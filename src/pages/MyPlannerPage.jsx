import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteStoredPlanner, getStoredPlanners, saveStoredPlanner } from '../utils/plannerStorage'
import './ExplorePages.css'

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function MyPlannerPage() {
  const navigate = useNavigate()
  const [planners, setPlanners] = useState(() => getStoredPlanners())
  const [activeId, setActiveId] = useState(() => getStoredPlanners()[0]?.id ?? null)
  const initialPlanner = planners.find((planner) => planner.id === activeId) ?? planners[0] ?? null
  const [memo, setMemo] = useState(() => initialPlanner?.memo ?? '')
  const [title, setTitle] = useState(() => initialPlanner?.title ?? '')

  const activePlanner = useMemo(
    () => planners.find((planner) => planner.id === activeId) ?? null,
    [planners, activeId]
  )

  const selectPlanner = (planner) => {
    setActiveId(planner.id)
    setTitle(planner.title ?? '')
    setMemo(planner.memo ?? '')
  }

  const saveMemo = () => {
    if (!activePlanner) return
    const saved = saveStoredPlanner({ ...activePlanner, title, memo })
    const next = getStoredPlanners()
    setPlanners(next)
    setActiveId(saved.id)
  }

  const removePlanner = () => {
    if (!activePlanner) return
    const next = deleteStoredPlanner(activePlanner.id)
    setPlanners(next)
    setActiveId(next[0]?.id ?? null)
  }

  return (
    <main className="directory-page">
      <div className="directory-shell">
        <header className="directory-head">
          <div>
            <p className="directory-kicker">MY PLANNER</p>
            <h1 className="directory-title">내 플래너</h1>
            <p className="directory-desc">완성한 플래너를 여러 개 보관하고, 제목과 메모를 수정할 수 있습니다.</p>
          </div>
          <div className="directory-actions">
            <button className="directory-btn primary" onClick={() => navigate('/planner')}>새 플래너 만들기</button>
          </div>
        </header>

        {planners.length === 0 ? (
          <div className="directory-empty">
            저장된 플래너가 없습니다. 내 플래너 시작하기에서 마지막 단계까지 완료해 첫 결과를 만들어 보세요.
          </div>
        ) : (
          <section className="planner-list">
            <aside className="planner-list-panel">
              {planners.map((planner) => (
                <button
                  className={`planner-item${planner.id === activeId ? ' active' : ''}`}
                  key={planner.id}
                  onClick={() => selectPlanner(planner)}
                >
                  <h2 className="directory-card-title">{planner.title}</h2>
                  <p className="directory-card-sub">{planner.regionName} · {planner.jobs?.length ?? 0}개 일자리</p>
                  <p className="directory-card-sub">수정 {formatDate(planner.updatedAt ?? planner.createdAt)}</p>
                </button>
              ))}
            </aside>

            <article className="planner-detail-panel">
              {activePlanner && (
                <>
                  <div className="planner-form">
                    <label>
                      플래너 제목
                      <input value={title} onChange={(event) => setTitle(event.target.value)} />
                    </label>
                    <label>
                      메모
                      <textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="이 플래너에서 기억할 점을 적어두세요." />
                    </label>
                  </div>

                  <div className="directory-metrics">
                    <div className="directory-metric"><span>지역</span><strong>{activePlanner.regionName}</strong></div>
                    <div className="directory-metric"><span>숙소</span><strong>{activePlanner.accommodation?.name ?? '-'}</strong></div>
                    <div className="directory-metric"><span>총 예상 급여</span><strong>{(activePlanner.totalSalary ?? 0).toLocaleString()}원</strong></div>
                    <div className="directory-metric"><span>월 예상 잔액</span><strong>{(activePlanner.disposableIncome ?? 0).toLocaleString()}원</strong></div>
                  </div>

                  <div className="directory-tags">
                    {(activePlanner.jobs ?? []).map((job) => (
                      <span className="directory-tag" key={job.id ?? job.name}>{job.name ?? job.title}</span>
                    ))}
                  </div>

                  <div className="directory-actions" style={{ marginTop: 18, justifyContent: 'flex-start' }}>
                    <button className="directory-btn primary" onClick={saveMemo}>수정 저장</button>
                    <button className="directory-btn" onClick={() => navigate('/planner')}>다시 만들기</button>
                    <button className="directory-btn" onClick={removePlanner}>삭제</button>
                  </div>
                </>
              )}
            </article>
          </section>
        )}
      </div>
    </main>
  )
}
