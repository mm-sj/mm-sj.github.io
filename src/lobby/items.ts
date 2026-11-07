import { PROFILE, PROJECTS, type Project } from '../content'

/** 룰렛 메뉴 한 칸. DocQ 메인 화면의 menuItems 구조를 그대로 가져왔다 (색 + 진한 색 + 아이콘) */
export type LobbyItem =
  | { kind: 'about'; id: string; label: string; icon: string; color: string; dark: string }
  | { kind: 'project'; id: string; label: string; icon: string; color: string; dark: string; project: Project }
  | { kind: 'fridge'; id: string; label: string; icon: string; color: string; dark: string }
  | { kind: 'contact'; id: string; label: string; icon: string; color: string; dark: string }

const P = Object.fromEntries(PROJECTS.map((p) => [p.id, p]))

export const ITEMS: LobbyItem[] = [
  { kind: 'about', id: 'about', label: '소개', icon: 'face', color: '#42a5f5', dark: '#1565c0' },
  { kind: 'project', id: 'docq', label: 'DocQ', icon: 'casino', color: '#7cb342', dark: '#33691e', project: P.docq },
  { kind: 'project', id: 'wyd', label: 'Would You Draw', icon: 'auto_awesome', color: '#7e57c2', dark: '#4527a0', project: P.wyd },
  { kind: 'project', id: 'jabis', label: 'Jabis', icon: 'precision_manufacturing', color: '#5c6bc0', dark: '#283593', project: P.jabis },
  { kind: 'fridge', id: 'fridge', label: '데이터 냉장고', icon: 'kitchen', color: '#26a69a', dark: '#00695c' },
  { kind: 'contact', id: 'contact', label: '연락처', icon: 'mail', color: '#8d6e63', dark: '#4e342e' },
]

export const ABOUT = {
  name: '오창민',
  role: PROFILE.role,
  lines: ['건축을 전공한 프론트엔드 개발자입니다.', '모형을 만지던 손으로, 지금은 웹에서 3D를 만지고 있습니다.'],
  chips: ['SSAFY 14기', '계명대 건축학', 'LG전자 K-뉴딜 AX 트랙'],
}

export const FRIDGE = {
  title: '데이터 냉장고',
  tag: 'LG전자 AX 트랙 · 2026.10 – 11',
  line: '저장할 때 남긴 "이유"가 다시 유효해지면, AI가 자료를 꺼내주는 사내 지식 재활용 서비스',
  role: '자료 입고 워크플로우 · 웹 화면',
  flow: ['파일 업로드', '마크다운 변환', 'AI 카드 초안', '사람이 확정', '저장'],
  video: 'https://www.youtube.com/watch?v=HB-bQzTXlkQ',
}
