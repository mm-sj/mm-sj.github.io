import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { SECTION_COUNT } from './timeline'
import { facadeSlot } from './layouts'

/**
 * 대상지 주변 맥락 — 00 도면과 01 모형이 같은 조각을 공유한다.
 *
 *  00 도면 : 0.6 모듈 바닥 타일만 얇은 판(모눈)으로 깔린다. 건물과 나무는 아직 보이지 않는다.
 *  01 모형 : 바닥 타일이 두께를 얻어 대지판이 되고, 필지 위로 0.3 모듈 큐브가 한 층씩 쌓이며,
 *            나무가 솟아오른다. (가운데 건물과 같은 0.3 모듈)
 *  02 전환 : 대지가 바깥쪽부터 아래로 꺼지며 사라진다. (예전엔 모듈이 파사드로 날아가 합류했는데, 화면이 너무 꽉 찼다)
 */

const MOD = 0.3 // 건물 모듈 (가운데 모형과 동일)
const TILE = 0.6 // 바닥 모듈
const GROUND_T = 0.18 // 모형 상태의 대지판 두께
const EXTENT = { x0: -7.2, x1: 7.2, z0: -5.4, z1: 7.2 }
const SITE = { x0: -2.1, x1: 2.1, z0: -1.8, z1: 2.7 }
const ROAD_Z = 3.6 // 동서 도로 중심
const ROAD_X = -3.9 // 남북 도로 중심
const ROAD_W = 1.2

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
const onRoad = (x: number, z: number, pad = 0) =>
  Math.abs(z - ROAD_Z) < ROAD_W / 2 + pad || Math.abs(x - ROAD_X) < ROAD_W / 2 + pad
const inSite = (x: number, z: number, pad = 0) =>
  x > SITE.x0 - pad && x < SITE.x1 + pad && z > SITE.z0 - pad && z < SITE.z1 + pad
const insideOval = (x: number, z: number) => (x / 7.4) ** 2 + ((z - 0.9) / 6.6) ** 2 < 1

type Tile = { x: number; z: number; road: boolean; delay: number }
type Vox = { x: number; z: number; level: number; levels: number; delay: number; c: string }
type Tree = { x: number; z: number; r: number; delay: number }

function build() {
  const rnd = rng(23)
  const tiles: Tile[] = []
  for (let x = EXTENT.x0 + TILE / 2; x < EXTENT.x1; x += TILE)
    for (let z = EXTENT.z0 + TILE / 2; z < EXTENT.z1; z += TILE) {
      if (!insideOval(x, z)) continue
      tiles.push({ x, z, road: onRoad(x, z), delay: Math.hypot(x, z - 0.9) / 7.4 })
    }

  // 필지: 0.3 모듈에 맞춘 사각형, 2~4 모듈 × 2~4 모듈, 1~5층
  const vox: Vox[] = []
  const taken: { x0: number; x1: number; z0: number; z1: number }[] = []
  const lots: { x: number; z: number; w: number; d: number; h: number }[] = [] // 다 쌓인 뒤 보여줄 한 덩어리 버전
  const WHITES = [PAPER]
  for (let n = 0; n < 900 && vox.length < 1500; n++) {
    const cw = 2 + Math.floor(rnd() * 3)
    const cd = 2 + Math.floor(rnd() * 3)
    const x0 = Math.round((EXTENT.x0 + rnd() * (EXTENT.x1 - EXTENT.x0)) / MOD) * MOD
    const z0 = Math.round((EXTENT.z0 + rnd() * (EXTENT.z1 - EXTENT.z0)) / MOD) * MOD
    const x1 = x0 + cw * MOD
    const z1 = z0 + cd * MOD
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    if (!insideOval(x0, z0) || !insideOval(x1, z1) || !insideOval(x0, z1) || !insideOval(x1, z0)) continue
    // 도로·대상지와 겹치거나 다른 필지와 붙으면 건너뛴다 (0.3 여유)
    const hitsRoad = [x0, x1].some((x) => [z0, z1].some((z) => onRoad(x, z, 0.15))) || onRoad(cx, cz, 0.15)
    if (hitsRoad || inSite(cx, cz, 0.3) || [x0, x1].some((x) => [z0, z1].some((z) => inSite(x, z, 0.15)))) continue
    if (taken.some((t) => x0 < t.x1 + 0.3 && x1 > t.x0 - 0.3 && z0 < t.z1 + 0.3 && z1 > t.z0 - 0.3)) continue
    taken.push({ x0, x1, z0, z1 })
    lots.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, h: 0 })
    const r = Math.hypot(cx, cz - 0.9)
    const levels = 1 + Math.floor(rnd() * (r < 4 ? 5 : 3)) // 가운데 모형보다 낮게
    const c = WHITES[Math.floor(rnd() * WHITES.length)]
    lots[lots.length - 1].h = levels * MOD
    for (let ix = 0; ix < cw; ix++)
      for (let iz = 0; iz < cd; iz++)
        for (let l = 0; l < levels; l++)
          vox.push({ x: x0 + (ix + 0.5) * MOD, z: z0 + (iz + 0.5) * MOD, level: l, levels, delay: r / 7.4, c })
  }

  // 나무: 도로를 따라 가로수 + 대상지 앞마당
  const trees: Tree[] = []
  for (let x = EXTENT.x0 + 0.4; x < EXTENT.x1; x += 0.6)
    for (const s of [-1, 1]) {
      const z = ROAD_Z + s * (ROAD_W / 2 + 0.2)
      if (Math.abs(x - ROAD_X) < 0.9 || !insideOval(x, z)) continue
      trees.push({ x, z, r: 0.16 + rnd() * 0.05, delay: Math.hypot(x, z - 0.9) / 7.4 })
    }
  for (let z = EXTENT.z0 + 0.4; z < EXTENT.z1; z += 0.6)
    for (const s of [-1, 1]) {
      const x = ROAD_X + s * (ROAD_W / 2 + 0.2)
      if (Math.abs(z - ROAD_Z) < 0.9 || !insideOval(x, z)) continue
      trees.push({ x, z, r: 0.16 + rnd() * 0.05, delay: Math.hypot(x, z - 0.9) / 7.4 })
    }
  for (let k = 0; k < 6; k++) trees.push({ x: -1.35 + k * 0.54, z: 2.4, r: 0.14, delay: 0.12 })
  return { tiles, vox, trees, lots }
}

/**
 * 윗면이 배경색(#F3F5F4)과 거의 같게 보이도록 맞춘 반사율.
 * 이 요소들만 톤매핑을 꺼서, 윗면은 배경에 녹아들고 옆면·그림자로만 형태가 드러난다.
 */
const PAPER = '#EDEFEE'

const dummy = new THREE.Object3D()

type Slot = ReturnType<typeof facadeSlot>
/** 패널 자리를 고르게 흩어 배정 (큰 소수로 섞기) */
const slotFor = (i: number, salt: number) => facadeSlot(i * 7919 + salt * 104729)

/**
 * 01 → 02: 모듈이 사라지지 않고 파사드 패널 자리로 날아가 합류한다.
 * f(0~1) 동안 위로 떠오르는 궤적을 그리며 이동하고, 패널 크기·각도로 바뀐 뒤 도착 직전에 패널 속으로 스며든다.
 */
function fly(
  sx: number, sy: number, sz: number, // 출발 위치
  w: number, h: number, d: number, // 출발 크기
  slot: Slot, f: number,
) {
  const lift = Math.sin(f * Math.PI) * 1.4
  dummy.position.set(sx + (slot.x - sx) * f, sy + (slot.y - sy) * f + lift, sz + (slot.z - sz) * f)
  const merge = 1 - ss((f - 0.8) / 0.2) // 도착 직전 패널과 겹치며 스며든다
  dummy.scale.set(
    (w + (slot.sx - w) * f) * merge + 1e-4,
    (h + (slot.sy - h) * f) * merge + 1e-4,
    (d + (0.03 - d) * f) * merge + 1e-4,
  )
  dummy.rotation.set(0, slot.yaw * f, 0)
}
/**
 * 01 → 02: 대지(바닥·주변 건물·나무)가 아래로 꺼지며 사라진다.
 * 이미 dummy에 놓인 위치·크기를 기준으로 f(0~1)만큼 가라앉히고 작게 만든다.
 */
function sink(f: number) {
  if (f <= 0) return
  const k = f * f
  dummy.position.y -= k * 2.6
  const sc = 1 - ss((f - 0.35) / 0.65)
  dummy.scale.multiplyScalar(sc + 1e-4)
}
const col = new THREE.Color()
function ss(x: number) {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

export function ModelContext() {
  const scroll = useScroll()
  const tileRef = useRef<THREE.InstancedMesh>(null)
  const voxRef = useRef<THREE.InstancedMesh>(null)
  const crownRef = useRef<THREE.InstancedMesh>(null)
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const { tiles, vox, trees, lots } = useMemo(build, [])
  const solidRef = useRef<THREE.Group>(null)
  const slots = useMemo(
    () => ({
      tiles: tiles.map((_, i) => slotFor(i, 1)),
      vox: vox.map((_, i) => slotFor(i, 2)),
      trees: trees.map((_, i) => slotFor(i, 3)),
    }),
    [tiles, vox, trees],
  )
  const last = useRef({ e: -1, x: -1 })

  // 색은 한 번만 칠해 둔다
  useLayoutEffect(() => {
    tiles.forEach((_, i) => tileRef.current?.setColorAt(i, col.set(PAPER)))
    vox.forEach((v, i) => voxRef.current?.setColorAt(i, col.set(v.c)))
    for (const m of [tileRef.current, voxRef.current]) if (m?.instanceColor) m.instanceColor.needsUpdate = true
  }, [tiles, vox])

  /** e: 도면→모형 진행도(0~1), x: 모형→다음 장면으로 빠지는 진행도(0~1) */
  const apply = (e: number, x: number) => {
    const T = tileRef.current
    const V = voxRef.current
    const C = crownRef.current
    const K = trunkRef.current
    if (!T || !V || !C || !K) return
    const vis = x < 0.999
    for (const m of [T, V, C, K]) m.visible = vis
    if (!vis) return

    tiles.forEach((t, i) => {
      const ei = ss(e * 1.6 - t.delay * 0.6)
      const xi = ss(x * 1.7 - (1 - t.delay) * 0.7) // 바깥쪽부터 꺼진다
      // 도면에서는 보이지 않다가, 솟아나며 두께 0.18의 대지판이 된다 (도로는 살짝 낮게)
      const thick = (t.road ? GROUND_T * 0.7 : GROUND_T) * ei
      const top = -0.001 - (t.road ? GROUND_T * 0.3 * ei : 0)
      const on = ei > 0 ? 1 : 0
      fly(t.x, top - thick / 2, t.z, TILE * 0.96 * on, thick, TILE * 0.96 * on, slots.tiles[i], 0)
      sink(xi)
      dummy.updateMatrix()
      T.setMatrixAt(i, dummy.matrix)
    })

    vox.forEach((v, i) => {
      const ei = ss(e * 1.5 - v.delay * 0.5)
      const xi = ss(x * 1.7 - (1 - v.delay) * 0.7)
      // 층이 아래부터 차례로 쌓인다. 솟아나기 전에는 완전히 숨긴다 (가로세로도 0)
      const grow = Math.min(1, Math.max(0, ei * v.levels - v.level))
      const h = MOD * 1.004 * grow // 층 사이도 빈틈없이(살짝 겹치게) — 주변 건물은 줄눈 없는 흰 덩어리
      const on = grow > 0 ? 1 : 0
      fly(v.x, v.level * MOD + h / 2, v.z, MOD * 1.004 * on, h, MOD * 1.004 * on, slots.vox[i], 0)
      sink(xi)
      dummy.updateMatrix()
      V.setMatrixAt(i, dummy.matrix)
    })

    trees.forEach((t, i) => {
      const ei = ss(e * 1.6 - t.delay * 0.6)
      const xi = ss(x * 1.7 - (1 - t.delay) * 0.7)
      // 솟아나기 전에는 보이지 않고, 자라면서 줄기와 수관이 함께 커진다. 빠질 땐 대지와 함께 꺼진다
      const r = t.r * ei
      const hgt = 0.32 * ei
      fly(t.x, hgt, t.z, r, r, r, slots.trees[i], 0)
      sink(xi)
      dummy.updateMatrix()
      C.setMatrixAt(i, dummy.matrix)
      dummy.position.set(t.x, hgt / 2, t.z)
      dummy.scale.set(0.025 * ei + 1e-4, hgt + 1e-4, 0.025 * ei + 1e-4)
      dummy.rotation.set(0, 0, 0)
      sink(xi)
      dummy.updateMatrix()
      K.setMatrixAt(i, dummy.matrix)
    })
    for (const m of [T, V, C, K]) m.instanceMatrix.needsUpdate = true
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => apply(0, 0), [])

  useFrame(() => {
    // 0~1 구간: 도면 → 모형, 1~2 구간: 모형 → 파사드로 합류, 그 뒤로는 숨김
    const s = scroll.offset * (SECTION_COUNT - 1)
    const hold = (f: number) => ss((f - 0.25) / 0.5) // timeline.ts와 같은 정지 구간
    const e = s <= 1 ? hold(s) : 1
    const x = s <= 1 ? 0 : s <= 2 ? hold(s - 1) : 1
    if (Math.abs(e - last.current.e) < 1e-4 && Math.abs(x - last.current.x) < 1e-4) return
    last.current = { e, x }
    apply(e, x)
    // 다 쌓이고 아직 빠지기 전(01 정지 구간)에는 큐브 대신 필지별 한 덩어리를 보여준다 — 이음매 없이
    const settled = e === 1 && x === 0
    if (voxRef.current) voxRef.current.visible = !settled && x < 0.999
    if (solidRef.current) solidRef.current.visible = settled
  })

  return (
    <group>
      <instancedMesh ref={tileRef} args={[undefined, undefined, tiles.length]} receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.95} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={voxRef} args={[undefined, undefined, vox.length]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.85} toneMapped={false} />
      </instancedMesh>
      <group ref={solidRef} visible={false}>
        {lots.map((l, i) => (
          <mesh key={i} position={[l.x, l.h / 2, l.z]} scale={[l.w, l.h, l.d]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={PAPER} roughness={0.85} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <instancedMesh ref={crownRef} args={[undefined, undefined, trees.length]} castShadow frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={PAPER} roughness={0.9} flatShading toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={PAPER} roughness={0.9} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
