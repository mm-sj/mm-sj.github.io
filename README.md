# 오창민 포트폴리오

https://mm-sj.github.io

첫 화면은 제가 만든 DocQ 메인 화면의 룰렛 메뉴 구조를 가져와 다시 만든 것입니다.
아래 룰렛을 돌리면 위 카드가 같이 넘어갑니다. 휠, 방향키, 드래그(스와이프)로 조작합니다.

- 스택: React 19 · TypeScript · Vite (첫 화면은 3D 없이 DOM/CSS만 사용)
- 배포: GitHub Actions → GitHub Pages

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성
```

## 폴더 구조

```
src/
├── App.tsx            첫 화면(Lobby) + 문서 모달 조립
├── content.ts         프로필·프로젝트 문구 (문구 수정은 여기)
├── base.css           공통 변수, 리셋, 모달 스타일
├── lobby/
│   ├── Lobby.tsx      룰렛 + 카드 캐러셀, 입력 처리, 첫 방문 연출
│   ├── items.ts       룰렛 메뉴 5칸과 소개·데이터 냉장고 카드 내용
│   └── lobby.css      화이트 모형 톤 스타일
└── ui/Modal.tsx       문서 페이지(quick/)를 띄우는 모달
public/
├── assets/            프로젝트 영상(mp4)·이미지
├── quick/             문서형 포트폴리오 (정적 HTML 한 장)
├── design/            UI 포트폴리오 (정적 HTML 한 장)
└── portfolio.pdf      PDF 포트폴리오
```

## 룰렛이 움직이는 방식 (`src/lobby/Lobby.tsx`)

- 회전값은 React 상태가 아니라 ref(`target`, `cur`)로 두고 `requestAnimationFrame` 루프에서 직접 `transform`을 바꿉니다. 매 프레임 리렌더가 일어나지 않습니다.
- 입력은 `target`만 한 칸(360° ÷ 5)씩 옮기고, `cur`가 경과 시간 기준 지수 감쇠로 따라갑니다. 프레임 속도가 달라도 같은 빠르기로 움직입니다.
- 휠 입력은 한 프레임 동안 모아서 한 번만 처리합니다. 트랙패드처럼 이벤트가 잘게 쏟아져도 한 칸씩 넘어갑니다.
- 가운데 카드는 `cur`가 아니라 `target`이 가리키는 칸으로 정합니다. 룰렛이 출발하는 순간 카드도 같이 출발합니다.
- 카드 다섯 장은 처음부터 모두 렌더해 두고 위치 클래스만 바꿉니다. 영상은 가운데 카드일 때만 재생합니다.
- 입력이 1초 없으면 룰렛이 천천히 혼자 돕니다. 가운데 카드에 마우스를 올리거나 모달이 열려 있으면 멈춥니다.
- `prefers-reduced-motion`이 켜져 있으면 혼자 도는 동작과 첫 방문 연출을 끕니다.
