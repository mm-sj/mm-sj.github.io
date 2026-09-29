import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import {
  N, type Layout, emptyLayout, planLayout, modelLayout, facadeLayout, docqLayout, wydLayout, jabisLayout, endLayout,
} from './layouts'
import { facadeParams, sceneState } from '../store'
import { SECTION_COUNT, sectionBlend } from './timeline'

/**
 * 800개의 큐브 하나(InstancedMesh)로 모든 장면을 그린다.
 * - React 리렌더 없이 useFrame에서 인스턴스 행렬만 직접 갱신한다.
 * - 스크롤 위치 → (현재 장면 a, 다음 장면 b, 비율 t) → 인스턴스별 시차(stagger)를 준 보간.
 */
const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Morph() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const scroll = useScroll()
  const { camera, pointer } = useThree()

  // 장면별 레이아웃. 파사드(2번)만 매 프레임 다시 계산한다.
  const layouts = useMemo<Layout[]>(() => {
    const facade = emptyLayout()
    facadeLayout(facade, 0, 2, 0)
    return [
      planLayout(),
      modelLayout(),
      facade,
      docqLayout(),
      wydLayout(),
      jabisLayout(),
      endLayout(),
    ]
  }, [])

  // 인스턴스마다 0~1 지연값 — 바닥에서 위로, 약간의 무작위를 섞어 쌓이듯 움직이게
  const delay = useMemo(() => {
    const d = new Float32Array(N)
    for (let i = 0; i < N; i++) d[i] = (i / N) * 0.7 + Math.random() * 0.3
    return d
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const ca = useMemo(() => new THREE.Color(), [])
  const cb = useMemo(() => new THREE.Color(), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const attractor = useRef(sceneState.attractor)
  const goal = useMemo(() => new THREE.Vector2(), [])
  // 스크롤이 멈춰 있고 파사드 장면이 아니면 800개 행렬을 다시 쓸 필요가 없다
  const lastKey = useRef('')

  // 별(WYD)만 스스로 빛나게: 인스턴스 색을 emissive에 더하는 셰이더 패치
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uGlow = sceneState.glowUniform
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uGlow;')
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance += vColor.rgb * uGlow;\n#endif',
        )
    }
    return m
  }, [])

  // instanceColor 속성을 첫 렌더 전에 만들어 둬야 셰이더가 USE_INSTANCING_COLOR로 컴파일된다
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const c = new THREE.Color(1, 1, 1)
    for (let i = 0; i < N; i++) m.setColorAt(i, c)
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [])

  useFrame((state, dt) => {
    const m = mesh.current
    if (!m) return
    const { a, b, t } = sectionBlend(scroll.offset, SECTION_COUNT)
    sceneState.section = a + (t > 0.5 ? 1 : 0)
    sceneState.clock = state.clock.elapsedTime
    sceneState.facadeWeight = a === 2 ? 1 - t : b === 2 ? t : 0
    // 01 장면 정지 구간에서는 큐브 대신 합친 덩어리(ModelSolid)를 보여준다 — 모양이 같아서 바뀌는 순간이 보이지 않는다
    sceneState.modelSettled = (a === 1 && t === 0) || (b === 1 && t === 1)
    m.visible = !sceneState.modelSettled

    // 파사드 장면이 화면에 걸려 있을 때만 끌개를 갱신
    if (a === 2 || b === 2) {
      ray.setFromCamera(pointer, camera)
      const recent = performance.now() - facadeParams.lastMove < 2500
      if (recent && ray.ray.intersectPlane(plane, hit) && Math.abs(hit.x) < 3.8 && hit.y > -0.3 && hit.y < 5.4) {
        attractor.current.lerp(goal.set(hit.x, hit.y), Math.min(1, dt * 6))
      } else {
        // 커서가 없으면 천천히 8자로 움직인다
        const tt = state.clock.elapsedTime * 0.35
        attractor.current.lerp(goal.set(Math.sin(tt) * 2.2, 2.5 + Math.sin(tt * 2) * 1.3), Math.min(1, dt * 2))
      }
      facadeLayout(layouts[2], attractor.current.x, attractor.current.y, state.clock.elapsedTime)
    }

    const key = `${a}|${b}|${t.toFixed(4)}`
    const live = a === 2 || b === 2
    if (key === lastKey.current && !live) {
      const w4s = a === 4 ? 1 - t : b === 4 ? t : 0
      sceneState.glowUniform.value = w4s * 2.4
      return
    }
    lastKey.current = key

    const A = layouts[a]
    const B = layouts[b]
    for (let i = 0; i < N; i++) {
      // 인스턴스별 시차: t를 늘려 앞뒤로 밀어낸 뒤 0~1로 자른다
      let ti = reduceMotion ? t : Math.min(1, Math.max(0, t * 1.8 - delay[i] * 0.8))
      ti = ti * ti * (3 - 2 * ti) // smoothstep
      const j = i * 3
      // 이동 중엔 살짝 위로 떠오르는 궤적 — 조립되는 느낌
      const lift = reduceMotion ? 0 : Math.sin(ti * Math.PI) * 0.6
      dummy.position.set(
        A.pos[j] + (B.pos[j] - A.pos[j]) * ti,
        A.pos[j + 1] + (B.pos[j + 1] - A.pos[j + 1]) * ti + lift,
        A.pos[j + 2] + (B.pos[j + 2] - A.pos[j + 2]) * ti,
      )
      dummy.rotation.set(
        A.rot[j] + (B.rot[j] - A.rot[j]) * ti,
        A.rot[j + 1] + (B.rot[j + 1] - A.rot[j + 1]) * ti,
        A.rot[j + 2] + (B.rot[j + 2] - A.rot[j + 2]) * ti,
      )
      dummy.scale.set(
        Math.max(1e-4, A.scl[j] + (B.scl[j] - A.scl[j]) * ti),
        Math.max(1e-4, A.scl[j + 1] + (B.scl[j + 1] - A.scl[j + 1]) * ti),
        Math.max(1e-4, A.scl[j + 2] + (B.scl[j + 2] - A.scl[j + 2]) * ti),
      )
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      ca.setRGB(A.col[j], A.col[j + 1], A.col[j + 2])
      cb.setRGB(B.col[j], B.col[j + 1], B.col[j + 2])
      m.setColorAt(i, ca.lerp(cb, ti))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true

    // 은하 장면(4)에서만 발광
    const w4 = a === 4 ? 1 - t : b === 4 ? t : 0
    sceneState.glowUniform.value = w4 * 2.4
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} material={material} castShadow receiveShadow frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  )
}
