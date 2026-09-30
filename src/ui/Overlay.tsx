import { useEffect, useRef, useState } from 'react'
import { modalClick } from './Modal'
import { stampSvg } from './stamp'
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

function ProjectCard({ p, dark }: { p: Project; dark?: boolean }) {
  // 좁은 화면에서는 제목·상·버튼만 보이게 접어 두고, 누르면 펼친다 (넓은 화면에선 항상 펼침)
  const [open, setOpen] = useState(false)
  return (
    <article className={`card ${dark ? 'card--dark' : ''} ${open ? 'is-open' : ''}`} aria-labelledby={`${p.id}-t`}>
      <div className="card__block">
        <span><i>SHEET</i>{p.no} / 03</span>
        <span><i>PERIOD</i>{p.period}</span>
        <span><i>TEAM</i>{p.team}</span>
        <span><i>ROLE</i>{p.role}</span>
      </div>
      <span className="stamp-wrap" aria-hidden="true" dangerouslySetInnerHTML={{ __html: stampSvg(p.stamp, `st-${p.id}`) }} />
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
        <button type="button" className="chip card__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? '접기 ▴' : '펼치기 ▾'}
        </button>
        <a
          className="chip chip--solid"
          href={p.detail}
          target="_blank"
          rel="noopener"
          onClick={modalClick(p.id)}
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
            <span className="name-box">{PROFILE.name}</span>입니다.
          </h1>
          <p className="lede">모형을 만지던 손으로, 지금은 웹에서 3D를 만지고 있습니다.</p>
          <div className="hero__cta">
            <a className="chip" href={PROFILE.quick} target="_blank" rel="noopener" onClick={modalClick()}>
              포트폴리오 전체 보기 →
            </a>
            <p className="cue">아래로 스크롤해 보세요 ↓</p>
          </div>
        </div>
      </section>

      {/* 1. 모형 */}
      <section className="sec">
        <div className="txt">
          <p className="eyebrow">01 · Architecture</p>
          <h2>처음엔 모형을 만들었습니다</h2>
          <p>
            건축학을 전공했고, 4학년 때 건축사사무소 인턴으로 모형 제작과 3D 모델링, 건축물 일러스트를 맡았습니다.
          </p>
          <p className="note">이 모형은 큐브 {MODEL_CUBES}개를 쌓아 만들었습니다.</p>
        </div>
      </section>

      {/* 2. 파사드 */}
      <section className="sec">
        <div className="txt">
          <p className="eyebrow">02 · Code</p>
          <h2>지금은 코드로 만듭니다</h2>
          <p>
            아부다비 알 바르 타워의 차양을 참고해 three.js로 만든 스크린입니다.
          </p>
          <p className="note">커서를 가까이 대 보세요.</p>
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
          <div className="contact__head">
            <div>
              <p className="eyebrow">06 · Contact</p>
              <h2>오창민</h2>
            </div>
            <img className="contact__photo" src="./assets/portrait.jpg" alt="오창민 프로필 사진" width="600" height="750" loading="lazy" decoding="async" />
          </div>
          <ul className="facts">
            <li><i>EDUCATION</i>SSAFY 14기 수료 · 계명대학교 건축학 학사</li>
            <li><i>EXPERIENCE</i>건축사사무소 인턴 (학부 4학년) — 모형 제작, 3D 모델링</li>
            <li><i>NOW</i>LG전자 K-뉴딜 아카데미 1기 AX 워크플로우 트랙</li>
            <li><i>AWARDS</i>SSAFY 공통 최우수상 · 특화 우수상 · 자율 우수상</li>
          </ul>
          <div className="links links--contact">
            <a className="chip chip--solid chip--wide" href={PROFILE.quick} target="_blank" rel="noopener" onClick={modalClick()}>
              포트폴리오 전체 보기 →
            </a>
            <Copy text={PROFILE.email} />
            <a className="chip" href={PROFILE.github} target="_blank" rel="noopener">
              GitHub ↗
            </a>
            <a className="chip" href="./portfolio.pdf" target="_blank" rel="noopener">
              PDF ↓
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
