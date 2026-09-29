import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PROFILE, PROJECTS, type Project } from '../content'
import { MODEL_CUBES } from '../scene/layouts'

function Copy({ text }: { text: string }) {
  const [msg, setMsg] = useState('')
  return (
    <span className="copy">
      <button
        type="button"
        className="chip"
        onClick={() => {
          navigator.clipboard
            ?.writeText(text)
            .then(() => setMsg('복사했습니다'))
            .catch(() => setMsg('주소를 직접 선택해 주세요'))
          window.setTimeout(() => setMsg(''), 2200)
        }}
      >
        {text}
      </button>
      <span className="toast" aria-live="polite">
        {msg}
      </span>
    </span>
  )
}

/** 화면에 보일 때만 재생되는 루프 영상 */
function Clip({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = src
          v.play().catch(() => {})
        } else v.pause()
      },
      { threshold: 0.2 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  return <video ref={ref} poster={poster} muted loop playsInline preload="none" aria-label={label} />
}

/** 자세히 보기 — 정적 포트폴리오의 해당 프로젝트만 모달 안에 띄운다 */
function DetailModal({ p, onClose }: { p: Project; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])
  const [base, hash] = p.detail.split('#')
  const src = `${base}${base.includes('?') ? '&' : '?'}embed#${hash ?? ''}`
  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label={`${p.title} 자세히 보기`} onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__bar">
          <span className="mono">
            SHEET {p.no} / 03 — {p.title}
          </span>
          <span className="modal__actions">
            <a className="mono" href={p.detail} target="_blank" rel="noopener">
              새 탭 ↗
            </a>
            <button ref={closeBtn} type="button" className="modal__close" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </span>
        </div>
        {!loaded && <p className="modal__loading mono">불러오는 중…</p>}
        <iframe title={`${p.title} 상세`} src={src} onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0 }} />
      </div>
    </div>,
    document.body,
  )
}

function ProjectCard({ p, dark }: { p: Project; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <article className={`card ${dark ? 'card--dark' : ''}`} aria-labelledby={`${p.id}-t`}>
      <div className="card__block">
        <span><i>SHEET</i>{p.no} / 03</span>
        <span><i>PERIOD</i>{p.period}</span>
        <span><i>TEAM</i>{p.team}</span>
        <span><i>ROLE</i>{p.role}</span>
      </div>
      <p className="award">{p.award}</p>
      <h2 id={`${p.id}-t`}>{p.title}</h2>
      <p className="line">{p.line}</p>
      <div className="clip">
        <Clip src={p.video} poster={p.poster} label={`${p.title} 화면`} />
      </div>
      <ul className="points">
        {p.points.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <div className="links">
        <a
          className="chip chip--solid"
          href={p.detail}
          target="_blank"
          rel="noopener"
          onClick={(e) => {
            // 새 탭 열기(휠 클릭·Ctrl 클릭)는 그대로 두고, 일반 클릭만 모달로
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
            e.preventDefault()
            setOpen(true)
          }}
        >
          자세히 보기 →
        </a>
        {p.extra && (
          <a className="chip" href={p.extra.href} target="_blank" rel="noopener">
            {p.extra.label} ↗
          </a>
        )}
        <a className="chip" href={p.repo} target="_blank" rel="noopener">
          GitHub ↗
        </a>
      </div>
      {open && <DetailModal p={p} onClose={() => setOpen(false)} />}
    </article>
  )
}

export function Overlay() {
  return (
    <div className="overlay">
      {/* 0. 도면 */}
      <section className="sec sec--hero">
        <div className="txt">
          <p className="eyebrow">{PROFILE.role}</p>
          <h1>
            건축을 전공한
            <br />
            프론트엔드 개발자
            <br />
            {PROFILE.name}입니다.
          </h1>
          <p className="lede">모형을 만지던 손으로, 지금은 웹에서 3D를 만지고 있습니다.</p>
          <p className="cue">천천히 스크롤해 보세요 ↓</p>
        </div>
        <p className="stamp">PLAN — SCALE 1:250</p>
      </section>

      {/* 1. 모형 */}
      <section className="sec">
        <div className="txt">
          <p className="eyebrow">01 · Architecture</p>
          <h2>처음엔 모형을 만들었습니다</h2>
          <p>
            건축학을 전공했고, 건축사사무소에서 인턴으로 일하며 모형을 만들고 3D 모델링과 건축물 일러스트를
            맡았습니다.
          </p>
          <p className="note">이 모형도 큐브 {MODEL_CUBES}개를 한 칸씩 쌓아 만들었습니다. 스크롤하면 이 큐브들이 그대로 다음 장면이 됩니다.</p>
        </div>
      </section>

      {/* 2. 파사드 */}
      <section className="sec">
        <div className="txt">
          <p className="eyebrow">02 · Code</p>
          <h2>지금은 코드로 만듭니다</h2>
          <p>
            아부다비 알 바르 타워의 차양을 참고해 three.js로 만든 스크린입니다. 커서를 가까이 대 보세요. 주변
            모듈이 우산처럼 하나씩 열리고, 커서가 떠나면 다시 닫힙니다.
          </p>
        </div>
      </section>

      {/* 3~5. 프로젝트 */}
      <section className="sec sec--card">
        <ProjectCard p={PROJECTS[0]} />
      </section>
      <section className="sec sec--card sec--dark">
        <ProjectCard p={PROJECTS[1]} dark />
      </section>
      <section className="sec sec--card sec--dark">
        <ProjectCard p={PROJECTS[2]} dark />
      </section>

      {/* 6. 연락처 */}
      <section className="sec sec--end">
        <div className="txt">
          <p className="eyebrow">Contact</p>
          <h2>봐 주셔서 감사합니다</h2>
          <ul className="facts">
            <li><i>EDUCATION</i>SSAFY 14기 수료 · 계명대학교 건축학 학사</li>
            <li><i>EXPERIENCE</i>건축사사무소 인턴 — 모형 제작, 3D 모델링</li>
            <li><i>NOW</i>LG전자 K-뉴딜 아카데미 1기 AX 워크플로우 트랙</li>
            <li><i>AWARDS</i>SSAFY 공통 최우수상 · 특화 우수상 · 자율 우수상</li>
          </ul>
          <div className="links">
            <Copy text={PROFILE.email} />
            <a className="chip" href={PROFILE.github} target="_blank" rel="noopener">
              GitHub ↗
            </a>
            <a className="chip" href="./portfolio.pdf" target="_blank" rel="noopener">
              PDF ↓
            </a>
            <a className="chip chip--solid" href={PROFILE.quick} target="_blank" rel="noopener">
              1분 버전으로 보기 →
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
