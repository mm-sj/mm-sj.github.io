"""quick/index.html(문서형 포트폴리오)을 받아 A4 인쇄용 HTML 두 벌(제출용·웹 공개용)을 만든다."""
import re, sys
SRC, OUT = sys.argv[1], sys.argv[2]
PHONE = '010-5152-1181'
src = open(SRC, encoding='utf-8').read()

def build(with_phone: bool) -> str:
    s = src
    s = re.sub(r'<script[\s\S]*?</script>', '', s)                      # 스크립트 전부 제거
    s = re.sub(r'\s*<header class="topbar">[\s\S]*?</header>', '', s)   # 상단 바
    s = re.sub(r'\s*<footer id="contact">[\s\S]*?</footer>', '', s)     # 끝 연락처(1쪽에 있음)
    s = re.sub(r'\s*<p class="toast"[^>]*></p>', '', s)
    s = s.replace('../assets/', 'assets/')
    # 영상 → 포스터 이미지
    s = re.sub(r'<video[^>]*poster="([^"]+)"[^>]*aria-label="([^"]*)"[^>]*></video>', r'<img src="\1" alt="\2">', s)
    s = re.sub(r'<video[^>]*poster="([^"]+)"[^>]*></video>', r'<img src="\1" alt="">', s)
    s = s.replace(' loading="lazy"', '')
    # 사진 아래 연락처
    chips = (f'<span class="chip chip--tel">{PHONE}</span>\n' if with_phone else '') + \
        '<span class="chip">dhckdals1104@naver.com</span>\n' \
        '<a class="chip" href="https://github.com/mm-sj">github.com/mm-sj</a>\n' \
        '<a class="live" href="https://mm-sj.github.io/"><b>포트폴리오 웹사이트</b><span>mm-sj.github.io ↗</span></a>'
    s = re.sub(r'(<div class="hero-side">[\s\S]*?</figure>)\s*<div class="contact">[\s\S]*?</div>',
               lambda m: m.group(1) + '\n      <div class="contact">\n' + chips + '\n      </div>', s, count=1)
    top = ('<div class="pdf-top"><span class="mono">OH CHANGMIN — PORTFOLIO 2026</span><span class="mono">'
           + (f'{PHONE} · ' if with_phone else '') +
           'dhckdals1104@naver.com · <a href="https://mm-sj.github.io/">mm-sj.github.io</a></span></div>')
    s = s.replace('<div class="wrap">', '<div class="wrap">\n' + top, 1)
    css = open(sys.argv[3], encoding='utf-8').read()
    fonts = ''.join(f'<link rel="stylesheet" href="_fonts/{f}">' for f in [
        'ibm-plex-sans-kr/400.css', 'ibm-plex-sans-kr/500.css', 'ibm-plex-sans-kr/600.css',
        'hahmlet/500.css', 'hahmlet/700.css', 'ibm-plex-mono/400.css', 'ibm-plex-mono/500.css'])
    s = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>', fonts, s)
    s = s.replace('</head>', '<style>\n' + css + '\n</style>\n</head>', 1)
    return s

open(OUT + '/print.html', 'w', encoding='utf-8').write(build(True))
open(OUT + '/print-web.html', 'w', encoding='utf-8').write(build(False))
print('ok')
