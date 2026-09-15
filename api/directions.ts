import {
  DirectionsApiError,
  type DirectionsMode,
  type DirectionsPoint,
  type DirectionsRequest,
  getDirections
} from '../backend/src/services/directions-service.js';
import {
  getActiveDirectionCounts,
  removeDirectionPresence,
  touchDirectionPresence
} from '../backend/src/services/directions-presence-service.js';

type ApiRequest = {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
  body?: unknown;
};

type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
};

const modes = new Set<DirectionsMode>(['bicycle', 'car', 'walk']);

function isPoint(value: unknown): value is DirectionsPoint {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const point = value as Record<string, unknown>;
  return typeof point.latitude === 'number' && Number.isFinite(point.latitude) &&
    point.latitude >= -90 && point.latitude <= 90 &&
    typeof point.longitude === 'number' && Number.isFinite(point.longitude) &&
    point.longitude >= -180 && point.longitude <= 180;
}

function parseRequest(value: unknown): DirectionsRequest | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const body = value as Record<string, unknown>;
  if (!isPoint(body.origin) || !isPoint(body.destination) ||
      typeof body.mode !== 'string' || !modes.has(body.mode as DirectionsMode)) return undefined;

  const destination = body.destination as unknown as Record<string, unknown>;
  if (typeof destination.name !== 'string' || !destination.name.trim() || destination.name.length > 100) {
    return undefined;
  }

  return {
    origin: body.origin,
    destination: { ...body.destination, name: destination.name.trim() },
    mode: body.mode as DirectionsMode
  };
}

function isValidPresenceId(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function parsePresenceToiletIds(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const ids = value.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length > 100 || ids.some((id) => !isValidPresenceId(id, 255))) return undefined;
  return Array.from(new Set(ids));
}

function parsePresenceBody(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const body = value as Record<string, unknown>;
  if (!isValidPresenceId(body.toiletId, 255) || !isValidPresenceId(body.visitorId, 128)) return undefined;
  return {
    toiletId: body.toiletId.trim(),
    visitorId: body.visitorId.trim()
  };
}

function getRequestUrl(request: ApiRequest) {
  return new URL(request.url ?? '', 'https://yourpooprainbow.vercel.app');
}

function isPresenceRequest(request: ApiRequest) {
  const resource = request.query?.resource;
  return resource === 'presence' || getRequestUrl(request).searchParams.get('resource') === 'presence';
}

function getQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function handlePresence(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method === 'GET') {
    const url = getRequestUrl(request);
    const rawToiletIds = getQueryValue(request.query?.toiletIds) ?? url.searchParams.get('toiletIds');
    const toiletIds = parsePresenceToiletIds(rawToiletIds);
    if (!toiletIds) {
      response.status(400).json({ code: 'INVALID_PRESENCE_QUERY', message: '화장실 ID를 확인해 주세요.' });
      return;
    }
    response.status(200).json({ counts: await getActiveDirectionCounts(toiletIds) });
    return;
  }

  const input = parsePresenceBody(request.body);
  if (!input) {
    response.status(400).json({ code: 'INVALID_PRESENCE_REQUEST', message: '화장실 ID와 방문자 세션을 확인해 주세요.' });
    return;
  }

  if (request.method === 'PUT') {
    response.status(200).json({ toiletId: input.toiletId, count: await touchDirectionPresence(input.toiletId, input.visitorId) });
    return;
  }

  if (request.method === 'DELETE') {
    response.status(200).json({ toiletId: input.toiletId, count: await removeDirectionPresence(input.toiletId, input.visitorId) });
    return;
  }

  response.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
  response.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: '지원하지 않는 요청입니다.' });
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (isPresenceRequest(request)) {
    try {
      await handlePresence(request, response);
    } catch (error) {
      console.error('Failed to handle direction presence:', error instanceof Error ? error.message : 'Unknown error');
      response.status(503).json({ code: 'PRESENCE_UNAVAILABLE', message: '현재 이용자 수를 처리하지 못했습니다.' });
    }
    return;
  }

  if (request.method === 'OPTIONS') {
    response.setHeader('Allow', 'POST, OPTIONS');
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS');
    response.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'POST 요청만 지원합니다.' });
    return;
  }

  const input = parseRequest(request.body);
  if (!input) {
    response.status(400).json({
      code: 'INVALID_DIRECTIONS_REQUEST',
      message: '출발지, 목적지, 교통수단을 확인해 주세요.'
    });
    return;
  }

  try {
    response.status(200).json(await getDirections(input));
  } catch (error) {
    if (error instanceof DirectionsApiError) {
      response.status(error.status).json({ code: error.code, message: error.message });
      return;
    }
    console.error('Failed to fetch directions:', error instanceof Error ? error.message : 'Unknown error');
    response.status(502).json({
      code: 'DIRECTIONS_UNAVAILABLE',
      message: '길찾기 서비스를 일시적으로 사용할 수 없습니다.'
    });
  }
}
