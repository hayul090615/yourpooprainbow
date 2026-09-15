import { useEffect, useState } from 'react';
import { getFeedback, updateFeedback } from '../services/feedbackService';
import type { Feedback, FeedbackStatus } from '../types/feedback';

const statusLabels: Record<FeedbackStatus, string> = {
  received: '접수',
  reviewing: '검토 중',
  resolved: '처리 완료',
};

const typeLabels = { bug: '버그', suggestion: '기능 건의', toilet_update: '화장실 정보 수정' } as const;

export default function AdminFeedbackInbox() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    void getFeedback()
      .then(setItems)
      .catch((reason) => setError(reason instanceof Error ? reason.message : '피드백을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(item: Feedback, status: FeedbackStatus) {
    setError('');
    try {
      await updateFeedback(item.id, status, item.adminReply);
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '상태를 변경하지 못했습니다.');
    }
  }

  async function sendReply(item: Feedback) {
    const reply = (replyInputs[item.id] ?? '').trim();
    if (reply.length < 2) { setError('답변은 2자 이상 입력해 주세요.'); return; }
    try {
      await updateFeedback(item.id, item.status, reply, true);
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, adminReply: reply } : entry));
      setReplyInputs((current) => ({ ...current, [item.id]: '' }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : '답변을 전송하지 못했습니다.'); }
  }

  return (
    <section className="admin-feedback" aria-labelledby="admin-feedback-title">
      <div className="admin-feedback-heading">
        <div><p>관리자 전용</p><h2 id="admin-feedback-title">피드백 수신함</h2></div>
        <span>{items.length}건</span>
      </div>
      {loading && <p className="admin-feedback-empty">피드백을 불러오는 중입니다.</p>}
      {error && <p className="service-form-status" role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="admin-feedback-empty">아직 도착한 피드백이 없습니다.</p>}
      <div className="admin-feedback-list">
        {items.map((item) => (
          <article key={item.id}>
            <div className="admin-feedback-meta">
              <span>{typeLabels[item.type]}</span>
              <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('ko-KR')}</time>
            </div>
            <h3>{item.title}</h3>
            <p>{item.message}</p>
            <small>{item.senderName} · {item.senderEmail}</small>
            <label>처리 상태
              <select value={item.status} onChange={(event) => void changeStatus(item, event.target.value as FeedbackStatus)}>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {item.adminReply && <p className="admin-feedback-reply"><strong>내 답변</strong>{item.adminReply}</p>}
            <div className="admin-feedback-reply-form">
              <textarea value={replyInputs[item.id] ?? ''} maxLength={1000} onChange={(event) => setReplyInputs((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="답변을 작성하면 사용자에게 알림이 전송됩니다." />
              <button type="button" onClick={() => void sendReply(item)}>답변 전송·알림</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
