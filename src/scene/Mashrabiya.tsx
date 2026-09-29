import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MODULES, PETALS, TRI, openness, screenCurve } from './layouts'
import { sceneState } from '../store'

/**
 * 마쉬라비야의 접히는 면. 정삼각형 모듈마다 3장 — 모듈의 바깥 모서리가 경첩이고, 꼭짓점은 무게중심(액추에이터)에서 만난다.
 *  닫힘: 거의 평평하게(4°) 3면이 맞물려 모듈을 빈틈없이 덮는다
 *  열림: 72°까지 접히며 앞으로 서고, 모듈 가운데에 삼각형 구멍이 뚫린다 (우산처럼)
 *
 * 변환 = 이동(모서리 중점, 곡면 위) · Y회전(곡면 접선) · Z회전(모서리 방향) · X회전(θ, 경첩) · 등장 스케일
 * 면은 로컬 좌표에서 경첩이 x축, 꼭짓점이 +y(모듈 중심 쪽)에 오도록 만들어 둔다.
 */
const CLOSED = (4 * Math.PI) / 180
const OPEN = (72 * Math.PI) / 180

export function Mashrabiya() {
  const mesh = useRef<THREE.InstancedMesh>(null)

  const geometry = useMemo(() => {
    const s = TRI.L * 0.985 // 닫혔을 때 면 사이 틈이 거의 없도록
    const a = ((TRI.L * Math.sqrt(3)) / 6) * 0.985 // 모서리 → 무게중심 거리
    const shape = new THREE.Shape()
    shape.moveTo(-s / 2, 0)
    shape.lineTo(s / 2, 0)
    shape.lineTo(0, a)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false })
    g.translate(0, 0, -0.006)
    return g
  }, [])

  // 면별 경첩(모서리 중점)·방향·곡면 각도는 고정 — 한 번만 계산
  const hinges = useMemo(
    () =>
      MODULES.flatMap((m, u) => {
        const cs = [m.a, m.b, m.c]
        return cs.map((p, e) => {
          const q = cs[(e + 1) % 3]
          const mx = (p[0] + q[0]) / 2
          const my = (p[1] + q[1]) / 2
          const { z, yaw } = screenCurve(mx)
          return { u, mx, my, mz: z, yaw, ang: Math.atan2(q[1] - p[1], q[0] - p[0]) }
        })
      }),
    [],
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const qY = useMemo(() => new THREE.Quaternion(), [])
  const qZ = useMemo(() => new THREE.Quaternion(), [])
  const qX = useMemo(() => new THREE.Quaternion(), [])
  const X = useMemo(() => new THREE.Vector3(1, 0, 0), [])
  const Y = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const Z = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const open = useRef(new Float32Array(MODULES.length)) // 모듈별 열림 (부드럽게 따라감)

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    dummy.scale.setScalar(0)
    dummy.updateMatrix()
    for (let i = 0; i < PETALS; i++) m.setMatrixAt(i, dummy.matrix)
    m.instanceMatrix.needsUpdate = true
  }, [dummy])

  useFrame((state, dt) => {
    const m = mesh.current
    if (!m) return
    const w = sceneState.facadeWeight
    m.visible = w > 0.01
    if (!m.visible) return
    const { x: ax, y: ay } = sceneState.attractor
    const t = state.clock.elapsedTime
    const k = Math.min(1, dt * 4)
    MODULES.forEach((mod, u) => {
      open.current[u] += (openness(mod.gx, mod.gy, ax, ay, t) - open.current[u]) * k
    })
    // 장면에 들어올 때 면이 경첩에서 자라 나온다 (도착 전엔 활짝 열린 채로 → 닫히며 표면이 완성)
    const appear = Math.min(1, Math.max(0, (w - 0.35) / 0.55))
    const grow = appear * appear * (3 - 2 * appear)
    hinges.forEach((h, i) => {
      const o = Math.max(open.current[h.u], 1 - grow)
      const theta = CLOSED + (OPEN - CLOSED) * o
      dummy.position.set(h.mx, h.my, h.mz)
      qY.setFromAxisAngle(Y, h.yaw)
      qZ.setFromAxisAngle(Z, h.ang)
      qX.setFromAxisAngle(X, theta)
      dummy.quaternion.copy(qY).multiply(qZ).multiply(qX)
      dummy.scale.setScalar(Math.max(1e-4, grow))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, PETALS]} castShadow receiveShadow frustumCulled={false}>
      <meshStandardMaterial color="#F4F4F1" roughness={0.55} side={THREE.DoubleSide} flatShading />
    </instancedMesh>
  )
}
