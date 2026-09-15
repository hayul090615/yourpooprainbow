export type DirectionsMode = 'bicycle' | 'car' | 'walk';

export type DirectionsPoint = {
  latitude: number;
  longitude: number;
};

export type DirectionsRequest = {
  origin: DirectionsPoint;
  destination: DirectionsPoint & { name: string };
  mode: DirectionsMode;
};

type JsonRecord = Record<string, unknown>;

export class DirectionsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function coordinatePairs(value: unknown): DirectionsPoint[] {
  if (!Array.isArray(value)) return [];

  const points: DirectionsPoint[] = [];
  for (let index = 0; index + 1 < value.length; index += 2) {
    const longitude = numberValue(value[index]);
    const latitude = numberValue(value[index + 1]);
    if (longitude !== undefined && latitude !== undefined) {
      points.push({ latitude, longitude });
    }
  }
  return points;
}

function dedupePath(path: DirectionsPoint[]): DirectionsPoint[] {
  return path.filter((point, index) => {
    const previous = path[index - 1];
    return !previous || previous.latitude !== point.latitude || previous.longitude !== point.longitude;
  });
}

function geoJsonCoordinates(value: unknown): DirectionsPoint[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((coordinate) => {
    if (!Array.isArray(coordinate)) return [];
    const longitude = numberValue(coordinate[0]);
    const latitude = numberValue(coordinate[1]);
    return longitude !== undefined && latitude !== undefined
      ? [{ latitude, longitude }]
      : [];
  });
}

type OsmStartCandidate = {
  point: DirectionsPoint;
  snapDistanceMeters: number;
  hasRoadName: boolean;
};

const MAX_OSM_START_CANDIDATES = 3;
const MAX_OSM_START_SNAP_METERS = 120;

async function getOsmStartCandidates(origin: DirectionsPoint): Promise<OsmStartCandidate[]> {
  const coordinates = origin.longitude + ',' + origin.latitude;
  const url = new URL(
    'https://routing.openstreetmap.de/routed-foot/nearest/v1/driving/' + coordinates
  );
  url.searchParams.set('number', String(MAX_OSM_START_CANDIDATES));

  const response = await fetch(url, {
    headers: { 'User-Agent': 'GeuphaeyoToilet/0.1 (student-project)' },
    signal: AbortSignal.timeout(8_000)
  });
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok || !isRecord(body) || body.code !== 'Ok') return [];

  const candidates: OsmStartCandidate[] = [];
  for (const waypoint of records(body.waypoints)) {
    if (!Array.isArray(waypoint.location)) continue;
    const longitude = numberValue(waypoint.location[0]);
    const latitude = numberValue(waypoint.location[1]);
    const snapDistanceMeters = numberValue(waypoint.distance);
    if (
      longitude === undefined ||
      latitude === undefined ||
      snapDistanceMeters === undefined ||
      snapDistanceMeters > MAX_OSM_START_SNAP_METERS
    ) continue;

    const isDuplicate = candidates.some(({ point }) =>
      point.latitude === latitude && point.longitude === longitude
    );
    if (isDuplicate) continue;

    candidates.push({
      point: { latitude, longitude },
      snapDistanceMeters,
      hasRoadName: stringValue(waypoint.name) !== undefined
    });
  }
  return candidates.slice(0, MAX_OSM_START_CANDIDATES);
}

function osmInstruction(step: JsonRecord): string {
  const maneuver = isRecord(step.maneuver) ? step.maneuver : {};
  const type = stringValue(maneuver.type) ?? 'continue';
  const modifier = stringValue(maneuver.modifier);
  const roadName = stringValue(step.name);
  const direction: Record<string, string> = {
    left: '좌회전',
    right: '우회전',
    'slight left': '왼쪽 방향',
    'slight right': '오른쪽 방향',
    'sharp left': '크게 좌회전',
    'sharp right': '크게 우회전',
    straight: '직진',
    uturn: '유턴'
  };

  if (type === 'depart') return '출발하세요.';
  if (type === 'arrive') return '목적지에 도착합니다.';
  if (type === 'roundabout' || type === 'rotary') return '회전교차로로 진입하세요.';
  const action = modifier ? direction[modifier] : undefined;
  if (action && roadName) return roadName + ' 방면으로 ' + action + '하세요.';
  if (action) return action + '하세요.';
  if (roadName) return roadName + '을 따라 이동하세요.';
  return '경로를 따라 계속 이동하세요.';
}

async function requestOsmDirections(
  request: DirectionsRequest & { mode: 'walk' | 'bicycle' }
) {
  const { origin, destination, mode } = request;
  const profile = mode === 'walk' ? 'foot' : 'bike';
  const coordinates = origin.longitude + ',' + origin.latitude + ';' +
    destination.longitude + ',' + destination.latitude;
  const url = new URL(
    'https://routing.openstreetmap.de/routed-' + profile +
    '/route/v1/driving/' + coordinates
  );
  url.searchParams.set('overview', 'full');
  url.searchParams.set('steps', 'true');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('alternatives', 'true');
  url.searchParams.set('radiuses', '60;150');

  const response = await fetch(url, {
    headers: { 'User-Agent': 'GeuphaeyoToilet/0.1 (student-project)' },
    signal: AbortSignal.timeout(15_000)
  });
  const body: unknown = await response.json().catch(() => undefined);
  const isUnmatchedPoint = isRecord(body) && body.code === 'NoSegment';
  if (isUnmatchedPoint) {
    throw new DirectionsApiError(
      '출발지 또는 목적지 가까이에서 연결 가능한 길을 찾지 못했습니다. 지도에서 실제 출입구나 도로를 출발 위치로 선택해 주세요.',
      422,
      'ROUTE_POINT_NOT_NEAR_ROAD'
    );
  }

  if (!response.ok) {
    throw new DirectionsApiError(
      '무료 도보·자전거 경로 서버가 일시적으로 응답하지 않습니다.',
      502,
      'OSM_DIRECTIONS_FAILED'
    );
  }

  if (!isRecord(body) || body.code !== 'Ok') {
    throw new DirectionsApiError(
      '사용 가능한 도보·자전거 경로를 찾지 못했습니다.',
      404,
      'ROUTE_NOT_FOUND'
    );
  }

  const candidates = records(body.routes);
  const shortestDistance = Math.min(
    ...candidates.map((candidate) =>
      numberValue(candidate.distance) ?? Number.POSITIVE_INFINITY
    )
  );
  const reasonableCandidates = candidates.filter((candidate) => {
    const distance = numberValue(candidate.distance);
    return distance !== undefined && distance <= shortestDistance * 1.2;
  });
  const route = reasonableCandidates.reduce<JsonRecord | undefined>((best, candidate) => {
    if (!best) return candidate;
    const candidateDuration = numberValue(candidate.duration) ?? Number.POSITIVE_INFINITY;
    const bestDuration = numberValue(best.duration) ?? Number.POSITIVE_INFINITY;
    if (candidateDuration !== bestDuration) {
      return candidateDuration < bestDuration ? candidate : best;
    }
    return (numberValue(candidate.distance) ?? Number.POSITIVE_INFINITY) <
      (numberValue(best.distance) ?? Number.POSITIVE_INFINITY)
      ? candidate
      : best;
  }, undefined);
  const geometry = route && isRecord(route.geometry) ? route.geometry : undefined;
  const path = dedupePath(geoJsonCoordinates(geometry?.coordinates));
  const distanceMeters = route && numberValue(route.distance);
  const durationSeconds = route && numberValue(route.duration);
  const steps = route
    ? records(route.legs).flatMap((leg) =>
        records(leg.steps).map((step) => ({
          instruction: osmInstruction(step),
          distanceMeters: numberValue(step.distance),
          durationSeconds: numberValue(step.duration)
        }))
      )
    : [];

  if (distanceMeters === undefined || durationSeconds === undefined || path.length < 2) {
    throw new DirectionsApiError(
      '사용 가능한 도보·자전거 경로를 찾지 못했습니다.',
      404,
      'ROUTE_NOT_FOUND'
    );
  }

  return {
    distanceMeters,
    durationSeconds,
    path,
    mode,
    ...(steps.length ? { steps } : {})
  };
}

async function getOsmDirections(
  request: DirectionsRequest & { mode: 'walk' | 'bicycle' }
) {
  if (request.mode === 'bicycle') return requestOsmDirections(request);

  let startCandidates: OsmStartCandidate[] = [];
  try {
    startCandidates = await getOsmStartCandidates(request.origin);
  } catch {
    // Keep the previous single-origin request as the fallback if Nearest is unavailable.
  }
  if (!startCandidates.length) return requestOsmDirections(request);

  const attempts = await Promise.allSettled(
    startCandidates.map(async (candidate) => ({
      candidate,
      route: await requestOsmDirections({ ...request, origin: candidate.point })
    }))
  );
  const routedCandidates = attempts.flatMap((attempt) =>
    attempt.status === 'fulfilled' ? [attempt.value] : []
  );
  if (!routedCandidates.length) return requestOsmDirections(request);

  const shortestTotalDistance = Math.min(
    ...routedCandidates.map(({ candidate, route }) =>
      candidate.snapDistanceMeters + route.distanceMeters
    )
  );
  const reasonableCandidates = routedCandidates.filter(({ candidate, route }) =>
    candidate.snapDistanceMeters + route.distanceMeters <= shortestTotalDistance * 1.35 + 80
  );

  return reasonableCandidates.reduce((best, current) => {
    const score = ({ candidate, route }: typeof current) =>
      route.durationSeconds +
      candidate.snapDistanceMeters / 1.25 +
      (candidate.hasRoadName ? 0 : 75);
    return score(current) < score(best) ? current : best;
  }).route;
}

async function kakaoRequest(url: URL): Promise<JsonRecord> {
  const runtimeProcess = (globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }).process;
  const kakaoRestApiKey = runtimeProcess?.env?.KAKAO_REST_API_KEY?.trim();
  if (!kakaoRestApiKey) {
    throw new DirectionsApiError(
      '서버에 Kakao REST API 키가 설정되지 않았습니다.',
      503,
      'KAKAO_KEY_NOT_CONFIGURED'
    );
  }

  const response = await fetch(url, {
    headers: { Authorization: 'KakaoAK ' + kakaoRestApiKey },
    signal: AbortSignal.timeout(12_000)
  });

  if (!response.ok) {
    throw new DirectionsApiError(
      'Kakao Mobility 경로 요청에 실패했습니다. (' + response.status + ')',
      502,
      'KAKAO_DIRECTIONS_FAILED'
    );
  }

  const body: unknown = await response.json();
  if (!isRecord(body)) {
    throw new DirectionsApiError('Kakao Mobility 응답 형식이 올바르지 않습니다.', 502, 'INVALID_KAKAO_RESPONSE');
  }
  return body;
}

function normalizeRoadRoute(body: JsonRecord, mode: DirectionsMode) {
  const route = records(body.routes)[0];
  const summary = route && isRecord(route.summary) ? route.summary : undefined;
  const sections = route ? records(route.sections) : [];
  const path = dedupePath(
    sections.flatMap((section) =>
      records(section.roads).flatMap((road) => coordinatePairs(road.vertexes))
    )
  );
  const steps = sections.flatMap((section) =>
    records(section.guides).flatMap((guide) => {
      const instruction = stringValue(guide.guidance) ?? stringValue(guide.name);
      if (!instruction) return [];
      return [{
        instruction,
        distanceMeters: numberValue(guide.distance),
        durationSeconds: numberValue(guide.duration)
      }];
    })
  );

  const distanceMeters = summary && numberValue(summary.distance);
  const durationSeconds = summary && numberValue(summary.duration);
  if (distanceMeters === undefined || durationSeconds === undefined || path.length < 2) {
    throw new DirectionsApiError('사용 가능한 경로를 찾지 못했습니다.', 404, 'ROUTE_NOT_FOUND');
  }

  const fare = summary && isRecord(summary.fare) ? numberValue(summary.fare.toll) : undefined;
  return {
    distanceMeters,
    durationSeconds,
    path,
    mode,
    ...(fare !== undefined && fare > 0 ? { fareWon: fare } : {}),
    ...(steps.length ? { steps } : {})
  };
}

function normalizeTransitRoute(body: JsonRecord, mode: 'bus' | 'subway') {
  const journey = records(body.journeys)[0];
  const summary = journey && isRecord(journey.summary) ? journey.summary : undefined;
  const sections = journey ? records(journey.sections) : [];
  const path = dedupePath(sections.flatMap((section) => coordinatePairs(section.path)));
  const steps = sections.flatMap((section) => {
    const departure = isRecord(section.departure_stop) ? section.departure_stop : undefined;
    const arrival = isRecord(section.arrival_stop) ? section.arrival_stop : undefined;
    const route = isRecord(section.route) ? section.route : undefined;
    const from = departure && stringValue(departure.stop_name);
    const to = arrival && stringValue(arrival.stop_name);
    const instruction = from && to ? from + ' → ' + to : stringValue(section.type);
    if (!instruction) return [];
    return [{
      instruction,
      transitLine: route && (stringValue(route.route_short_name) ?? stringValue(route.route_name)),
      distanceMeters: numberValue(section.distance),
      durationSeconds: numberValue(section.duration) ?? numberValue(section.time)
    }];
  });

  const distanceMeters = summary && numberValue(summary.distance);
  const durationSeconds = summary && (numberValue(summary.duration) ?? numberValue(summary.total_time));
  if (distanceMeters === undefined || durationSeconds === undefined || path.length < 2) {
    throw new DirectionsApiError('사용 가능한 대중교통 경로를 찾지 못했습니다.', 404, 'ROUTE_NOT_FOUND');
  }

  const fareWon = summary && (numberValue(summary.fare) ?? numberValue(summary.payment));
  return {
    distanceMeters,
    durationSeconds,
    path,
    mode,
    ...(fareWon !== undefined ? { fareWon } : {}),
    ...(steps.length ? { steps } : {})
  };
}

export async function getDirections(request: DirectionsRequest) {
  const { origin, destination, mode } = request;

  if (mode === 'walk' || mode === 'bicycle') {
    return getOsmDirections({ ...request, mode });
  }

  const url = new URL('https://apis-navi.kakaomobility.com/v1/directions');
  url.searchParams.set('origin', origin.longitude + ',' + origin.latitude);
  url.searchParams.set('destination', destination.longitude + ',' + destination.latitude);
  url.searchParams.set('priority', 'RECOMMEND');
  url.searchParams.set('summary', 'false');

  return normalizeRoadRoute(await kakaoRequest(url), mode);
}
