import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
root=sys.argv[3] if len(sys.argv)>3 else 'render'
srv=subprocess.Popen(['python3','-m','http.server','4310','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
try:
  with sync_playwright() as p:
    b=p.chromium.launch()
    for src,out in [('print.html',sys.argv[1]),('print-web.html',sys.argv[2])]:
        pg=b.new_page(); pg.goto(f'http://localhost:4310/{src}', wait_until='networkidle'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(500)
        pg.pdf(path=out, format='A4', print_background=True, prefer_css_page_size=True); pg.close()
    b.close()
finally: srv.terminate()
