import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { SECTION_COUNT, sectionBlend, weightOf } from './timeline'
import { CONSTELLATIONS, DESK, DETECTIONS, wydLayout } from './layouts'
import { facadeParams, sceneState } from '../store'

/* 장면별 카메라 위치·시점과 배경색 */
const SHOTS: { pos: [number, number, number]; look: [number, number, number]; bg: string }[] = [
  { pos: [0.01, 10.6, 1.2], look: [0, 0, 0.3], bg: '#F3F5F4' }, // 0 도면: 위에서 내려다본 평면
  { pos: [8.8, 6.9, 10.0], look: [0, 1.2, 0.5], bg: '#F3F5F4' }, // 1 모형: 주변 맥락까지 보이게 조금 물러난 시점
  { pos: [3.4, 2.87, 9.54], look: [0.86, 2.45, 0], bg: '#EEF1F0' }, // 2 파사드: 비스듬한 시점 — 접히는 면의 깊이가 보이게
  { pos: [6.4, 5.4, 6.4], look: [0, -0.2, 0], bg: '#CFE8F5' }, // 3 DocQ: 하늘색 배경의 섬
  { pos: [0.5, 6.4, 5.2], look: [0, 0, 0], bg: '#07080D' }, // 4 WYD: 밤하늘
  { pos: [6.2, 6.0, 6.8], look: [0, 2.6, 0], bg: '#18191C' }, // 5 Jabis: 대시보드 톤
  { pos: [5.2, 4.2, 6.0], look: [0, 0.9, 0], bg: '#F3F5F4' }, // 6 연락처: 다시 작은 모형
]

export function CameraRig() {
  const scroll = useScroll()
  const { camera, size, scene } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  const goalPos = useMemo(() => new THREE.Vector3(), [])
  const goalLook = useMemo(() => new THREE.Vector3(), [])
  const bgA = useMemo(() => new THREE.Color(), [])
  const bgB = useMemo(() => new THREE.Color(), [])
  const bg = useMemo(() => new THREE.Color('#F3F5F4'), [])
  const side = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const { a, b, t } = sectionBlend(scroll.offset, SECTION_COUNT)
    const A = SHOTS[a]
    const B = SHOTS[b]
    goalPos.set(...A.pos).lerp(side.set(...B.pos), t)
    goalLook.set(...A.look).lerp(side.set(...B.look), t)

    // 데스크톱에선 글이 왼쪽에 있으니 피사체를 오른쪽으로 민다(카메라 기준 좌측으로 이동)
    const wide = size.width > 860
    if (wide) {
      const right = side.set(0, 0, 0).subVectors(goalLook, goalPos).cross(camera.up).normalize()
      const shift = -1.6
      goalPos.addScaledVector(right, shift)
      goalLook.addScaledVector(right, shift)
    }
    // 모바일에선 글 상자가 아래쪽에 있으니 피사체를 위로 올리고 조금 멀리서 본다
    if (!wide) {
      side.subVectors(goalPos, goalLook).multiplyScalar(0.85)
      goalPos.add(side)
      goalPos.y -= 1.4
      goalLook.y -= 1.4
    }
    // 마우스 패럴랙스 — 아주 조금만
    // 첫 화면(도면)은 정지된 그림처럼 — 커서 패럴랙스는 도면에서 벗어날수록 서서히 켜진다
    const still = weightOf(0, scroll.offset, SECTION_COUNT)
    goalPos.x += state.pointer.x * 0.6 * (1 - still)
    goalPos.y += state.pointer.y * 0.35 * (1 - still)

    const k = Math.min(1, dt * 4)
    camera.position.lerp(goalPos, k)
    look.lerp(goalLook, k)
    camera.lookAt(look)

    bgA.set(A.bg)
    bgB.set(B.bg)
    bg.copy(bgA).lerp(bgB, t)
    scene.background = bg
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(bg)
  })
  return null
}

/* 조명 + 그림자 바닥. 어두운 장면에선 바닥 그림자를 지운다 */
export function Lights() {
  const scroll = useScroll()
  const shadow = useRef<THREE.ShadowMaterial>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  useFrame(() => {
    const dark = weightOf(4, scroll.offset, SECTION_COUNT) + weightOf(5, scroll.offset, SECTION_COUNT) * 0.6
    if (shadow.current) shadow.current.opacity = 0.16 * (1 - Math.min(1, weightOf(2, scroll.offset, SECTION_COUNT) + weightOf(3, scroll.offset, SECTION_COUNT) + weightOf(4, scroll.offset, SECTION_COUNT)))
    if (amb.current) amb.current.intensity = 1.25 - dark * 0.55
  })
  return (
    <>
      <ambientLight ref={amb} intensity={1.25} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-5, 4, -6]} intensity={0.5} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial ref={shadow} transparent opacity={0.16} />
      </mesh>
    </>
  )
}

/* WYD — 별자리 선 */
export function Constellations() {
  const scroll = useScroll()
  const group = useRef<THREE.Group>(null)
  const lines = useMemo(() => {
    const L = wydLayout()
    return CONSTELLATIONS.map((idx) => idx.map((i) => new THREE.Vector3(L.pos[i * 3], L.pos[i * 3 + 1], L.pos[i * 3 + 2])))
  }, [])
  useFrame(() => {
    const w = weightOf(4, scroll.offset, SECTION_COUNT)
    const g = group.current
    if (!g) return
    g.visible = w > 0.02
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material & { opacity?: number }
      if (m && 'opacity' in m) m.opacity = Math.max(0, (w - 0.4) / 0.6) * 0.55
    })
  })
  return (
    <group ref={group}>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#BFD4FF" lineWidth={1} transparent opacity={0} dashed={false} />
      ))}
    </group>
  )
}

/* ─────────── Jabis — 양팔 로봇과 인식 박스 ─────────── */
const ARM_BLACK = '#1E2023'
const ARM_ACCENT = '#6E5BD6'

function Arm({ side }: { side: 1 | -1 }) {
  const j1 = useRef<THREE.Group>(null)
  const j2 = useRef<THREE.Group>(null)
  const j3 = useRef<THREE.Group>(null)
  const j4 = useRef<THREE.Group>(null)
  const smooth = useRef([0, 0, 0, 0])
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.7 + (side > 0 ? 0 : 1.7)
    // 목표 각도(20Hz 데이터처럼 계단식으로 바뀐다고 가정) → 매 프레임 lerp로 부드럽게
    const step = Math.floor(t * 20) / 20
    const target = [
      Math.sin(step * 0.6) * 0.5 * side,
      -0.5 + Math.sin(step) * 0.35,
      1.1 + Math.sin(step * 1.3) * 0.4,
      0.4 + Math.sin(step * 1.7) * 0.4,
    ]
    const s = smooth.current
    for (let i = 0; i < 4; i++) s[i] += (target[i] - s[i]) * 0.2
    if (j1.current) j1.current.rotation.y = s[0]
    if (j2.current) j2.current.rotation.z = s[1] * side
    if (j3.current) j3.current.rotation.z = s[2] * side
    if (j4.current) j4.current.rotation.z = s[3] * side
  })
  return (
    <group position={[side * -2.05, DESK.h, -0.2]} rotation-y={side > 0 ? 0 : Math.PI}>
      <mesh castShadow position-y={0.08}>
        <cylinderGeometry args={[0.16, 0.2, 0.16, 20]} />
        <meshStandardMaterial color={ARM_BLACK} roughness={0.6} />
      </mesh>
      <group ref={j1} position-y={0.16}>
        <mesh castShadow position-y={0.12}>
          <boxGeometry args={[0.2, 0.24, 0.2]} />
          <meshStandardMaterial color={ARM_BLACK} roughness={0.6} />
        </mesh>
        <group ref={j2} position-y={0.24}>
          <mesh castShadow position={[0.5, 0, 0]}>
            <boxGeometry args={[1.0, 0.13, 0.13]} />
            <meshStandardMaterial color={ARM_BLACK} roughness={0.6} />
          </mesh>
          <group ref={j3} position={[1.0, 0, 0]}>
            <mesh castShadow position={[0.4, 0, 0]}>
              <boxGeometry args={[0.8, 0.11, 0.11]} />
              <meshStandardMaterial color={ARM_BLACK} roughness={0.6} />
            </mesh>
            <group ref={j4} position={[0.8, 0, 0]}>
              <mesh castShadow position={[0.14, 0, 0]}>
                <boxGeometry args={[0.28, 0.16, 0.16]} />
                <meshStandardMaterial color={ARM_ACCENT} roughness={0.5} />
              </mesh>
              <mesh castShadow position={[0.34, 0.05, 0]}>
                <boxGeometry args={[0.16, 0.04, 0.12]} />
                <meshStandardMaterial color={ARM_ACCENT} roughness={0.5} />
              </mesh>
              <mesh castShadow position={[0.34, -0.05, 0]}>
                <boxGeometry args={[0.16, 0.04, 0.12]} />
                <meshStandardMaterial color={ARM_ACCENT} roughness={0.5} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function Detection({ p, s }: { p: readonly [number, number, number]; s: readonly [number, number, number] }) {
  const ref = useRef<THREE.LineSegments>(null)
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), [])
  useFrame((state) => {
    // 인식 결과가 조금씩 흔들리는 느낌 — 실제 대시보드처럼 lerp로 따라간다
    const r = ref.current
    if (!r) return
    const n = Math.sin(state.clock.elapsedTime * 3 + p[0] * 5) * 0.02
    r.position.x += (p[0] + n - r.position.x) * 0.15
  })
  return (
    <lineSegments ref={ref} geometry={geo} position={[p[0], p[1], p[2]]} scale={[s[0], s[1], s[2]]}>
      <lineBasicMaterial color="#22D3EE" transparent opacity={0.9} />
    </lineSegments>
  )
}

export function JabisRig() {
  const scroll = useScroll()
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    const w = weightOf(5, scroll.offset, SECTION_COUNT)
    const grp = g.current
    if (!grp) return
    grp.visible = w > 0.02
    const k = Math.max(0, (w - 0.35) / 0.65)
    const e = k * k * (3 - 2 * k)
    grp.scale.setScalar(Math.max(0.001, e))
    grp.position.y = (1 - e) * DESK.h * 0.35
  })
  return (
    <group ref={g} visible={false}>
      <Arm side={1} />
      <Arm side={-1} />
      {DETECTIONS.map((d) => (
        <Detection key={d.label} p={d.p} s={d.s} />
      ))}
    </group>
  )
}


/**
 * 커서를 따라 장면 전체가 살짝 기울어지는 그룹.
 * 파사드(02)에서는 커서가 끌개 역할을 하므로 기울기를 끄고, 은하(WYD)에서는 천천히 스스로 돈다.
 */
export function Tilt({ children }: { children: React.ReactNode }) {
  const scroll = useScroll()
  const g = useRef<THREE.Group>(null)
  const spin = useRef(0)
  useFrame((state, dt) => {
    const grp = g.current
    if (!grp) return
    // 도면(첫 화면)과 파사드에서는 커서 기울기를 끈다 — 도면은 정지된 그림, 파사드는 커서가 끌개라서
    const calm = (1 - sceneState.facadeWeight) * (1 - weightOf(0, scroll.offset, SECTION_COUNT))
    const wyd = weightOf(4, scroll.offset, SECTION_COUNT)
    spin.current += Math.min(dt, 0.05) * 0.06 * wyd
    const ty = state.pointer.x * 0.22 * calm + spin.current
    const tx = -state.pointer.y * 0.07 * calm
    const k = Math.min(1, dt * 3)
    grp.rotation.y += (ty - grp.rotation.y) * k
    grp.rotation.x += (tx - grp.rotation.x) * k
  })
  return <group ref={g}>{children}</group>
}

/**
 * 02 스크린 — 커서를 올려 두는 동안 끌개 위치에 은은한 파란 조명.
 * 커서가 2.5초 이상 멈추거나 화면 밖으로 나가면 서서히 꺼진다.
 */
export function FacadeLight() {
  const light = useRef<THREE.PointLight>(null)
  useFrame((_, dt) => {
    const l = light.current
    if (!l) return
    const hovering = performance.now() - facadeParams.lastMove < 2500
    const target = sceneState.facadeWeight * (hovering ? 4.5 : 0)
    l.intensity += (target - l.intensity) * Math.min(1, dt * 3)
    l.visible = l.intensity > 0.02
    l.position.set(sceneState.attractor.x, sceneState.attractor.y, 0.9)
  })
  return <pointLight ref={light} color="#9DB6FF" distance={2.6} decay={1.4} intensity={0} />
}
