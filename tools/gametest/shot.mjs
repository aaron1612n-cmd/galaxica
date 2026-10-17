// usage: node shot.mjs <path> <out-prefix> [js-before-shot] [waitms]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, path, out, js='', wait='1500', ls='{}'] = process.argv;
const b = await chromium.launch();
for (const [name, vp, mobile] of [['d',{width:1280,height:800},false],['m',{width:390,height:800},true]]) {
  const ctx = await b.newContext({viewport:vp, isMobile:mobile, hasTouch:mobile, deviceScaleFactor: mobile?2:1, userAgent: mobile?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148':undefined});
  const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e=>errs.push('PAGEERR '+e.message)); p.on('console', m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()) });
  await p.addInitScript(o=>{const v=JSON.parse(o);for(const k in v)localStorage.setItem(k,v[k])}, ls);
  await p.goto('http://localhost:8080/'+path); await p.waitForTimeout(+wait);
  if (js) { const r = await p.evaluate(js); if (r!==undefined) console.log(name,'eval:',JSON.stringify(r)); await p.waitForTimeout(+wait); }
  await p.screenshot({path:`${out}-${name}.png`});
  console.log(name, errs.length? errs.join('\n') : 'no errors');
  await ctx.close();
}
await b.close();
