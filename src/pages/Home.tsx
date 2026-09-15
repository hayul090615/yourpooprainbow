import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import { getImmediateToilets, getNearbyToilets } from '../services/toiletService';
import type { Toilet } from '../types/toilet';
import type { User } from '../types/auth';

type HomeProps = {
  user: User | null;
  onServiceOpen: () => void;
  onLogout: () => void;
};

export default function Home({ user, onServiceOpen, onLogout }: HomeProps) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('toilet-map-theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    setToilets(getImmediateToilets());
    let isMounted = true;
    const loadAllToilets = () => {
      void getNearbyToilets().then((loadedToilets) => {
        if (isMounted) setToilets(loadedToilets);
      });
    };
    const idleCallback = window.requestIdleCallback?.(loadAllToilets, { timeout: 2_000 });
    const timeoutId = idleCallback === undefined
      ? window.setTimeout(loadAllToilets, 800)
      : undefined;

    return () => {
      isMounted = false;
      if (idleCallback !== undefined) window.cancelIdleCallback?.(idleCallback);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('toilet-map-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="map-home">
      <Header
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode((current) => !current)}
        onServiceOpen={onServiceOpen}
        user={user}
        onLogout={onLogout}
      />
      <main className="map-home-main">
        <section className="map-home-toolbar" aria-label="화장실 검색">
          <SearchBar value={query} onChange={setQuery} onSubmit={setSubmittedQuery} />
        </section>
        <Map toilets={toilets} query={submittedQuery} user={user} onLoginRequired={onServiceOpen} />

      </main>
    </div>
  );
}
