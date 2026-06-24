export default function CandidatePairChip({ index, job, hotel, active, onClick }) {
  const matched = Boolean(hotel?.name)

  return (
    <button
      type="button"
      className={`candidate-pair-chip${active ? ' active' : ''}${matched ? ' matched' : ' unmatched'}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`후보 ${index + 1}: ${job.name}, ${matched ? `${hotel.name} 숙소와 매칭됨` : '숙소 미선택'}`}
    >
      <span className="candidate-pair-head">
        <strong>후보 {index + 1}</strong>
        <em>{matched ? '✓ 매칭 완료' : '숙소 미선택'}</em>
      </span>
      <span className="candidate-pair-route">
        <span className="candidate-pair-item job">
          <i>💼</i>
          <span>
            <small>일자리</small>
            <b title={job.name}>{job.name}</b>
          </span>
        </span>
        <span className="candidate-pair-link" aria-hidden="true">↔</span>
        <span className="candidate-pair-item hotel">
          <i>🏠</i>
          <span>
            <small>숙소</small>
            <b title={hotel?.name || '아직 선택하지 않음'}>{hotel?.name || '아직 선택하지 않음'}</b>
          </span>
        </span>
      </span>
    </button>
  )
}
