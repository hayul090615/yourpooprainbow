import { useEffect, useRef, useState } from 'react';
import type { User } from '../types/auth';
import { signInWithGoogleCredential } from '../services/authService';

type GoogleCredentialResponse = { credential: string };
export default function GoogleLoginButton({ onSuccess }: { onSuccess: (user: User) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    const render = () => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => void signInWithGoogleCredential(credential).then(onSuccess).catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : 'Google 로그인에 실패했습니다.');
        }),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'signin_with',
        shape: 'rectangular', logo_alignment: 'left', width: 304, locale: 'ko',
      });
    };
    if (window.google) { render(); return; }
    const existing = document.getElementById('google-identity-script') as HTMLScriptElement | null;
    if (existing) { existing.addEventListener('load', render, { once: true }); return; }
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    script.onerror = () => setError('Google 로그인 서비스를 불러오지 못했습니다.');
    document.head.appendChild(script);
  }, [clientId, onSuccess]);

  if (!clientId) return <p className="google-setup-note">Google 로그인을 사용하려면 클라이언트 ID 설정이 필요합니다.</p>;
  return <><div className="google-login-button" ref={containerRef} />{error && <p className="auth-error">{error}</p>}</>;
}
