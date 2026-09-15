import type { Toilet } from '../types/toilet';

type ToiletCardProps = {
  toilet: Toilet;
  onSelect?: (toilet: Toilet) => void;
};

export default function ToiletCard({ toilet, onSelect }: ToiletCardProps) {
  const content = (
    <>
      <div className="card-heading"><h3>{toilet.name}</h3><span className="distance">{toilet.distance}</span></div>
      <p className="address">{toilet.address}{toilet.locationDetail ? ` · ${toilet.locationDetail}` : ''}</p>
      <div className="card-tags">
        <span className={toilet.openAllDay ? 'tag tag-open' : 'tag'}>{toilet.openAllDay ? '24시간' : toilet.hours || '운영시간 확인'}</span>
        {toilet.requiresAccessKey && (
          <span className="tag" title={toilet.accessNote}>
            &#128273; {toilet.requiresPassword ? '비밀번호 필요' : '출입 확인 필요'}
          </span>
        )}
        {toilet.accessible && <span className="tag accessible-tag">♿ 접근 가능</span>}
        {toilet.babyFacility && <span className="tag">기저귀 교환대</span>}
        {toilet.status === 'pending' && <span className="tag pending-tag">검토 중</span>}
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        className="toilet-card toilet-card-button"
        type="button"
        onClick={() => onSelect(toilet)}
        aria-label={`${toilet.name} 위치 보기`}
      >
        {content}
      </button>
    );
  }

  return (
    <article className="toilet-card">
      {content}
    </article>
  );
}
