import { useCallback, useEffect, useRef, useState } from 'react'
import { PROFILE } from '../content'
import { openFolio, modalClick } from '../ui/Modal'
import { ABOUT, FRIDGE, ITEMS, type LobbyItem } from './items'
import { wheelState } from './wheelState'


/*
 * DocQ 메인 화면(룰렛 + 3D 캐러셀 메뉴)을 포트폴리오용으로 다시 짠 것.
 * - 바닥의 큰 나무 룰렛이 돌면 위쪽 카드 캐러셀이 따라 넘어간다
 * - 핀이 화살표를 지날 때마다 화살표가 튕긴다 (elastic)
 * - 처음엔 혼자 천천히 돌다가, 사용자가 한 번 만지면 멈춰서 기다린다
 */
const TOTAL = ITEMS.length
const STEP = 360 / TOTAL
const PIN = STEP / 2
const REDUCED = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const mod = (n: number) => ((n % TOTAL) + TOTAL) % TOTAL

function Icon({ name, style }: { name: string; style?: React.CSSProperties }) {
  return (
    <span className="msym" aria-hidden="true" style={style}>
      {name}
    </span>
  )
}

/** 가운데 카드일 때만 재생. 엘리먼트는 계속 살려 둬서 카드가 바뀔 때 다시 불러오지 않는다 */
function Clip({ src, poster, label, active }: { src: string; poster: string; label: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (active) {
      if (!v.getAttribute('src')) v.src = src
      v.play().catch(() => {})
    } else v.pause()
  }, [active, src])
  return <video ref={ref} className="clip" poster={poster} muted loop playsInline preload="none" aria-label={label} />
}

/**
 * 버튼 — 두 가지만 쓴다. 꽉 찬 먹색(주 동작) / 얇은 선(보조 동작).
 * 아이콘 대신 오른쪽 끝의 기호로 어디로 가는지 알려준다: → 이 페이지 안, ↗ 새 탭, ↓ 내려받기
 */
type Go = 'in' | 'out' | 'down'
const MARK: Record<Go, string> = { in: '→', out: '↗', down: '↓' }
/** 브랜드 아이콘 (Simple Icons) — 어디로 가는 링크인지 한눈에 */
const BRAND = {
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
} as const
function Brand({ name }: { name: keyof typeof BRAND }) {
  return (
    <svg className={`brand brand--${name}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={BRAND[name]} />
    </svg>
  )
}
function Btn({ children, onClick, href, line, go = 'out', download, brand, icon }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; href: string; line?: boolean; go?: Go; download?: boolean; brand?: keyof typeof BRAND; icon?: string }) {
  return (
    <a className={`cbtn ${line ? 'cbtn--line' : ''}`} href={href} target={download ? undefined : '_blank'} rel="noopener" onClick={onClick} download={download || undefined}>
      <span>
        {brand && <Brand name={brand} />}
        {icon && <Icon name={icon} />}
        {children}
      </span>
      {go !== 'in' && <i aria-hidden="true">{MARK[go]}</i>}
    </a>
  )
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="mail"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          window.setTimeout(() => setDone(false), 1800)
        })
      }}
    >
      <Icon name={done ? 'check' : 'mail'} />
      {done ? '복사했어요' : text}
      <i aria-hidden="true">{done ? '✓' : '복사'}</i>
    </button>
  )
}

function CardBody({ item, active }: { item: LobbyItem; active: boolean }) {
  if (item.kind === 'about')
    return (
      <div className="body body--about">
        <img className="portrait" src="./assets/portrait.jpg" alt="오창민 사진" />
        <div>
          <h1 className="wood">{ABOUT.name}</h1>
          <p className="role">{ABOUT.role}</p>
          <p className="lede">{ABOUT.lede}</p>
          {ABOUT.lines.map((l) => (
            <p key={l} className="desc">
              {l}
            </p>
          ))}
          <div className="tags">
            {ABOUT.chips.map((c, i) => (
              <span key={c}>
                <Icon name={['school', 'code', 'bolt'][i]} />
                {c}
              </span>
            ))}
          </div>
        </div>
        <Copy text={PROFILE.email} />
        <div className="actions">
          <Btn onClick={modalClick()} href={PROFILE.quick} go="in" icon="description">
            포트폴리오
          </Btn>
          <Btn line href={PROFILE.github} brand="github">
            GitHub
          </Btn>
          <Btn line href="./portfolio.pdf" go="down" download icon="picture_as_pdf">
            PDF
          </Btn>
        </div>
      </div>
    )

  if (item.kind === 'project') {
    const p = item.project
    return (
      <div className="body">
        <Clip src={p.video} poster={p.poster} label={`${p.title} 화면 영상`} active={active} />
        <div className="head">
          <span className="no" style={{ '--sw': item.color } as React.CSSProperties}>{p.no}</span>
          <h1 className="wood">{p.title}</h1>
          <span className="award">{p.award.replace('SSAFY ', '')}</span>
        </div>
        <p className="desc">{p.line}</p>
        <p className="meta">
          {p.period} · {p.team} · <b>{p.role}</b>
        </p>
        <div className="actions">
          <Btn onClick={modalClick(p.id)} href={p.detail} go="in" icon="article">
            자세히 보기
          </Btn>
          {p.extra && (
            <Btn line href={p.extra.href} brand="youtube">
              {p.extra.label}
            </Btn>
          )}
          <Btn line href={p.repo} brand="github">
            GitHub
          </Btn>
        </div>
      </div>
    )
  }

  return (
      <div className="body">
        <div className="flow" aria-label="데이터 냉장고 흐름">
          {FRIDGE.flow.map((f, i) => (
            <span key={f} className="flow__step" data-key={i === 2 ? '' : undefined}>
              {f}
            </span>
          ))}
        </div>
        <div className="head">
          <span className="no" style={{ '--sw': item.color } as React.CSSProperties}>01</span>
          <h1 className="wood">{FRIDGE.title}</h1>
          <span className="award">팀 우수상 · 1위</span>
        </div>
        <p className="desc">{FRIDGE.line}</p>
        <p className="meta">
          {FRIDGE.tag} · 4명 · <b>{FRIDGE.role}</b>
        </p>
        <div className="actions">
          <Btn onClick={modalClick('fridge')} href={`${PROFILE.quick}#fridge`} go="in" icon="article">
            자세히 보기
          </Btn>
          <Btn line href={FRIDGE.video} brand="youtube">
            소개 영상
          </Btn>
        </div>
      </div>
    )

}

export function Lobby() {
  const [active, setActive] = useState(0)
  const wheel = useRef<HTMLDivElement>(null)
  const arrow = useRef<HTMLDivElement>(null)
  const cur = useRef(0)
  const target = useRef(0)
  const touched = useRef(false)
  const idle = useRef(0)
  const hovering = useRef(false)
  const modalOpen = useRef(false)

  const go = useCallback((index: number) => {
    touched.current = true
    idle.current = performance.now() + 1000
    const now = Math.round(-target.current / STEP)
    let diff = index - mod(now)
    if (diff > TOTAL / 2) diff -= TOTAL
    if (diff < -TOTAL / 2) diff += TOTAL
    target.current = -(now + diff) * STEP
  }, [])

  const step = useCallback((dir: number) => {
    // 처음 만질 때만 혼자 돌던 각도를 칸에 맞추고, 그 뒤로는 DocQ처럼 입력만큼 그대로 쌓는다
    if (!touched.current) target.current = Math.round(target.current / STEP) * STEP
    touched.current = true
    target.current -= dir * STEP
    idle.current = performance.now() + 1000
  }, [])

  // 메인 루프 — DocQ의 updateLoop
  useEffect(() => {
    let raf = 0
    let lastPin = 0
    let lastDelta = 0
    const tick = (dir: number) => {
      const a = arrow.current
      if (!a) return
      a.animate(
        [
          { transform: 'translate(-50%, -55%) rotate(0deg)' },
          { transform: `translate(-50%, -55%) rotate(${dir > 0 ? -25 : 25}deg)`, offset: 0.14 },
          { transform: `translate(-50%, -55%) rotate(${dir > 0 ? 8 : -8}deg)`, offset: 0.45 },
          { transform: `translate(-50%, -55%) rotate(${dir > 0 ? -3 : 3}deg)`, offset: 0.7 },
          { transform: 'translate(-50%, -55%) rotate(0deg)' },
        ],
        { duration: 380, easing: 'ease-out' },
      )
    }
    let last = performance.now()
    const loop = (now: number) => {
      // 프레임 속도와 상관없이 같은 빠르기로 움직이도록 경과 시간 기준으로 계산
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (now > idle.current && !hovering.current && !modalOpen.current && !REDUCED) target.current -= 3.6 * dt
      const diff = target.current - cur.current
      cur.current += diff * (1 - Math.exp(-5 * dt))
      const sp = Math.abs(diff) * 0.8
      wheelState.speed = sp < 0.05 ? 0 : 0.5 + sp
      if (Math.abs(diff) > 0.01) lastDelta = diff
      if (wheel.current) wheel.current.style.transform = `rotate(${cur.current}deg)`
      const pin = Math.floor((Math.abs(cur.current) + 2) / PIN)
      if (pin !== lastPin) {
        tick(lastDelta)
        lastPin = pin
      }
      // 카드는 룰렛이 도착할 칸(target) 기준으로 바로 출발해서 룰렛과 같이 움직인다
      const idx = mod(Math.round(-target.current / STEP))
      setActive((a) => (a === idx ? a : idx))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 입력: 휠 · 방향키 · 드래그(스와이프)
  useEffect(() => {
    // DocQ(gsap Observer)와 같은 방식: 한 프레임 동안 들어온 휠 값을 모아 8 이상이면 한 칸
    let acc = 0
    let queued = 0
    const flush = () => {
      queued = 0
      if (Math.abs(acc) >= 8) step(acc > 0 ? 1 : -1)
      acc = 0
    }
    const onWheel = (e: WheelEvent) => {
      if (modalOpen.current) return
      acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (!queued) queued = requestAnimationFrame(flush)
    }
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen.current) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') step(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') step(-1)
    }
    let sx = 0
    let sy = 0
    let down = false
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a,button,video')) return
      down = true
      sx = e.clientX
      sy = e.clientY
    }
    const onUp = (e: PointerEvent) => {
      if (!down) return
      down = false
      const dx = e.clientX - sx
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - sy)) step(dx < 0 ? 1 : -1)
    }
    const onModal = (e: Event) => (modalOpen.current = (e as CustomEvent<boolean>).detail)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('folio:modal', onModal)
    return () => {
      window.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(queued)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('folio:modal', onModal)
    }
  }, [step])

  useEffect(() => {
    document.fonts?.ready.then(() => window.dispatchEvent(new Event('folio:ready')))
  }, [])

  // 화면이 낮으면 가운데 카드를 줄여서 룰렛 위에 들어가게 한다
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fit = () => {
      const el = root.current
      const panel = el?.querySelector<HTMLElement>('.pos-center .panel')
      if (!el || !panel) return
      const show = Math.min(300, Math.max(190, window.innerHeight * 0.3))
      const low = window.innerHeight < 760
      const room = window.innerHeight - show - 28 - (low ? 80 : 100)
      const f = Math.min(1, room / panel.offsetHeight, (window.innerWidth - 24) / panel.offsetWidth)
      el.style.setProperty('--fit', String(Math.max(0.55, f)))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [active])

  const pos = (i: number) => {
    const d = (i - active + TOTAL) % TOTAL
    if (d === 0) return 'pos-center'
    if (d === 1) return 'pos-right'
    if (d === TOTAL - 1) return 'pos-left'
    return 'pos-hidden'
  }

  return (
    <div className="lobby" ref={root}>
      <div className="studio" aria-hidden="true">
        <div className="studio__floor" />
        <div className="studio__light" />
      </div>
      <div className="grain" aria-hidden="true" />


      <main className="stage" aria-roledescription="carousel" aria-label="프로젝트 메뉴">
        {ITEMS.map((item, i) => {
          const p = pos(i)
          const center = p === 'pos-center'
          return (
            <section
              key={item.id}
              className={`citem ${p}`}
              aria-hidden={!center}
              aria-label={item.label}
              onClick={center ? undefined : () => go(i)}
              onPointerEnter={center ? () => (hovering.current = true) : undefined}
              onPointerLeave={center ? () => (hovering.current = false) : undefined}
            >
              <div className={`panel ${center ? 'panel--main' : 'panel--side'} ${item.kind === 'about' ? 'panel--about' : ''}`}>
                <CardBody item={item} active={center} />
                <div className="mini">
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </div>
              </div>
            </section>
          )
        })}
      </main>

      <div className="roulette" aria-hidden="true">
        <div className="roulette__shadow" />
        <div className="roulette__wheel" ref={wheel}>
          <div className="roulette__wood" />
          {Array.from({ length: TOTAL * 2 }, (_, n) => (
            <span key={n} className="pin" style={{ transform: `rotate(${n * PIN}deg) translateY(calc(var(--R) * -0.4925))` }} />
          ))}
        </div>
        <div className="arrow" ref={arrow}>
          <svg viewBox="0 0 100 300">
            <path d="M 50 200 L 15 30 L 85 30 Z" fill="#ff5252" />
          </svg>
        </div>
      </div>

      <nav className="dots" aria-label="메뉴 바로가기">
        <p className="hint">
          <Icon name="swipe" />
          휠 · 드래그 · ← → 로 돌려보세요
        </p>
        <div className="dots__bar">
          {ITEMS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`dot ${i === active ? 'is-active' : ''}`}
              aria-label={item.label}
              aria-current={i === active}
              onClick={() => go(i)}
            >
              <Icon name={item.icon} />
              <span className="tip">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export { openFolio }
