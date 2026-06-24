function toMinutes(value) {
  const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function occursOnSameSlot(left, right) {
  if (left.dateKey && right.dateKey) return left.dateKey === right.dateKey
  return Number(left.day) === Number(right.day)
}

export function findScheduleConflict(schedule, candidate, excludeId = null) {
  const candidateStart = toMinutes(candidate?.start)
  const candidateEnd = toMinutes(candidate?.end)
  if (candidateStart == null || candidateEnd == null || candidateEnd <= candidateStart) return null

  return (schedule ?? []).find((event) => {
    if (excludeId != null && event.id === excludeId) return false
    if (!occursOnSameSlot(event, candidate)) return false
    const eventStart = toMinutes(event.start)
    const eventEnd = toMinutes(event.end)
    if (eventStart == null || eventEnd == null) return false
    return candidateStart < eventEnd && candidateEnd > eventStart
  }) ?? null
}

export function scheduleConflictMessage(conflict, candidate) {
  if (!conflict) return ''
  const dateLabel = candidate?.dateKey ? `${candidate.dateKey} ` : ''
  return `${dateLabel}${conflict.title || '기존 일정'}(${conflict.start}~${conflict.end})과 시간이 겹칩니다. 다른 시간을 선택해 주세요.`
}
