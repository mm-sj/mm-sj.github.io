import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { modelSolids } from './layouts'
import { sceneState } from '../store'

/** 01 장면에서 멈춰 있을 때만 보이는 매스 모형 — 큐브를 층·재료별로 합친 박스들 */
export function ModelSolid() {
  const g = useRef<THREE.Group>(null)
  const boxes = useMemo(modelSolids, [])
  const mats = useMemo(() => {
    const m = new Map<string, THREE.MeshStandardMaterial>()
    for (const b of boxes) if (!m.has(b.color)) m.set(b.color, new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.78 }))
    return m
  }, [boxes])
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  useFrame(() => {
    if (g.current) g.current.visible = sceneState.modelSettled
  })
  return (
    <group ref={g} visible={false}>
      {boxes.map((b, i) => (
        <mesh key={i} geometry={geo} material={mats.get(b.color)} position={[b.x, b.y, b.z]} scale={[b.w, b.h, b.d]} castShadow receiveShadow />
      ))}
    </group>
  )
}
