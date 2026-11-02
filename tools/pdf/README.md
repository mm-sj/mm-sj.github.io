# PDF 만들기

`public/quick/index.html`(문서형 포트폴리오)을 A4 PDF로 뽑는다. 결과는 두 벌:
- 제출용(전화번호 포함) — 지원서에 직접 첨부
- 웹 공개용(전화번호 없음) — `public/portfolio.pdf`

```bash
# 1) 렌더링 폴더 준비: 에셋 링크 + 한글 폰트(fontsource)
mkdir -p render fonts && ln -sfn ../public/assets render/assets && ln -sfn ../fonts render/_fonts
cd fonts && for p in @fontsource/ibm-plex-sans-kr @fontsource/hahmlet @fontsource/ibm-plex-mono; do \
  n=$(npm pack $p --silent | tail -1); d=${p#*/}; mkdir -p $d && tar xzf $n -C $d --strip-components=1; done; cd ..

# 2) 인쇄용 HTML 생성 → PDF 렌더링 (Python Playwright 필요)
python3 tools/pdf/build.py public/quick/index.html render tools/pdf/print.css
python3 tools/pdf/render.py 오창민_포트폴리오.pdf public/portfolio.pdf render
```

- `print.css`: A4 인쇄용 덮어쓰기. 프로젝트 시트마다 새 쪽, 이미지 시트는 2쪽(그림 / 내용), A4 폭에서 걸리는 모바일 규칙을 데스크톱 배치로 되돌림.
- 쪽수가 늘면 `print.css` 아래쪽의 촘촘히 규칙으로 조절한다.
