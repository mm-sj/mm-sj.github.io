import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { PROFILE } from '../content'
import { openFolio, modalClick } from '../ui/Modal'
import { ABOUT, FRIDGE, ITEMS, type LobbyItem } from './items'
import { wheelState } from './wheelState'

const Characters = lazy(() => import('./Characters').then((m) => ({ default: m.Characters })))

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

/** 가운데 카드에 올라간 동안만 재생되는 루프 영상 */
function Clip({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.src = src
    v.play().catch(() => {})
    return () => v.pause()
  }, [src])
  return <video ref={ref} className="clip" poster={poster} muted loop playsInline aria-label={label} />
}

function Btn({ item, children, onClick, href, ghost }: { item: LobbyItem; children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; href?: string; ghost?: boolean }) {
  void item
  const style = undefined
  const cls = `cbtn ${ghost ? 'cbtn--ghost' : ''}`
  if (href)
    return (
      <a className={cls} style={style} href={href} target="_blank" rel="noopener" onClick={onClick}>
        {children}
      </a>
    )
  return (
    <button type="button" className={cls} style={style} onClick={onClick}>
      {children}
    </button>
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
      <Icon name={done ? 'check' : 'content_copy'} />
      {done ? '복사했어요' : text}
    </button>
  )
}

function CardBody({ item }: { item: LobbyItem }) {
  if (item.kind === 'about')
    return (
      <div className="body body--about">
        <img className="portrait" src="./assets/portrait.jpg" alt="오창민 사진" />
        <div>
          <h1 className="wood">{ABOUT.name}</h1>
          <p className="role">{ABOUT.role}</p>
          {ABOUT.lines.map((l) => (
            <p key={l} className="desc">
              {l}
            </p>
          ))}
          <div className="tags">
            {ABOUT.chips.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
        <div className="actions">
          <Btn item={item} onClick={modalClick()} href={PROFILE.quick}>
            <Icon name="menu_book" />
            전체 포트폴리오
          </Btn>
        </div>
      </div>
    )

  if (item.kind === 'project') {
    const p = item.project
    return (
      <div className="body">
        <Clip src={p.video} poster={p.poster} label={`${p.title} 화면 영상`} />
        <div className="head">
          <span className="no" style={{ '--sw': item.color } as React.CSSProperties}>{p.no}</span>
          <h1 className="wood">{p.title}</h1>
          <span className="award">
            <Icon name="emoji_events" />
            {p.stamp.rank}
          </span>
        </div>
        <p className="desc">{p.line}</p>
        <p className="meta">
          {p.period} · {p.team} · <b>{p.role}</b>
        </p>
        <div className="actions">
          <Btn item={item} onClick={modalClick(p.id)} href={p.detail}>
            <Icon name="article" />
            자세히 보기
          </Btn>
          {p.extra && (
            <Btn item={item} ghost href={p.extra.href}>
              <Icon name="play_circle" />
              {p.extra.label}
            </Btn>
          )}
          <Btn item={item} ghost href={p.repo}>
            <Icon name="code" />
            GitHub
          </Btn>
        </div>
      </div>
    )
  }

  if (item.kind === 'fridge')
    return (
      <div className="body">
        <div className="flow" aria-label="자료 입고 흐름">
          {FRIDGE.flow.map((f, i) => (
            <span key={f} className="flow__step" data-key={i === 3 ? '' : undefined}>
              {f}
            </span>
          ))}
        </div>
        <div className="head">
          <span className="no" style={{ '--sw': item.color } as React.CSSProperties}>04</span>
          <h1 className="wood">{FRIDGE.title}</h1>
          <span className="award">
            <Icon name="school" />
            AX 트랙
          </span>
        </div>
        <p className="desc">{FRIDGE.line}</p>
        <p className="meta">
          {FRIDGE.tag} · 5명 · <b>{FRIDGE.role}</b>
        </p>
        <div className="actions">
          <Btn item={item} onClick={modalClick('fridge')} href={`${PROFILE.quick}#fridge`}>
            <Icon name="article" />
            자세히 보기
          </Btn>
          <Btn item={item} ghost href={FRIDGE.video}>
            <Icon name="play_circle" />
            소개 영상
          </Btn>
        </div>
      </div>
    )

  return (
    <div className="body body--contact">
      <h1 className="wood">연락처</h1>
      <p className="desc">포트폴리오를 끝까지 봐 주셔서 고맙습니다.</p>
      <Copy text={PROFILE.email} />
      <div className="actions">
        <Btn item={item} href={PROFILE.github}>
          <Icon name="code" />
          GitHub
        </Btn>
        <Btn item={item} ghost href="./portfolio.pdf">
          <Icon name="download" />
          PDF
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
  const hovering = useRef(false)
  const modalOpen = useRef(false)

  const go = useCallback((index: number) => {
    touched.current = true
    const now = Math.round(-target.current / STEP)
    let diff = index - mod(now)
    if (diff > TOTAL / 2) diff -= TOTAL
    if (diff < -TOTAL / 2) diff += TOTAL
    target.current = -(now + diff) * STEP
  }, [])

  const step = useCallback((dir: number) => {
    touched.current = true
    // 아직 돌고 있는 중이면 다음 칸 기준으로 쌓는다
    target.current = Math.round(target.current / STEP) * STEP - dir * STEP
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
          { transform: 'translate(-50%, -63%) rotate(0deg)' },
          { transform: `translate(-50%, -63%) rotate(${dir > 0 ? -25 : 25}deg)`, offset: 0.14 },
          { transform: `translate(-50%, -63%) rotate(${dir > 0 ? 8 : -8}deg)`, offset: 0.45 },
          { transform: `translate(-50%, -63%) rotate(${dir > 0 ? -3 : 3}deg)`, offset: 0.7 },
          { transform: 'translate(-50%, -63%) rotate(0deg)' },
        ],
        { duration: 380, easing: 'ease-out' },
      )
    }
    let last = performance.now()
    const loop = (now: number) => {
      // 프레임 속도와 상관없이 같은 빠르기로 움직이도록 경과 시간 기준으로 계산
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!touched.current && !hovering.current && !modalOpen.current && !REDUCED) target.current -= 3.6 * dt
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
      const idx = mod(Math.round(-cur.current / STEP))
      setActive((a) => (a === idx ? a : idx))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 입력: 휠 · 방향키 · 드래그(스와이프)
  useEffect(() => {
    let acc = 0
    let lock = 0
    const onWheel = (e: WheelEvent) => {
      if (modalOpen.current) return
      const t = e.target as HTMLElement
      if (t.closest('.body')) return
      acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      const now = performance.now()
      if (Math.abs(acc) > 30 && now > lock) {
        step(acc > 0 ? 1 : -1)
        acc = 0
        lock = now + 160
      }
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
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('folio:modal', onModal)
    }
  }, [step])

  // 화면이 낮으면 가운데 카드를 줄여서 룰렛 위에 들어가게 한다
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fit = () => {
      const el = root.current
      const panel = el?.querySelector<HTMLElement>('.pos-center .panel')
      if (!el || !panel) return
      const show = Math.min(300, Math.max(190, window.innerHeight * 0.3))
      const low = window.innerHeight < 760
      const room = window.innerHeight - show - 96 - (low ? 40 : 110)
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
      <div className="tilt tilt--top" aria-hidden="true" />
      <div className="tilt tilt--bottom" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="banner">
        <p className="banner__title">오창민</p>
        <p className="banner__sub">FRONTEND DEVELOPER · WEB 3D</p>
      </header>
      <a className="docbtn" href={PROFILE.quick} target="_blank" rel="noopener" onClick={modalClick()}>
        <Icon name="description" />
        문서로 보기
      </a>

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
              <div className={`panel ${center ? 'panel--main' : 'panel--side'}`}>
                {center ? (
                  <CardBody item={item} />
                ) : (
                  <div className="mini">
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </div>
                )}
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
          {ITEMS.map((it, n) => (
            <span key={it.id} className="seg" style={{ transform: `rotate(${n * STEP}deg) translateY(calc(var(--R) * -0.455))` }}>
              <Icon name={it.icon} />
            </span>
          ))}
        </div>
        <div className="walkers-wrap">
          <Suspense fallback={null}>
            <Characters />
          </Suspense>
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
