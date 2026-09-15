import type { SignUpInput, User } from "../types/auth";
import { Capacitor } from "@capacitor/core";

const SESSION_KEY = "geuphaeyo-session";

type StoredSession = { user: User; token: string };

function apiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  return (configuredBaseUrl || (Capacitor.isNativePlatform() ? "https://yourpooprainbow.vercel.app" : import.meta.env.DEV ? "http://localhost:3000" : "")).replace(/\/$/, "");
}

function readSession(): StoredSession | null {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Partial<StoredSession> | null;
    if (!stored?.token || !stored.user?.id || !stored.user.email) return null;
    return { token: stored.token, user: { ...stored.user, role: stored.user.role ?? "user" } };
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  return readSession()?.user ?? null;
}

export function getAuthToken(): string | null {
  return readSession()?.token ?? null;
}

async function requestAuth(path: string, body: Record<string, string>): Promise<User> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("로그인 서버에 연결하지 못했습니다.");
  }
  const result = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok) throw new Error(result.message || "인증 요청을 처리하지 못했습니다.");
  return saveAuthResponse(result);
}

export function signUp(input: SignUpInput): Promise<User> {
  return requestAuth("signup", input);
}

export function signIn(email: string, password: string): Promise<User> {
  return requestAuth("login", { email, password });
}

type AuthResponse = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    profileImage?: string | null;
    role?: "user" | "admin";
  };
  token?: string;
  message?: string;
};

function saveAuthResponse(result: AuthResponse): User {
  if (!result.user?.id || !result.user.email || !result.user.name || !result.token) {
    throw new Error("로그인 서버의 사용자 응답이 올바르지 않습니다.");
  }
  const user: User = {
    id: result.user.id,
    email: result.user.email,
    nickname: result.user.name,
    name: result.user.name,
    profileImage: result.user.profileImage ?? null,
    role: result.user.role ?? "user",
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token: result.token }));
  return user;
}

export async function signInWithGoogleCredential(credential: string): Promise<User> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential }),
    });
  } catch {
    throw new Error("로그인 서버에 연결하지 못했습니다.");
  }

  const result = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok) {
    throw new Error(result.message || "Google 로그인에 실패했습니다.");
  }

  return saveAuthResponse(result);
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  const googleApi = (window as unknown as { google?: { accounts?: { id?: { disableAutoSelect?: () => void } } } }).google;
  googleApi?.accounts?.id?.disableAutoSelect?.();
}
