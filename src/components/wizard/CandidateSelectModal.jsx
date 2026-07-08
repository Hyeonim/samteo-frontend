import { useEffect } from 'react'
import './CandidateSelectModal.css'

export default function CandidateSelectModal({
  jobs,
  hotelsByJobId,
  selectedId,
  onSelect,
  onConfirm,
  onClose,
  saving,
}) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, saving])

  const selectedJob = jobs.find((job) => job.id === selectedId)

  return (
    <div className="csm-overlay" onClick={() => !saving && onClose()}>
      <div className="csm-panel" onClick={(e) => e.stopPropagation()}>
        <button className="csm-close" onClick={onClose} disabled={saving} aria-label="닫기">✕</button>

        <div className="csm-header">
          <h2 className="csm-title">저장할 후보를 선택해 주세요</h2>
          <p className="csm-sub">선택한 후보의 일자리와 숙소만 내 플래너에 저장됩니다.</p>
        </div>

        <div className="csm-list">
          {jobs.map((job, index) => {
            const hotel = hotelsByJobId[job.id]
            const active = job.id === selectedId
            return (
              <button
                type="button"
                key={job.id}
                className={`csm-item${active ? ' active' : ''}`}
                onClick={() => onSelect(job.id)}
                aria-pressed={active}
              >
                <span className="csm-item-badge">{active ? '✓' : index + 1}</span>
                <span className="csm-item-body">
                  <span className="csm-item-row">
                    <i aria-hidden="true">💼</i><b title={job.name}>{job.name}</b>
                  </span>
                  <span className="csm-item-row">
                    <i aria-hidden="true">🏠</i><b title={hotel?.name || '숙소 미선택'}>{hotel?.name || '숙소 미선택'}</b>
                  </span>
                  <span className="csm-item-meta">
                    <span>📍 {job.region ?? job.district ?? '-'}</span>
                    <span>{Number(job.salary ?? job.monthlySalary ?? 0).toLocaleString()}원</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="csm-actions">
          <button className="csm-cancel" onClick={onClose} disabled={saving}>취소</button>
          <button className="csm-confirm" onClick={onConfirm} disabled={!selectedJob || saving}>
            {saving ? '저장 중...' : '이 후보로 저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
