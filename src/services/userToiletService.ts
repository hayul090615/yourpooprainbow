import type { Toilet } from '../types/toilet';

const STORAGE_PREFIX = 'geuphaeyo-user-toilets:';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getUserToilets(userId: string | null): Toilet[] {
  if (!userId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]') as Toilet[];
    return Array.isArray(parsed) ? parsed.filter((toilet) => toilet?.isUserAdded) : [];
  } catch {
    return [];
  }
}

function saveUserToilets(userId: string, toilets: Toilet[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(toilets));
}

export function addUserToilet(userId: string, input: Omit<Toilet, 'id' | 'isUserAdded'>): Toilet {
  const toilet: Toilet = { ...input, id: `user-${userId}-${crypto.randomUUID()}`, isUserAdded: true };
  saveUserToilets(userId, [...getUserToilets(userId), toilet]);
  return toilet;
}

export function updateUserToilet(userId: string, toilet: Toilet) {
  saveUserToilets(userId, getUserToilets(userId).map((item) => item.id === toilet.id || `mock-${item.id}` === toilet.id ? { ...toilet, id: item.id } : item));
}

export function deleteUserToilet(userId: string, toiletId: string) {
  saveUserToilets(userId, getUserToilets(userId).filter((item) => item.id !== toiletId));
}
