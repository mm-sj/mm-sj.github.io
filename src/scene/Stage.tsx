import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { SECTION_COUNT, sectionBlend, weightOf } from './timeline'
import { DESK, DETECTIONS, DOCQ_PATH, docqLayout, wydLayout } from './layouts'
import { facadeParams, sceneState } from '../store'

/* 장면별 카메라 위치·시점과 배경색 */
const SHOTS: { pos: [number, number, number]; look: [number, number, number]; bg: string }[] = [
  { pos: [0.01, 10.6, 1.2], look: [0, 0, 0.3], bg: '#F3F5F4' }, // 0 도면: 위에서 내려다본 평면
  { pos: [8.8, 6.9, 10.0], look: [0, 1.2, 0.5], bg: '#F3F5F4' }, // 1 모형: 주변 맥락까지 보이게 조금 물러난 시점
  { pos: [3.4, 2.87, 9.54], look: [0.86, 2.45, 0], bg: '#EEF1F0' }, // 2 파사드: 비스듬한 시점 — 접히는 면의 깊이가 보이게
  { pos: [6.4, 5.4, 6.4], look: [0, -0.2, 0], bg: '#CFE8F5' }, // 3 DocQ: 하늘색 배경의 섬
  { pos: [0.5, 6.4, 5.2], look: [0, 0, 0], bg: '#07080D' }, // 4 WYD: 밤하늘
  { pos: [6.2, 6.0, 6.8], look: [0, 2.6, 0], bg: '#18191C' }, // 5 Jabis: 대시보드 톤
  { pos: [5.2, 4.2, 6.0], look: [0, 0.9, 0], bg: '#F3F5F4' }, // 6 연락처: 큐브가 바닥으로 흩어진 빈 무대
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

/** 터치 기기(휴대폰·태블릿)는 그림자 해상도를 낮춰 GPU 부담을 줄인다 */
const COARSE = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

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
        shadow-mapSize={COARSE ? [1024, 1024] : [2048, 2048]}
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
        <shadowMaterial ref={shadow} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </>
  )
}

/* WYD — 별자리 선 */
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
  const lean = useRef({ x: 0, y: 0 })
  useFrame((state, dt) => {
    const grp = g.current
    if (!grp) return
    // 도면(첫 화면)과 파사드에서는 커서 기울기를 끈다 — 도면은 정지된 그림, 파사드는 커서가 끌개라서
    const calm = (1 - sceneState.facadeWeight) * (1 - weightOf(0, scroll.offset, SECTION_COUNT))
    const wyd = weightOf(4, scroll.offset, SECTION_COUNT)
    // 커서 기울기는 부드럽게 따라가고
    const k = Math.min(1, dt * 3)
    lean.current.y += (state.pointer.x * 0.22 * calm - lean.current.y) * k
    lean.current.x += (-state.pointer.y * 0.07 * calm - lean.current.x) * k
    // 은하 회전은 -π~π 안에서만 누적하고 은하 가중치를 곱한다.
    // 은하를 벗어나면 회전이 0으로 돌아오고, 오래 머물러도 되감기는 반 바퀴를 넘지 않는다.
    // (예전엔 무한히 누적돼서 은하를 지나간 뒤 다른 장면 모델들이 틀어져 있었다)
    spin.current += Math.min(dt, 0.05) * 0.06 * wyd
    if (spin.current > Math.PI) spin.current -= Math.PI * 2
    if (wyd < 0.001) spin.current = 0
    grp.rotation.y = lean.current.y + spin.current * wyd
    grp.rotation.x = lean.current.x
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

/* ─────────── WYD — 은하 중심에서 피어나는 별 ─────────── */
function glowTexture(kind: 'halo' | 'spike') {
  const S = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const g = cv.getContext('2d')!
  if (kind === 'halo') {
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.18, 'rgba(255,255,255,0.55)')
    gr.addColorStop(0.45, 'rgba(255,255,255,0.14)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, S, S)
  } else {
    // 회절 스파이크: 가운데가 밝고 끝으로 갈수록 가늘게 사라지는 십자
    for (const horiz of [true, false]) {
      const gr = horiz ? g.createLinearGradient(0, 0, S, 0) : g.createLinearGradient(0, 0, 0, S)
      gr.addColorStop(0, 'rgba(255,255,255,0)')
      gr.addColorStop(0.5, 'rgba(255,255,255,1)')
      gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr
      if (horiz) g.fillRect(0, S / 2 - 1.5, S, 3)
      else g.fillRect(S / 2 - 1.5, 0, 3, S)
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 중심별 밝기 — 색 별 번짐은 이 값의 85% */
const CORE_BRIGHT = 0.7
const CORE_HALOS = [
  { size: 0.9, color: '#FFF3DC', alpha: 1 * CORE_BRIGHT },
  { size: 2.2, color: '#C9D8FF', alpha: 0.55 * CORE_BRIGHT },
  { size: 5.2, color: '#8A7CFF', alpha: 0.22 * CORE_BRIGHT },
]

export function GalaxyCore() {
  const scroll = useScroll()
  const root = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const halos = useRef<(THREE.Sprite | null)[]>([])
  const spikes = useRef<THREE.Sprite>(null)
  const light = useRef<THREE.PointLight>(null)
  const halo = useMemo(() => glowTexture('halo'), [])
  const spike = useMemo(() => glowTexture('spike'), [])

  useFrame((state) => {
    const r = root.current
    if (!r) return
    const w = weightOf(4, scroll.offset, SECTION_COUNT)
    r.visible = w > 0.01
    if (!r.visible) return
    // 장면에 들어오면서 가운데서 피어난다 (별들이 자리 잡는 동안 조금 늦게)
    const e0 = Math.min(1, Math.max(0, (w - 0.35) / 0.65))
    const e = e0 * e0 * (3 - 2 * e0)
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 1.4) * 0.07 + Math.sin(t * 3.1) * 0.025
    core.current?.scale.setScalar(Math.max(1e-4, e * (1 + (pulse - 1) * 0.5)))
    halos.current.forEach((s, i) => {
      if (!s) return
      const h = CORE_HALOS[i]
      const breathe = 1 + (pulse - 1) * (1 + i * 0.8)
      s.scale.setScalar(Math.max(1e-4, h.size * e * breathe))
      ;(s.material as THREE.SpriteMaterial).opacity = h.alpha * e
    })
    const sp = spikes.current
    if (sp) {
      sp.scale.setScalar(Math.max(1e-4, 1.5 * e * pulse))
      const m = sp.material as THREE.SpriteMaterial
      m.opacity = 0.4 * CORE_BRIGHT * e
      m.rotation = t * 0.05
    }
    if (light.current) light.current.intensity = 6 * CORE_BRIGHT * e * pulse
  })

  return (
    <group ref={root} visible={false}>
      <mesh ref={core}>
        <sphereGeometry args={[0.14, 32, 16]} />
        <meshBasicMaterial color="#FFFBF2" toneMapped={false} />
      </mesh>
      {CORE_HALOS.map((h, i) => (
        <sprite key={i} ref={(s) => { halos.current[i] = s }}>
          <spriteMaterial
            map={halo}
            color={h.color}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
      <sprite ref={spikes}>
        <spriteMaterial map={spike} color="#E8EEFF" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <pointLight ref={light} color="#DCE4FF" intensity={0} distance={3.5} decay={2} />
    </group>
  )
}

/**
 * 스크롤 안정화.
 * drei ScrollControls는 스크롤 비율을 scrollTop / (scrollHeight - 창 높이)로 계산하는데,
 * 창을 최소화하는 등 높이가 0이 되면 0으로 나눠 offset이 NaN이 되고, 그 뒤로는 창을 되살려도
 * NaN에서 벗어나지 못해 스크롤바만 움직이고 화면은 멈춘다.
 * 이벤트에 기대지 않고 매 프레임 scrollTop을 직접 읽어 동기화하고, 값이 깨지면 바로 복구한다.
 */
export function ScrollSync() {
  const s = useScroll() as ReturnType<typeof useScroll> & { scroll: { current: number } }
  const size = useThree((st) => st.size)
  const last = useRef({ w: 0, h: 0 })
  useFrame(() => {
    const el = s.el
    sceneState.scrollEl = el
    const max = el.scrollHeight - el.clientHeight
    const target = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
    s.scroll.current = target
    if (!Number.isFinite(s.offset)) s.offset = target
    if (!Number.isFinite(s.delta)) s.delta = 0
    // 창 크기가 바뀌면 HTML 오버레이 위치를 한 번 강제로 다시 계산
    if (last.current.w !== size.width || last.current.h !== size.height) {
      last.current = { w: size.width, h: size.height }
      s.delta = 1
    }
  })
  return null
}

/**
 * 전체 보기 모달이 열려 있는 동안은 뒤의 3D가 가려지므로 렌더 루프를 멈춘다.
 * (모달 안 문서 스크롤과 영상 재생에 GPU를 양보)
 */
export function PauseWhenModal() {
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    const on = (e: Event) => setFrameloop((e as CustomEvent<boolean>).detail ? 'never' : 'always')
    window.addEventListener('folio:modal', on)
    return () => window.removeEventListener('folio:modal', on)
  }, [setFrameloop])
  return null
}

/**
 * WYD — 감정 색 별마다 번지는 빛(블룸 느낌).
 * 실제 서비스에서 색마다 밝기가 달라 유독 안 빛나던 별이 있었던 걸 떠올려, 모든 색 별에 같은 세기의 번짐을 준다.
 * 밝기는 중심별의 85%.
 */
export function ColorStarGlow() {
  const scroll = useScroll()
  const pts = useRef<THREE.Points>(null)
  const halo = useMemo(() => glowTexture('halo'), [])
  const geo = useMemo(() => {
    const L = wydLayout()
    const pos: number[] = []
    const col: number[] = []
    for (let i = 0; i < L.scl.length / 3; i++) {
      const k = i * 3
      const r = L.col[k], g = L.col[k + 1], b = L.col[k + 2]
      if (L.scl[k] <= 0 || (r > 0.98 && g > 0.98 && b > 0.98)) continue // 흰 별은 제외
      pos.push(L.pos[k], L.pos[k + 1], L.pos[k + 2])
      col.push(r, g, b)
    }
    const gg = new THREE.BufferGeometry()
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    return gg
  }, [])
  useFrame((state) => {
    const p = pts.current
    if (!p) return
    const w = weightOf(4, scroll.offset, SECTION_COUNT)
    p.visible = w > 0.01
    if (!p.visible) return
    const e0 = Math.min(1, Math.max(0, (w - 0.35) / 0.65))
    const e = e0 * e0 * (3 - 2 * e0)
    const t = state.clock.elapsedTime
    const m = p.material as THREE.PointsMaterial
    m.opacity = 0.85 * CORE_BRIGHT * e * (1 + Math.sin(t * 1.7) * 0.08)
    m.size = 1.1 * (0.6 + 0.4 * e)
  })
  return (
    <points ref={pts} geometry={geo} visible={false}>
      <pointsMaterial
        map={halo}
        vertexColors
        size={1.1}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

/* ─────────── DocQ — 보드 위를 깡충깡충 도는 양 (게임 속 캐릭터 느낌) ─────────── */
const WOOL = '#F6F3EC'
const FACE = '#3B3431'

function Sheep() {
  const parts: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [
    { p: [0, 0.2, 0], s: [0.3, 0.19, 0.22], c: WOOL }, // 몸통
    { p: [-0.04, 0.3, 0], s: [0.18, 0.06, 0.16], c: WOOL }, // 등 털
    { p: [-0.16, 0.23, 0], s: [0.05, 0.07, 0.07], c: WOOL }, // 꼬리
    { p: [0.18, 0.28, 0], s: [0.12, 0.13, 0.12], c: FACE }, // 머리
    { p: [0.17, 0.35, 0], s: [0.1, 0.04, 0.13], c: WOOL }, // 앞머리 털
    { p: [0.15, 0.3, 0.085], s: [0.04, 0.03, 0.07], c: FACE }, // 귀
    { p: [0.15, 0.3, -0.085], s: [0.04, 0.03, 0.07], c: FACE },
    { p: [0.245, 0.3, 0.035], s: [0.012, 0.025, 0.025], c: '#FFFFFF' }, // 눈
    { p: [0.245, 0.3, -0.035], s: [0.012, 0.025, 0.025], c: '#FFFFFF' },
    { p: [0.09, 0.06, 0.07], s: [0.05, 0.12, 0.05], c: FACE }, // 다리
    { p: [0.09, 0.06, -0.07], s: [0.05, 0.12, 0.05], c: FACE },
    { p: [-0.09, 0.06, 0.07], s: [0.05, 0.12, 0.05], c: FACE },
    { p: [-0.09, 0.06, -0.07], s: [0.05, 0.12, 0.05], c: FACE },
  ]
  return (
    <>
      {parts.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={b.c} roughness={0.85} />
        </mesh>
      ))}
    </>
  )
}

export function DocqSheep() {
  const scroll = useScroll()
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  // 경로 타일을 섬 중심 기준 각도 순으로 정렬해 한 바퀴 도는 순서를 만든다
  const ring = useMemo(() => {
    if (DOCQ_PATH.length === 0) docqLayout()
    return [...DOCQ_PATH].sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x))
  }, [])
  const heading = useRef(0)

  useFrame((state, dt) => {
    const r = root.current
    const bd = body.current
    if (!r || !bd || ring.length < 2) return
    const w = weightOf(3, scroll.offset, SECTION_COUNT)
    r.visible = w > 0.02
    if (!r.visible) return
    const k = Math.max(0, (w - 0.45) / 0.55)
    const e = k * k * (3 - 2 * k)
    r.scale.setScalar(Math.max(0.001, e))

    // 0.55초에 한 칸씩 깡충
    const t = state.clock.elapsedTime / 0.55
    const i = Math.floor(t) % ring.length
    const f = t - Math.floor(t)
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const hop = Math.sin(Math.min(1, f / 0.7) * Math.PI) * 0.16 // 70% 동안 뛰고 30%는 착지해서 쉼
    const m = Math.min(1, f / 0.7)
    const ease = m * m * (3 - 2 * m)
    r.position.set(a.x + (b.x - a.x) * ease, a.top + (b.top - a.top) * ease + hop, a.z + (b.z - a.z) * ease)
    // 진행 방향을 바라보되 부드럽게 돈다
    const target = Math.atan2(-(b.z - a.z), b.x - a.x)
    let dh = target - heading.current
    dh = Math.atan2(Math.sin(dh), Math.cos(dh))
    heading.current += dh * Math.min(1, dt * 10)
    r.rotation.y = heading.current
    // 착지할 때 살짝 눌렸다 펴지기
    const squash = f > 0.7 ? 1 - Math.sin(((f - 0.7) / 0.3) * Math.PI) * 0.12 : 1
    bd.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash))
  })

  return (
    <group ref={root} visible={false}>
      <group ref={body}>
        <Sheep />
      </group>
    </group>
  )
}

/**
 * 로딩 화면을 걷기 전에 모든 재질의 셰이더를 미리 컴파일한다.
 * 처음 스크롤할 때 각 장면(은하 빛무리, Jabis 로봇 등)이 처음 나타나며 멈칫하던 원인이 셰이더 컴파일이었다.
 * 숨겨 둔 오브젝트도 컴파일되도록 잠깐 보이게 했다가 되돌린다.
 */
export function Warmup() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      // 레이아웃 계산 등 첫 프레임 작업이 끝나도록 두 프레임 기다린다
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const hidden: THREE.Object3D[] = []
      scene.traverse((o) => {
        if (!o.visible) {
          hidden.push(o)
          o.visible = true
        }
      })
      try {
        await gl.compileAsync(scene, camera)
      } catch {
        /* 컴파일 실패해도 화면은 보여준다 */
      }
      hidden.forEach((o) => (o.visible = false))
      await document.fonts?.ready
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (!cancelled) window.dispatchEvent(new Event('folio:ready'))
    }
    run()
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera])
  return null
}
