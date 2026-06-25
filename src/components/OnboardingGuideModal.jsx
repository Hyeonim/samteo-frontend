import { useEffect, useMemo, useState } from 'react'
import './OnboardingGuideModal.css'

const SLIDES = [
  {
    key: 'type',
    title: '체류 유형을 먼저 골라요',
    caption: '짧게 둘러볼지, 한 지역에 오래 머물지 선택하면 플래너 흐름이 시작돼요.',
    image: '/onboarding/guide-type.png',
    accent: '#f59e0b',
    annotations: [
      {
        className: 'ogm-note--type-short',
        text: '단기 체류',
        desc: '가볍게 여행처럼 계획',
        position: { left: '2%', top: '24%' },
        from: { x: 17, y: 31 },
        to: { x: 32, y: 42 },
        curve: { x: 24, y: 30 },
      },
      {
        className: 'ogm-note--type-long',
        text: '장기 체류',
        desc: '일자리와 숙소까지 꼼꼼히',
        position: { left: '67%', top: '24%' },
        from: { x: 70, y: 31 },
        to: { x: 66, y: 42 },
        curve: { x: 65, y: 34 },
      },
    ],
  },
  {
    key: 'region',
    title: '머물 지역을 선택해요',
    caption: '지역 카드나 검색을 통해 한 달 동안 머물 후보 지역을 정할 수 있어요.',
    image: '/onboarding/guide-region.png',
    accent: '#2563eb',
    aspectRatio: '1260 / 1080',
    annotations: [
      {
        className: 'ogm-note--planner-step',
        text: '진행 단계',
        desc: '현재 위치를 한눈에 확인',
        position: { left: '22%', top: '1%' },
        from: { x: 30, y: 10 },
        to: { x: 16, y: 18 },
        curve: { x: 23, y: 9 },
      },
      {
        className: 'ogm-note--planner-search',
        text: '지역 검색',
        desc: '원하는 지역을 빠르게 찾기',
        position: { left: '0%', top: '36%' },
        from: { x: 18, y: 42 },
        to: { x: 24, y: 43 },
        curve: { x: 20, y: 38 },
      },
      {
        className: 'ogm-note--planner-next',
        text: '다음 단계',
        desc: '선택 후 이동',
        position: { right: '-2%', top: '18%' },
        from: { x: 88, y: 27 },
        to: { x: 91, y: 25 },
        curve: { x: 90, y: 30 },
      },
    ],
  },
  {
    key: 'jobs',
    title: '지역 일자리를 비교해요',
    caption: '체류 유형을 바꾸고, 조건이 맞는 일자리 카드를 골라 다음 단계로 이동해요.',
    image: '/onboarding/guide-jobs.png',
    accent: '#0ea5e9',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--planner-jobs-mode',
        text: '체류 유형',
        desc: '단기와 장기를 전환',
        position: { left: '2%', top: '20%' },
        from: { x: 18, y: 27 },
        to: { x: 20, y: 24 },
        curve: { x: 17, y: 22 },
      },
      {
        className: 'ogm-note--planner-jobs-card',
        text: '일자리 카드',
        desc: '조건을 보고 선택',
        position: { left: '36%', top: '57%' },
        from: { x: 41, y: 64 },
        to: { x: 30, y: 64 },
        curve: { x: 36, y: 62 },
      },
      {
        className: 'ogm-note--planner-jobs-next',
        text: '다음 단계',
        desc: '숙소 매칭으로 이동',
        position: { right: '-2%', top: '17%' },
        from: { x: 88, y: 26 },
        to: { x: 91, y: 18 },
        curve: { x: 92, y: 24 },
      },
    ],
  },
  {
    key: 'accommodation',
    title: '숙소와 이동 시간을 함께 봐요',
    caption: '선택한 일자리 주변 숙소를 지도와 목록으로 확인하고 후보를 매칭해요.',
    image: '/onboarding/guide-accommodation.png',
    accent: '#10b981',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--accommodation-route',
        text: '추천 경로',
        desc: '출퇴근 시간을 확인',
        position: { left: '2%', top: '31%' },
        from: { x: 18, y: 38 },
        to: { x: 31, y: 40 },
        curve: { x: 24, y: 36 },
      },
      {
        className: 'ogm-note--accommodation-list',
        text: '추천 숙소',
        desc: '후보 숙소를 비교',
        position: { left: '2%', top: '63%' },
        from: { x: 18, y: 70 },
        to: { x: 18, y: 74 },
        curve: { x: 13, y: 72 },
      },
      {
        className: 'ogm-note--accommodation-map',
        text: '지도 보기',
        desc: '위치 관계를 바로 확인',
        position: { right: '3%', top: '62%' },
        from: { x: 79, y: 70 },
        to: { x: 69, y: 65 },
        curve: { x: 74, y: 67 },
      },
    ],
  },
  {
    key: 'budget',
    title: '가계부로 예상 잔액을 확인해요',
    caption: '급여와 숙박비, 생활비를 반영해 한 달 후 남을 금액을 미리 볼 수 있어요.',
    image: '/onboarding/guide-budget.png',
    accent: '#6366f1',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--budget-summary',
        text: '월 잔액',
        desc: '예상 실수령액 확인',
        position: { left: '3%', top: '58%' },
        from: { x: 18, y: 65 },
        to: { x: 31, y: 72 },
        curve: { x: 23, y: 70 },
      },
      {
        className: 'ogm-note--budget-chart',
        text: '수입/지출 추이',
        desc: '월별 흐름 비교',
        position: { right: '16%', top: '39%' },
        from: { x: 72, y: 47 },
        to: { x: 67, y: 58 },
        curve: { x: 72, y: 55 },
      },
      {
        className: 'ogm-note--budget-next',
        text: '다음 단계',
        desc: '저장 화면으로 이동',
        position: { right: '-2%', top: '16%' },
        from: { x: 88, y: 24 },
        to: { x: 91, y: 18 },
        curve: { x: 92, y: 24 },
      },
    ],
  },
  {
    key: 'save',
    title: '완성된 플래너를 저장해요',
    caption: '선택한 일자리와 숙소를 저장하면 내 플래너에서 일정과 예산을 관리할 수 있어요.',
    image: '/onboarding/guide-save.png',
    accent: '#7c3aed',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--save-preview',
        text: '최종 후보',
        desc: '저장 전 선택 내용을 확인',
        position: { left: '1%', top: '31%' },
        from: { x: 17, y: 38 },
        to: { x: 31, y: 30 },
        curve: { x: 23, y: 32 },
      },
      {
        className: 'ogm-note--save-calendar',
        text: '일정 미리보기',
        desc: '근무 일정이 자동 배치',
        position: { left: '1%', top: '61%' },
        from: { x: 17, y: 68 },
        to: { x: 31, y: 76 },
        curve: { x: 20, y: 75 },
      },
      {
        className: 'ogm-note--save-button',
        text: '저장하기',
        desc: '내 플래너로 담기',
        position: { right: '-2%', top: '16%' },
        from: { x: 88, y: 24 },
        to: { x: 91, y: 18 },
        curve: { x: 92, y: 24 },
      },
    ],
  },
  {
    key: 'plannerOverview',
    title: '내 플래너에서 저장한 계획을 확인해요',
    caption: '저장한 플래너는 내 플래너 메뉴에서 다시 열고, 예산과 시간표를 함께 볼 수 있어요.',
    image: '/onboarding/guide-planner-overview.png',
    accent: '#2563eb',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--planner-overview-list',
        text: '플래너 목록',
        desc: '저장한 계획을 선택',
        position: { left: '1%', top: '24%' },
        from: { x: 10, y: 31 },
        to: { x: 17, y: 31 },
        curve: { x: 13, y: 26 },
      },
      {
        className: 'ogm-note--planner-overview-budget',
        text: '예상 정산',
        desc: '이번 달 예산 확인',
        position: { right: '21%', top: '17%' },
        from: { x: 51, y: 32 },
        to: { x: 66, y: 25 },
        curve: { x: 57, y: 23 },
      },
      {
        className: 'ogm-note--planner-overview-calendar',
        text: '시간표',
        desc: '자동 생성된 일정 확인',
        position: { left: '48%', top: '67%' },
        from: { x: 52, y: 82 },
        to: { x: 53, y: 75 },
        curve: { x: 49, y: 78 },
      },
    ],
  },
  {
    key: 'plannerDay',
    title: '날짜를 눌러 하루 일정을 확인해요',
    caption: '달력의 날짜를 선택하면 해당 날짜의 근무와 개인 일정을 바로 확인할 수 있어요.',
    image: '/onboarding/guide-planner-day.png',
    accent: '#0ea5e9',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--planner-day-cell',
        text: '날짜 선택',
        desc: '원하는 날짜 클릭',
        position: { left: '58%', top: '63%' },
        from: { x: 53, y: 63 },
        to: { x: 62, y: 70 },
        curve: { x: 58, y: 65 },
      },
      {
        className: 'ogm-note--planner-day-modal',
        text: '일정 팝업',
        desc: '그날 일정을 확인',
        position: { right: '13%', top: '23%' },
        from: { x: 58, y: 39 },
        to: { x: 74, y: 31 },
        curve: { x: 66, y: 30 },
      },
      {
        className: 'ogm-note--planner-day-add',
        text: '일정 추가',
        desc: '빈 시간에 새 일정 등록',
        position: { right: '9%', top: '44%' },
        from: { x: 58, y: 51 },
        to: { x: 78, y: 52 },
        curve: { x: 69, y: 47 },
      },
    ],
  },
  {
    key: 'plannerEdit',
    title: '우측 패널에서 일정을 수정해요',
    caption: '제목, 날짜, 시간, 구분과 색상을 바꿔 개인 일정을 원하는 방식으로 관리할 수 있어요.',
    image: '/onboarding/guide-planner-edit.png',
    accent: '#7c3aed',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--planner-edit-calendar',
        text: '월간 달력',
        desc: '수정할 날짜를 선택',
        position: { left: '31%', top: '64%' },
        from: { x: 34, y: 57 },
        to: { x: 38, y: 71 },
        curve: { x: 32, y: 64 },
      },
      {
        className: 'ogm-note--planner-edit-panel',
        text: '일정 편집',
        desc: '시간과 구분을 조정',
        position: { right: '0%', top: '27%' },
        from: { x: 78, y: 38 },
        to: { x: 86, y: 35 },
        curve: { x: 83, y: 32 },
      },
      {
        className: 'ogm-note--planner-edit-color',
        text: '색상 선택',
        desc: '일정 표시 색상 변경',
        position: { right: '0%', top: '72%' },
        from: { x: 78, y: 79 },
        to: { x: 86, y: 79 },
        curve: { x: 82, y: 84 },
      },
    ],
  },
]

function ScreenshotGuide({ slide }) {
  const markerId = `ogm-arrow-head-${slide.key}`

  return (
    <div
      className={`ogm-shot-wrap${slide.cropHeader ? ' is-cropped-header' : ''}`}
      style={{ '--ogm-shot-ratio': slide.aspectRatio ?? '1260 / 970' }}
    >
      <div className="ogm-shot-frame">
        <img className="ogm-shot" src={slide.image} alt={`${slide.title} 화면 예시`} />
        <div className="ogm-shot-shade" />
      </div>
      <svg className="ogm-arrow-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="8.4" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {slide.annotations.map((annotation) => {
          const midX = annotation.curve?.x ?? ((annotation.from.x + annotation.to.x) / 2)
          const midY = annotation.curve?.y ?? ((annotation.from.y + annotation.to.y) / 2)
          return (
            <path
              className="ogm-sketch-path"
              d={`M ${annotation.from.x} ${annotation.from.y} Q ${midX} ${midY} ${annotation.to.x} ${annotation.to.y}`}
              key={`${annotation.className}-arrow`}
              markerEnd={`url(#${markerId})`}
            />
          )
        })}
      </svg>
      {slide.annotations.map((annotation) => (
        <div
          className={`ogm-note ${annotation.className}`}
          key={annotation.className}
          style={annotation.position}
        >
          <strong>{annotation.text}</strong>
          <span>{annotation.desc}</span>
        </div>
      ))}
    </div>
  )
}

export default function OnboardingGuideModal({ initialIndex = 0, onClose, onHideForDay, onHideForever }) {
  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), SLIDES.length - 1))
  const slide = SLIDES[index]
  const lastIndex = SLIDES.length - 1

  const pageLabel = useMemo(() => `${index + 1} / ${SLIDES.length}`, [index])

  const goPrev = () => setIndex((current) => (current === 0 ? lastIndex : current - 1))
  const goNext = () => setIndex((current) => (current === lastIndex ? 0 : current + 1))

  useEffect(() => {
    setIndex(Math.min(Math.max(initialIndex, 0), SLIDES.length - 1))
  }, [initialIndex])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div className="ogm-overlay" role="presentation">
      <section
        className="ogm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-guide-title"
      >
        <button className="ogm-close" type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <button className="ogm-arrow ogm-arrow--prev" type="button" onClick={goPrev} aria-label="이전 가이드">
          &lt;
        </button>
        <button className="ogm-arrow ogm-arrow--next" type="button" onClick={goNext} aria-label="다음 가이드">
          &gt;
        </button>

        <div className="ogm-slide" style={{ '--ogm-accent': slide.accent }}>
          <header className="ogm-slide-head">
            <span className="ogm-kicker">GUIDE {pageLabel}</span>
            <div>
              <h2 id="onboarding-guide-title">{slide.title}</h2>
              <p>{slide.caption}</p>
            </div>
          </header>
          <ScreenshotGuide slide={slide} />
        </div>

        <div className="ogm-footer">
          <div className="ogm-dots" aria-label={pageLabel}>
            {SLIDES.map((item, itemIndex) => (
              <button
                key={item.key}
                className={`ogm-dot${itemIndex === index ? ' is-active' : ''}`}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`${itemIndex + 1}번째 가이드 보기`}
                aria-current={itemIndex === index ? 'step' : undefined}
              />
            ))}
          </div>
          {(onHideForDay || onHideForever) && (
            <div className="ogm-hide-actions">
              {onHideForDay && <button type="button" onClick={onHideForDay}>24시간 보지 않기</button>}
              {onHideForever && <button type="button" onClick={onHideForever}>다시는 보지 않기</button>}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
