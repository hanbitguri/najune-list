import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for lang in ['ko','ja']:
      for name,vp,mob in [('mobile',{'width':390,'height':844},True),('desktop',{'width':1440,'height':900},False)]:
        pg=b.new_page(viewport=vp,device_scale_factor=2 if mob else 1,is_mobile=mob,has_touch=mob)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and '404' not in m.text and errs.append(m.text))
        pg.add_init_script(f"localStorage.setItem('najune-lang','{lang}')")
        pg.goto('http://localhost:8080/?sample=1&tab=trips');pg.wait_for_load_state('networkidle')
        for tab in ['places','share','trips']: pg.click(f'.tab[data-tab={tab}]'); pg.wait_for_timeout(200)
        pg.click('#newTrip');pg.wait_for_timeout(300);pg.click('#cancelTrip')
        pg.click('#placeList .item .body >> nth=0', force=True) if False else None
        pg.wait_for_timeout(1500)
        info=pg.evaluate("[document.documentElement.lang, document.title, document.querySelector('#tripMeta').textContent, document.querySelector('#banner').textContent]")
        pg.screenshot(path=f"shots/{name}{'' if lang=='ko' else '-ja'}.png");print(lang,name,info,errs)
    # live toggle test
    pg=b.new_page();pg.goto('http://localhost:8080/');pg.wait_for_timeout(800);pg.click('.lang button[data-lang=ja]');pg.wait_for_timeout(300)
    print('toggle',pg.evaluate("[document.documentElement.lang, localStorage.getItem('najune-lang'), document.querySelector('.tab').textContent]"))
    b.close()
