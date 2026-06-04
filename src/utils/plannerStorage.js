const STORAGE_KEY = 'samteo.planners'

export function getStoredPlanners() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredPlanner(planner) {
  const planners = getStoredPlanners()
  const index = planners.findIndex((item) => item.id === planner.id)
  const nextPlanner = {
    ...planner,
    updatedAt: new Date().toISOString(),
  }

  const next = index >= 0
    ? planners.map((item) => (item.id === planner.id ? nextPlanner : item))
    : [nextPlanner, ...planners]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return nextPlanner
}

export function deleteStoredPlanner(id) {
  const next = getStoredPlanners().filter((planner) => planner.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
