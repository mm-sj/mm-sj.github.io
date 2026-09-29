/** 페이지 문구는 여기 한 곳에서 관리한다 */

const QUICK = (import.meta.env.VITE_QUICK_URL as string | undefined) ?? './quick/index.html'

export const PROFILE = {
  name: '오창민',
  role: 'Frontend Developer · Web 3D & Interaction',
  email: 'dhckdals1104@naver.com',
  github: 'https://github.com/mm-sj',
  // 문서형 정적 버전(전체 보기). 배포 시엔 같은 사이트의 quick/ 폴더, 필요하면 VITE_QUICK_URL로 교체
  quick: QUICK,
}

export type Project = {
  id: string
  no: string
  title: string
  award: string
  period: string
  team: string
  role: string
  line: string
  points: string[]
  video: string
  poster: string
  detail: string
  repo: string
  extra?: { label: string; href: string }
}

export const PROJECTS: Project[] = [
  {
    id: 'docq',
    no: '01',
    title: 'DocQ',
    award: 'SSAFY 공통 최우수상',
    period: '2026.01 – 02',
    team: '6명 · FE 3',
    role: 'FE · UX 방향 · 3D 에셋',
    line: '읽은 PDF를 정말 이해했는지, 친구들과 보드게임으로 확인해 보는 서비스',
    points: [
      '동화책 같은 분위기를 잡고 로비·대기실·커뮤니티 화면을 만들었습니다',
      'Blender로 보드 맵을 만들고 캐릭터와 룰렛 위치를 하나하나 다시 잡았습니다',
      '엉뚱한 축으로 빙글빙글 돌던 룰렛은 모델 원점을 옮겨 바로잡았습니다',
    ],
    video: './assets/docq-board.mp4',
    poster: './assets/docq-board.jpg',
    detail: `${QUICK}#docq`,
    repo: 'https://github.com/mm-sj/S14P11D209',
  },
  {
    id: 'wyd',
    no: '02',
    title: 'Would You Draw',
    award: 'SSAFY 특화 우수상',
    period: '2026.03',
    team: '5명 · FE 2',
    role: 'FE 팀장',
    line: '하루의 감정을 그림으로 남기면 별이 되고, 일주일이면 별자리, 한 달이면 은하가 됩니다',
    points: [
      '팀원이 만든 우주 화면 위에 별자리가 이어지고 별이 태어나는 연출을 더했습니다',
      'AI 분석을 기다리지 않도록 임시 별을 먼저 띄우고, 결과가 오면 바꿔 끼웠습니다',
      '유독 빛나지 않던 색의 별들, 원인은 색마다 다른 밝기였습니다 (Bloom 임계값 조정)',
    ],
    video: './assets/wyd-universe.mp4',
    poster: './assets/wyd-universe.jpg',
    detail: `${QUICK}#wyd`,
    repo: 'https://github.com/mm-sj/S14P21D207',
  },
  {
    id: 'jabis',
    no: '03',
    title: 'Jabis',
    award: 'SSAFY 자율 우수상',
    period: '2026.04 – 05',
    team: '5명 · FE 1',
    role: 'FE 전담',
    line: '말을 알아듣고 책상 위 물건을 두 팔로 집는 로봇. 그 로봇이 보고 움직이는 것을 보여주는 대시보드',
    points: [
      '로봇 팔 두 개를 URDF로 불러와 실제 관절 각도대로 움직이게 했습니다',
      '자꾸 깜빡이던 인식 박스는 React 렌더링 밖으로 빼서 잡았습니다',
      '초당 20번 들어오는 관절 값을 사이사이 채워 움직임을 부드럽게 했습니다',
    ],
    video: './assets/jabis-dashboard.mp4',
    poster: './assets/jabis-dashboard.jpg',
    detail: `${QUICK}#jabis`,
    repo: 'https://github.com/mm-sj/S14P31D101',
    extra: { label: '시연 영상', href: 'https://www.youtube.com/watch?v=pIx2FC31FqI' },
  },
]
