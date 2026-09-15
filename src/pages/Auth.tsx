import { useCallback, useState, type FormEvent } from "react";
import GoogleSignInButton from "../components/GoogleSignInButton";
import type { User } from "../types/auth";
import { signIn, signInWithGoogleCredential, signUp } from "../services/authService";

type AuthProps = { mode: "login" | "signup"; onModeChange: (mode: "login" | "signup") => void; onSuccess: (user: User) => void };

export default function Auth({ mode, onModeChange, onSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError("");
    setIsGoogleSigningIn(true);
    try {
      onSuccess(await signInWithGoogleCredential(credential));
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Google 로그인에 실패했습니다.");
    } finally {
      setIsGoogleSigningIn(false);
    }
  }, [onSuccess]);

  const handleGoogleError = useCallback((message: string) => setError(message), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!email.includes("@")) return setError("올바른 이메일을 입력해주세요.");
    if (password.length < 8) return setError("비밀번호는 8자 이상 입력해주세요.");
    try {
      const user = mode === "login" ? await signIn(email, password) : await signUp({ email, password, nickname: nickname.trim() });
      onSuccess(user);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "잠시 후 다시 시도해주세요."); }
  }

  return <main className="auth-page">
    <section className="auth-intro" aria-label="서비스 소개">
      <a className="auth-site-brand" href="/" onClick={(event) => { event.preventDefault(); onModeChange("login"); }}><span>니똥</span><span className="auth-brand-accent">칼라</span><span>똥</span><span className="auth-brand-toilet" aria-hidden="true">🚽</span></a>
      <p className="auth-intro-kicker">FIND RESTROOMS ANYWHERE</p>
      <h1>급할 때,<br /><strong>가장 가까운 곳</strong>으로.</h1>
      <p className="auth-intro-copy">니똥칼라똥은 현재 위치를 기반으로<br />가까운 화장실을 빠르고 정확하게 찾아주는 서비스입니다.</p>
      <div className="auth-feature-list">
        <span><i aria-hidden="true">●</i><b>현재 위치 기반</b><small>가까운 화장실 찾기</small></span>
        <span><i aria-hidden="true">◷</i><b>운영시간 확인</b><small>지금 이용 가능한 곳</small></span>
        <span><i aria-hidden="true">♟</i><b>상세 정보 제공</b><small>접근성, 비밀번호 등</small></span>
      </div>
      <div className="auth-map-visual" aria-hidden="true"><span className="auth-map-road auth-map-road-one" /><span className="auth-map-road auth-map-road-two" /><span className="auth-map-pin">🚽</span><span className="auth-map-current" /><span className="auth-map-bubble">지금, 여기서<br /><b>가까운 화장실을 찾아보세요!</b></span></div>
    </section>
    <section className="auth-card" aria-labelledby="auth-title">
    <a className="auth-brand" href="/" onClick={(event) => { event.preventDefault(); onModeChange("login"); }}><span>니똥</span><span className="auth-brand-accent">칼라</span><span>똥</span><span className="auth-brand-toilet" aria-hidden="true">🚽</span></a>
    <h1 id="auth-title">{mode === "login" ? "가까운 화장실을 바로 찾아보세요." : "회원가입하고 시작해보세요."}</h1>
    <p className="auth-description">{mode === "login" ? "로그인하고 주변 화장실 정보를 확인하세요." : "간단한 정보만 입력하면 주변 정보를 확인할 수 있어요."}</p>
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "signup" && <label>닉네임<input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="사용할 닉네임" required /></label>}
      <label>이메일<div className="auth-input-wrap"><span className="auth-input-icon" aria-hidden="true">✉</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div></label>
      <label>비밀번호<div className="auth-input-wrap"><span className="auth-input-icon" aria-hidden="true">▣</span><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상 입력하세요." minLength={8} required /><button className="auth-password-toggle" type="button" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? "숨기기" : "보기"}</button></div></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit">{mode === "login" ? "로그인" : "회원가입"}</button>
    </form>
    <div className="auth-divider"><span>또는</span></div>
    <GoogleSignInButton onCredential={handleGoogleCredential} onError={handleGoogleError} />
    {isGoogleSigningIn && <p className="google-auth-status" role="status">Google 계정을 확인하는 중입니다...</p>}
    <p className="auth-switch">{mode === "login" ? "아직 계정이 없나요?" : "이미 계정이 있나요?"} <button type="button" onClick={() => { setError(""); onModeChange(mode === "login" ? "signup" : "login"); }}>{mode === "login" ? "회원가입" : "로그인"}</button></p>
    <p className="auth-note">Google 로그인 정보는 서버에서 검증한 뒤 안전하게 저장됩니다.</p>
    </section>
  </main>;
}
