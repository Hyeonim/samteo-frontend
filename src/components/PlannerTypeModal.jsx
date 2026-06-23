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
              편의점·카페·음식점·물류 등 다양한 아르바이트를 통해<br />
              현지 생활비를 마련하고 색다른 지역을 경험하세요.
            </p>
            <div className="ptm-cta">선택하기 →</div>
          </div>
        </div>

        <div className="ptm-divider" />

        <div className="ptm-half ptm-long" onClick={() => onSelect('long')}>
          <div className="ptm-content">
            <div className="ptm-icon">🌱</div>
            <h2 className="ptm-title">장기체류</h2>
            <p className="ptm-sub">깊게, 뿌리내리며</p>
            <p className="ptm-desc">
              공공기관·기업의 정규직·계약직 채용 공고를 기반으로<br />
              새로운 지역에 안정적으로 정착하는 플래너를 만드세요.
            </p>
            <div className="ptm-cta">선택하기 →</div>
          </div>
        </div>

      </div>
    </div>
  )
}
