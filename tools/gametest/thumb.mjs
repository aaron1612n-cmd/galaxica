// usage: node thumb.mjs <path> <out.jpg> <js> <waitms> <ls-json> [cx cy offsets in px from canvas centre]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, path, out, js='', wait='3000', ls='{}', ox='0', oy='0'] = process.argv;
const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1700,height:1100}});
const p = await ctx.newPage();
await p.addInitScript(o=>{const v=JSON.parse(o);for(const k in v)localStorage.setItem(k,v[k])}, ls);
await p.goto('http://localhost:8080/'+path); await p.waitForTimeout(1000);
if (js) await p.evaluate(js); await p.waitForTimeout(+wait);
const r = await p.evaluate(()=>{const c=document.querySelector('canvas').getBoundingClientRect();return{x:c.x,y:c.y,w:c.width,h:c.height}});
const W=938,H=704, x=Math.round(r.x+r.w/2-W/2+(+ox)), y=Math.round(r.y+r.h/2-H/2+(+oy));
await p.screenshot({path: out.replace('.jpg','.png'), clip:{x, y, width:W, height:H}});
await b.close();
