import * as THREE from 'three'

/**
 * 프레임마다 바뀌는 값은 React 상태에 두지 않는다.
 * (Jabis 대시보드에서 겪은 리렌더 문제와 같은 이유 — 3D 루프가 읽는 값은 평범한 가변 객체로 둔다)
 */
export const facadeParams = {
  lastMove: -1e9, // 마지막으로 커서가 움직인 시각(ms). 최근에 움직였을 때만 끌개가 커서를 따라간다
}

export const sceneState = {
  section: 0,
  glowUniform: { value: 0 } as THREE.IUniform<number>,
  attractor: new THREE.Vector2(0.6, 2.2), // 파사드 끌개 위치 (조명·클릭 파동이 함께 쓴다)
  clock: 0, // useFrame의 elapsedTime — 클릭 시각을 3D 시간축에 맞추려고 보관
  facadeWeight: 0,
  modelSettled: false, // 01 장면에 멈춰 있는 동안 true — 큐브 대신 합친 덩어리를 보여준다
}
