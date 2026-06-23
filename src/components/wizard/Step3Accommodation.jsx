import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { api } from '../../api'

const DEFAULT_MAP_POINT = { lat: 35.8714, lng: 128.6014 }

// meta_region.region_id 기준 광역 지역 대표 좌표입니다.
// ALIO는 상세 근무지 좌표를 제공하지 않으므로 지도 중심/마커의 안전한 대체값으로 사용합니다.
const META_REGION_CENTERS = {
  1: { lat: 37.5665, lng: 126.9780 }, // 서울
  2: { lat: 37.4563, lng: 126.7052 }, // 인천
  3: { lat: 36.3504, lng: 127.3845 }, // 대전
  4: { lat: 35.8714, lng: 128.6014 }, // 대구
  5: { lat: 35.1595, lng: 126.8526 }, // 광주
  6: { lat: 35.1796, lng: 129.0756 }, // 부산
  7: { lat: 35.5384, lng: 129.3114 }, // 울산
  8: { lat: 36.4800, lng: 127.2890 }, // 세종
  31: { lat: 37.2636, lng: 127.0286 }, // 경기
  32: { lat: 37.8813, lng: 127.7300 }, // 강원
  33: { lat: 36.6357, lng: 127.4917 }, // 충북
  34: { lat: 36.6013, lng: 126.6608 }, // 충남
  35: { lat: 36.5684, lng: 128.7294 }, // 경북
  36: { lat: 35.2279, lng: 128.6811 }, // 경남
  37: { lat: 35.8242, lng: 127.1480 }, // 전북
  38: { lat: 34.8161, lng: 126.4630 }, // 전남
  39: { lat: 33.4996, lng: 126.5312 }, // 제주
}

function finitePoint(lat, lng) {
  if (lat == null || lng == null || lat === '' || lng === '') return null
  const parsedLat = Number(lat)
  const parsedLng = Number(lng)
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null
  return { lat: parsedLat, lng: parsedLng }
}

function directJobPoint(job) {
  if (!job) return null
  return finitePoint(job.lat ?? job.latitude, job.lng ?? job.longitude)
}

function resolveJobPoint(job) {
  const direct = directJobPoint(job)
  if (direct) return direct

  const regionId = Number(job?.districtRegionId ?? job?.regionId ?? job?.cityId)
  return META_REGION_CENTERS[regionId] ?? null
}

async function fetchTransitRoute(accommodation, job) {
  const data = await api.post('/api/planner/transit-routes', {
    startName: accommodation.name,
    endName: job.name ?? job.title,
    startLatitude: accommodation.lat,
    startLongitude: accommodation.lng,
    endLatitude: job.lat ?? job.latitude,
    endLongitude: job.lng ?? job.longitude,
  })
  return data.data ?? data.result ?? data
}

async function fetchLane(mapObj) {
  const data = await api.get(`/api/planner/load-lane?mapObject=${encodeURIComponent(mapObj)}`)
  return data.data ?? data.result ?? data
}

async function fetchDrivingRoute(accommodation, job) {
  const data = await api.post('/api/planner/driving-route', {
    startName: accommodation.name,
    startLatitude: accommodation.lat,
    startLongitude: accommodation.lng,
    endName: job.name ?? job.title,
    endLatitude: job.lat,
    endLongitude: job.lng,
  })
  return data.data ?? data.result ?? data
}

export default function Step3Accommodation({ selectedJobs, selectedHotel, onSelect }) {
  const [hotels, setHotels] = useState([])
  const [activeJobId, setActiveJobId] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mobileTab, setMobileTab] = useState('list')
  const [detailHotel, setDetailHotel] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const sliderRef = useRef(null)
  const mapRef = useRef(null)
  const kakaoMapRef = useRef(null)
  const markersRef = useRef([])
  const jobMarkerRef = useRef(null)
  const infoWindowsRef = useRef([])
  const routePolylinesRef = useRef([])
  const selectedJobsRef = useRef(selectedJobs)
  selectedJobsRef.current = selectedJobs
  // 기관명 기반 지오코딩 캐시 (jobId → {lat, lng})
  const geocodeCache = useRef({})
  const [geocodedPoint, setGeocodedPoint] = useState(null)

  useEffect(() => {
    const regionId = selectedJobs[0]?.districtRegionId ?? selectedJobs[0]?.regionId
    const query = regionId ? `?regionId=${encodeURIComponent(regionId)}` : ''
    api.get(`/api/planner/accommodations${query}`)
      .then((res) => {
        const data = res.data ?? res.result ?? res
        setHotels(data.map((h) => ({
          ...h,
          lat: parseFloat(h.lat ?? h.latitude),
          lng: parseFloat(h.lng ?? h.longitude),
          price: h.monthlyPrice ?? h.price,
        })))
      })
      .catch(() => {})
  }, [selectedJobs])

  const activeJob = selectedJobs.find((j) => j.id === activeJobId) ?? null
  // geocodedPoint(Kakao Places 결과) > 직접 좌표 > 지역 중심 순으로 우선순위 적용
  const activeJobPoint = useMemo(() => {
    if (!activeJob) return null
    return geocodedPoint ?? resolveJobPoint(activeJob)
  }, [activeJob, geocodedPoint])
  const activeJobUsesRegionCenter = Boolean(
    activeJob && !directJobPoint(activeJob) && !geocodedPoint && activeJobPoint
  )
  const selectedRegionIds = useMemo(
    () => [...new Set(selectedJobs.map((job) => job.districtRegionId ?? job.regionId).filter(Boolean))],
    [selectedJobs]
  )
  const visibleHotels = useMemo(() => (
    selectedRegionIds.length === 0
      ? hotels
      : hotels.filter((hotel) => selectedRegionIds.includes(hotel.regionId))
  ), [hotels, selectedRegionIds])
  const noMatchedHotels = selectedRegionIds.length > 0 && visibleHotels.length === 0

  function scrollSlider(dir) {
    sliderRef.current?.scrollBy({ left: dir * 250, behavior: 'smooth' })
  }

  async function openHotelDetail(hotel) {
    setDetailHotel(hotel)
    setDetailLoading(true)
    try {
      const res = await api.get(`/api/tour/detail/common?contentId=${encodeURIComponent(hotel.id)}`)
      const detail = res.data ?? res.result ?? res
      setDetailHotel({ ...hotel, detail })
    } catch {
      setDetailHotel(hotel)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (activeJobId && !selectedJobs.find((j) => j.id === activeJobId)) {
      setActiveJobId(null)
    }
  }, [selectedJobs, activeJobId])

  // 직접 좌표가 없는 일자리: Kakao Places 키워드 검색으로 기관명 지오코딩
  useEffect(() => {
    if (!activeJob) { setGeocodedPoint(null); return }
    if (directJobPoint(activeJob)) { setGeocodedPoint(null); return }

    const cached = geocodeCache.current[activeJob.id]
    if (cached !== undefined) { setGeocodedPoint(cached); return }

    const keyword = [activeJob.company, activeJob.location].filter(Boolean).join(' ')
    if (!keyword || !window.kakao?.maps?.services) return

    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(keyword, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const point = { lat: Number(result[0].y), lng: Number(result[0].x) }
        geocodeCache.current[activeJob.id] = point
        setGeocodedPoint(point)
      } else {
        geocodeCache.current[activeJob.id] = null
        setGeocodedPoint(null)
      }
    })
  }, [activeJob])

  // 모바일에서 지도 탭으로 전환할 때 relayout
  useEffect(() => {
    if (mobileTab === 'map' && kakaoMapRef.current) {
      setTimeout(() => {
        kakaoMapRef.current?.relayout()
      }, 120)
    }
  }, [mobileTab])

  useEffect(() => {
    const initMap = () => {
      if (kakaoMapRef.current) return
      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container || kakaoMapRef.current) return

        const initialPoint = resolveJobPoint(selectedJobsRef.current[0]) ?? DEFAULT_MAP_POINT
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(initialPoint.lat, initialPoint.lng),
          level: 5,
        })
        kakaoMapRef.current = map
        map.relayout()
        setMapReady(true)

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const first = selectedJobsRef.current[0]
            if (first) setActiveJobId(first.id)
          })
        })
      })
    }

    if (window.kakao?.maps) {
      initMap()
    } else {
      const script = document.querySelector('script[src*="dapi.kakao.com"]')
      script?.addEventListener('load', initMap)
      return () => script?.removeEventListener('load', initMap)
    }

    return () => {
      setMapReady(false)
      kakaoMapRef.current = null
      markersRef.current = []
      infoWindowsRef.current = []
      routePolylinesRef.current = []
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !kakaoMapRef.current) return

    markersRef.current.forEach((m) => m.setMap(null))
    infoWindowsRef.current.forEach((iw) => iw.setMap(null))
    markersRef.current = []
    infoWindowsRef.current = []

    visibleHotels.forEach((h) => {
      if (!h.lat || !h.lng || isNaN(h.lat) || isNaN(h.lng)) return
      const position = new window.kakao.maps.LatLng(h.lat, h.lng)

      const markerContent = `<div style="width:14px;height:14px;border-radius:50%;background:${h.color ?? '#3B82F6'};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.22);cursor:pointer;"></div>`
      const marker = new window.kakao.maps.CustomOverlay({
        position,
        content: markerContent,
        xAnchor: 0.5,
        yAnchor: 0.5,
      })
      marker.setMap(kakaoMapRef.current)

      const infoContent = `
        <div style="padding:10px 14px;border-radius:10px;background:white;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:160px;font-family:sans-serif;">
          <div style="font-weight:700;font-size:13px;color:#1e293b;">${h.name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">${h.location}</div>
          <div style="font-size:12px;color:#3B82F6;font-weight:600;margin-top:4px;">${h.price == null ? '월 비용 미제공' : `월 ${Number(h.price).toLocaleString()}원`}</div>
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
  }, [mapReady, visibleHotels])

  useEffect(() => {
    if (!mapReady || !markersRef.current.length || !kakaoMapRef.current) return
    markersRef.current.forEach((m, i) => {
      const h = visibleHotels[i]
      if (!h) return
      const selected = selectedHotel.name === h.name
      const s = selected ? 20 : 14
      const markerColor = h.color ?? '#3B82F6'
      const shadow = selected
        ? `box-shadow:0 0 0 5px ${markerColor}44,0 2px 8px rgba(0,0,0,0.25);`
        : 'box-shadow:0 2px 8px rgba(0,0,0,0.22);'
      const content = `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${markerColor};border:2.5px solid white;${shadow}cursor:pointer;"></div>`
      m.setContent(content)

      if (selected) {
        m.__info.setMap(kakaoMapRef.current)
        kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(h.lat, h.lng))
      } else {
        m.__info.setMap(null)
      }
    })
  }, [mapReady, selectedHotel, visibleHotels])

  const clearRoute = useCallback(() => {
    routePolylinesRef.current.forEach((p) => p.setMap(null))
    routePolylinesRef.current = []
  }, [])

  const drawPolyline = useCallback((coords, color, dashed = false) => {
    if (!kakaoMapRef.current || coords.length < 2) return
    const path = coords
      .map((c) => new window.kakao.maps.LatLng(Number(c.y), Number(c.x)))
      .filter((ll) => !isNaN(ll.getLat()) && !isNaN(ll.getLng()))
    if (path.length < 2) return
    const polyline = new window.kakao.maps.Polyline({
      path,
      strokeWeight: dashed ? 3 : 6,
      strokeColor: color,
      strokeOpacity: dashed ? 0.5 : 0.85,
      strokeStyle: dashed ? 'shortdash' : 'solid',
    })
    polyline.setMap(kakaoMapRef.current)
    routePolylinesRef.current.push(polyline)
  }, [])

  useEffect(() => {
    if (!activeJob) {
      clearRoute()
      setRouteInfo(null)
      return
    }

    const hotel = visibleHotels.find((h) => h.name === selectedHotel.name)
    if (!hotel || !mapReady || !kakaoMapRef.current) return

    const hotelPoint = finitePoint(hotel.lat, hotel.lng)
    if (!hotelPoint || !activeJobPoint) {
      clearRoute()
      setRouteInfo(null)
      return
    }

    const dLat = hotelPoint.lat - activeJobPoint.lat
    const dLng = hotelPoint.lng - activeJobPoint.lng
    const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111

    if (distKm > 50) {
      setRouteInfo({ error: '해당 알바는 다른 지역이에요. 같은 지역 알바를 선택해주세요.' })
      return
    }
    if (distKm < 1) {
      setRouteInfo({ walk: true, distKm })
      return
    }

    let cancelled = false
    setRouteLoading(true)
    setRouteInfo(null)
    clearRoute()

    ;(async () => {
      try {
        const routeRes = await fetchTransitRoute({
          ...hotel,
          lat: hotelPoint.lat,
          lng: hotelPoint.lng,
        }, {
          ...activeJob,
          lat: activeJobPoint.lat,
          lng: activeJobPoint.lng,
        })
        if (cancelled) return

        const rawOdsay = routeRes.raw ?? routeRes
        if (rawOdsay.error) {
          const code = String(rawOdsay.error.code)
          if (code === '-8') {
            setRouteInfo({ walk: true, distKm })
          } else {
            setRouteInfo({ error: `경로 조회 실패 (${rawOdsay.error.message ?? code})` })
          }
          return
        }

        if (!rawOdsay.result?.path?.length) {
          setRouteInfo({ error: '대중교통 경로를 찾을 수 없습니다 (거리가 너무 가깝거나 경로 없음)' })
          return
        }

        const best = rawOdsay.result.path[0]
        const { totalTime, payment, busTransitCount, subwayTransitCount } = best.info

        for (const sp of best.subPath) {
          if (cancelled) return

          const sx = Number(sp.startX), sy = Number(sp.startY)
          const ex = Number(sp.endX), ey = Number(sp.endY)
          const hasCoords = !isNaN(sx) && !isNaN(sy) && !isNaN(ex) && !isNaN(ey) && (sx || sy)

          if (sp.trafficType === 3) {
            if (hasCoords) drawPolyline([{ x: sx, y: sy }, { x: ex, y: ey }], '#94A3B8', true)
          } else {
            const color = sp.trafficType === 1 ? '#3B82F6' : '#10B981'
            let drew = false

            if (sp.mapObj) {
              try {
                const laneData = await fetchLane(sp.mapObj)
                if (cancelled) return
                const lanes = laneData.result?.lane ?? []
                for (const lane of lanes) {
                  const coords = lane.section.flatMap((s) => s.graphPos ?? [])
                  if (coords.length > 0) { drawPolyline(coords, color); drew = true }
                }
              } catch { /* fallback */ }
            }

            if (!drew) {
              const stations = sp.passStopList?.stations ?? []
              if (stations.length >= 2) {
                const coords = stations.map((s) => ({ x: Number(s.x), y: Number(s.y) }))
                drawPolyline(coords, color)
                drew = true
              }
            }

            if (!drew && hasCoords) {
              drawPolyline([{ x: sx, y: sy }, { x: ex, y: ey }], color)
            }
          }
        }

        if (!cancelled) {
          const steps = best.subPath.map((sp) => {
            if (sp.trafficType === 3) {
              return { type: 'walk', time: sp.sectionTime, distance: sp.distance }
            } else if (sp.trafficType === 1) {
              return {
                type: 'subway',
                time: sp.sectionTime,
                lineName: sp.lane?.[0]?.name ?? '지하철',
                start: sp.startName,
                end: sp.endName,
                stops: sp.stationCount,
              }
            } else {
              return {
                type: 'bus',
                time: sp.sectionTime,
                busNo: sp.lane?.[0]?.busNo ?? sp.lane?.[0]?.name ?? '버스',
                start: sp.startName,
                end: sp.endName,
                stops: sp.stationCount,
              }
            }
          })
          setRouteInfo({
            totalTime,
            payment,
            subwayCount: subwayTransitCount,
            busCount: busTransitCount,
            steps,
          })

          const bounds = new window.kakao.maps.LatLngBounds()
          bounds.extend(new window.kakao.maps.LatLng(hotelPoint.lat, hotelPoint.lng))
          bounds.extend(new window.kakao.maps.LatLng(activeJobPoint.lat, activeJobPoint.lng))
          kakaoMapRef.current.setBounds(bounds, 80, 80, 80, 80)
          if (kakaoMapRef.current.getLevel() > 7) kakaoMapRef.current.setLevel(7)
        }
      } catch {
        try {
          const driving = await fetchDrivingRoute({
            ...hotel,
            lat: hotelPoint.lat,
            lng: hotelPoint.lng,
          }, {
            ...activeJob,
            lat: activeJobPoint.lat,
            lng: activeJobPoint.lng,
          })
          if (cancelled) return

          const route = driving.routes?.find((item) => item.result_code === 0)
          const coordinates = (route?.sections ?? []).flatMap((section) => (
            (section.roads ?? []).flatMap((road) => {
              const vertexes = road.vertexes ?? []
              const points = []
              for (let index = 0; index + 1 < vertexes.length; index += 2) {
                points.push({ x: Number(vertexes[index]), y: Number(vertexes[index + 1]) })
              }
              return points
            })
          ))

          if (!route || coordinates.length < 2) throw new Error('No driving route')

          clearRoute()
          drawPolyline(coordinates, '#2563EB')
          setRouteInfo({
            driving: true,
            totalTime: Math.max(1, Math.ceil((route.summary?.duration ?? 0) / 60)),
            distanceKm: (route.summary?.distance ?? 0) / 1000,
          })

          const bounds = new window.kakao.maps.LatLngBounds()
          bounds.extend(new window.kakao.maps.LatLng(hotelPoint.lat, hotelPoint.lng))
          bounds.extend(new window.kakao.maps.LatLng(activeJobPoint.lat, activeJobPoint.lng))
          kakaoMapRef.current.setBounds(bounds, 80, 80, 80, 80)
        } catch {
          if (!cancelled) setRouteInfo({ error: '대중교통 및 자동차 경로를 조회할 수 없습니다' })
        }
      } finally {
        if (!cancelled) setRouteLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [activeJob, activeJobPoint, selectedHotel, clearRoute, drawPolyline, mapReady, visibleHotels])

  useEffect(() => {
    if (visibleHotels.length === 0) return
    const stillVisible = visibleHotels.some((hotel) => hotel.name === selectedHotel.name)
    if (!stillVisible) {
      const first = visibleHotels[0]
      onSelect({ ...first })
    }
  }, [visibleHotels, selectedHotel.name, onSelect])

  useEffect(() => {
    if (!mapReady || !kakaoMapRef.current) return

    if (jobMarkerRef.current) {
      jobMarkerRef.current.setMap(null)
      jobMarkerRef.current = null
    }

    if (activeJobPoint) {
      const position = new window.kakao.maps.LatLng(activeJobPoint.lat, activeJobPoint.lng)
      kakaoMapRef.current.relayout()
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
  }, [mapReady, activeJob, activeJobPoint])

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
            <span>
              <strong>{activeJob.name}</strong>{' '}
              {geocodedPoint
                ? '기관명으로 위치를 찾았습니다'
                : activeJobUsesRegionCenter
                  ? '정확한 좌표가 없어 지역 중심 위치를 표시합니다'
                  : '위치로 지도가 이동했습니다'}
            </span>
            <button className="job-active-close" onClick={() => setActiveJobId(null)}>✕</button>
          </div>
        )}
        {activeJob && (
          <div className="route-info-bar">
            {routeLoading && (
              <div className="route-loading">
                <span className="route-spinner" />
                <span>출퇴근 경로 조회 중... 지도 좌측 패널에서 상세 경로를 확인하세요</span>
              </div>
            )}
            {!routeLoading && routeInfo && !routeInfo.error && (
              <div className="route-summary">
                {routeInfo.subwayCount > 0 && <span className="route-badge subway">🚇 지하철 {routeInfo.subwayCount}회</span>}
                {routeInfo.busCount > 0 && <span className="route-badge bus">🚌 버스 {routeInfo.busCount}회</span>}
                {routeInfo.driving && <span className="route-badge driving">🚗 자동차 대체 경로</span>}
                {routeInfo.walk && <span className="route-badge walk">🚶 도보 이동 가능</span>}
                <span className="route-divider" />
                <span className="route-time">🕐 총 {routeInfo.totalTime}분</span>
                {routeInfo.payment > 0 && <span className="route-fare">₩ {routeInfo.payment.toLocaleString()}원</span>}
                <span className="route-legend">좌측 지도 패널에서 경로 상세 확인</span>
              </div>
            )}
            {!routeLoading && routeInfo?.error && (
              <span className="route-error">{routeInfo.error}</span>
            )}
          </div>
        )}
      </div>

      {/* 모바일 전용 목록/지도 탭 */}
      <div className="map-mobile-tabs">
        <button
          className={`map-mobile-tab${mobileTab === 'list' ? ' active' : ''}`}
          onClick={() => setMobileTab('list')}
        >
          🏠 목록
        </button>
        <button
          className={`map-mobile-tab${mobileTab === 'map' ? ' active' : ''}`}
          onClick={() => setMobileTab('map')}
        >
          🗺 지도
        </button>
      </div>

      <div className={`map-step-layout${mobileTab === 'map' ? ' mobile-show-map' : ' mobile-show-list'}`}>
        <div className="map-sidebar">
          <div className="map-sidebar-header">
            <div className="map-sidebar-title">추천 숙소</div>
            <div className="map-filter-row">
              <div className="mchip active">🚌 30분 이내</div>
              <div className="mchip green">🍽 숙식 제공</div>
            </div>
          </div>
          {activeJob && (
            <div className="sidebar-route-panel">
              <div className="srp-header">
                <span>출퇴근 경로</span>
                {!routeLoading && routeInfo && !routeInfo.error && (
                  <span className="srp-total-time">
                    🕐 {routeInfo.totalTime}분
                    {routeInfo.payment > 0 && ` · ₩${routeInfo.payment.toLocaleString()}`}
                  </span>
                )}
              </div>
              {routeLoading && (
                <div className="srp-loading">
                  <span className="route-spinner" />
                  <span>경로 조회 중...</span>
                </div>
              )}
              {!routeLoading && routeInfo && !routeInfo.error && !routeInfo.walk && (
                <div className="srp-body">
                  {routeInfo.driving && (
                    <div className="srp-driving-note">🚗 자동차 경로 · {routeInfo.distanceKm?.toFixed(1)}km</div>
                  )}
                  {(routeInfo.steps ?? []).length > 0 && (
                    <div className="srp-steps">
                      {(routeInfo.steps ?? []).map((s, i) => (
                        <div key={i} className={`srp-step-item srp-step-${s.type}`}>
                          <div className="srp-step-dot" />
                          <div className="srp-step-icon">
                            {s.type === 'walk' ? '🚶' : s.type === 'subway' ? '🚇' : '🚌'}
                          </div>
                          <div className="srp-step-detail">
                            {s.type === 'walk' && (
                              <span>도보 {s.time}분{s.distance >= 100 ? ` · ${Math.round(s.distance)}m` : ''}</span>
                            )}
                            {s.type === 'subway' && (
                              <>
                                <strong>{s.lineName}</strong>
                                <span className="srp-step-route">{s.start} → {s.end}</span>
                                <span className="srp-step-meta">{s.stops}정거장 · {s.time}분</span>
                              </>
                            )}
                            {s.type === 'bus' && (
                              <>
                                <strong>{s.busNo}번</strong>
                                <span className="srp-step-route">{s.start} → {s.end}</span>
                                <span className="srp-step-meta">{s.stops}정거장 · {s.time}분</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!routeLoading && routeInfo?.walk && (
                <div className="srp-walk-only">
                  🚶 도보 약 {Math.max(1, Math.round(routeInfo.distKm * 1000 / 80))}분
                  <span className="srp-no-transit">{Math.round(routeInfo.distKm * 1000)}m · 대중교통 불필요</span>
                </div>
              )}
              {!routeLoading && routeInfo?.error && (
                <div className="srp-error">{routeInfo.error}</div>
              )}
            </div>
          )}
          <div className="map-result-info">
            <span>숙소 {visibleHotels.length}개 표시 중</span>
            <span style={{ color: '#3B82F6', cursor: 'pointer', fontWeight: 600 }}>거리순 ▾</span>
          </div>
          <div className="acc-list">
            {noMatchedHotels && (
              <div className="acc-empty-notice">
                선택한 일자리 근처에 매칭되는 숙소가 아직 없습니다. 숙소를 선택하지 않아도 다음 단계로 이동할 수 있어요.
              </div>
            )}
            {!noMatchedHotels && [...new Set(visibleHotels.map((h) => h.district))].map((d) => (
              <div key={d}>
                <div className="acc-sec">📍 {d}</div>
                {visibleHotels.filter((h) => h.district === d).map((h) => (
                  <div
                    key={h.name}
                    className={`acc-card${selectedHotel.name === h.name ? ' selected' : ''}`}
                    onClick={() => onSelect({ ...h })}
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
                        {(h.tags ?? []).map((t) => (
                          <span key={t} className="at at-gray">{t}</span>
                        ))}
                      </div>
                      <div className="acc-price-row">
                        <span className="acc-price">{h.price == null ? '월 비용 미제공' : `월 ${Number(h.price).toLocaleString()}원`}</span>
                        <span className={h.posType === 'pos' ? 'acc-pos' : 'acc-neg'}>{h.pos}</span>
                      </div>
                      <button className="acc-detail-btn" onClick={(event) => { event.stopPropagation(); openHotelDetail(h) }}>자세히 보기</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {selectedHotel.name && <div className="planner-edit-later-note">월 숙박비는 플래너 완성 후 수정할 수 있습니다.</div>}
        </div>

        <div className="map-wrapper">
          <div ref={mapRef} className="map-canvas" />
          {activeJob && routeInfo && !routeInfo.error && !routeLoading && (
            <div className="map-route-overlay">
              <div className="mro-row">
                <span className="mro-time">🕐 {routeInfo.totalTime}분</span>
                {routeInfo.payment > 0 && <span className="mro-fare">₩{routeInfo.payment.toLocaleString()}</span>}
                {routeInfo.driving && routeInfo.distanceKm > 0 && (
                  <span className="mro-dist">{routeInfo.distanceKm.toFixed(1)}km</span>
                )}
              </div>
              {!routeInfo.driving && !routeInfo.walk && (
                <div className="mro-legend">
                  {routeInfo.subwayCount > 0 && <span className="mro-leg subway">━ 지하철</span>}
                  {routeInfo.busCount > 0 && <span className="mro-leg bus">━ 버스</span>}
                  <span className="mro-leg walk">- - 도보</span>
                </div>
              )}
              {routeInfo.driving && (
                <div className="mro-legend"><span className="mro-leg driving">━ 자동차</span></div>
              )}
              {routeInfo.walk && (
                <div className="mro-legend"><span className="mro-leg walk">🚶 도보 이동 가능</span></div>
              )}
            </div>
          )}
        </div>
      </div>
      {detailHotel && (
        <div className="planner-modal-backdrop" onClick={() => setDetailHotel(null)}>
          <section className="event-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="planner-day-modal-head">
              <div><p>숙박 상세</p><h2>{detailHotel.detail?.title ?? detailHotel.name}</h2></div>
              <button type="button" onClick={() => setDetailHotel(null)} aria-label="닫기">x</button>
            </div>
            {detailLoading ? <div className="event-detail-overview">상세 정보를 불러오는 중입니다.</div> : (
              <>
                {(detailHotel.detail?.firstImage ?? detailHotel.imageUrl) ? (
                  <img className="event-detail-image" src={detailHotel.detail?.firstImage ?? detailHotel.imageUrl} alt={detailHotel.name} />
                ) : <div className="job-detail-placeholder"><span>🏠</span><strong>{detailHotel.name}</strong><small>이미지 미제공</small></div>}
                <div className="event-detail-location"><span>위치</span><strong>{[detailHotel.detail?.addr1, detailHotel.detail?.addr2].filter(Boolean).join(' ') || detailHotel.location}</strong></div>
                <div className="event-detail-overview">{detailHotel.detail?.overview || '숙박 상세 설명이 제공되지 않았습니다.'}</div>
                <div className="event-detail-actions">
                  <button className="directory-btn primary" onClick={() => { onSelect({ ...detailHotel, detail: undefined }); setDetailHotel(null) }}>이 숙소 선택</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
