import { useCallback, useEffect, useRef, useState } from 'react'
import { PROFILE, PROJECTS } from '../content'

/**
 * 전체 보기 모달 — 문서형 포트폴리오(quick/)를 iframe 하나로 띄운다.
 * "전체 보기"는 맨 위부터, 프로젝트 카드의 "자세히 보기"는 같은 모달에서 해당 프로젝트 위치로 연다.
 * 한 번 불러온 iframe은 닫아도 유지해서, 다시 열 때 즉시 뜬다.
 */
const EVENT = 'folio:open'

/** 어디서든(Canvas 안 HTML 오버레이 포함) 모달을 연다. id가 없으면 맨 위 */
export function openFolio(id?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(EVENT, { detail: id }))
}

/** 링크의 기본 동작(새 탭)은 Ctrl·휠 클릭에만 남기고, 일반 클릭은 모달로 */
export function modalClick(id?: string) {
  return (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    openFolio(id)
  }
}

const base = PROFILE.quick.split('#')[0]
// 배포할 때마다 v가 바뀌어서 브라우저가 예전 문서 페이지를 캐시에서 꺼내 쓰지 않는다
const SRC = `${base}${base.includes('?') ? '&' : '?'}embed&v=${__BUILD__}`

export function FolioModal() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const target = useRef<string | undefined>(undefined)
  const frame = useRef<HTMLIFrameElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const jump = useCallback((id?: string) => {
    const doc = frame.current?.contentDocument
    if (!doc) return
    const el = id ? doc.getElementById(id) : null
    if (el) el.scrollIntoView({ block: 'start' })
    else frame.current?.contentWindow?.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const onOpen = (e: Event) => {
      target.current = (e as CustomEvent<string | undefined>).detail
      returnFocus.current = document.activeElement as HTMLElement | null
      setMounted(true)
      setOpen(true)
    }
    window.addEventListener(EVENT, onOpen)
    return () => window.removeEventListener(EVENT, onOpen)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    returnFocus.current?.focus?.()
  }, [])

  useEffect(() => {
    if (!open) return
    if (loaded) jump(target.current)
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loaded, jump, close])

  if (!mounted) return null
  return (
    <div className={`modal ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="포트폴리오 전체 보기" aria-hidden={!open} onClick={close}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__bar">
          <nav className="modal__nav" aria-label="프로젝트로 이동">
            <button type="button" className="mono" onClick={() => jump()}>
              처음
            </button>
            {PROJECTS.map((p) => (
              <button key={p.id} type="button" className="mono" onClick={() => jump(p.id)}>
                {p.no} {p.title}
              </button>
            ))}
          </nav>
          <span className="modal__actions">
            <a className="mono" href={PROFILE.quick} target="_blank" rel="noopener">
              새 탭 ↗
            </a>
            <button ref={closeBtn} type="button" className="modal__close" onClick={close} aria-label="닫기">
              ✕
            </button>
          </span>
        </div>
        {!loaded && <p className="modal__loading mono">불러오는 중…</p>}
        <iframe
          ref={frame}
          title="포트폴리오 전체"
          src={SRC}
          onLoad={() => {
            setLoaded(true)
            jump(target.current)
          }}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>
    </div>
  )
}
