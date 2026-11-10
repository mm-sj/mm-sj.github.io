/** 페이지 문구는 여기 한 곳에서 관리한다 */

const QUICK = (import.meta.env.VITE_QUICK_URL as string | undefined) ?? './quick/index.html'

export const PROFILE = {
  name: '오창민',
  role: '서비스 기획 · 프론트엔드',
  email: 'dhckdals1104@naver.com',
  github: 'https://github.com/mm-sj',
  // 문서형 정적 버전(전체 보기). 배포 시엔 같은 사이트의 quick/ 폴더, 필요하면 VITE_QUICK_URL로 교체
  quick: QUICK,
}

/** 수상 프로젝트와 따로 두는 AX 프로젝트 — 3D 장면 없이 전체 보기(quick)의 04 시트로만 연결 */
export const AX_PROJECT = { id: 'fridge', no: '01', title: '데이터 냉장고' }

export type Project = {
  id: string
  no: string
  title: string
  award: string
  period: string
  team: string
  role: string
  line: string
  video: string
  poster: string
  detail: string
  repo: string
  extra?: { label: string; href: string }
}

export const PROJECTS: Project[] = [
  {
    id: 'docq',
    no: '02',
    title: 'DocQ',
    award: 'SSAFY 공통 최우수상',
    period: '2026.01 – 02',
    team: '6명 · FE 3',
    role: 'UX 방향 · FE · 3D 에셋',
    line: 'PDF를 AI 퀴즈로 바꿔 최대 4명이 보드게임처럼 푸는 학습 서비스. UX 방향과 게임 밖 화면 전반을 맡았습니다.',
    video: './assets/docq-board.mp4',
    poster: './assets/docq-board.jpg',
    detail: `${QUICK}#docq`,
    repo: 'https://github.com/mm-sj/S14P11D209',
  },
  {
    id: 'wyd',
    no: '03',
    title: 'Would You Draw',
    award: 'SSAFY 특화 우수상',
    period: '2026.03',
    team: '5명 · FE 2',
    role: 'FE 팀장',
    line: '그린 감정이 별, 별자리, 은하로 쌓이는 감정 기록 앱. FE 팀장으로 드로잉과 우주 인터랙션을 맡았습니다.',
    video: './assets/wyd-universe.mp4',
    poster: './assets/wyd-universe.jpg',
    detail: `${QUICK}#wyd`,
    repo: 'https://github.com/mm-sj/S14P21D207',
  },
  {
    id: 'jabis',
    no: '04',
    title: 'Jabis',
    award: 'SSAFY 자율 우수상',
    period: '2026.04 – 05',
    team: '6명 · FE 1',
    role: 'FE 전담',
    line: '양팔 데스크 로봇의 상태를 3D로 보여주는 웹 대시보드. 팀의 유일한 FE로 대시보드 전체를 맡았습니다.',
    video: './assets/jabis-dashboard.mp4',
    poster: './assets/jabis-dashboard.jpg',
    detail: `${QUICK}#jabis`,
    repo: 'https://github.com/mm-sj/S14P31D101',
    extra: { label: '홍보 영상', href: 'https://www.youtube.com/watch?v=pIx2FC31FqI' },
  },
]
