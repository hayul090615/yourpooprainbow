import { Capacitor } from '@capacitor/core';

export type DirectionsPoint = {
  latitude: number;
  longitude: number;
};

export type DirectionsMode = 'bicycle' | 'car' | 'walk';

export type DirectionsStep = {
  instruction: string;
  distanceMeters?: number;
  durationSeconds?: number;
  transitLine?: string;
};

export type DirectionsRoute = {
  distanceMeters: number;
  durationSeconds: number;
  path: DirectionsPoint[];
  mode: DirectionsMode;
  fareWon?: number;
  steps?: DirectionsStep[];
};

type DirectionsRequest = {
  origin: DirectionsPoint;
  destination: DirectionsPoint & { name: string };
  mode: DirectionsMode;
};

const DIRECTIONS_MODES = new Set<DirectionsMode>(['bicycle', 'car', 'walk']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isDirectionsPoint(value: unknown): value is DirectionsPoint {
  if (!isRecord(value)) return false;
  return typeof value.latitude === 'number' && Number.isFinite(value.latitude) &&
    value.latitude >= -90 && value.latitude <= 90 &&
    typeof value.longitude === 'number' && Number.isFinite(value.longitude) &&
    value.longitude >= -180 && value.longitude <= 180;
}

function isDirectionsRoute(value: unknown): value is DirectionsRoute {
  if (!isRecord(value) || typeof value.mode !== 'string' ||
      !DIRECTIONS_MODES.has(value.mode as DirectionsMode)) return false;

  return isNonNegativeNumber(value.distanceMeters) &&
    isNonNegativeNumber(value.durationSeconds) &&
    Array.isArray(value.path) && value.path.length >= 2 && value.path.every(isDirectionsPoint) &&
    (value.fareWon === undefined || isNonNegativeNumber(value.fareWon)) &&
    (value.steps === undefined || Array.isArray(value.steps));
}

export async function getDirections(request: DirectionsRequest): Promise<DirectionsRoute> {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || (Capacitor.isNativePlatform() ? 'https://yourpooprainbow.vercel.app' : '')).replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
  let response: Response;

  try {
    response = await fetch(apiBaseUrl + '/api/directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('길찾기 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error('길찾기 서버에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.');
  } finally {
    window.clearTimeout(timeoutId);
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = isRecord(body) && typeof body.message === 'string'
      ? body.message
      : '길찾기 요청에 실패했습니다.';
    throw new Error(message);
  }

  if (!isDirectionsRoute(body)) {
    throw new Error('길찾기 서버의 응답 형식이 올바르지 않습니다.');
  }

  return body;
}
