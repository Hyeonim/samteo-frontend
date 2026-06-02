const API_KEY = '7fdo7FzwFFmbWxYTfnj3Yw'

export async function searchPubTransPath(sLat, sLng, eLat, eLng) {
  const params = new URLSearchParams({
    SX: sLng, SY: sLat,
    EX: eLng, EY: eLat,
    apiKey: API_KEY,
  })
  const res = await fetch(`/odsay/v1/api/searchPubTransPathT?${params}`)
  if (!res.ok) throw new Error('경로 조회 실패')
  return res.json()
}

export async function loadLane(mapObj) {
  const params = new URLSearchParams({
    mapObject: `0:0@${mapObj}`,
    apiKey: API_KEY,
  })
  const res = await fetch(`/odsay/v1/api/loadLane?${params}`)
  if (!res.ok) throw new Error('경로 상세 조회 실패')
  return res.json()
}
