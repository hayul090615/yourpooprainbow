import { Capacitor } from '@capacitor/core';

export type GoingCounts = Record<string, number>;

const VISITOR_ID_KEY = 'toilet-direction-visitor-id';

function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    (Capacitor.isNativePlatform()
      ? 'https://yourpooprainbow.vercel.app'
      : '')
  ).replace(/\/$/, '');
}

function getVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY)?.trim();
    if (existing) return existing;
    const generated = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_ID_KEY, generated);
    return generated;
  } catch {
    return `temporary-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

async function requestPresence<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api/directions?resource=presence${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
  });
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string'
      ? body.message
      : '현재 이용자 수를 불러오지 못했습니다.';
    throw new Error(message);
  }
  return body as T;
}

export async function getGoingCounts(toiletIds: string[]): Promise<GoingCounts> {
  const ids = Array.from(new Set(toiletIds)).filter(Boolean).slice(0, 100);
  if (ids.length === 0) return {};
  const query = new URLSearchParams({ toiletIds: ids.join(',') });
  const body = await requestPresence<{ counts?: GoingCounts }>(`&${query.toString()}`);
  return body.counts ?? {};
}

export async function touchGoing(toiletId: string) {
  return requestPresence<{ toiletId: string; count: number }>('', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toiletId, visitorId: getVisitorId() }),
  });
}

export async function releaseGoing(toiletId: string) {
  return requestPresence<{ toiletId: string; count: number }>('', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toiletId, visitorId: getVisitorId() }),
    keepalive: true,
  });
}
