import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StepIndicator from '../components/wizard/StepIndicator'
import Step1Region from '../components/wizard/Step1Region'
import Step2Jobs from '../components/wizard/Step2Jobs'
import Step3Accommodation from '../components/wizard/Step3Accommodation'
import Step4Budget from '../components/wizard/Step4Budget'
import Step5Planner from '../components/wizard/Step5Planner'
import { myPlannerApi } from '../api/myPlannerApi'
import { createJobSchedule, createPlannerId } from '../utils/plannerSchedule'
import './PlannerPage.css'

const TOTAL = 5
const FIXED_EXPENSES = 380000

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
  const [selectedCity, setSelectedCity] = useState(seedCityId)
  const [selectedCityName, setSelectedCityName] = useState(seedCityName)
  const [selectedRegion, setSelectedRegion] = useState(seedDistrictId)
  const [selectedRegionName, setSelectedRegionName] = useState(seedDistrictName)
  const [selectedJobs, setSelectedJobs] = useState(seedJob ? [seedJob] : [])
  const [selectedHotel, setSelectedHotel] = useState(DEFAULT_HOTEL)
  const [draftPlannerId] = useState(() => createPlannerId())
  const [saving, setSaving] = useState(false)

  function selectCity(cityId, cityName) {
    setSelectedCity(cityId)
    setSelectedCityName(getCityLabel(cityId, cityName))
    setSelectedRegion(null)
    setSelectedRegionName(null)
    setSelectedJobs([])
  }

  function selectDistrict(regionId, regionName) {
    setSelectedRegion(regionId)
    setSelectedRegionName(regionId ? getDistrictLabel(regionId, regionName) : null)
    setSelectedJobs([])
  }

  function toggleJob(job) {
    if (!selectedRegion && job.districtRegionId) {
      setSelectedRegion(job.districtRegionId)
      setSelectedRegionName(getDistrictLabel(job.districtRegionId, job.district))
    }
    setSelectedJobs((prev) => {
      const exists = prev.find((j) => j.id === job.id)
      return exists ? prev.filter((j) => j.id !== job.id) : [...prev, job]
    })
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

  function buildPlannerDraft(createdAt = new Date().toISOString()) {
    const totalSalary = selectedJobs.reduce((sum, job) => sum + Number(job.salary ?? job.monthlySalary ?? 0), 0)
    const accommodationCost = Number(selectedHotel.price ?? selectedHotel.monthlyPrice ?? 0)
    return {
      id: draftPlannerId,
      title: `${selectedRegionName ?? selectedCityName} 체류 플래너`,
      cityId: selectedCity,
      cityName: selectedCityName,
      regionId: selectedRegion,
      regionName: selectedRegionName ?? selectedCityName,
      jobs: selectedJobs.map((job) => ({
        id: job.id,
        name: job.name ?? job.title,
        type: job.type ?? job.category,
        company: job.company ?? job.desc ?? '',
        workingDays: job.workingDays ?? job.sub ?? job.schedule ?? '',
        schedule: job.schedule ?? job.workingDays ?? job.sub ?? '',
        hourlyWage: Number(job.hourlyWage ?? job.wage ?? 10320),
        salary: Number(job.salary ?? job.monthlySalary ?? 0),
      })),
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
  }

  const previewPlanner = useMemo(() => {
    const planner = buildPlannerDraft()
    return { ...planner, schedule: createJobSchedule(planner) }
  }, [draftPlannerId, selectedCity, selectedCityName, selectedRegion, selectedRegionName, selectedJobs, selectedHotel])

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
      key={2}
      cityId={selectedCity}
      cityName={selectedCityName}
      selectedDistrictId={selectedRegion}
      selectedJobs={selectedJobs}
      onDistrictSelect={selectDistrict}
      onToggle={toggleJob}
    />,
    <Step3Accommodation key={3} selectedJobs={selectedJobs} selectedHotel={selectedHotel} onSelect={setSelectedHotel} />,
    <Step4Budget key={4} selectedJobs={selectedJobs} selectedHotel={selectedHotel} />,
    <Step5Planner key={5} selectedJobs={selectedJobs} selectedHotel={selectedHotel} plannerPreview={previewPlanner} />,
  ]

  return (
    <div className="planner-wizard">
      <div className="wizard-inner">
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
