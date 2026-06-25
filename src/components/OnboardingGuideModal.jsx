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
        arrow: 'down',
      },
      {
        className: 'ogm-note--type-long',
        text: '장기 체류',
        desc: '일자리와 숙소까지 꼼꼼히',
        arrow: 'down',
      },
    ],
  },
  {
    key: 'region',
    title: '머물 지역을 선택해요',
    caption: '지역 카드나 검색을 통해 한 달 동안 머물 후보 지역을 정할 수 있어요.',
    image: '/onboarding/guide-region.png',
    accent: '#2563eb',
    cropHeader: true,
    annotations: [
      {
        className: 'ogm-note--planner-step',
        text: '진행 단계',
        desc: '현재 위치를 한눈에 확인',
        arrow: 'up',
      },
      {
        className: 'ogm-note--planner-search',
        text: '지역 검색',
        desc: '원하는 지역을 빠르게 찾기',
        arrow: 'left',
      },
      {
        className: 'ogm-note--planner-next',
        text: '다음 단계',
        desc: '선택 후 이동',
        arrow: 'down',
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
        arrow: 'up',
      },
      {
        className: 'ogm-note--planner-jobs-card',
        text: '일자리 카드',
        desc: '조건을 보고 선택',
        arrow: 'down',
      },
      {
        className: 'ogm-note--planner-jobs-next',
        text: '다음 단계',
        desc: '숙소 매칭으로 이동',
        arrow: 'right',
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
        arrow: 'down',
      },
      {
        className: 'ogm-note--accommodation-list',
        text: '추천 숙소',
        desc: '후보 숙소를 비교',
        arrow: 'left',
      },
      {
        className: 'ogm-note--accommodation-map',
        text: '지도 보기',
        desc: '위치 관계를 바로 확인',
        arrow: 'right',
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
        arrow: 'down',
      },
      {
        className: 'ogm-note--budget-chart',
        text: '수입/지출 추이',
        desc: '월별 흐름 비교',
        arrow: 'up',
      },
      {
        className: 'ogm-note--budget-next',
        text: '다음 단계',
        desc: '저장 화면으로 이동',
        arrow: 'right',
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
        arrow: 'down',
      },
      {
        className: 'ogm-note--save-calendar',
        text: '일정 미리보기',
        desc: '근무 일정이 자동 배치',
        arrow: 'left',
      },
      {
        className: 'ogm-note--save-button',
        text: '저장하기',
        desc: '내 플래너로 담기',
        arrow: 'right',
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
        arrow: 'right',
      },
      {
        className: 'ogm-note--planner-overview-budget',
        text: '예상 정산',
        desc: '이번 달 예산 확인',
        arrow: 'down',
      },
      {
        className: 'ogm-note--planner-overview-calendar',
        text: '시간표',
        desc: '자동 생성된 일정 확인',
        arrow: 'left',
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
        arrow: 'down',
      },
      {
        className: 'ogm-note--planner-day-modal',
        text: '일정 팝업',
        desc: '그날 일정을 확인',
        arrow: 'up',
      },
      {
        className: 'ogm-note--planner-day-add',
        text: '일정 추가',
        desc: '빈 시간에 새 일정 등록',
        arrow: 'down',
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
        arrow: 'left',
      },
      {
        className: 'ogm-note--planner-edit-panel',
        text: '일정 편집',
        desc: '시간과 구분을 조정',
        arrow: 'right',
      },
      {
        className: 'ogm-note--planner-edit-color',
        text: '색상 선택',
        desc: '일정 표시 색상 변경',
        arrow: 'up',
      },
    ],
  },
]

function ScreenshotGuide({ slide }) {
  return (
    <div className={`ogm-shot-wrap${slide.cropHeader ? ' is-cropped-header' : ''}`}>
      <img className="ogm-shot" src={slide.image} alt={`${slide.title} 화면 예시`} />
      <div className="ogm-shot-shade" />
      {slide.annotations.map((annotation) => (
        <div className={`ogm-note ${annotation.className}`} key={annotation.className}>
          <div className={`ogm-sketch-arrow ogm-sketch-arrow--${annotation.arrow}`} aria-hidden="true" />
          <strong>{annotation.text}</strong>
          <span>{annotation.desc}</span>
        </div>
      ))}
    </div>
  )
}

export default function OnboardingGuideModal({ onClose, onHideForDay, onHideForever }) {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const lastIndex = SLIDES.length - 1

  const pageLabel = useMemo(() => `${index + 1} / ${SLIDES.length}`, [index])

  const goPrev = () => setIndex((current) => (current === 0 ? lastIndex : current - 1))
  const goNext = () => setIndex((current) => (current === lastIndex ? 0 : current + 1))

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
          <div className="ogm-hide-actions">
            <button type="button" onClick={onHideForDay}>24시간 보지 않기</button>
            <button type="button" onClick={onHideForever}>다시는 보지 않기</button>
          </div>
        </div>
      </section>
    </div>
  )
}
