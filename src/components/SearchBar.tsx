type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

export default function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  const clearSearch = () => {
    onChange('');
    onSubmit('');
  };

  return (
    <form className="search-bar" role="search" onSubmit={(event) => { event.preventDefault(); onSubmit(value.trim()); }}>
      <button className="search-submit" type="submit" aria-label="화장실 검색">
        <span aria-hidden="true">⌕</span>
      </button>
      <div className="search-bar-copy">
        <strong>니똥칼라똥, 가까운 화장실은 우리가 찾을게요</strong>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="지역, 화장실 이름 또는 주소로 검색" aria-label="화장실 검색어" />
      </div>
      {value && <button type="button" onClick={clearSearch} aria-label="검색어 지우기">×</button>}
    </form>
  );
}
