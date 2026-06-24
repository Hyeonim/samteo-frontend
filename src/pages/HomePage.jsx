import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PlannerTypeModal from '../components/PlannerTypeModal'
import './HomePage.css'

const FEATURES = [
  {
    icon: '🏡',
    label: '쉼터',
    title: '나만의 안식처 찾기',
    desc: '지역별 숙소, 게스트하우스, 공유주택 정보를 한눈에 확인하세요.',
    color: '#7c3aed',
  },
  {
    icon: '💼',
    label: '일터',
    title: '지역 일자리 탐색',
    desc: '귀농·귀촌·워케이션에 맞는 일자리와 아르바이트를 찾아보세요.',
    color: '#2563eb',
  },
  {
    icon: '🎪',
    label: '놀터',
    title: '로컬 축제 & 체험',
    desc: '지역 축제, 문화행사, 체험 프로그램 정보를 확인하세요.',
    color: '#059669',
  },
]

function HomePage() {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const [showTypeModal, setShowTypeModal] = useState(false)

  function handlePlannerTypeSelect(type) {
    setShowTypeModal(false)
    navigate('/planner', { state: { plannerType: type } })
  }

  return (
    <div className="home">
      {showTypeModal && (
        <PlannerTypeModal
          onSelect={handlePlannerTypeSelect}
          onClose={() => setShowTypeModal(false)}
        />
      )}
      {/* Hero */}
      <section className="hero">
        <div className="hero__inner">
          <p className="hero__badge">쉼터 · 일터 · 놀터</p>
          <h1 className="hero__title">
            지역과 나를 잇는<br />
            <span className="hero__title--grad">새로운 연결</span>
          </h1>
          <p className="hero__desc">
            삼터는 당신이 원하는 곳에서<br />
            살고, 일하고, 즐길 수 있도록 돕습니다.
          </p>
          <div className="hero__cta">
            {isLoggedIn ? (
              <>
                <span className="hero__welcome">{user.name}님, 환영해요!</span>
                <button className="btn-primary" onClick={() => setShowTypeModal(true)}>
                  내 플래너 시작하기
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary" onClick={() => navigate('/login')}>
                  시작
                </button>
                <button className="btn-secondary" onClick={() => navigate('/register')}>
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
        <div className="hero__visual">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="features__title">삼터가 제공하는 것</h2>
        <div className="features__grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.label}>
              <div className="feature-card__icon" style={{ background: f.color + '18', color: f.color }}>
                {f.icon}
              </div>
              <div className="feature-card__badge" style={{ color: f.color }}>{f.label}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      {!isLoggedIn && (
        <section className="cta-banner">
          <h2 className="cta-banner__title">지금 바로 시작해보세요</h2>
          <p className="cta-banner__desc">카카오 계정으로 3초 만에 가입할 수 있어요.</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            무료로 시작하기
          </button>
        </section>
      )}

      {/* Data Attribution */}
      <section className="data-attr">
        <div className="data-attr__inner">
          <div className="data-attr__top">
            <span className="data-attr__label">한국관광콘텐츠랩 활용</span>
            <p className="data-attr__desc">
              삼터는 한국관광콘텐츠랩 API를 활용하여 전국의 실시간 관광 정보를 제공합니다.
            </p>
          </div>
          <ul className="data-attr__chips">
            <li className="data-attr__chip">🎪 지역 축제 · 행사</li>
            <li className="data-attr__chip">🏔️ 관광 명소</li>
            <li className="data-attr__chip">🍽️ 지역 음식점</li>
            <li className="data-attr__chip">📋 시설 운영 정보</li>
          </ul>
          <p className="data-attr__source">
            출처: 한국관광콘텐츠랩 API
          </p>
        </div>
      </section>
    </div>
  )
}

export default HomePage
