import { useEffect, useState } from 'react'
import { sceneState } from '../store'

/**
 * 첫 화면 스크롤 안내 — 마우스 모양 안에서 점이 굴러 내려간다.
 * 조금이라도 스크롤하면 사라지고, 맨 위로 돌아오면 다시 나타난다.
 */
export function ScrollHint() {
  const [show, setShow] = useState(true)
  useEffect(() => {
    let raf = 0
    let last = true
    const tick = () => {
      const el = sceneState.scrollEl
      const top = el ? el.scrollTop < 40 : true
      if (top !== last) {
        last = top
        setShow(top)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className={`scrollhint ${show ? '' : 'is-hidden'}`} aria-hidden="true">
      <span className="scrollhint__mouse">
        <span className="scrollhint__dot" />
      </span>
      <span className="scrollhint__label">SCROLL</span>
    </div>
  )
}
