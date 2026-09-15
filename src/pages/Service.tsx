import { useEffect, useState, type FormEvent } from 'react';
import ServiceFooter from '../components/ServiceFooter';
import { getNearbyToilets } from '../services/toiletService';
import type { Toilet } from '../types/toilet';
import type { User } from '../types/auth';
import AdminFeedbackInbox from '../components/AdminFeedbackInbox';
import { sendFeedback } from '../services/feedbackService';
import NotificationBell from '../components/NotificationBell';

type ServiceProps = {
  user: User;
  onBack: () => void;
  onLogout: () => void;
};

type ToiletForm = {
  name: string;
  address: string;
  facilityType: NonNullable<Toilet['facilityType']>;
  locationDetail: string;
  openAllDay: boolean;
  openTime: string;
  closeTime: string;
  genderType: NonNullable<Toilet['genderType']>;
  accessible: boolean;
  babyFacility: boolean;
  note: string;
  agreed: boolean;
};

type ModalName = 'add' | 'feedback' | 'logout' | null;

const SUBMITTED_KEY = 'geuphaeyo-submitted-toilets';
const initialForm = (): ToiletForm => ({
  name: '',
  address: '',
  facilityType: 'public',
  locationDetail: '',
  openAllDay: false,
  openTime: '09:00',
  closeTime: '18:00',
  genderType: 'unknown',
  accessible: false,
  babyFacility: false,
  note: '',
  agreed: false,
});

function normalize(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s\-_,.·()]/g, '');
}

function loadSubmitted(): Toilet[] {
  try {
    return JSON.parse(localStorage.getItem(SUBMITTED_KEY) || '[]') as Toilet[];
  } catch {
    return [];
  }
}

export default function Service({ user, onBack, onLogout }: ServiceProps) {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [modal, setModal] = useState<ModalName>(null);
  const [form, setForm] = useState<ToiletForm>(initialForm);
  const [formError, setFormError] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'toilet_update'>('bug');
  const [feedbackArea, setFeedbackArea] = useState<'map' | 'service' | 'auth' | 'other'>('map');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackState, setFeedbackState] = useState('');
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    void getNearbyToilets().then((items) => setToilets([...loadSubmitted(), ...items]));
  }, []);

  useEffect(() => {
    if (!modal) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [modal]);

  const closeModal = () => {
    setModal(null);
    setFormError('');
    setFeedbackState('');
  };

  const addToilet = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (normalize(form.name).length < 3 || normalize(form.address).length < 6) {
      setFormError('화장실 이름과 정확한 도로명 주소를 입력해 주세요.');
      return;
    }
    if (toilets.some((item) => normalize(item.name) === normalize(form.name) || normalize(item.address) === normalize(form.address))) {
      setFormError('이미 등록된 이름 또는 주소입니다.');
      return;
    }
    if (!form.openAllDay && (!form.openTime || !form.closeTime)) {
      setFormError('24시간 운영이 아니라면 시작 시간과 종료 시간을 입력해 주세요.');
      return;
    }
    if (!form.agreed) {
      setFormError('등록 규칙을 확인하고 동의해 주세요.');
      return;
    }

    const toilet: Toilet = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      address: form.address.trim(),
      distance: '거리 확인 중',
      facilityType: form.facilityType,
      locationDetail: form.locationDetail.trim(),
      openAllDay: form.openAllDay,
      hours: form.openAllDay ? '24시간' : `${form.openTime}~${form.closeTime}`,
      genderType: form.genderType,
      accessible: form.accessible,
      babyFacility: form.babyFacility,
      note: form.note.trim(),
      status: 'pending',
      latitude: 37.5665,
      longitude: 126.978,
    };
    const submitted = [toilet, ...loadSubmitted()];
    localStorage.setItem(SUBMITTED_KEY, JSON.stringify(submitted));
    setToilets((current) => [toilet, ...current]);
    setForm(initialForm());
    closeModal();
  };

  const saveFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (feedbackTitle.trim().length < 3 || feedbackMessage.trim().length < 10) {
      setFeedbackState('제목은 3자 이상, 상세 내용은 10자 이상 입력해 주세요.');
      return;
    }

    try {
      await sendFeedback({
        type: feedbackType,
        area: feedbackArea,
        title: feedbackTitle.trim(),
        message: feedbackMessage.trim(),
      });
      setFeedbackTitle('');
      setFeedbackMessage('');
      setFeedbackState('피드백이 관리자에게 안전하게 전송되었습니다.');
    } catch (error) {
      setFeedbackState(error instanceof Error ? error.message : '내용을 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div className="service-page">
      <header className="service-page-header">
        <button className="service-brand" type="button" onClick={onBack}>니똥칼라똥</button>
        <nav className="service-page-actions" aria-label="고객센터 메뉴">
          <div className="service-user">
            {user.profileImage && <img src={user.profileImage} alt="" referrerPolicy="no-referrer" />}
            <span><strong>{user.name}{user.role === 'admin' && <em className="admin-role-badge">관리자</em>}</strong><small>{user.email}</small></span>
          </div>
          
          <button className="service-back-button" type="button" onClick={onBack}>← 지도로 돌아가기</button>
          <button className="service-logout-button" type="button" onClick={() => setModal('logout')}>로그아웃</button>
        </nav>
      </header>
      <div className="service-page-notification"><NotificationBell /></div>

      <main className="service-page-main">
        <section className="service-hero">
          <p>고객센터</p>
          <h1>더 나은 화장실 정보를<br /><strong>함께 만들어 주세요.</strong></h1>
          <span>새로운 장소를 제보하거나 서비스에 필요한 의견을 남길 수 있어요.</span>
        </section>

        <section className="service-guide" aria-labelledby="service-guide-title">
          <div><p>이용 방법</p><h2 id="service-guide-title">정확한 정보를 빠르게 제보하세요.</h2></div>
          <ol>
            <li><strong>장소 확인</strong><span>지도에서 같은 장소가 등록되어 있는지 먼저 확인하세요.</span></li>
            <li><strong>장소 제보</strong><span>주소와 운영시간 등 확인한 정보를 입력하세요.</span></li>
            <li><strong>통합 제보</strong><span>오류·기능 건의와 잘못된 화장실 정보를 함께 알려주세요.</span></li>
          </ol>
        </section>

        <section className="service-help-section" aria-labelledby="service-help-title">
          <div className="service-help-heading">
            <p>서비스 이용 안내</p>
            <h2 id="service-help-title">필요한 도움을 바로 선택하세요.</h2>
            <span>새로운 화장실을 제보하고, 서비스 의견 또는 잘못된 화장실 정보를 하나의 제보함으로 보낼 수 있습니다.</span>
          </div>

          <div className="service-help-grid">
            <article>
              <span className="service-help-number">01</span>
              <div><h3>새로운 화장실 제보</h3><p>지도에 없는 화장실의 위치와 운영 정보를 알려주세요.</p></div>
              <button type="button" onClick={() => setModal('add')}>화장실 제보하기 <span aria-hidden="true">→</span></button>
            </article>
            <article>
              <span className="service-help-number">02</span>
              <div><h3>통합 제보함</h3><p>버그·기능 건의와 화장실 정보 수정을 한 번에 접수하세요.</p></div>
              <button type="button" onClick={() => setModal('feedback')}>통합 제보하기 <span aria-hidden="true">→</span></button>
            </article>
          </div>

          <div className="service-help-notice">
            <strong>제보 전 확인해 주세요</strong>
            <span>정확한 주소와 운영시간을 입력하면 더 신뢰할 수 있는 화장실 정보를 만드는 데 도움이 됩니다.</span>
          </div>
        </section>

        {user.role === 'admin' && <AdminFeedbackInbox />}

      </main>

      <ServiceFooter
        onMapOpen={onBack}
        onFeedbackOpen={() => setModal('feedback')}
        onToiletAdd={() => setModal('add')}
      />

      {modal === 'add' && (
        <div className="service-modal-backdrop" onMouseDown={closeModal}>
          <section className="service-modal service-modal-wide" role="dialog" aria-modal="true" aria-labelledby="add-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="service-modal-header"><div><p>새로운 장소 제보</p><h2 id="add-title">화장실 추가</h2></div><button type="button" onClick={closeModal} aria-label="닫기">×</button></div>
            <p className="service-modal-description">정확한 장소와 이용 정보를 알려주세요. 제보는 이 브라우저에 검토 중 상태로 임시 저장됩니다.</p>
            <form className="service-form" onSubmit={addToilet}>
              <div className="service-form-grid">
                <label>화장실 이름 *<input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                <label>시설 유형 *
                  <select value={form.facilityType} onChange={(event) => setForm({ ...form, facilityType: event.target.value as ToiletForm['facilityType'] })}>
                    <option value="public">공중화장실</option>
                    <option value="building">건물 내부</option>
                    <option value="station">역·터미널</option>
                    <option value="park">공원</option>
                    <option value="other">기타</option>
                  </select>
                </label>
                <label className="service-full-field">도로명 주소 *<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
                <label>상세 위치<input value={form.locationDetail} onChange={(event) => setForm({ ...form, locationDetail: event.target.value })} /></label>
                <label>남녀 구분 *
                  <select value={form.genderType} onChange={(event) => setForm({ ...form, genderType: event.target.value as ToiletForm['genderType'] })}>
                    <option value="unknown">확인하지 못함</option>
                    <option value="separated">남녀 분리</option>
                    <option value="unisex">남녀 공용</option>
                  </select>
                </label>
                <fieldset className="service-time-field service-full-field" disabled={form.openAllDay}>
                  <legend>운영시간 *</legend>
                  <div>
                    <label>시작<input type="time" required={!form.openAllDay} value={form.openTime} onChange={(event) => setForm({ ...form, openTime: event.target.value })} /></label>
                    <span aria-hidden="true">~</span>
                    <label>종료<input type="time" required={!form.openAllDay} value={form.closeTime} onChange={(event) => setForm({ ...form, closeTime: event.target.value })} /></label>
                  </div>
                  {form.openAllDay && <small>24시간 운영으로 설정되었습니다.</small>}
                </fieldset>
                <label className="service-full-field">추가 설명<textarea maxLength={300} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
              </div>
              <div className="service-check-row">
                <label><input type="checkbox" checked={form.openAllDay} onChange={(event) => setForm({ ...form, openAllDay: event.target.checked })} /> 24시간 운영</label>
                <label><input type="checkbox" checked={form.accessible} onChange={(event) => setForm({ ...form, accessible: event.target.checked })} /> 장애인 접근 가능</label>
                <label><input type="checkbox" checked={form.babyFacility} onChange={(event) => setForm({ ...form, babyFacility: event.target.checked })} /> 기저귀 교환대 있음</label>
              </div>
              <label className="service-agreement"><span>정확한 정보임을 확인했으며 등록 규칙에 동의합니다.</span><input type="checkbox" checked={form.agreed} onChange={(event) => setForm({ ...form, agreed: event.target.checked })} /></label>
              {formError && <p className="service-form-status" role="alert">{formError}</p>}
              <div className="service-form-actions"><button type="button" onClick={closeModal}>취소</button><button className="service-submit-button" type="submit">검토 요청하기</button></div>
            </form>
          </section>
        </div>
      )}

      {modal === 'feedback' && (
        <div className="service-modal-backdrop" onMouseDown={closeModal}>
          <section className="service-modal service-feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="service-modal-header">
              <div><p>서비스·정보 통합 제보</p><h2 id="feedback-title">통합 제보함</h2></div>
              <button type="button" onClick={closeModal} aria-label="닫기">×</button>
            </div>
            <p className="service-modal-description">전송한 내용은 관리자 계정에서만 확인할 수 있습니다.</p>
            <form className="service-form" onSubmit={saveFeedback}>
              <div className="service-form-grid">
                <label>접수 유형 *
                  <select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as typeof feedbackType)}>
                    <option value="bug">버그 신고</option>
                    <option value="suggestion">기능 건의</option>
                    <option value="toilet_update">화장실 정보 수정</option>
                  </select>
                </label>
                <label>관련 화면 *
                  <select value={feedbackArea} onChange={(event) => setFeedbackArea(event.target.value as typeof feedbackArea)}>
                    <option value="map">지도·길찾기</option>
                    <option value="service">고객센터</option>
                    <option value="auth">로그인·회원가입</option>
                    <option value="other">기타</option>
                  </select>
                </label>
                <label className="service-full-field">제목 *
                  <input
                    autoFocus
                    required
                    minLength={3}
                    maxLength={80}
                    value={feedbackTitle}
                    onChange={(event) => {
                      setFeedbackTitle(event.target.value);
                      setFeedbackState('');
                    }}
                    placeholder="버그, 기능 건의 또는 수정할 화장실 정보를 입력해 주세요"
                  />
                </label>
                <label className="service-full-field">상세 내용 *
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    value={feedbackMessage}
                    onChange={(event) => {
                      setFeedbackMessage(event.target.value);
                      setFeedbackState('');
                    }}
                    placeholder="화장실 이름·주소·수정할 항목 또는 발생 상황을 자세히 적어주세요"
                  />
                </label>
              </div>
              {feedbackState && <p className="service-form-status" role="status">{feedbackState}</p>}
              <div className="service-form-actions">
                <button type="button" onClick={closeModal}>닫기</button>
                <button className="service-submit-button" type="submit">통합 제보 전송</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modal === 'logout' && (
        <div className="service-modal-backdrop" onMouseDown={closeModal}>
          <section className="service-modal service-logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="service-modal-header"><div><p>로그아웃 확인</p><h2 id="logout-title">로그아웃할까요?</h2></div><button type="button" onClick={closeModal} aria-label="닫기">×</button></div>
            <p className="service-modal-description">로그아웃하면 다시 로그인해야 서비스를 이용할 수 있습니다.</p>
            <div className="service-form-actions"><button type="button" onClick={closeModal}>아니요</button><button className="service-submit-button" type="button" onClick={onLogout}>예</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
