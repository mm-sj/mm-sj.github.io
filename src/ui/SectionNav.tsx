import { useEffect, useState } from 'react'
import { sceneState } from '../store'
import { SECTION_COUNT } from '../scene/timeline'

/** 스크롤 위치(장면 번호)와 1:1로 대응하는 상단 목차 */
const ITEMS = [
  { no: '00', label: 'Plan' },
  { no: '01', label: 'Architecture' },
  { no: '02', label: 'Code' },
  { no: '03', label: 'DocQ' },
  { no: '04', label: 'Would You Draw' },
  { no: '05', label: 'Jabis' },
  { no: '06', label: 'Contact' },
]
/** 배경이 어두운 장면 (WYD 밤하늘, Jabis 대시보드) — 글자색을 밝게 바꾼다 */
const DARK = new Set([4, 5])

/**
 * 상단 가로 내비게이션.
 * 현재 장면은 3D 루프가 sceneState.section에 쓰고, 여기서는 rAF로 읽어 바뀔 때만 리렌더한다.
 */
export function SectionNav() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    let raf = 0
    let last = -1
    const tick = () => {
      const s = sceneState.section
      if (s !== last) {
        last = s
        setActive(s)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const go = (k: number) => {
    const el = sceneState.scrollEl
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    el.scrollTo({ top: (k / (SECTION_COUNT - 1)) * max, behavior: 'smooth' })
  }

  return (
    <nav className={`secnav ${DARK.has(active) ? 'secnav--dark' : ''}`} aria-label="섹션 이동">
      <ol>
        {ITEMS.map((it, k) => (
          <li key={it.no}>
            <button type="button" className={k === active ? 'is-active' : ''} aria-current={k === active ? 'step' : undefined} onClick={() => go(k)}>
              <span className="secnav__no">{it.no}</span>
              <span className="secnav__label">{it.label}</span>
              <span className="secnav__bar" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
