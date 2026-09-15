type ServiceFooterProps = {
  onMapOpen: () => void;
  onFeedbackOpen: () => void;
  onToiletAdd: () => void;
};

export default function ServiceFooter({ onMapOpen, onFeedbackOpen, onToiletAdd }: ServiceFooterProps) {
  return (
    <footer className="service-footer">
      <div className="service-footer-main">
        <div className="service-footer-brand">
          <button type="button" onClick={onMapOpen}>니똥칼라똥</button>
          <p>니똥칼라똥, 가까운 화장실은 우리가 찾을게요.</p>
        </div>

        <nav className="service-footer-links" aria-label="푸터 서비스 메뉴">
          <strong>서비스</strong>
          <button type="button" onClick={onFeedbackOpen}>통합 제보함</button>
          <button type="button" onClick={onToiletAdd}>화장실 제보</button>
        </nav>

        <div className="service-footer-project">
          <strong>프로젝트</strong>
          <span>React · TypeScript</span>
          <span>Kakao Map SDK</span>
          <span>Node.js · PostgreSQL</span>
        </div>
      </div>

      <div className="service-footer-bottom">
        <span>© {new Date().getFullYear()} 니똥칼라똥</span>
        <span>함께 만드는 정확한 화장실 정보</span>
      </div>
    </footer>
  );
}
