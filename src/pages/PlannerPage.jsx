import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StepIndicator from '../components/wizard/StepIndicator'
import Step1Region from '../components/wizard/Step1Region'
import Step2Jobs from '../components/wizard/Step2Jobs'
import Step3Accommodation from '../components/wizard/Step3Accommodation'
import Step4Budget from '../components/wizard/Step4Budget'
import Step5Planner from '../components/wizard/Step5Planner'
import OnboardingGuideModal from '../components/OnboardingGuideModal'
import { myPlannerApi } from '../api/myPlannerApi'
import { createJobSchedule, createPlannerId } from '../utils/plannerSchedule'
import './PlannerPage.css'

const TOTAL = 5
const FIXED_EXPENSES = 380000
const MAX_COMPARISON_JOBS = 3
const STEP_GUIDE_INDEX = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
}

const DEFAULT_HOTEL = {
  id: null,
  name: '',
  price: 0,
}

function prepareSeedJob(job) {
  if (!job) return null
  const salary = Number(job.salary ?? job.monthlySalary ?? 0)
  return {
    ...job,
    name: job.name ?? job.title,
    title: job.title ?? job.name,
    region: job.region ?? job.district ?? job.regionId,
    type: job.type ?? job.category ?? '추천',
    salary,
    monthlySalary: salary,
    priceLabel: job.priceLabel ?? `${salary.toLocaleString()}원`,
    unit: job.unit ?? '/월',
    sub: job.sub ?? job.workingDays ?? '',
    emoji: job.emoji ?? '💼',
  }
}

function getCityLabel(cityId, fallback) {
  const labels = {
    seoul: '서울',
    busan: '부산',
    daegu: '대구',
    jeju: '제주',
    gangneung: '강릉',
    jeonju: '전주',
    gyeongju: '경주',
    incheon: '인천',
    yeosu: '여수',
    sokcho: '속초',
    gwangju: '광주',
    daejeon: '대전',
  }
  return labels[cityId] ?? fallback ?? cityId
}

function getDistrictLabel(regionId, fallback) {
  const labels = {
    junggu: '대구 중구',
    donggu: '대구 동구',
    suseong: '대구 수성구',
    dalseo: '대구 달서구',
    bukgu: '대구 북구',
  }
  return labels[regionId] ?? fallback ?? regionId
}

function inferCityId(regionId, fallback) {
  if (fallback) return fallback
  if (['junggu', 'donggu', 'suseong', 'dalseo', 'bukgu'].includes(regionId)) return 'daegu'
  return regionId ?? null
}

export default function PlannerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const seedJob = prepareSeedJob(location.state?.selectedJob)
  const seedDistrictId = location.state?.selectedRegion ?? seedJob?.districtRegionId ?? seedJob?.regionId ?? null
  const seedCityId = inferCityId(seedDistrictId, location.state?.selectedCity ?? seedJob?.cityId)
  const seedCityName = getCityLabel(seedCityId, location.state?.selectedCityName)
  const seedDistrictName = seedDistrictId
    ? getDistrictLabel(seedDistrictId, location.state?.selectedRegionName ?? seedJob?.region)
    : null
  const seedStep = seedJob ? Number(location.state?.startStep ?? 3) : 1
  const [currentStep, setCurrentStep] = useState(Math.min(Math.max(seedStep, 1), TOTAL))
  const [plannerType, setPlannerType] = useState(location.state?.plannerType ?? 'long')
  const [selectedCity, setSelectedCity] = useState(seedCityId)
  const [selectedCityName, setSelectedCityName] = useState(seedCityName)
  const [selectedRegion, setSelectedRegion] = useState(seedDistrictId)
  const [selectedRegionName, setSelectedRegionName] = useState(seedDistrictName)
  const [selectedJobs, setSelectedJobs] = useState(seedJob ? [seedJob] : [])
  const [activeJobId, setActiveJobId] = useState(seedJob?.id ?? null)
  const [selectedHotelsByJobId, setSelectedHotelsByJobId] = useState({})
  const [draftPlannerId] = useState(() => createPlannerId())
  const [saving, setSaving] = useState(false)
  const [showStepGuide, setShowStepGuide] = useState(Boolean(location.state?.showGuide))
  const [guideInitialIndex, setGuideInitialIndex] = useState(STEP_GUIDE_INDEX[currentStep] ?? 1)

  function selectCity(cityId, cityName) {
    setSelectedCity(cityId)
    setSelectedCityName(getCityLabel(cityId, cityName))
    setSelectedRegion(null)
    setSelectedRegionName(null)
    setSelectedJobs([])
    setActiveJobId(null)
    setSelectedHotelsByJobId({})
  }

  function selectDistrict(regionId, regionName) {
    setSelectedRegion(regionId)
    setSelectedRegionName(regionId ? getDistrictLabel(regionId, regionName) : null)
    setSelectedJobs([])
    setActiveJobId(null)
    setSelectedHotelsByJobId({})
  }

  function toggleJob(job) {
    if (!selectedRegion && job.districtRegionId) {
      setSelectedRegion(job.districtRegionId)
      setSelectedRegionName(getDistrictLabel(job.districtRegionId, job.district))
    }
    const exists = selectedJobs.some((selectedJob) => selectedJob.id === job.id)
    if (!exists) {
      if (selectedJobs.length >= MAX_COMPARISON_JOBS) {
        alert(`비교할 일자리는 최대 ${MAX_COMPARISON_JOBS}개까지 선택할 수 있습니다.`)
        return
      }
      setSelectedJobs((prev) => [...prev, job])
      setActiveJobId((current) => current ?? job.id)
      return
    }

    const next = selectedJobs.filter((selectedJob) => selectedJob.id !== job.id)
    setSelectedJobs(next)
    setActiveJobId((current) => current === job.id ? (next[0]?.id ?? null) : current)
    setSelectedHotelsByJobId((hotels) => {
      const nextHotels = { ...hotels }
      delete nextHotels[job.id]
      return nextHotels
    })
  }

  function selectHotelForActiveJob(hotel) {
    if (!activeJobId) return
    setSelectedHotelsByJobId((prev) => ({ ...prev, [activeJobId]: hotel }))
  }

  function changePlannerType(nextType) {
    if (nextType === plannerType) return
    setPlannerType(nextType)
    setSelectedRegion(null)
    setSelectedRegionName(null)
    setSelectedJobs([])
    setActiveJobId(null)
    setSelectedHotelsByJobId({})
  }

  function moveStep(dir) {
    if (dir === 1) {
      if (currentStep === 1 && !selectedCity) {
        alert('지역을 선택해 주세요.')
        return
      }
      if (currentStep === 2 && selectedJobs.length === 0) {
        alert('일자리를 하나 이상 선택해 주세요.')
        return
      }
      if (currentStep === 2 && !selectedRegion) {
        alert('일자리 주소를 기준으로 구·군을 먼저 선택해 주세요.')
        return
      }
    }
    const next = currentStep + dir
    if (next < 1 || next > TOTAL) return
    setCurrentStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openStepGuide() {
    setGuideInitialIndex(STEP_GUIDE_INDEX[currentStep] ?? 1)
    setShowStepGuide(true)
  }

  const buildPlannerDraft = useCallback((createdAt = new Date().toISOString()) => {
    const primaryJob = selectedJobs.find((job) => job.id === activeJobId) ?? selectedJobs[0]
    const selectedHotel = selectedHotelsByJobId[primaryJob?.id] ?? DEFAULT_HOTEL
    const totalSalary = Number(primaryJob?.salary ?? primaryJob?.monthlySalary ?? 0)
    const accommodationCost = Number(selectedHotel.price ?? selectedHotel.monthlyPrice ?? 0)
    return {
      id: draftPlannerId,
      title: `${selectedRegionName ?? selectedCityName} 체류 플래너`,
      plannerType,
      cityId: selectedCity,
      cityName: selectedCityName,
      regionId: selectedRegion,
      regionName: selectedRegionName ?? selectedCityName,
      jobs: primaryJob ? [{
        id: primaryJob.id,
        name: primaryJob.name ?? primaryJob.title,
        type: primaryJob.type ?? primaryJob.category,
        role: 'PRIMARY',
        company: primaryJob.company ?? primaryJob.desc ?? '',
        workingDays: primaryJob.workingDays ?? primaryJob.sub ?? primaryJob.schedule ?? '',
        schedule: primaryJob.schedule ?? primaryJob.workingDays ?? primaryJob.sub ?? '',
        hourlyWage: Number(primaryJob.hourlyWage ?? primaryJob.wage ?? 10320),
        salary: Number(primaryJob.salary ?? primaryJob.monthlySalary ?? 0),
      }] : [],
      accommodation: {
        id: selectedHotel.id,
        name: selectedHotel.name,
        price: selectedHotel.price == null && selectedHotel.monthlyPrice == null ? null : accommodationCost,
      },
      totalSalary,
      accommodationCost,
      fixedExpense: FIXED_EXPENSES,
      disposableIncome: Math.max(0, totalSalary - accommodationCost - FIXED_EXPENSES),
      createdAt,
      memo: '',
    }
  }, [activeJobId, draftPlannerId, plannerType, selectedCity, selectedCityName, selectedHotelsByJobId, selectedJobs, selectedRegion, selectedRegionName])

  const previewPlanner = useMemo(() => {
    const planner = buildPlannerDraft()
    return { ...planner, schedule: createJobSchedule(planner) }
  }, [buildPlannerDraft])

  async function completePlanner() {
    if (selectedJobs.length === 0) {
      alert('일자리를 하나 이상 선택해 주세요.')
      setCurrentStep(2)
      return
    }
    if (!selectedRegion) {
      alert('선택한 일자리의 구·군 정보를 확인해 주세요.')
      setCurrentStep(2)
      return
    }

    setSaving(true)
    const planner = buildPlannerDraft()
    const plannerWithSchedule = { ...planner, schedule: createJobSchedule(planner) }
    try {
      await myPlannerApi.create(plannerWithSchedule)
    } catch (error) {
      setSaving(false)
      if (error.status === 401 || error.status === 403) {
        alert('로그인이 필요합니다. 로그인 후 다시 저장해 주세요.')
        navigate('/login', { state: { from: '/planner' } })
        return
      }
      alert('플래너 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    setSaving(false)
    navigate('/my-planner')
  }

  const isLastStep = currentStep === TOTAL

  const stepContent = [
    <Step1Region key={1} selectedRegion={selectedCity} onSelect={selectCity} />,
    <Step2Jobs
      key={`2-${plannerType}`}
      plannerType={plannerType}
      onPlannerTypeChange={changePlannerType}
      cityId={selectedCity}
      cityName={selectedCityName}
      selectedDistrictId={selectedRegion}
      selectedJobs={selectedJobs}
      onDistrictSelect={selectDistrict}
      onToggle={toggleJob}
    />,
    <Step3Accommodation
      key={3}
      selectedJobs={selectedJobs}
      activeJobId={activeJobId}
      onActiveJobChange={setActiveJobId}
      selectedHotelsByJobId={selectedHotelsByJobId}
      selectedHotel={selectedHotelsByJobId[activeJobId] ?? DEFAULT_HOTEL}
      onSelect={selectHotelForActiveJob}
    />,
    <Step4Budget
      key={4}
      selectedJobs={selectedJobs}
      activeJobId={activeJobId}
      onActiveJobChange={setActiveJobId}
      selectedHotelsByJobId={selectedHotelsByJobId}
    />,
    <Step5Planner
      key={5}
      selectedJobs={selectedJobs}
      activeJobId={activeJobId}
      onActiveJobChange={setActiveJobId}
      selectedHotelsByJobId={selectedHotelsByJobId}
      plannerPreview={previewPlanner}
    />,
  ]

  return (
    <div className="planner-wizard">
      {showStepGuide && (
        <OnboardingGuideModal
          initialIndex={guideInitialIndex}
          onClose={() => setShowStepGuide(false)}
        />
      )}
      <div className="wizard-inner">
        <div className="wizard-guide-bar">
          <button className="wizard-guide-button" type="button" onClick={openStepGuide}>
            <span aria-hidden="true">🔎</span><span>가이드</span>
          </button>
        </div>
        <StepIndicator currentStep={currentStep} total={TOTAL} />
        <div className="wizard-nav">
          <button
            className="btn-prev"
            onClick={() => moveStep(-1)}
            disabled={currentStep === 1 || saving}
          >
            이전 단계
          </button>
          <div className="step-counter">{currentStep} / {TOTAL} 단계</div>
          <button
            className="btn-next"
            onClick={isLastStep ? completePlanner : () => moveStep(1)}
            disabled={saving}
          >
            {isLastStep ? (saving ? '저장 중...' : '플래너 저장하고 결과 보기') : '다음 단계'}
          </button>
        </div>
        {stepContent[currentStep - 1]}
      </div>
    </div>
  )
}
