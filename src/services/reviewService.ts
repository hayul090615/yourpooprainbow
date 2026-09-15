import { getAuthToken } from './authService';
import { Capacitor } from '@capacitor/core';
import type { ToiletReview, ToiletReviewInput } from '../types/review';

function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return (configured || (Capacitor.isNativePlatform() ? 'https://yourpooprainbow.vercel.app' : import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(/\/$/, '');
}

export async function getToiletReviews(toiletId: string): Promise<ToiletReview[]> {
  const token = getAuthToken();
  const response = await fetch(`${apiBaseUrl()}/api/toilet-reviews?toiletId=${encodeURIComponent(toiletId)}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  const result = await response.json().catch(() => ({})) as { reviews?: ToiletReview[]; message?: string };
  if (!response.ok) throw new Error(result.message || '리뷰를 불러오지 못했습니다.');
  return result.reviews ?? [];
}

export async function saveToiletReview(input: ToiletReviewInput): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch(`${apiBaseUrl()}/api/toilet-reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(result.message || '리뷰를 저장하지 못했습니다.');
}

export async function deleteToiletReview(id: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch(`${apiBaseUrl()}/api/toilet-reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(result.message || '리뷰를 삭제하지 못했습니다.');
}

export async function toggleToiletReviewLike(id: string): Promise<{ liked: boolean; likeCount: number }> {
  const token = getAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch(`${apiBaseUrl()}/api/toilet-reviews/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => ({})) as { liked?: boolean; likeCount?: number; message?: string };
  if (!response.ok || result.liked === undefined || result.likeCount === undefined) throw new Error(result.message || '좋아요를 변경하지 못했습니다.');
  return { liked: result.liked, likeCount: result.likeCount };
}
