/*
 * 카드 뒤에 깔리는 옅은 선 도면. 1600×800 좌표, 가운데 카드가 (800, 400)에 온다.
 * 가운데는 카드에 가려지니 그림은 바깥 둘레(옆 아크릴 판 뒤, 카드 위쪽 띠)에 몰아 둔다.
 * 글씨는 카드에 이미 있는 말이나 도면 기호(축 번호·치수)만 쓴다.
 */
import type { ReactNode } from 'react'

const W = 1600
const H = 800

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const T = (p: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number; accent?: boolean }) => (
  <text
    x={p.x}
    y={p.y}
    textAnchor={p.anchor ?? 'middle'}
    fontSize={p.size ?? 12}
    className={`bd__t ${p.accent ? 'bd__accent-fill' : ''}`}
    stroke="none"
  >
    {p.children}
  </text>
)

/** 치수선: 양 끝 사선 눈금 + 가운데 숫자 */
function DimH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x1 - 10} y1={y} x2={x2 + 10} y2={y} />
      <line x1={x1 - 5} y1={y + 5} x2={x1 + 5} y2={y - 5} />
      <line x1={x2 - 5} y1={y + 5} x2={x2 + 5} y2={y - 5} />
      <line x1={x1} y1={y - 12} x2={x1} y2={y + 18} strokeDasharray="2 3" />
      <line x1={x2} y1={y - 12} x2={x2} y2={y + 18} strokeDasharray="2 3" />
      <T x={(x1 + x2) / 2} y={y - 7} size={11}>{label}</T>
    </g>
  )
}
function DimV({ y1, y2, x, label }: { y1: number; y2: number; x: number; label: string }) {
  return (
    <g>
      <line x1={x} y1={y1 - 10} x2={x} y2={y2 + 10} />
      <line x1={x - 5} y1={y1 + 5} x2={x + 5} y2={y1 - 5} />
      <line x1={x - 5} y1={y2 + 5} x2={x + 5} y2={y2 - 5} />
      <text x={x - 8} y={(y1 + y2) / 2} fontSize={11} className="bd__t" stroke="none" textAnchor="middle" transform={`rotate(-90 ${x - 8} ${(y1 + y2) / 2})`}>
        {label}
      </text>
    </g>
  )
}

/* ── 소개: 건축 도면(왼쪽)에서 화면 설계(오른쪽)로 ── */
function Plan() {
  return (
    <Svg>
      {/* 왼쪽: 평면도 */}
      {[90, 410].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={176} x2={x} y2={690} strokeDasharray="14 4 2 4" opacity={0.6} />
          <circle cx={x} cy={160} r={14} />
          <T x={x} y={164} size={11}>{i + 1}</T>
        </g>
      ))}
      <DimH x1={90} x2={410} y={212} label="6,400" />
      <rect x={90} y={250} width={320} height={400} fill="var(--bd-bg)" />
      <rect x={98} y={258} width={304} height={384} />
      {/* 칸막이벽과 문 */}
      <path d="M98 440 H230 M300 440 H402 M98 448 H230 M300 448 H402" />
      <path d="M230 444 A70 70 0 0 1 300 374" strokeDasharray="3 3" />
      <line x1={230} y1={444} x2={230} y2={374} />
      <path d="M250 258 V330 M258 258 V330 M250 400 V440 M258 400 V440" />
      {/* 창 */}
      <path d="M150 250 H220 M150 254 H220 M150 258 H220" strokeWidth={1.4} />
      <path d="M402 500 V590 M406 500 V590 M410 500 V590" strokeWidth={1.4} />
      {/* 계단 */}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={300} y1={470 + i * 20} x2={380} y2={470 + i * 20} />
      ))}
      <path d="M300 470 V610 M380 470 V610 M340 604 V480 M333 492 L340 480 L347 492" />
      {/* 가구 */}
      <rect x={120} y={280} width={100} height={60} rx={2} opacity={0.7} />
      <circle cx={170} cy={540} r={34} opacity={0.7} />
      <path d="M124 540 h-12 M216 540 h12 M170 494 v-12 M170 586 v12" opacity={0.7} />
      <DimV y1={250} y2={650} x={60} label="8,000" />
      <T x={250} y={682} size={12}>건축</T>

      {/* 오른쪽: 화면 와이어프레임 */}
      <DimH x1={1170} x2={1530} y={160} label="1,440" />
      <rect x={1170} y={196} width={360} height={270} rx={8} fill="var(--bd-bg)" />
      <line x1={1170} y1={224} x2={1530} y2={224} />
      <circle cx={1186} cy={210} r={4} />
      <circle cx={1200} cy={210} r={4} />
      <circle cx={1214} cy={210} r={4} />
      <rect x={1240} y={203} width={200} height={14} rx={7} opacity={0.7} />
      {/* 머리말 · 큰 그림 자리 · 카드 둘 · 버튼 */}
      <path d="M1188 244 H1250 M1420 244 H1450 M1466 244 H1512" strokeWidth={1.6} />
      <rect x={1188} y={262} width={180} height={110} rx={4} />
      <path d="M1188 262 L1368 372 M1368 262 L1188 372" opacity={0.6} />
      <path d="M1386 272 H1512 M1386 290 H1490 M1386 308 H1504" opacity={0.7} />
      <rect x={1386} y={340} width={90} height={30} rx={15} className="bd__accent" strokeWidth={1.6} />
      <rect x={1188} y={390} width={156} height={58} rx={4} />
      <rect x={1356} y={390} width={156} height={58} rx={4} />
      <path d="M1200 408 H1290 M1200 426 H1320 M1368 408 H1458 M1368 426 H1488" opacity={0.6} />
      <T x={1350} y={496} size={12}>화면</T>
      {/* 사용자 흐름: 시작 → 판단 → 화면 */}
      <rect x={1170} y={566} width={90} height={44} rx={22} fill="var(--bd-bg)" />
      <path d="M1350 554 L1396 588 L1350 622 L1304 588 Z" fill="var(--bd-bg)" />
      <rect x={1440} y={566} width={90} height={44} rx={6} fill="var(--bd-bg)" />
      <path d="M1260 588 H1298 M1290 582 L1300 588 L1290 594 M1396 588 H1434 M1426 582 L1436 588 L1426 594" />
      <path d="M1350 622 V660 H1485 V616 M1479 626 L1485 614 L1491 626" strokeDasharray="4 4" />
      <T x={1350} y={690} size={12}>흐름</T>
    </Svg>
  )
}

/* ── 데이터 냉장고: 문 열린 냉장고에 쌓인 자료(왼쪽) + 카드의 흐름 4단계(오른쪽) ── */
function Flow() {
  const doc = (x: number, y: number, accent = false) => (
    <g className={accent ? 'bd__accent' : ''} strokeWidth={accent ? 1.6 : 1}>
      <path d={`M${x} ${y} h22 l10 10 v38 h-32 Z M${x + 22} ${y} v10 h10`} fill="var(--bd-bg)" />
      <path d={`M${x + 6} ${y + 22} h20 M${x + 6} ${y + 30} h20 M${x + 6} ${y + 38} h12`} opacity={0.7} />
    </g>
  )
  const nodes = [
    { x: 1150, y: 170, t: '이유와 함께 저장' },
    { x: 1370, y: 290, t: 'AI 정리' },
    { x: 1150, y: 420, t: '사람이 확정', key: true },
    { x: 1370, y: 550, t: '필요할 때 꺼내줌' },
  ]
  const nw = 176
  const nh = 50
  const dots = []
  for (let y = 150; y < 700; y += 30) for (let x = 1130; x < 1590; x += 30) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill="currentColor" stroke="none" opacity={0.4} />)
  return (
    <Svg>
      {/* 냉장고 몸통 */}
      <path d="M150 190 L190 168 H370 V640 L330 662" />
      <rect x={150} y={190} width={180} height={472} rx={4} fill="var(--bd-bg)" />
      <path d="M330 190 L370 168 M330 662 L370 640" />
      <rect x={162} y={202} width={156} height={448} rx={2} />
      {/* 열린 문 */}
      <path d="M150 190 L74 226 V700 L150 662" fill="var(--bd-bg)" />
      <path d="M86 300 L138 276 M86 420 L138 396 M86 540 L138 516" opacity={0.8} />
      <path d="M86 300 v26 L138 302 M86 420 v26 L138 422 M86 540 v26 L138 542" opacity={0.6} />
      {/* 선반과 자료 */}
      <path d="M162 310 H318 M162 420 H318 M162 530 H318" />
      {doc(176, 258)}
      {doc(214, 258)}
      {doc(270, 258)}
      {doc(184, 368)}
      <rect x={236} y={378} width={66} height={40} rx={3} />
      <path d="M236 392 H302" opacity={0.7} />
      {doc(176, 478)}
      {doc(214, 478)}
      {doc(252, 478)}
      <rect x={176} y={566} width={128} height={70} rx={3} />
      <path d="M176 590 H304 M226 578 H254" opacity={0.7} />
      {/* 꺼내진 자료 한 장 */}
      <path d="M290 344 C 350 300, 380 270, 410 236 M398 238 L412 234 L410 248" strokeDasharray="5 5" className="bd__accent" />
      {doc(404, 170, true)}

      {/* 오른쪽: 흐름 4단계 */}
      <g>{dots}</g>
      {nodes.slice(0, -1).map((n, i) => {
        const m = nodes[i + 1]
        const x1 = n.x + nw / 2
        const y1 = n.y + nh
        const x2 = m.x + nw / 2
        const y2 = m.y
        return (
          <g key={i}>
            <path d={`M${x1} ${y1} C${x1} ${y1 + 50} ${x2} ${y2 - 50} ${x2} ${y2}`} />
            <circle cx={x1} cy={y1} r={4} fill="var(--bd-bg)" />
            <circle cx={x2} cy={y2} r={4} fill="var(--bd-bg)" />
          </g>
        )
      })}
      {nodes.map((n, i) => (
        <g key={n.t}>
          <rect x={n.x} y={n.y} width={nw} height={nh} rx={9} fill="var(--bd-bg)" className={n.key ? 'bd__accent' : ''} strokeWidth={n.key ? 1.6 : 1} />
          <circle cx={n.x + 24} cy={n.y + nh / 2} r={10} className={n.key ? 'bd__accent' : ''} />
          <T x={n.x + 24} y={n.y + nh / 2 + 4} size={10.5} accent={n.key}>{i + 1}</T>
          <T x={n.x + 44} y={n.y + nh / 2 + 4.5} anchor="start" size={12.5} accent={n.key}>
            {n.t}
          </T>
        </g>
      ))}
    </Svg>
  )
}

/* ── DocQ: PDF 한 장이 퀴즈 카드가 되고, 네 명이 보드게임 판 위에서 푼다 ── */
function Quiz() {
  // 등각(아이소) 보드 칸: 5×5 테두리를 한 바퀴 도는 길
  const ox = 1350
  const oy = 190
  const tiles: [number, number][] = []
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (i === 0 || j === 0 || i === 4 || j === 4) tiles.push([i, j])
  const pos = (i: number, j: number) => [ox + (i - j) * 40, oy + (i + j) * 20]
  const pawn = (i: number, j: number, accent = false) => {
    const [x, y] = pos(i, j)
    return (
      <g className={accent ? 'bd__accent' : ''} strokeWidth={1.4}>
        <path d={`M${x - 9} ${y} L${x - 4} ${y - 24} H${x + 4} L${x + 9} ${y} Z`} fill="var(--bd-bg)" />
        <ellipse cx={x} cy={y} rx={9} ry={4} fill="var(--bd-bg)" />
        <circle cx={x} cy={y - 30} r={7} fill="var(--bd-bg)" />
      </g>
    )
  }
  const card = (x: number, y: number, r: number, right: number) => (
    <g transform={`rotate(${r} ${x + 70} ${y + 95})`}>
      <rect x={x} y={y} width={140} height={190} rx={8} fill="var(--bd-bg)" />
      <text x={x + 16} y={y + 40} fontSize={26} className="bd__t" stroke="none" fontWeight={600}>
        Q
      </text>
      <line x1={x + 44} y1={y + 26} x2={x + 122} y2={y + 26} opacity={0.6} />
      <line x1={x + 44} y1={y + 38} x2={x + 100} y2={y + 38} opacity={0.6} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k} className={k === right ? 'bd__accent' : ''} strokeWidth={k === right ? 1.6 : 1}>
          <rect x={x + 14} y={y + 62 + k * 30} width={112} height={22} rx={5} />
          <circle cx={x + 26} cy={y + 73 + k * 30} r={4} />
        </g>
      ))}
    </g>
  )
  return (
    <Svg>
      {/* 왼쪽: PDF → 퀴즈 카드 */}
      <path d="M70 160 H200 L236 196 V380 H70 Z M200 160 V196 H236" fill="var(--bd-bg)" />
      <T x={86} y={196} anchor="start" size={15}>PDF</T>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <line key={k} x1={90} y1={228 + k * 24} x2={[210, 190, 214, 160, 206, 150][k]} y2={228 + k * 24} opacity={0.6} />
      ))}
      <path d="M150 396 C150 470 190 500 236 512 M224 502 L238 512 L226 524" strokeDasharray="5 5" />
      {card(230, 470, -10, -1)}
      {card(300, 452, 4, 1)}
      {/* 오른쪽: 보드게임 판과 말 네 개 */}
      {tiles.map(([i, j]) => {
        const [x, y] = pos(i, j)
        return (
          <g key={`${i}-${j}`}>
            <path d={`M${x} ${y - 19} L${x + 38} ${y} L${x} ${y + 19} L${x - 38} ${y} Z`} fill="var(--bd-bg)" />
            <path d={`M${x - 38} ${y} v7 L${x} ${y + 26} L${x + 38} ${y + 7} v-7`} opacity={0.7} />
          </g>
        )
      })}
      {pawn(0, 0)}
      {pawn(4, 1)}
      {pawn(2, 4, true)}
      {pawn(0, 3)}
      {/* 네 명의 순위 막대 */}
      {[0, 1, 2, 3].map((k) => (
        <g key={k} className={k === 0 ? 'bd__accent' : ''}>
          <circle cx={1216} cy={560 + k * 34} r={9} />
          <rect x={1238} y={552 + k * 34} width={[250, 200, 150, 110][k]} height={16} rx={8} />
        </g>
      ))}
    </Svg>
  )
}

/* ── Would You Draw: 손으로 그린 감정이 별이 되고, 별자리가 되고, 은하로 쌓인다 ── */
function Cosmos() {
  const spark = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`
  // 흩어진 잔별 (고정된 의사 난수)
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const dust = Array.from({ length: 150 }, (_, i) => <circle key={i} cx={20 + rnd() * 1560} cy={110 + rnd() * 640} r={0.6 + rnd() * 1.2} fill="currentColor" stroke="none" opacity={0.25 + rnd() * 0.45} />)
  // 은하: 두 갈래 나선 팔
  const gx = 1350
  const gy = 300
  const arms = []
  for (let arm = 0; arm < 2; arm++)
    for (let k = 0; k < 46; k++) {
      const th = k * 0.15 + arm * Math.PI
      const r = 10 + k * 3.5
      const x = gx + Math.cos(th) * r
      const y = gy + Math.sin(th) * r * 0.52
      arms.push(<circle key={`${arm}-${k}`} cx={x} cy={y} r={Math.max(1.4, 3.4 - k * 0.035)} fill="currentColor" stroke="none" opacity={0.95 - k * 0.006} />)
    }
  const con: [number, number][] = [
    [80, 600],
    [150, 520],
    [240, 560],
    [310, 480],
    [400, 520],
    [430, 620],
    [330, 660],
  ]
  return (
    <Svg>
      <g>{dust}</g>
      {/* 1. 손으로 그린 선 → 별 */}
      <g strokeWidth={1.8} transform="translate(40 0)">
        <path d="M70 250 C 60 190, 130 170, 150 220 C 170 170, 240 190, 226 250 C 214 300, 160 320, 148 340 C 132 316, 84 300, 70 250" />
      </g>
      <path d="M250 240 C 290 220, 310 214, 336 212 M324 204 L338 212 L326 222" strokeDasharray="5 5" />
      <path d={spark(390, 208, 30)} className="bd__accent" strokeWidth={1.6} />
      <T x={390} y={262} size={12}>별</T>
      {/* 2. 별자리 */}
      <path d={`M${con.map((c) => c.join(' ')).join(' L')}`} opacity={0.75} />
      <path d={`M${con[2].join(' ')} L${con[6].join(' ')}`} opacity={0.75} />
      {con.map(([x, y], i) => (i % 3 === 0 ? <path key={i} d={spark(x, y, 11)} fill="var(--bd-bg)" /> : <circle key={i} cx={x} cy={y} r={4} fill="var(--bd-bg)" />))}
      <T x={250} y={700} size={12}>별자리</T>
      {/* 3. 은하 */}
      <g>{arms}</g>
      <ellipse cx={gx} cy={gy} rx={196} ry={102} strokeDasharray="2 7" opacity={0.7} />
      <path d={spark(gx, gy, 16)} fill="var(--bd-bg)" />
      <T x={gx} y={150} size={12}>은하</T>
      {/* 오른쪽 아래: 작은 별자리 하나 더 */}
      <path d="M1200 560 L1280 520 L1360 580 L1450 540 L1520 610 M1360 580 L1340 660" opacity={0.75} />
      {[
        [1200, 560],
        [1280, 520],
        [1360, 580],
        [1450, 540],
        [1520, 610],
        [1340, 660],
      ].map(([x, y], i) => (i === 2 ? <path key={i} d={spark(x, y, 12)} fill="var(--bd-bg)" /> : <circle key={i} cx={x} cy={y} r={3.5} fill="var(--bd-bg)" />))}
    </Svg>
  )
}

/* ── Jabis: 책상 위 양팔 로봇(등각 선화) + 상태를 보여주는 대시보드 패널 ── */
function Robot() {
  const joint = (x: number, y: number, r = 7) => <circle cx={x} cy={y} r={r} fill="var(--bd-bg)" />
  const arm = (pts: [number, number][], grip: number) => {
    const [wx, wy] = pts[pts.length - 1]
    return (
      <g>
        <path d={`M${pts.map((q) => q.join(' ')).join(' L')}`} strokeWidth={7} opacity={0.35} />
        <path d={`M${pts.map((q) => q.join(' ')).join(' L')}`} strokeWidth={1.4} />
        {pts.map(([x, y], i) => (
          <g key={i}>{joint(x, y, i === 0 ? 9 : 7)}</g>
        ))}
        <path d={`M${wx - 9} ${wy + 8} v16 M${wx + 9} ${wy + 8} v16 M${wx - 9} ${wy + 8} H${wx + 9}`} transform={`rotate(${grip} ${wx} ${wy})`} strokeWidth={1.6} />
      </g>
    )
  }
  return (
    <Svg>
      {/* 책상 (등각) */}
      <path d="M60 470 L280 360 L470 455 L250 565 Z" fill="var(--bd-bg)" />
      <path d="M60 470 v12 L250 577 L470 467 v-12" opacity={0.8} />
      <path d="M72 488 V610 M250 577 V700 M458 473 V595" />
      <path d="M72 610 L250 700 L458 595" strokeDasharray="3 5" opacity={0.6} />
      {/* 몸통과 머리(카메라) */}
      <path d="M252 420 V300 H288 V420" fill="var(--bd-bg)" />
      <ellipse cx={270} cy={420} rx={26} ry={12} fill="var(--bd-bg)" />
      <rect x={244} y={252} width={52} height={36} rx={8} fill="var(--bd-bg)" />
      <circle cx={260} cy={270} r={6} />
      <circle cx={280} cy={270} r={6} />
      <path d="M222 306 H318" strokeWidth={1.6} />
      {/* 양팔 */}
      {arm(
        [
          [222, 306],
          [150, 340],
          [140, 420],
        ],
        8,
      )}
      {arm(
        [
          [318, 306],
          [392, 330],
          [384, 410],
        ],
        -6,
      )}
      {/* 책상 위 물체와 인식 박스 */}
      <path d="M368 470 l26 -13 l26 13 l-26 13 Z M368 470 v22 l26 13 l26 -13 v-22 M394 483 v22" />
      <g className="bd__accent" strokeWidth={1.8}>
        <path d="M352 458 V444 H366 M422 444 H436 V458 M436 506 V520 H422 M366 520 H352 V506" />
      </g>
      {/* 오른쪽: 대시보드 패널 */}
      <rect x={1160} y={170} width={380} height={200} rx={8} fill="var(--bd-bg)" />
      <line x1={1160} y1={200} x2={1540} y2={200} />
      <circle cx={1178} cy={185} r={4} />
      <circle cx={1194} cy={185} r={4} />
      <path d="M1180 330 L1220 300 L1260 316 L1300 262 L1340 284 L1380 240 L1420 270 L1460 232 L1520 250" strokeWidth={1.6} />
      <path d="M1180 346 H1520 M1180 230 V346" opacity={0.6} />
      {[0, 1, 2].map((k) => {
        const cx = 1220 + k * 130
        const a = [-2.3, -1.4, -0.7][k]
        return (
          <g key={k}>
            <path d={`M${cx - 44} 480 A44 44 0 0 1 ${cx + 44} 480`} />
            <line x1={cx} y1={480} x2={cx + Math.cos(a) * 34} y2={480 + Math.sin(a) * 34} strokeWidth={1.6} />
            <circle cx={cx} cy={480} r={4} fill="var(--bd-bg)" />
          </g>
        )
      })}
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <circle cx={1176} cy={550 + k * 34} r={6} className={k === 1 ? 'bd__accent' : ''} fill={k === 1 ? 'currentColor' : 'none'} />
          <rect x={1196} y={543 + k * 34} width={[240, 300, 200, 260][k]} height={14} rx={7} />
        </g>
      ))}
    </Svg>
  )
}

export const BACKDROPS: Record<string, () => ReactNode> = {
  about: Plan,
  fridge: Flow,
  docq: Quiz,
  wyd: Cosmos,
  jabis: Robot,
}
