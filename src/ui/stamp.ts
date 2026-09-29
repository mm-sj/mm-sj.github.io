/**
 * 수상 도장 — 건축 도면의 승인 도장처럼 카드·시트 오른쪽 위에 찍는다.
 * 인터랙티브 페이지(React), 문서형 페이지(quick/), PDF(print.html)가 같은 SVG를 쓴다.
 */
export type StampInfo = { rank: string; track: string }

export function stampSvg({ rank, track }: StampInfo, uid: string): string {
  const top = rank === '최우수상'
  const ring = 'SSAFY 14TH · AWARD · 2026 · '
  return `<svg class="stamp-award${top ? ' is-top' : ''}" viewBox="0 0 120 120" role="img" aria-label="${track} ${rank}">
  <defs>
    <path id="${uid}-p" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"/>
    <filter id="${uid}-ink" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${uid.length * 7}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.5" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in" result="t"/>
      <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="1" seed="3" result="w"/>
      <feDisplacementMap in="t" in2="w" scale="1.1"/>
    </filter>
  </defs>
  <g filter="url(#${uid}-ink)" fill="currentColor" stroke="currentColor">
    <circle cx="60" cy="60" r="56" fill="none" stroke-width="3.2"/>
    <circle cx="60" cy="60" r="37" fill="none" stroke-width="1.2"/>
    <text font-size="8.6" stroke="none" font-family="'IBM Plex Mono', ui-monospace, monospace" font-weight="500">
      <textPath href="#${uid}-p" startOffset="0" textLength="280" lengthAdjust="spacing">${ring}${ring}</textPath>
    </text>
    <text x="60" y="51" text-anchor="middle" font-size="8.5" stroke="none" font-family="'IBM Plex Sans KR', 'Pretendard', sans-serif" font-weight="600">${track}</text>
    <text x="60" y="${top ? 70 : 71}" text-anchor="middle" font-size="${top ? 16.5 : 19}" stroke="none" font-family="'Hahmlet', serif" font-weight="700">${rank}</text>
    <text x="60" y="84" text-anchor="middle" font-size="7" stroke="none">${top ? '★ ★ ★' : '★ ★'}</text>
  </g>
</svg>`
}
