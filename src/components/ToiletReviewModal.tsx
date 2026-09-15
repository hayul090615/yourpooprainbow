import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { deleteToiletReview, getToiletReviews, saveToiletReview, toggleToiletReviewLike } from '../services/reviewService';
import type { ToiletReview } from '../types/review';
import type { User } from '../types/auth';

type ToiletReviewModalProps = {
  toilet: { id: string; name: string };
  user: User | null;
  onClose: () => void;
  onLogin: () => void;
};

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div className="review-score"><span>{label}</span><div role="radiogroup" aria-label={label}>{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" className={score <= value ? 'is-filled' : ''} onClick={() => onChange(score)} aria-label={`${score}점`} aria-checked={score === value} role="radio">★</button>)}</div><strong>{value}.0</strong></div>;
}

export default function ToiletReviewModal({ toilet, user, onClose, onLogin }: ToiletReviewModalProps) {
  const [reviews, setReviews] = useState<ToiletReview[]>([]);
  const [rating, setRating] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [likedReviewIds, setLikedReviewIds] = useState<string[]>([]);

  useEffect(() => { void getToiletReviews(toilet.id).then(setReviews).catch((error) => setStatus(error instanceof Error ? error.message : '리뷰를 불러오지 못했습니다.')); }, [toilet.id]);
  const averages = useMemo(() => reviews.length ? { rating: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length, cleanliness: reviews.reduce((sum, review) => sum + review.cleanliness, 0) / reviews.length } : null, [reviews]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { onLogin(); return; }
    if (content.trim().length < 5) { setStatus('리뷰는 5자 이상 입력해 주세요.'); return; }
    try {
      await saveToiletReview({ toiletId: toilet.id, toiletName: toilet.name, rating, cleanliness, content: content.trim() });
      setContent('');
      setEditingReviewId(null);
      setStatus(editingReviewId ? '리뷰가 수정되었습니다.' : '리뷰가 저장되었습니다.');
      setReviews(await getToiletReviews(toilet.id));
    } catch (error) { setStatus(error instanceof Error ? error.message : '리뷰를 저장하지 못했습니다.'); }
  }

  async function removeReview(id: string) {
    if (!window.confirm('이 리뷰를 삭제할까요?')) return;
    try { await deleteToiletReview(id); setReviews(await getToiletReviews(toilet.id)); } catch (error) { setStatus(error instanceof Error ? error.message : '리뷰를 삭제하지 못했습니다.'); }
  }

  function editReview(review: ToiletReview) {
    setRating(review.rating);
    setCleanliness(review.cleanliness);
    setContent(review.content);
    setEditingReviewId(review.id);
    setStatus('');
  }

  async function likeReview(review: ToiletReview) {
    if (!user) { onLogin(); return; }
    try { const result = await toggleToiletReviewLike(review.id); setLikedReviewIds((current) => result.liked ? [...new Set([...current, review.id])] : current.filter((id) => id !== review.id)); setReviews((current) => current.map((item) => item.id === review.id ? { ...item, likeCount: result.likeCount } : item)); } catch (error) { setStatus(error instanceof Error ? error.message : '좋아요를 변경하지 못했습니다.'); }
  }

  return <div className="review-modal-backdrop" onMouseDown={onClose}><section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><p>화장실 이용 후기</p><h2 id="review-title">{toilet.name}</h2></div><button type="button" onClick={onClose} aria-label="닫기">×</button></header>
    {averages ? <div className="review-summary"><strong>★ {averages.rating.toFixed(1)}</strong><span>청결도 {averages.cleanliness.toFixed(1)} · {reviews.length}개 리뷰</span></div> : <p className="review-empty">첫 번째 리뷰를 남겨 주세요.</p>}
    {user ? <form onSubmit={submit} className="review-form"><StarPicker label="별점" value={rating} onChange={setRating} /><StarPicker label="청결도" value={cleanliness} onChange={setCleanliness} /><label>리뷰 내용<textarea value={content} maxLength={500} minLength={5} onChange={(event) => { setContent(event.target.value); setStatus(''); }} placeholder="청결 상태, 휴지·비누 비치 여부 등 실제 이용 경험을 남겨 주세요." required /></label><button type="submit">{editingReviewId ? '리뷰 수정 저장' : '리뷰 등록'}</button>{editingReviewId && <button className="review-cancel-button" type="button" onClick={() => { setEditingReviewId(null); setContent(''); setRating(5); setCleanliness(5); }}>수정 취소</button>}</form> : <div className="review-login"><p>리뷰 작성은 로그인 후 이용할 수 있습니다.</p><button type="button" onClick={onLogin}>로그인하고 리뷰 쓰기</button></div>}
    {status && <p className="review-status" role="status">{status}</p>}
    <div className="review-list">{reviews.slice(0, 5).map((review) => <article key={review.id}><div><strong>{review.authorName}{user?.role === 'admin' && review.updatedAt !== review.createdAt && <em className="review-edited-badge">수정됨</em>}</strong><span>★ {review.rating} · 청결도 {review.cleanliness}</span></div><p>{review.content}</p><time dateTime={review.updatedAt}>{new Date(review.updatedAt).toLocaleDateString('ko-KR')}</time><button className={likedReviewIds.includes(review.id) ? 'review-like-button is-liked' : 'review-like-button'} type="button" onClick={() => void likeReview(review)}>♥ 좋아요 {review.likeCount}</button>{user?.id === review.authorUserId && <><button className="review-edit-button" type="button" onClick={() => editReview(review)}>내 리뷰 수정</button><button className="review-delete-button" type="button" onClick={() => void removeReview(review.id)}>내 리뷰 삭제</button></>}{user?.role === 'admin' && user.id !== review.authorUserId && <button className="review-delete-button" type="button" onClick={() => void removeReview(review.id)}>관리자 삭제</button>}</article>)}</div>
  </section></div>;
}
