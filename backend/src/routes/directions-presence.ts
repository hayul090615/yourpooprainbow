import { Router } from 'express';
import {
  getActiveDirectionCounts,
  removeDirectionPresence,
  touchDirectionPresence
} from '../services/directions-presence-service';

export const directionsPresenceRouter = Router();

function isValidId(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function parseToiletIds(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const ids = value.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length > 100 || ids.some((id) => !isValidId(id, 255))) return undefined;
  return Array.from(new Set(ids));
}

function parsePresenceBody(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const body = value as Record<string, unknown>;
  if (!isValidId(body.toiletId, 255) || !isValidId(body.visitorId, 128)) return undefined;
  return {
    toiletId: body.toiletId.trim(),
    visitorId: body.visitorId.trim()
  };
}

directionsPresenceRouter.get('/', async (request, response) => {
  const toiletIds = parseToiletIds(request.query.toiletIds);
  if (!toiletIds) {
    response.status(400).json({ code: 'INVALID_PRESENCE_QUERY', message: '화장실 ID를 확인해 주세요.' });
    return;
  }

  try {
    response.json({ counts: await getActiveDirectionCounts(toiletIds) });
  } catch (error) {
    console.error('Failed to fetch direction presence:', error);
    response.status(503).json({ code: 'PRESENCE_UNAVAILABLE', message: '현재 이용자 수를 불러오지 못했습니다.' });
  }
});

directionsPresenceRouter.put('/', async (request, response) => {
  const input = parsePresenceBody(request.body);
  if (!input) {
    response.status(400).json({ code: 'INVALID_PRESENCE_REQUEST', message: '화장실 ID와 방문자 세션을 확인해 주세요.' });
    return;
  }

  try {
    response.json({ toiletId: input.toiletId, count: await touchDirectionPresence(input.toiletId, input.visitorId) });
  } catch (error) {
    console.error('Failed to update direction presence:', error);
    response.status(503).json({ code: 'PRESENCE_UNAVAILABLE', message: '현재 이용자 수를 갱신하지 못했습니다.' });
  }
});

directionsPresenceRouter.delete('/', async (request, response) => {
  const input = parsePresenceBody(request.body);
  if (!input) {
    response.status(400).json({ code: 'INVALID_PRESENCE_REQUEST', message: '화장실 ID와 방문자 세션을 확인해 주세요.' });
    return;
  }

  try {
    response.json({ toiletId: input.toiletId, count: await removeDirectionPresence(input.toiletId, input.visitorId) });
  } catch (error) {
    console.error('Failed to remove direction presence:', error);
    response.status(503).json({ code: 'PRESENCE_UNAVAILABLE', message: '현재 이용자 수를 갱신하지 못했습니다.' });
  }
});
