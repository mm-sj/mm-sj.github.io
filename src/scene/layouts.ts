import * as THREE from 'three'

/**
 * 모든 장면은 같은 N개의 큐브(InstancedMesh)로 그린다.
 * 장면마다 "각 큐브가 있어야 할 위치·크기·회전·색"을 레이아웃으로 정의하고,
 * 스크롤 위치에 따라 두 레이아웃 사이를 보간(lerp)해서 형태가 이어지듯 바뀌게 만든다.
 */
export const N = 800

export type Layout = {
  pos: Float32Array // x,y,z
  scl: Float32Array // sx,sy,sz  (0이면 숨김)
  rot: Float32Array // rx,ry,rz
  col: Float32Array // r,g,b (linear)
}

export function emptyLayout(): Layout {
  return {
    pos: new Float32Array(N * 3),
    scl: new Float32Array(N * 3),
    rot: new Float32Array(N * 3),
    col: new Float32Array(N * 3).fill(1),
  }
}

const tmpColor = new THREE.Color()

/** 레이아웃을 앞에서부터 채우는 작은 빌더. 남는 인스턴스는 scale 0(숨김)으로 둔다. */
class Builder {
  L = emptyLayout()
  i = 0
  push(
    p: [number, number, number],
    s: [number, number, number],
    c: string,
    r: [number, number, number] = [0, 0, 0],
  ) {
    if (this.i >= N) return
    const k = this.i * 3
    this.L.pos.set(p, k)
    this.L.scl.set(s, k)
    this.L.rot.set(r, k)
    tmpColor.set(c)
    this.L.col.set([tmpColor.r, tmpColor.g, tmpColor.b], k)
    this.i++
  }
  /** 숨겨진 인스턴스를 hideAt 근처에 모아둔다 — 다음 장면으로 날아갈 때 자연스럽게 보이도록 */
  done(hideAt: [number, number, number] = [0, 0, 0]) {
    for (let j = this.i; j < N; j++) {
      const k = j * 3
      this.L.pos.set(hideAt, k)
      this.L.scl.set([0, 0, 0], k)
    }
    return this.L
  }
}

// 결정적 난수 — 새로고침해도 같은 배치가 나오도록
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* ───────────────────── 0. 도면 (평면도) ───────────────────── */
// 절단 높이(바닥 위 1.2m)에서 자른 1층 평면도. 선은 막대 큐브를 빈틈없이 이어 붙여 표현한다.

/* 도면 선 굵기(선 위계): 절단된 외벽 > 내벽 > 창 > 가는 선 */
const LW = { cut: 0.075, wall: 0.04, glass: 0.018, thin: 0.012, hair: 0.008 }
const INK = '#16191C'
const INK2 = '#3A4048'
const GLASS = '#8C96A0'
const DIM = '#6B737C'
const AXIS = '#9AA9D8' // 통심선은 연하게 — 도면의 주인공은 벽이다

/**
 * a→b 선을 막대 큐브로 채운다. 조각끼리 딱 붙어 끊김 없는 선이 된다.
 * dash: [그리는 길이, 비우는 길이] — 점선(통심·숨은선)용
 */
function line(
  b: Builder, ax: number, az: number, bx: number, bz: number,
  w: number, c: string, piece = 0.14, dash?: [number, number], h = 0.012,
) {
  const len = Math.hypot(bx - ax, bz - az)
  if (len < 1e-4) return
  const ang = Math.atan2(bz - az, bx - ax)
  const put = (t0: number, t1: number) => {
    const n = Math.max(1, Math.round(((t1 - t0) * len) / piece))
    for (let i = 0; i < n; i++) {
      const u0 = t0 + ((t1 - t0) * i) / n
      const u1 = t0 + ((t1 - t0) * (i + 1)) / n
      const t = (u0 + u1) / 2
      // 모서리가 비지 않도록 선 두께만큼 살짝 겹친다
      b.push([ax + (bx - ax) * t, 0.006 + h / 2, az + (bz - az) * t], [(u1 - u0) * len + w * 0.5, h, w], c, [0, -ang, 0])
    }
  }
  if (!dash) return put(0, 1)
  const period = dash[0] + dash[1]
  for (let d = 0; d < len; d += period) put(d / len, Math.min(len, d + dash[0]) / len)
}
/** 벽: 구간 목록 [[x0,z0,x1,z1], ...] 을 같은 굵기로 */
const walls = (b: Builder, segs: number[][], w: number, c = INK) => segs.forEach(([a, bz, x, z]) => line(b, a, bz, x, z, w, c, 0.14, undefined, 0.02))
/** 원호 (문 열림 궤적, 통심 기호) */
function arc(b: Builder, cx: number, cz: number, r: number, a0: number, a1: number, w: number, c: string, n: number) {
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n
    const t1 = a0 + ((a1 - a0) * (i + 1)) / n
    line(b, cx + Math.cos(t0) * r, cz + Math.sin(t0) * r, cx + Math.cos(t1) * r, cz + Math.sin(t1) * r, w, c, 1)
  }
}
/** 여닫이문: 경첩(hx,hz), 문짝 방향 각도 a, 열림 방향 sweep(+/-90°) */
function door(b: Builder, hx: number, hz: number, r: number, a: number, sweep: number) {
  line(b, hx, hz, hx + Math.cos(a + sweep) * r, hz + Math.sin(a + sweep) * r, LW.thin, INK2, 1)
  arc(b, hx, hz, r, a, a + sweep, LW.hair, INK2, 6)
}

// 모형(1번)과 같은 footprint — 도면의 선이 그대로 모형의 매스가 된다
const FOOTPRINTS = {
  podium: { x0: -1.5, x1: 1.5, z0: -1.05, z1: 1.05 },
  tower: { x0: -1.35, x1: -0.15, z0: -0.9, z1: 0.3 },
  slab: { x0: 0.3, x1: 1.5, z0: -0.6, z1: 0.6 },
  annex: { x0: -0.9, x1: 0.9, z0: 1.05, z1: 1.95 },
}
const GX = [-1.5, -0.75, 0, 0.75, 1.5] // 통심 X1~X5
const GZ = [-1.05, 0, 1.05, 1.95] // 통심 Y1~Y4

export function planLayout(): Layout {
  const b = new Builder()
  const P = FOOTPRINTS.podium
  const A = FOOTPRINTS.annex

  // ── 외벽 (절단선, 가장 굵게) — 창과 출입구 자리는 비워 둔다
  walls(b, [
    // 북측: 창 3개 사이의 벽
    [P.x0, P.z0, -1.2, P.z0], [-0.85, P.z0, -0.4, P.z0], [-0.05, P.z0, 0.3, P.z0], [1.2, P.z0, P.x1, P.z0],
    // 동측
    [P.x1, P.z0, P.x1, -0.55], [P.x1, 0.35, P.x1, P.z1],
    // 서측
    [P.x0, P.z0, P.x0, -0.35], [P.x0, 0.55, P.x0, P.z1],
    // 남측 (별동과 만나는 부분 제외)
    [P.x0, P.z1, A.x0, P.z1], [A.x1, P.z1, P.x1, P.z1],
    // 별동
    [A.x0, A.z0, A.x0, A.z1], [A.x1, A.z0, A.x1, A.z1],
    [A.x0, A.z1, -0.3, A.z1], [0.3, A.z1, A.x1, A.z1],
  ], LW.cut)

  // ── 창 — 벽 두께 안에 벽면선 2줄 + 유리선 1줄, 양끝 문설주. (빈 구멍처럼 보이지 않게)
  const T = LW.cut / 2
  const winX = (x0: number, x1: number, z: number) => {
    line(b, x0, z - T, x1, z - T, LW.thin, INK2, 0.2)
    line(b, x0, z + T, x1, z + T, LW.thin, INK2, 0.2)
    line(b, x0, z, x1, z, LW.hair, GLASS, 0.2)
    line(b, x0, z - T, x0, z + T, LW.thin, INK, 1)
    line(b, x1, z - T, x1, z + T, LW.thin, INK, 1)
  }
  const winZ = (z0: number, z1: number, x: number) => {
    line(b, x - T, z0, x - T, z1, LW.thin, INK2, 0.2)
    line(b, x + T, z0, x + T, z1, LW.thin, INK2, 0.2)
    line(b, x, z0, x, z1, LW.hair, GLASS, 0.2)
    line(b, x - T, z0, x + T, z0, LW.thin, INK, 1)
    line(b, x - T, z1, x + T, z1, LW.thin, INK, 1)
  }
  for (const [x0, x1] of [[-1.2, -0.85], [-0.4, -0.05], [0.3, 1.2]] as const) winX(x0, x1, P.z0)
  winZ(-0.55, 0.35, P.x1)
  winZ(-0.35, 0.55, P.x0)

  // ── 내벽
  walls(b, [
    [-0.15, P.z0, -0.15, -0.55], [-0.15, -0.2, -0.15, 0.3], // 서측 실 경계 (문 자리 비움)
    [P.x0, 0.3, -0.75, 0.3], [-0.45, 0.3, -0.15, 0.3],
    [0.3, P.z0, 0.3, -0.45], [0.3, -0.45, 0.45, -0.45], [0.75, -0.45, 0.95, -0.45], [1.15, -0.45, 1.2, -0.45], // 코어 (계단·승강기 출입 자리 비움)
    [0.9, P.z0, 0.9, -0.45], [1.2, P.z0, 1.2, -0.45],
    [0.75, 0.45, P.x1, 0.45], [0.75, 0.45, 0.75, 0.75], // 동측 실
  ], LW.wall, INK2)

  // ── 문
  door(b, -0.15, -0.55, 0.3, Math.PI / 2, -Math.PI / 2)
  door(b, -0.75, 0.3, 0.28, 0, Math.PI / 2)
  door(b, 0.75, 0.75, 0.27, Math.PI / 2, Math.PI / 2)
  door(b, -0.3, A.z1, 0.28, 0, -Math.PI / 2) // 주출입구 양여닫이
  door(b, 0.3, A.z1, 0.28, Math.PI, Math.PI / 2)

  // ── 계단 (코어 안 챌면)
  for (let k = 0; k < 9; k++) {
    const x = 0.34 + k * 0.061
    line(b, x, P.z0 + 0.04, x, -0.49, LW.hair, INK2, 1)
  }
  line(b, 0.34, -0.75, 0.86, -0.75, LW.hair, INK2, 1) // 계단 중간 난간
  line(b, 0.4, -0.62, 0.8, -0.62, LW.hair, AXIS, 1) // 오름 방향 화살표
  line(b, 0.8, -0.62, 0.74, -0.58, LW.hair, AXIS, 1)
  line(b, 0.8, -0.62, 0.74, -0.66, LW.hair, AXIS, 1)
  // ── 엘리베이터 (X 표시)
  line(b, 0.93, P.z0 + 0.03, 1.17, -0.48, LW.hair, INK2, 1)
  line(b, 1.17, P.z0 + 0.03, 0.93, -0.48, LW.hair, INK2, 1)

  // ── 기둥 (통심 교차점, 채운 사각형)
  for (const x of GX)
    for (const z of GZ) {
      const inP = z <= P.z1 + 1e-6
      const inA = z > P.z1 + 1e-6 && x >= A.x0 - 0.2 && x <= A.x1 + 0.2
      if (!inP && !inA) continue
      const cx = inA ? Math.max(A.x0, Math.min(A.x1, x)) : x
      if (inA && Math.abs(cx) < 0.35) continue // 주출입구 자리는 기둥을 비운다
      b.push([cx, 0.016, z], [0.1, 0.02, 0.1], INK)
    }

  // ── 통심선 (일점쇄선 느낌의 점선) + 통심 기호(원)
  // 일점쇄선: 긴 선 - 짧은 점을 반복
  const chain = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az)
    for (let d = 0; d < len; d += 0.3) {
      const t0 = d / len, t1 = Math.min(1, (d + 0.2) / len), t2 = Math.min(1, (d + 0.24) / len), t3 = Math.min(1, (d + 0.26) / len)
      line(b, ax + (bx - ax) * t0, az + (bz - az) * t0, ax + (bx - ax) * t1, az + (bz - az) * t1, LW.hair, AXIS, 0.2)
      if (t2 < 1) line(b, ax + (bx - ax) * t2, az + (bz - az) * t2, ax + (bx - ax) * t3, az + (bz - az) * t3, LW.hair, AXIS, 1)
    }
  }
  for (const x of GX) {
    chain(x, -1.95, x, 2.2)
    arc(b, x, -2.04, 0.08, 0, Math.PI * 2, LW.hair, AXIS, 10)
  }
  for (const z of GZ) {
    chain(-2.4, z, 1.8, z)
    arc(b, -2.49, z, 0.08, 0, Math.PI * 2, LW.hair, AXIS, 10)
  }

  // ── 치수선 (상단·좌측) + 틱
  const dz = -1.6
  line(b, GX[0], dz, GX[GX.length - 1], dz, LW.hair, DIM, 0.3)
  for (const x of GX) line(b, x - 0.04, dz + 0.04, x + 0.04, dz - 0.04, LW.thin, DIM, 1)
  line(b, GX[0], dz - 0.18, GX[GX.length - 1], dz - 0.18, LW.hair, DIM, 0.3) // 전체 치수
  for (const x of [GX[0], GX[GX.length - 1]]) line(b, x - 0.04, dz - 0.14, x + 0.04, dz - 0.22, LW.thin, DIM, 1)
  const dx = -2.05
  line(b, dx, GZ[0], dx, GZ[GZ.length - 1], LW.hair, DIM, 0.3)
  for (const z of GZ) line(b, dx - 0.04, z + 0.04, dx + 0.04, z - 0.04, LW.thin, DIM, 1)

  // ── 방위표 (원 + 북쪽 화살)
  const nx = 2.05, nz = -1.55
  arc(b, nx, nz, 0.16, 0, Math.PI * 2, LW.hair, INK2, 14)
  line(b, nx, nz + 0.16, nx, nz - 0.24, LW.hair, INK2, 1)
  line(b, nx, nz - 0.24, nx - 0.07, nz - 0.08, LW.thin, INK, 1)
  line(b, nx, nz - 0.24, nx + 0.07, nz - 0.08, LW.thin, INK, 1)

  // ── 단면 표시 (A-A')
  for (const x of [-2.3, 2.0]) {
    line(b, x, 0.62, x + 0.25, 0.62, LW.thin, INK, 1)
    line(b, x + 0.125, 0.62, x + 0.125, 0.5, LW.thin, INK, 1)
  }

  return b.done([0, 0, 0])
}

/* ───────────────────── 1. 건축 모형 (매스) ───────────────────── */
// 0.3 모듈 큐브로 쌓은 매스 스터디 모형. 재료로 역할을 구분한다:
//   저층부 = 발사나무, 타워 = 흰 보드, 판상동 = 연회색(유리 느낌), 별동 = 회색 보드
// 큐브를 가로세로 빈틈없이 붙여 매스가 한 덩어리로 읽히게 하고, 층마다 높이를 살짝 줄여 가는 슬래브 줄눈만 남긴다.
//, 저층부 모서리를 파내 필로티를, 타워·판상동 상부는 셋백을 준다.
export function modelLayout(scale = 1, offset: [number, number, number] = [0, 0, 0]): Layout {
  const b = new Builder()
  const M = 0.3
  const V = M * scale
  const BASSWOOD = '#D9C4A0'
  const WHITE = '#F3F3F0'
  const GLASSY = '#D8DDDE'
  const BOARD = '#CDD0CE'
  const GAP_Y = 0.94 // 층 높이 대비 큐브 높이 — 남는 6%가 가는 층 줄눈
  // 가로세로는 딱 맞게(1.0) 붙여 한 덩어리 면으로 읽히게 한다 — 이음매는 층 줄눈만 남는다
  const cell = (cx: number, cz: number, level: number, c: string, sx = 1.004, sz = 1.004) =>
    b.push(
      [offset[0] + (cx + M / 2) * scale, offset[1] + (level * V + (V * GAP_Y) / 2), offset[2] + (cz + M / 2) * scale],
      [V * sx, V * GAP_Y, V * sz],
      c,
    )
  const vox = (
    x0: number, x1: number, z0: number, z1: number, l0: number, l1: number, c: string,
    skip?: (x: number, z: number, l: number) => boolean,
  ) => {
    for (let x = x0; x < x1 - 1e-6; x += M)
      for (let z = z0; z < z1 - 1e-6; z += M)
        for (let l = l0; l < l1; l++) if (!skip?.(x, z, l)) cell(x, z, l, c)
  }
  const f = FOOTPRINTS

  // ── 저층부 (3층): 남서쪽 모서리 1층을 파내 필로티. 파낸 자리엔 가는 기둥만 남긴다
  const piloti = (x: number, z: number, l: number) => l === 0 && x < -0.3 && z > 0.1
  vox(f.podium.x0, f.podium.x1, f.podium.z0, f.podium.z1, 0, 3, BASSWOOD, piloti)
  for (const x of [-1.5, -0.9]) for (const z of [0.15, 0.75]) cell(x, z, 0, BASSWOOD, 0.32, 0.32)

  // ── 별동 (2층): 가운데 1층을 비워 주출입구
  vox(f.annex.x0, f.annex.x1, f.annex.z0, f.annex.z1, 0, 2, BOARD, (x, z, l) => l === 0 && Math.abs(x + 0.15) < 0.2 && z > 1.3)

  // ── 타워 (4층~): 12층까지 4×4, 그 위 두 층은 3×3, 꼭대기는 2×2로 셋백
  vox(f.tower.x0, f.tower.x1, f.tower.z0, f.tower.z1, 3, 11, WHITE)
  vox(f.tower.x0, f.tower.x1 - M, f.tower.z0, f.tower.z1 - M, 11, 13, WHITE)
  vox(f.tower.x0, f.tower.x1 - 2 * M, f.tower.z0, f.tower.z1 - 2 * M, 13, 14, WHITE)

  // ── 판상동 (4층~): 연회색 유리 매스, 맨 위 한 층은 북쪽으로 물러난다
  vox(f.slab.x0, f.slab.x1, f.slab.z0, f.slab.z1, 3, 8, GLASSY)
  vox(f.slab.x0, f.slab.x1, f.slab.z0, f.slab.z1 - M, 8, 9, GLASSY)

  return b.done([offset[0], offset[1], offset[2]])
}
/**
 * 01 장면에서 멈춰 있을 때 보여줄 '한 덩어리' 버전.
 * 큐브 인스턴스는 경계마다 음영 이음매가 생겨 모듈이 쪼개져 보이므로, 같은 칸들을 층별·재료별로
 * 가장 큰 직사각형으로 합쳐(greedy meshing) 박스 몇 십 개로 다시 만든다. 모양은 큐브 버전과 똑같다.
 */
export type SolidBox = { x: number; y: number; z: number; w: number; h: number; d: number; color: string }
export function modelSolids(): SolidBox[] {
  const L = modelLayout()
  const M = 0.3
  // 칸 중심을 반 모듈(0.15) 단위 정수로 기록 — 타워처럼 0.15만큼 어긋난 격자도 섞여 있어서
  const HM = M / 2
  const cells = new Map<string, { hx: number; hz: number; lv: number; c: string }>()
  const extra: SolidBox[] = []
  const c3 = new THREE.Color()
  for (let i = 0; i < N; i++) {
    const j = i * 3
    const sx = L.scl[j]
    if (sx <= 0) continue
    const color = '#' + c3.setRGB(L.col[j], L.col[j + 1], L.col[j + 2]).getHexString()
    if (sx < M * 0.9) {
      // 필로티 기둥처럼 가는 부재는 그대로
      extra.push({ x: L.pos[j], y: L.pos[j + 1], z: L.pos[j + 2], w: sx, h: L.scl[j + 1], d: L.scl[j + 2], color })
      continue
    }
    const hx = Math.round(L.pos[j] / HM)
    const hz = Math.round(L.pos[j + 2] / HM)
    const lv = Math.floor(L.pos[j + 1] / M + 1e-6)
    cells.set(`${hx},${hz},${lv}`, { hx, hz, lv, c: color })
  }
  const H = L.scl[1] // 층 줄눈을 뺀 큐브 높이
  const used = new Set<string>()
  const out: SolidBox[] = [...extra]
  const has = (hx: number, hz: number, lv: number, c: string) => {
    const k = `${hx},${hz},${lv}`
    return !used.has(k) && cells.get(k)?.c === c
  }
  // 왼쪽·앞쪽 끝 칸부터 시작해야 직사각형이 깔끔하게 나온다
  const order = [...cells.values()].sort((p, q) => p.lv - q.lv || p.hz - q.hz || p.hx - q.hx)
  for (const { hx, hz, lv, c } of order) {
    if (used.has(`${hx},${hz},${lv}`)) continue
    // x 방향으로 최대한 늘리고, 그 폭 그대로 z 방향으로 늘린다 (이웃 칸은 반 모듈 2칸 옆)
    let w = 1
    while (has(hx + 2 * w, hz, lv, c)) w++
    let d = 1
    grow: for (;;) {
      for (let k = 0; k < w; k++) if (!has(hx + 2 * k, hz + 2 * d, lv, c)) break grow
      d++
    }
    for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) used.add(`${hx + 2 * a},${hz + 2 * b},${lv}`)
    out.push({ x: (hx + (w - 1)) * HM, y: lv * M + H / 2, z: (hz + (d - 1)) * HM, w: w * M * 1.004, h: H, d: d * M * 1.004, color: c })
  }
  return out
}

export const MODEL_CUBES = (() => {
  const L = modelLayout()
  let n = 0
  for (let i = 0; i < N; i++) if (L.scl[i * 3] > 0) n++
  return n
})()

/* ───────────────────── 2. 파라메트릭 파사드 ───────────────────── */
// 아부다비 알 바르 타워의 마쉬라비야에서 착안한 스크린.
// 정삼각형 모듈을 삼각 격자로 깔고, 모듈마다 무게중심(액추에이터)에서 세 꼭짓점으로 나눈 면 3장이 있다.
// 각 면은 모듈의 바깥 모서리가 경첩: 닫히면 낮은 삼각뿔(약 18°), 열리면 우산처럼 접혀 가운데에 삼각 구멍이 뚫린다.
// 전체 윤곽은 위가 둥근 돔 모양이고, 원통형 타워를 감싸듯 평면에서 살짝 휘어 있다.
// 이 레이아웃은 큐브로 만드는 부분(삼각 프레임)만 담당하고, 접히는 면은 Mashrabiya.tsx가 그린다.
const SQ3 = Math.sqrt(3)
export const TRI = { L: 0.56, W: 6.8, base: 0.2, shoulder: 2.9, crown: 1.75, bend: 0.07 }
const TRI_H = (TRI.L * SQ3) / 2

/** 스크린 윤곽: 어깨 높이까지는 직선, 그 위는 가운데가 넓게 부푼 종 모양 돔 (초타원) */
function insideScreen(x: number, y: number) {
  const half = TRI.W / 2
  if (Math.abs(x) > half || y < TRI.base) return false
  const top = TRI.shoulder + TRI.crown * Math.pow(Math.max(0, 1 - Math.abs(x / half) ** 3), 1 / 2)
  return y <= top
}
/** 평면 곡률: 원통을 감싸듯 x에 따라 뒤로 휜다 */
export function screenCurve(x: number) {
  return { z: -x * x * TRI.bend, yaw: Math.atan(2 * x * TRI.bend) }
}

export type Module = { a: [number, number]; b: [number, number]; c: [number, number]; gx: number; gy: number }
/** 정삼각형 모듈 목록 (꼭짓점은 반시계 방향) — 위·아래를 번갈아 향한다 */
export const MODULES: Module[] = (() => {
  const out: Module[] = []
  const { L, W } = TRI
  const cols = Math.ceil(W / L) + 2
  for (let r = 0; r * TRI_H < 6; r++) {
    const y0 = TRI.base + r * TRI_H
    const y1 = y0 + TRI_H
    const shift = (r % 2) * (L / 2)
    for (let c = -cols; c <= cols; c++) {
      const x = c * L + shift
      // 위를 향한 삼각형
      const up: Module = { a: [x - L / 2, y0], b: [x + L / 2, y0], c: [x, y1], gx: x, gy: y0 + TRI_H / 3 }
      // 아래를 향한 삼각형
      const dn: Module = { a: [x + L / 2, y0], b: [x + L, y1], c: [x, y1], gx: x + L / 2, gy: y0 + (2 * TRI_H) / 3 }
      for (const m of [up, dn]) {
        const corners = [m.a, m.b, m.c]
        if (corners.every(([px, py]) => insideScreen(px * 0.999, py - 1e-6)) ) out.push(m)
      }
    }
  }
  return out
})()
export const PETALS = MODULES.length * 3
export const FACADE = { top: TRI.shoulder + TRI.crown, bottom: TRI.base, w: TRI.W }

/** 끌개와의 거리 → 열림 정도 0(닫힘)~1(활짝) */
export function openness(x: number, y: number, ax: number, ay: number, time: number) {
  const d = Math.hypot(x - ax, y - ay)
  let k = 1 - Math.min(1, d / 1.6)
  k = k * k * (3 - 2 * k)
  void time
  return k
}

/** k번째 면의 중심 — 주변 맥락 모듈이 파사드로 날아와 합류할 목표점 */
export function facadeSlot(k: number) {
  const idx = ((k % PETALS) + PETALS) % PETALS
  const m = MODULES[Math.floor(idx / 3)]
  const cs = [m.a, m.b, m.c]
  const p = cs[idx % 3]
  const q = cs[(idx % 3 + 1) % 3]
  const x = (p[0] + q[0] + m.gx) / 3
  const y = (p[1] + q[1] + m.gy) / 3
  const { z, yaw } = screenCurve(x)
  return { x, y, z, yaw, sx: 0.12, sy: 0.12 }
}

const cFrame = new THREE.Color('#E6E8E5')

export function facadeLayout(target: Layout, _ax: number, _ay: number, _time: number) {
  let i = 0
  const put = (x: number, y: number, dz: number, sx: number, sy: number, sz: number, rz: number, col: THREE.Color) => {
    if (i >= N) return
    const j = i * 3
    const { z, yaw } = screenCurve(x)
    target.pos[j] = x
    target.pos[j + 1] = y
    target.pos[j + 2] = z + dz
    target.scl[j] = sx
    target.scl[j + 1] = sy
    target.scl[j + 2] = sz
    target.rot[j] = 0
    target.rot[j + 1] = yaw // Euler XYZ: 면 안에서 rz로 돌린 뒤 곡면을 따라 yaw
    target.rot[j + 2] = rz
    target.col[j] = col.r
    target.col[j + 1] = col.g
    target.col[j + 2] = col.b
    i++
  }
  // ── 삼각 프레임 (공유 모서리는 한 번만)
  const seen = new Set<string>()
  for (const m of MODULES) {
    const cs = [m.a, m.b, m.c]
    for (let e = 0; e < 3; e++) {
      const p = cs[e]
      const q = cs[(e + 1) % 3]
      const mx = (p[0] + q[0]) / 2
      const my = (p[1] + q[1]) / 2
      const key = `${Math.round(mx * 100)},${Math.round(my * 100)}`
      if (seen.has(key)) continue
      seen.add(key)
      put(mx, my, -0.03, TRI.L * 1.02, 0.028, 0.04, Math.atan2(q[1] - p[1], q[0] - p[0]), cFrame)
    }
  }
  for (; i < N; i++) {
    const j = i * 3
    target.pos[j] = 0
    target.pos[j + 1] = 1.8
    target.pos[j + 2] = -0.4
    target.scl[j] = target.scl[j + 1] = target.scl[j + 2] = 0
  }
}

/* ───────────────────── 3. DocQ — 보드게임 섬 ───────────────────── */
/** DocQ 보드 경로(게임 칸) 타일 — 양이 이 위를 깡충깡충 돈다. docqLayout이 채운다 */
export const DOCQ_PATH: { x: number; z: number; top: number }[] = []

export function docqLayout(): Layout {
  const b = new Builder()
  DOCQ_PATH.length = 0
  const rnd = rng(7)
  const S = 0.36
  const G = 13
  const GRASS = ['#8CC152', '#7DB346', '#9ACD5C']
  const PATH = '#F4E2BC'
  const WATER = '#7CC6E6'
  const EARTH = '#8D6E5A'
  const EARTH2 = '#6F5646'
  // 보드 경로(링) — 게임 칸
  const onPath = (gx: number, gz: number) => {
    const d = Math.max(Math.abs(gx - 6), Math.abs(gz - 6))
    return d === 4
  }
  const trees: [number, number, number][] = []
  for (let gx = 0; gx < G; gx++) {
    for (let gz = 0; gz < G; gz++) {
      const dx = gx - 6
      const dz = gz - 6
      const rr = Math.hypot(dx, dz) + (rnd() - 0.5) * 1.3
      if (rr > 6.3) continue
      const x = dx * S
      const z = dz * S
      const terr = rr < 2.2 ? 2 : rr < 4.6 ? 1 : 0
      const water = !onPath(gx, gz) && rr > 5.1 && rnd() < 0.35
      const top = water ? 0.06 : 0.12 + terr * 0.12
      const c = onPath(gx, gz) ? PATH : water ? WATER : GRASS[Math.floor(rnd() * 3)]
      // 윗면 타일
      b.push([x, top / 2, z], [S * 0.96, top, S * 0.96], c)
      if (onPath(gx, gz)) DOCQ_PATH.push({ x, z, top })
      // 섬 아랫부분(흙)
      const depth = 0.25 + (6.3 - rr) * 0.09
      b.push([x, -depth / 2, z], [S * 0.96, depth, S * 0.96], rr < 3.5 ? EARTH2 : EARTH)
      if (!onPath(gx, gz) && !water && terr >= 1 && rnd() < 0.18) trees.push([x, top, z])
    }
  }
  for (const [x, y, z] of trees) {
    b.push([x, y + 0.1, z], [0.07, 0.2, 0.07], '#7A5236')
    b.push([x, y + 0.3, z], [0.22, 0.22, 0.22], '#5FA243', [0, 0.6, 0])
  }
  return b.done([0, -1, 0])
}

/* ───────────────────── 4. Would You Draw — 감정 은하 ───────────────────── */
export const EMOTION = ['#FFD166', '#EF476F', '#06D6A0', '#4CC9F0', '#9B5DE5', '#F15BB5']
function wydBase(): Layout {
  const b = new Builder()
  const rnd = rng(42)
  for (let i = 0; i < N; i++) {
    const arm = i % 3
    const r = Math.pow(rnd(), 0.65) * 4.2 + 0.15
    const th = (arm * Math.PI * 2) / 3 + r * 1.15 + (rnd() - 0.5) * 0.55
    const y = (rnd() - 0.5) * 0.35 * (1 - r / 5)
    const s = rnd() < 0.06 ? 0.11 : 0.028 + rnd() * 0.04
    const c = rnd() < 0.72 ? '#FFFFFF' : EMOTION[Math.floor(rnd() * EMOTION.length)]
    b.push([Math.cos(th) * r, y, Math.sin(th) * r], [s, s, s], c, [Math.PI / 4, rnd() * 3, Math.PI / 4])
  }
  return b.done()
}

/** 은하 — 흰 별과 감정 색 별. 색 별은 GalaxyCore 옆의 ColorStarGlow가 번지는 빛을 더한다 */
export function wydLayout(): Layout {
  return wydBase()
}

/* ───────────────────── 5. Jabis — 책상 디지털 트윈 ───────────────────── */
// 실측 책상 1200 × 600 × 700 mm 를 1:250 스케일(4.8 × 2.4 × 2.8)로
export const DESK = { w: 4.8, d: 2.4, h: 2.8, top: 0.1 }
export function jabisLayout(): Layout {
  const b = new Builder()
  const TOP = '#E6D3B1'
  const DARK = '#26282B'
  const cols = 16
  const rows = 8
  const cw = DESK.w / cols
  const cd = DESK.d / rows
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++)
      b.push([-DESK.w / 2 + (c + 0.5) * cw, DESK.h - DESK.top / 2, -DESK.d / 2 + (r + 0.5) * cd], [cw * 0.99, DESK.top, cd * 0.99], TOP)
  // 다리
  const legH = DESK.h - DESK.top
  for (const [x, z] of [[-2.25, -1.05], [2.25, -1.05], [-2.25, 1.05], [2.25, 1.05]] as const)
    for (let k = 0; k < 7; k++) b.push([x, (k + 0.5) * (legH / 7), z], [0.09, legH / 7, 0.09], DARK)
  // 모니터
  for (let c = 0; c < 10; c++)
    for (let r = 0; r < 5; r++) b.push([-1.1 + (c + 0.5) * 0.22, DESK.h + 0.55 + r * 0.22, -0.95], [0.215, 0.215, 0.04], '#17191B')
  b.push([0, DESK.h + 0.25, -0.95], [0.08, 0.5, 0.06], DARK)
  // 책상 위 물체 — 키보드, 컵, 상자
  for (let c = 0; c < 8; c++) for (let r = 0; r < 2; r++) b.push([-0.7 + c * 0.2, DESK.h + 0.03, 0.2 + r * 0.2], [0.18, 0.04, 0.18], '#3A3D42')
  for (let k = 0; k < 3; k++) b.push([1.0, DESK.h + 0.08 + k * 0.1, 0.35], [0.18, 0.1, 0.18], '#F2F2F2')
  for (let k = 0; k < 2; k++) b.push([-1.35, DESK.h + 0.1 + k * 0.2, 0.5], [0.4, 0.2, 0.3], '#C9A26B')
  return b.done([0, DESK.h, 0])
}

/** 책상 위 인식 대상(3D bbox를 씌울 물체) — 위 레이아웃과 좌표를 맞춘다 */
export const DETECTIONS = [
  { label: 'keyboard', p: [0, DESK.h + 0.05, 0.3] as const, s: [1.75, 0.14, 0.5] as const },
  { label: 'cup', p: [1.0, DESK.h + 0.18, 0.35] as const, s: [0.3, 0.38, 0.3] as const },
  { label: 'box', p: [-1.35, DESK.h + 0.2, 0.5] as const, s: [0.52, 0.46, 0.42] as const },
]

/* ───────────────────── 6. 연락처 — 비우기 ───────────────────── */
/**
 * Jabis 책상을 이루던 큐브들이 바닥으로 떨어지며 작아져 사라진다.
 * 위치는 책상 발치의 바닥(y≈0)으로 조금 퍼지게, 크기는 0 — 보간되는 동안 "무너져 내리는" 궤적이 된다.
 */
export function endLayout(): Layout {
  const src = jabisLayout()
  const out = emptyLayout()
  const rnd = rng(7)
  for (let i = 0; i < N; i++) {
    const j = i * 3
    const spread = 1.25 + rnd() * 0.35
    out.pos[j] = src.pos[j] * spread
    out.pos[j + 1] = 0.02
    out.pos[j + 2] = src.pos[j + 2] * spread
    out.rot[j] = src.rot[j]
    out.rot[j + 1] = src.rot[j + 1] + (rnd() - 0.5) * 1.2
    out.rot[j + 2] = src.rot[j + 2]
    out.scl[j] = out.scl[j + 1] = out.scl[j + 2] = 0
    out.col[j] = src.col[j]
    out.col[j + 1] = src.col[j + 1]
    out.col[j + 2] = src.col[j + 2]
  }
  return out
}
