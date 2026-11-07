import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { wheelState } from './wheelState'

/**
 * 룰렛 위를 걷는 동물 4마리 — DocQ 메인 화면 CharacterBackground를 R3F로 옮겼다.
 * 룰렛이 빨리 돌수록 걷는 애니메이션도 빨라진다.
 */
const CHARS = [
  { file: './assets/character/character_chicken.glb', x: 3.3, y: -0.4, scale: 2.4, speed: 0.5 },
  { file: './assets/character/character_dog.glb', x: -1.6, y: -0.2, scale: 2.2, speed: 1.0 },
  { file: './assets/character/character_sheep.glb', x: 1.6, y: -0.2, scale: 2.2, speed: 1.2 },
  { file: './assets/character/character_pig.glb', x: -3.4, y: -0.5, scale: 2.4, speed: 1.0 },
]

function Walker({ file, x, y, scale, speed }: (typeof CHARS)[number]) {
  const { scene, animations } = useGLTF(file)
  const model = useMemo(() => {
    const m = SkeletonUtils.clone(scene)
    m.traverse((c) => {
      const mesh = c as THREE.Mesh
      if (mesh.isMesh) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
        mat.roughness = 1
        mat.metalness = 0
        mesh.material = mat
      }
    })
    return m
  }, [scene])
  const { actions, names } = useAnimations(animations, model)
  useEffect(() => {
    const a = names[0] ? actions[names[0]] : null
    if (!a) return
    a.reset().play()
    a.time = Math.random() * 2
  }, [actions, names])
  useFrame(() => {
    const a = names[0] ? actions[names[0]] : null
    // 가만히 있을 때도 느긋하게 걷고, 룰렛이 빨라지면 같이 빨라진다
    if (a) a.timeScale = speed * (0.55 + Math.min(wheelState.speed, 6) * 0.35)
  })
  return <primitive object={model} position={[x, y, 0]} scale={scale} rotation={[0, Math.PI / 2, 0]} />
}

export function Characters() {
  return (
    <Canvas
      className="walkers"
      dpr={[1, 1.5]}
      camera={{ position: [0, 1, 6.5], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={() => window.dispatchEvent(new Event('folio:ready'))}
    >
      <ambientLight intensity={2.6} />
      <directionalLight position={[5, 10, 7]} intensity={2.4} />
      <directionalLight position={[0, 0, 10]} intensity={1.2} />
      <Suspense fallback={null}>
        {CHARS.map((c) => (
          <Walker key={c.file} {...c} />
        ))}
      </Suspense>
    </Canvas>
  )
}

CHARS.forEach((c) => useGLTF.preload(c.file))
