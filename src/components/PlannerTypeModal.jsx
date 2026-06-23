import { useEffect } from 'react'
import './PlannerTypeModal.css'

export default function PlannerTypeModal({ onSelect, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="ptm-overlay" onClick={onClose}>
      <div className="ptm-panel" onClick={(e) => e.stopPropagation()}>

        <button className="ptm-close" onClick={onClose} aria-label="닫기">✕</button>

        <div className="ptm-half ptm-short" onClick={() => onSelect('short')}>
          <div className="ptm-content">
            <div className="ptm-icon">⚡</div>
            <h2 className="ptm-title">단기체류</h2>
            <p className="ptm-sub">짧게, 자유롭게</p>
            <p className="ptm-desc">
              단기 아르바이트와 머물 곳을 함께 찾아,<br />
              부담 없이 새로운 지역의 일상을 경험해 보세요.
            </p>
            <div className="ptm-cta">선택하기 →</div>
            <p className="ptm-ps">ps. 1주일 ~ 1달 정도의 단기 체류를 생각하고 있다면</p>
          </div>
        </div>

        <div className="ptm-divider" />

        <div className="ptm-half ptm-long" onClick={() => onSelect('long')}>
          <div className="ptm-content">
            <div className="ptm-icon">🌱</div>
            <h2 className="ptm-title">장기체류</h2>
            <p className="ptm-sub">깊게, 뿌리내리며</p>
            <p className="ptm-desc">
              채용 공고와 주거 정보를 바탕으로,<br />
              새로운 지역에 안정적으로 정착할 계획을 세워 보세요.
            </p>
            <div className="ptm-cta">선택하기 →</div>
            <p className="ptm-ps">ps. 1달 이상의 장기 정착을 목표로 한다면</p>
          </div>
        </div>

      </div>
    </div>
  )
}
