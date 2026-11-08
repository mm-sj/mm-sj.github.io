import { PROFILE, PROJECTS, type Project } from '../content'

/** 룰렛 메뉴 한 칸. DocQ 메인 화면의 menuItems 구조를 그대로 가져왔다 (색 + 진한 색 + 아이콘) */
export type LobbyItem =
  | { kind: 'about'; id: string; label: string; icon: string; color: string; dark: string }
  | { kind: 'fridge'; id: string; label: string; icon: string; color: string; dark: string }
  | { kind: 'project'; id: string; label: string; icon: string; color: string; dark: string; project: Project }

const P = Object.fromEntries(PROJECTS.map((p) => [p.id, p]))

export const ITEMS: LobbyItem[] = [
  { kind: 'about', id: 'about', label: '소개', icon: 'face', color: '#8fa3b8', dark: '#5f7387' },
  { kind: 'fridge', id: 'fridge', label: '데이터 냉장고', icon: 'kitchen', color: '#73a59c', dark: '#4b7a71' },
  { kind: 'project', id: 'docq', label: 'DocQ', icon: 'casino', color: '#9bae7c', dark: '#6b7d4f', project: P.docq },
  { kind: 'project', id: 'wyd', label: 'Would You Draw', icon: 'auto_awesome', color: '#7d78a6', dark: '#55507d', project: P.wyd },
  { kind: 'project', id: 'jabis', label: 'Jabis', icon: 'precision_manufacturing', color: '#66748a', dark: '#434f62', project: P.jabis },
]

export const ABOUT = {
  name: '오창민',
  role: PROFILE.role,
  lede: '기획한 흐름을 직접 화면으로 만들어 본 사람입니다.',
  lines: ['건축을 전공했고, SSAFY에서 서비스 세 개의 화면 흐름을 정하고 직접 구현해 세 번 모두 수상했습니다. AX 트랙에서는 n8n 업무 자동화 서비스로 5개 팀 중 1위를 했습니다.'],
  chips: ['계명대 건축학', 'SSAFY 14기', 'LG전자 K-뉴딜 AX 트랙'],
}

export const FRIDGE = {
  title: '데이터 냉장고',
  tag: '2026.10 – 11',
  line: '저장한 이유가 다시 필요해질 때 AI가 자료를 꺼내주는 사내 지식 서비스. 자료 입고 흐름과 웹 화면을 맡았습니다.',
  role: '자료 입고 워크플로우 · 웹 화면',
  flow: ['이유와 함께 저장', 'AI 정리', '사람이 확정', '필요할 때 꺼내줌'],
  video: 'https://www.youtube.com/watch?v=HB-bQzTXlkQ',
}
