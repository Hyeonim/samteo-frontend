import { useState, useEffect, useRef } from 'react'

const HOTELS = [
  {
    name: '대구 도심 호스텔',
    price: 450000,
    location: '중구 동인동 · 반월당역 도보 4분',
    tags: [{ label: '숙소 별도', type: 'gray' }, { label: '지하철 12분', type: 'green' }],
    pos: '▲ 가처분 +93만',
    posType: 'pos',
    bg: 'linear-gradient(135deg,#1e3a5f,#2d5a8e)',
    lat: 35.868,
    lng: 128.591,
    color: '#3B82F6',
    rank: 1,
    district: '중구',
  },
  {
    name: '동성로 스마트 고시텔',
    price: 380000,
    location: '중구 남일동 · 중앙로역 도보 2분',
    tags: [{ label: '숙소 별도', type: 'gray' }, { label: '도보 22분', type: 'green' }],
    pos: '▲ 가처분 +105만',
    posType: 'pos',
    bg: 'linear-gradient(135deg,#f093fb,#f5576c)',
    lat: 35.8715,
    lng: 128.5865,
    color: '#10B981',
    rank: null,
    district: '중구',
  },
  {
    name: '수성 제이즈 스테이',
    price: 600000,
    location: '수성구 황금동 · 수성못역 도보 5분',
    tags: [{ label: '숙식 제공', type: 'blue' }, { label: '버스 28분', type: 'green' }],
    pos: '▲ 가처분 +160만',
    posType: 'pos',
    bg: 'linear-gradient(135deg,#667eea,#764ba2)',
    lat: 35.8563,
    lng: 128.6297,
    color: '#F97316',
    rank: null,
    district: '수성구',
  },
  {
    name: '팔공산 게스트하우스',
    price: 500000,
    location: '동구 둔산동 · 팔공산 버스 정류장 5분',
    tags: [{ label: '숙식 제공', type: 'blue' }, { label: '한달살기 전용', type: 'gray' }],
    pos: '▲ 가처분 +145만',
    posType: 'pos',
    bg: 'linear-gradient(135deg,#43e97b,#38f9d7)',
    lat: 35.912,
    lng: 128.663,
    color: '#EF4444',
    rank: null,
    district: '동구',
  },
  {
    name: '반월당 메트로 게하',
    price: 580000,
    location: '중구 덕산동 · 반월당역 환승센터',
    tags: [{ label: '숙소 별도', type: 'gray' }, { label: '버스 18분', type: 'green' }],
    pos: '▼ 가처분 -12만',
    posType: 'neg',
    bg: 'linear-gradient(135deg,#4facfe,#00f2fe)',
    lat: 35.8658,
    lng: 128.5948,
    color: '#8B5CF6',
    rank: null,
    district: '중구',
  },
]

const DISTRICTS = [...new Set(HOTELS.map((h) => h.district))]

export default function Step3Accommodation({ selectedJobs, selectedHotel, onSelect }) {
  const [activeJobId, setActiveJobId] = useState(null)
  const sliderRef = useRef(null)
  const mapRef = useRef(null)
  const kakaoMapRef = useRef(null)
  const markersRef = useRef([])
  const jobMarkerRef = useRef(null)
  const infoWindowsRef = useRef([])

  const activeJob = selectedJobs.find((j) => j.id === activeJobId) ?? null

  function scrollSlider(dir) {
    sliderRef.current?.scrollBy({ left: dir * 250, behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeJobId && !selectedJobs.find((j) => j.id === activeJobId)) {
      setActiveJobId(null)
    }
  }, [selectedJobs, activeJobId])

  useEffect(() => {
    const initMap = () => {
      if (kakaoMapRef.current) return
      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container || kakaoMapRef.current) return

        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(35.8714, 128.6014),
          level: 5,
        })
        kakaoMapRef.current = map

        HOTELS.forEach((h) => {
          const position = new window.kakao.maps.LatLng(h.lat, h.lng)

          const markerContent = `<div style="width:14px;height:14px;border-radius:50%;background:${h.color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.22);cursor:pointer;"></div>`
          const marker = new window.kakao.maps.CustomOverlay({
            position,
            content: markerContent,
            xAnchor: 0.5,
            yAnchor: 0.5,
          })
          marker.setMap(map)

          const infoContent = `
            <div style="padding:10px 14px;border-radius:10px;background:white;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:160px;font-family:sans-serif;">
              <div style="font-weight:700;font-size:13px;color:#1e293b;">${h.name}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${h.location}</div>
              <div style="font-size:12px;color:#3B82F6;font-weight:600;margin-top:4px;">월 ${h.price.toLocaleString()}원</div>
            </div>`
          const infoWindow = new window.kakao.maps.CustomOverlay({
            position,
            content: infoContent,
            xAnchor: 0.5,
            yAnchor: 1.6,
            zIndex: 10,
          })

          marker.__info = infoWindow
          infoWindowsRef.current.push(infoWindow)
          markersRef.current.push(marker)
        })
      })
    }

    if (window.kakao) {
      initMap()
    } else {
      const script = document.querySelector('script[src*="dapi.kakao.com"]')
      script?.addEventListener('load', initMap)
      return () => script?.removeEventListener('load', initMap)
    }
  }, [])

  // 선택된 숙소 마커 강조 + 지도 이동
  useEffect(() => {
    if (!markersRef.current.length || !kakaoMapRef.current) return
    markersRef.current.forEach((m, i) => {
      const h = HOTELS[i]
      if (!h) return
      const selected = selectedHotel.name === h.name
      const s = selected ? 20 : 14
      const shadow = selected
        ? `box-shadow:0 0 0 5px ${h.color}44,0 2px 8px rgba(0,0,0,0.25);`
        : 'box-shadow:0 2px 8px rgba(0,0,0,0.22);'
      const content = `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${h.color};border:2.5px solid white;${shadow}cursor:pointer;"></div>`
      m.setContent(content)

      if (selected) {
        m.__info.setMap(kakaoMapRef.current)
        kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(h.lat, h.lng))
      } else {
        m.__info.setMap(null)
      }
    })
  }, [selectedHotel])

  // 알바 위치로 이동
  useEffect(() => {
    if (!kakaoMapRef.current) return

    if (jobMarkerRef.current) {
      jobMarkerRef.current.setMap(null)
      jobMarkerRef.current = null
    }

    if (activeJob) {
      const position = new window.kakao.maps.LatLng(activeJob.lat, activeJob.lng)
      kakaoMapRef.current.panTo(position)

      const jobContent = `
        <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);border:3px solid white;box-shadow:0 0 0 5px rgba(245,158,11,0.3),0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:22px;">${activeJob.emoji}</div>`
      const jobMarker = new window.kakao.maps.CustomOverlay({
        position,
        content: jobContent,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 20,
      })
      jobMarker.setMap(kakaoMapRef.current)
      jobMarkerRef.current = jobMarker
    }
  }, [activeJob])

  return (
    <div className="step-card">
      <div className="step-title">출퇴근 1시간 이내 숙소를 지도에서 선택해 주세요</div>
      <div className="step-subtitle">
        관광공사 데이터 기반 엄선 체류지 · Haversine 반경 필터 + 카카오 대중교통 검증 완료
      </div>

      <div className="job-slider-wrap">
        <div className="job-slider-label">
          {selectedJobs.length > 0
            ? `선택한 알바 ${selectedJobs.length}개 · 클릭하면 지도에서 알바 위치를 확인할 수 있어요`
            : 'Step 2에서 알바를 선택하면 여기에 표시됩니다'}
        </div>
        {selectedJobs.length === 0 ? (
          <div className="job-chip-empty">
            <span style={{ fontSize: 20 }}>💼</span>
            아직 선택한 알바가 없어요. 이전 단계로 돌아가 알바를 선택해 보세요.
          </div>
        ) : (
          <div className="job-slider-carousel">
            <button className="slider-arrow" onClick={() => scrollSlider(-1)} aria-label="이전">‹</button>
            <div className="job-slider" ref={sliderRef}>
              {selectedJobs.map((j) => (
                <div
                  key={j.id}
                  className={`job-chip${activeJobId === j.id ? ' active' : ''}`}
                  onClick={() => setActiveJobId(activeJobId === j.id ? null : j.id)}
                >
                  <span className="job-chip-emoji">{j.emoji}</span>
                  <div>
                    <div className="job-chip-name">{j.name}</div>
                    <div className="job-chip-sub">{j.type} · {j.priceLabel}{j.unit}</div>
                  </div>
                  {activeJobId === j.id && <span className="job-chip-pin">📍</span>}
                </div>
              ))}
            </div>
            <button className="slider-arrow" onClick={() => scrollSlider(1)} aria-label="다음">›</button>
          </div>
        )}
        {activeJob && (
          <div className="job-active-banner">
            <span>{activeJob.emoji}</span>
            <span><strong>{activeJob.name}</strong> 위치로 지도가 이동했습니다</span>
            <button className="job-active-close" onClick={() => setActiveJobId(null)}>✕</button>
          </div>
        )}
      </div>

      <div className="map-step-layout">
        <div className="map-sidebar">
          <div className="map-sidebar-header">
            <div className="map-sidebar-title">추천 숙소</div>
            <div className="map-filter-row">
              <div className="mchip active">🚌 30분 이내</div>
              <div className="mchip green">🍽 숙식 제공</div>
            </div>
          </div>
          <div className="map-result-info">
            <span>숙소 {HOTELS.length}개 표시 중</span>
            <span style={{ color: '#3B82F6', cursor: 'pointer', fontWeight: 600 }}>거리순 ▾</span>
          </div>
          <div className="acc-list">
            {DISTRICTS.map((d) => (
              <div key={d}>
                <div className="acc-sec">📍 {d}</div>
                {HOTELS.filter((h) => h.district === d).map((h) => (
                  <div
                    key={h.name}
                    className={`acc-card${selectedHotel.name === h.name ? ' selected' : ''}`}
                    onClick={() => onSelect({ name: h.name, price: h.price })}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div className="acc-img-box" style={{ background: h.bg }} />
                      {h.rank && (
                        <div style={{
                          position: 'absolute', top: -3, left: -3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#3B82F6', color: 'white',
                          fontSize: 9, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {h.rank}
                        </div>
                      )}
                    </div>
                    <div className="acc-info">
                      <div className="acc-name">{h.name}</div>
                      <div className="acc-location">{h.location}</div>
                      <div className="acc-tags">
                        {h.tags.map((t) => (
                          <span key={t.label} className={`at at-${t.type}`}>{t.label}</span>
                        ))}
                      </div>
                      <div className="acc-price-row">
                        <span className="acc-price">월 {h.price.toLocaleString()}원</span>
                        <span className={h.posType === 'pos' ? 'acc-pos' : 'acc-neg'}>{h.pos}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="map-wrapper">
          <div ref={mapRef} style={{ width: '100%', height: '560px' }} />
        </div>
      </div>
    </div>
  )
}
