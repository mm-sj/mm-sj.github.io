import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { wheelState } from './wheelState'

/**
 * 룰렛 위를 걷는 점경인물 — 건축 모형에 세우는 흰 사람 모형처럼.
 * DocQ 메인 화면의 동물 행렬(CharacterBackground)에서 강아지 한 마리만 데려와 사람과 같이 걷게 했다.
 * 룰렛이 빨리 돌수록 걸음도 빨라진다.
 */
type Spec = { file: string; x: number; h: number; speed: number; phase: number }
const FIG = './assets/character/figure.glb'
const DOG = './assets/character/character_dog.glb'
const WALKERS: Spec[] = [
  { file: FIG, x: -3.1, h: 1.75, speed: 1.0, phase: 0.1 },
  { file: FIG, x: -1.9, h: 1.62, speed: 1.05, phase: 0.55 },
  { file: DOG, x: 1.1, h: 0.9, speed: 1.15, phase: 0.3 },
  { file: FIG, x: 2.3, h: 1.82, speed: 0.95, phase: 0.8 },
]
const GROUND = -0.95
const PLASTER = new THREE.MeshStandardMaterial({ color: '#e9e5dd', roughness: 0.88, metalness: 0 })

/** 발밑 그림자 — 매 프레임 깊이를 다시 그리는 ContactShadows 대신 고정 텍스처 한 장 */
const shadowTex = (() => {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(40,32,24,0.55)')
  grad.addColorStop(1, 'rgba(40,32,24,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
})()

function Walker({ file, x, h, speed, phase }: Spec) {
  const { scene, animations } = useGLTF(file)
  const { model, scale } = useMemo(() => {
    const m = SkeletonUtils.clone(scene)
    m.traverse((c) => {
      const mesh = c as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = PLASTER
        mesh.frustumCulled = false
      }
    })
    m.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m, true)
    const size = box.getSize(new THREE.Vector3())
    const s = h / (size.y || 1)
    // 발이 바닥선에 오도록 아래 기준으로 맞춘다
    m.position.y = -box.min.y
    return { model: m, scale: s }
  }, [scene, h])
  const { actions, names } = useAnimations(animations, model)
  useEffect(() => {
    const a = names[0] ? actions[names[0]] : null
    if (!a) return
    a.reset().play()
    a.time = phase * a.getClip().duration
  }, [actions, names, phase])
  useFrame(() => {
    const a = names[0] ? actions[names[0]] : null
    if (a) a.timeScale = speed * (0.6 + Math.min(wheelState.speed, 6) * 0.3)
  })
  return (
    <group position={[x, GROUND, 0]}>
      <group scale={scale} rotation={[0, Math.PI / 2, 0]}>
        <primitive object={model} />
      </group>
      {shadowTex && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[h * 0.75, h * 0.32]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

export function Characters() {
  return (
    <Canvas
      className="walkers"
      dpr={[1, 1.25]}
      camera={{ position: [0, 1, 6.5], fov: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={() => window.dispatchEvent(new Event('folio:ready'))}
    >
      <hemisphereLight args={['#ffffff', '#b8b0a2', 0.9]} />
      <directionalLight position={[-5, 7, 5]} intensity={2.6} />
      <directionalLight position={[6, 1, 3]} intensity={0.35} />
      <Suspense fallback={null}>
        {WALKERS.map((c, i) => (
          <Walker key={i} {...c} />
        ))}
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(FIG)
useGLTF.preload(DOG)
