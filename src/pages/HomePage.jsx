import { useNavigate } from 'react-router-dom'
import './HomePage.css'

const STATS = [
  { num: '₩168만', lbl: '리조트 스태프 4주 체류 시\n예상 가처분 소득' },
  { num: '5단계', lbl: '지역→숙소→일자리→\n동선→플래너 자동 완성' },
  { num: 'TourAPI', lbl: '한국관광공사 OpenAPI\n기반 실시간 데이터' },
  { num: '1시간', lbl: '출퇴근 1시간 이내 숙소만\n자동 필터링' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <div className="landing-bg" />
      <div className="landing-content">
        <div className="landing-left">
          <div className="landing-badge">📍 일터 + 쉼터 + 놀터 통합 플래너</div>
          <h1>
            일하고 쉬고 즐기는<br />
            <em>체류형 워킹홀리데이</em>를<br />
            한 번에 설계하세요
          </h1>
          <p>
            일자리·숙소·관광을 연결해<br />
            청년이 지역에서 살아볼 수 있도록 돕습니다
          </p>
          <div className="landing-cta">
            <button className="btn-cta-main" onClick={() => navigate('/planner')}>
              🚀 삼터 시작하기
            </button>
            <button className="btn-cta-sub">더 알아보기</button>
          </div>
        </div>
        <div className="landing-right">
          {STATS.map((s) => (
            <div className="landing-stat" key={s.num}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
