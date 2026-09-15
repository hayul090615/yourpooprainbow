import { getAuthToken } from './authService';
import { Capacitor } from '@capacitor/core';
import type { Feedback, FeedbackInput, FeedbackStatus } from '../types/feedback';

function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return (configured || (Capacitor.isNativePlatform() ? 'https://yourpooprainbow.vercel.app' : import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(/\/$/, '');
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  } catch {
    throw new Error('피드백 서버에 연결하지 못했습니다.');
  }

  const result = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(result.message || '피드백 요청을 처리하지 못했습니다.');
  return result;
}

export async function sendFeedback(input: FeedbackInput): Promise<void> {
  await apiRequest('/api/feedback', { method: 'POST', body: JSON.stringify(input) });
}

export async function getFeedback(): Promise<Feedback[]> {
  const result = await apiRequest<{ feedback: Feedback[] }>('/api/feedback', { method: 'GET' });
  return result.feedback;
}

export async function updateFeedback(
  id: string,
  status: FeedbackStatus,
  adminReply: string | null,
  notifyUser = false,
): Promise<void> {
  await apiRequest(`/api/feedback/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminReply, notifyUser }),
  });
}

export async function toggleFeedbackLike(id: string): Promise<{ liked: boolean; likeCount: number }> {
  return apiRequest(`/api/feedback/${id}/like`, { method: 'POST' });
}
