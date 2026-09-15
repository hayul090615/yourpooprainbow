import { useEffect, useState } from 'react';
import { getToiletReviews } from '../services/reviewService';

export default function ToiletRatingSummary({ toiletId, reviewOpen }: { toiletId: string; reviewOpen: boolean }) {
  const [summary, setSummary] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    if (reviewOpen) return;
    void getToiletReviews(toiletId).then((reviews) => {
      const text = reviews.length
        ? `★ 평균 ${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} · 리뷰 ${reviews.length}개`
        : '☆ 아직 별점 없음';
      if (active) setSummary({ id: toiletId, text });
    }).catch(() => {
      if (active) setSummary({ id: toiletId, text: '별점 정보를 불러오지 못했습니다.' });
    });
    return () => { active = false; };
  }, [toiletId, reviewOpen]);

  return <div className="map-rating-summary" role="status">{summary?.id === toiletId ? summary.text : '별점 불러오는 중…'}</div>;
}
