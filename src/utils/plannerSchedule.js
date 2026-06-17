const COLORS = ['#ef7f72', '#6b9ee8', '#9ac768', '#6ec7bd', '#f3bf58', '#9b7ae5', '#f59e73']

function pad(v) {
  return String(v).padStart(2, '0')
}

function toMinutes(v, fallback) {
  const m = String(v ?? '').match(/(\d{1,2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : fallback
}

function minutesToTime(v) {
  return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`
}

function hashBase36(value) {
  let hash = 0
  const text = String(value ?? '')
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

export function createPlannerId() {
  return globalThis.crypto?.randomUUID?.() ?? `planner-${Date.now().toString(36)}`
}

export function createWorkScheduleId(plannerId, jobId, day) {
  return `work-${hashBase36(`${plannerId}-${jobId}-${day}`)}-${day}`
}

function parseJobTime(job, index) {
  const text = [job.workingDays, job.sub, job.schedule, job.time].filter(Boolean).join(' ')
  const times = [...text.matchAll(/(\d{1,2}:\d{2})/g)].map((m) => m[1])
  const defaultStart = 9 * 60 + (index % 3) * 60
  const start = toMinutes(times[0], defaultStart)
  const end = toMinutes(times[1], start + 7 * 60)
  return { start: minutesToTime(start), end: minutesToTime(Math.max(end, start + 60)) }
}

function parseJobDays(job) {
  const text = [job.workingDays, job.sub, job.schedule, job.time].filter(Boolean).join(' ')
  if (/Mon-Fri|월-금|주\s*5/.test(text)) return [0, 1, 2, 3, 4]
  if (/주\s*4/.test(text)) return [0, 1, 2, 3]
  if (/주말|Sat|Sun|토|일/.test(text)) return [5, 6]
  return [0, 1, 2, 3, 4]
}

export function createJobSchedule(planner) {
  const raw = (planner.jobs ?? []).flatMap((job, jobIndex) => {
    const time = parseJobTime(job, jobIndex)
    const jobColor = COLORS[jobIndex % COLORS.length]
    return parseJobDays(job).map((day) => ({
      id: createWorkScheduleId(planner.id, job.id ?? jobIndex, day),
      title: job.name ?? job.title ?? '근무',
      type: 'work',
      day,
      start: time.start,
      end: time.end,
      color: jobColor,
      memo: job.company ?? job.type ?? '자동 생성된 근무 일정',
      locked: true,
    }))
  })

  const workColorByTitle = new Map()
  let nextColorIndex = 0
  return raw.map((event) => {
    const key = event.title ?? event.id
    if (!workColorByTitle.has(key)) {
      workColorByTitle.set(key, COLORS[nextColorIndex % COLORS.length])
      nextColorIndex += 1
    }
    return { ...event, color: workColorByTitle.get(key) }
  })
}
