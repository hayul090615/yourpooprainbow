import { Router } from 'express';
import {
  DirectionsApiError,
  DirectionsMode,
  DirectionsPoint,
  DirectionsRequest,
  getDirections
} from '../services/directions-service';

export const directionsRouter = Router();
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

directionsRouter.post('/', async (request, response) => {
  const input = parseRequest(request.body);
  if (!input) {
    response.status(400).json({ code: 'INVALID_DIRECTIONS_REQUEST', message: '출발지, 목적지, 교통수단을 확인해 주세요.' });
    return;
  }

  try {
    response.json(await getDirections(input));
  } catch (error) {
    if (error instanceof DirectionsApiError) {
      response.status(error.status).json({ code: error.code, message: error.message });
      return;
    }
    console.error('Failed to fetch directions:', error instanceof Error ? error.message : 'Unknown error');
    response.status(502).json({ code: 'DIRECTIONS_UNAVAILABLE', message: '길찾기 서비스를 일시적으로 사용할 수 없습니다.' });
  }
});
