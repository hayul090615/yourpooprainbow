import type { User } from '../types/auth';

type HeaderProps = {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onServiceOpen: () => void;
  user: User | null;
  onLogout: () => void;
};

export default function Header({ isDarkMode, onThemeToggle, onServiceOpen, user, onLogout }: HeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="/">니똥칼라똥</a>
      <div className="header-actions">
        <a href="/about.html" className="customer-service-button">서비스 소개</a>
        {user && <button className="header-logout-button" type="button" onClick={onLogout}>로그아웃</button>}
        <button className="customer-service-button" type="button" onClick={onServiceOpen}>고객센터</button>
        <button className="theme-toggle" type="button" onClick={onThemeToggle} aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}>
          <span aria-hidden="true">{isDarkMode ? '☀' : '☾'}</span>
          {isDarkMode ? '라이트' : '다크'}
        </button>
      </div>
    </header>
  );
}
