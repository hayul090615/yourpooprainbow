import {
  authenticateGoogleUser,
  GoogleAuthError,
} from '../../backend/src/services/google-auth-service.js';
import { createSession } from '../../backend/src/services/auth-service.js';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') {
    response.setHeader('Allow', 'POST, OPTIONS');
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS');
    response.status(405).json({ message: 'POST 요청만 지원합니다.' });
    return;
  }

  const idToken =
    typeof request.body === 'object' &&
    request.body !== null &&
    typeof (request.body as Record<string, unknown>).idToken === 'string'
      ? ((request.body as Record<string, unknown>).idToken as string).trim()
      : '';

  if (!idToken) {
    response.status(400).json({ message: 'Google ID token이 필요합니다.' });
    return;
  }

  try {
    const user = await authenticateGoogleUser(idToken);
    response.status(200).json({ user, token: await createSession(user.id) });
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      response.status(error.status).json({ message: error.message });
      return;
    }
    console.error('Unexpected Google login error:', error);
    response.status(500).json({ message: 'Google 로그인 처리 중 오류가 발생했습니다.' });
  }
}
