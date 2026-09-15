import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleIdentityApi = {
  accounts: {
      id: {
        initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
      prompt: () => void;
      renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Google 로그인 서비스를 불러오지 못했습니다.")), { once: true });

    if (!existingScript) {
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client?hl=ko";
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export default function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    if (isNative) {
      void GoogleSignIn.initialize({ clientId })
        .then(() => {
          if (isActive) setIsLoading(false);
        })
        .catch((initializeError) => {
          if (!isActive) return;
          setIsLoading(false);
          onError(initializeError instanceof Error ? initializeError.message : "Google 로그인을 준비하지 못했습니다.");
        });
      return () => {
        isActive = false;
      };
    }

    void loadGoogleIdentityScript()
      .then(() => {
        if (!isActive || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response.credential),
        });
        containerRef.current.replaceChildren();
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(400, containerRef.current.clientWidth || 400),
        });
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (!isActive) return;
        setIsLoading(false);
        onError(loadError instanceof Error ? loadError.message : "Google 로그인을 준비하지 못했습니다.");
      });

    return () => {
      isActive = false;
    };
  }, [clientId, isNative, onCredential, onError]);

  if (!clientId) {
    return <p className="google-auth-config">Google 로그인을 사용하려면 OAuth 클라이언트 설정이 필요합니다.</p>;
  }

  if (isNative) {
    return (
      <div className="google-auth-wrap">
        <button
          type="button"
          className="google-auth-native-button"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            try {
              const result = await GoogleSignIn.signIn();
              if (!result.idToken) throw new Error("Google ID 토큰을 받지 못했습니다.");
              onCredential(result.idToken);
            } catch (signInError) {
              onError(signInError instanceof Error ? signInError.message : "Google 로그인에 실패했습니다.");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <span className="google-g-mark" aria-hidden="true">G</span>{isLoading ? "Google 로그인 준비 중..." : "Google로 계속하기"}
        </button>
      </div>
    );
  }

  return (
    <div className="google-auth-wrap">
      {isLoading && <span className="google-auth-loading">Google 로그인 준비 중...</span>}
      <div ref={containerRef} className="google-auth-button">
      </div>
    </div>
  );
}
