import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, Scroll, ScrollControls } from '@react-three/drei'
import { Morph } from './scene/Morph'
import { CameraRig, ScrollSync, Constellations, FacadeLight, GalaxyCore, JabisRig, Lights, Tilt } from './scene/Stage'
import { ModelContext } from './scene/Context'
import { Mashrabiya } from './scene/Mashrabiya'
import { ModelSolid } from './scene/ModelSolid'
import { SECTION_COUNT } from './scene/timeline'
import { Overlay } from './ui/Overlay'
import { facadeParams } from './store'
import { PROFILE } from './content'

export default function App() {
  useEffect(() => {
    const onMove = () => (facadeParams.lastMove = performance.now())
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <>
      <header className="topbar">
        <span className="mono">OH CHANGMIN — PORTFOLIO</span>
        <a className="mono" href={PROFILE.quick} target="_blank" rel="noopener">
          전체 보기 →
        </a>
      </header>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0.01, 10.5, 1.2], fov: 32, near: 0.1, far: 80 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        performance={{ min: 0.6 }}
        fallback={
          <div className="nogl">
            <p>이 브라우저에서는 3D 화면을 표시할 수 없습니다.</p>
            <a className="chip chip--solid" href={PROFILE.quick}>
              포트폴리오 보기 →
            </a>
          </div>
        }
      >
        <color attach="background" args={['#F3F5F4']} />
        <Suspense fallback={null}>
          <ScrollControls pages={SECTION_COUNT} damping={0.22}>
            <ScrollSync />
            <CameraRig />
            <Lights />
            <Tilt>
              <ModelContext />
              <Morph />
              <ModelSolid />
              <Mashrabiya />
              <FacadeLight />
              <Constellations />
              <GalaxyCore />
              <JabisRig />
            </Tilt>
            <Scroll html style={{ width: '100%' }}>
              <Overlay />
            </Scroll>
          </ScrollControls>
        </Suspense>
        <AdaptiveDpr pixelated={false} />
      </Canvas>
    </>
  )
}
