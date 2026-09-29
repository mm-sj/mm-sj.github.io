/** 장면 순서: 0 도면 · 1 모형 · 2 파사드 · 3 DocQ · 4 WYD · 5 Jabis · 6 연락처 */
export const SECTION_COUNT = 7

/**
 * 스크롤 offset(0~1) → 현재 장면 a, 다음 장면 b, 전환 비율 t.
 * 각 섹션 앞뒤 25%는 정지 구간(hold)으로 두고, 가운데 50%에서만 전환한다.
 * 그래야 글을 읽는 동안 형태가 멈춰 있다.
 */
export function sectionBlend(offset: number, count: number) {
  const s = Math.min(count - 1, Math.max(0, offset * (count - 1)))
  const a = Math.min(count - 2, Math.floor(s))
  const f = s - a
  const x = Math.min(1, Math.max(0, (f - 0.25) / 0.5))
  return { a, b: a + 1, t: x * x * (3 - 2 * x) }
}

/** 장면 k의 "보이는 정도"(0~1) */
export function weightOf(k: number, offset: number, count: number) {
  const { a, b, t } = sectionBlend(offset, count)
  if (k === a) return 1 - t
  if (k === b) return t
  return 0
}
