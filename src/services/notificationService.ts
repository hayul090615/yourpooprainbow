import { getAuthToken } from './authService';
import { Capacitor } from '@capacitor/core';

export type AppNotification = { id: string; title: string; message: string; createdAt: string; readAt: string | null };

function apiBaseUrl() { const configured = import.meta.env.VITE_API_BASE_URL?.trim(); return (configured || (Capacitor.isNativePlatform() ? 'https://yourpooprainbow.vercel.app' : import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(/\/$/, ''); }

async function request<T>(path: string, method = 'GET'): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch(`${apiBaseUrl()}${path}`, { method, headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(result.message || '알림을 처리하지 못했습니다.');
  return result;
}

export async function getNotifications() { return (await request<{ notifications: AppNotification[] }>('/api/notifications')).notifications; }
export async function markNotificationRead(id: string) { await request(`/api/notifications/${id}`, 'PATCH'); }
