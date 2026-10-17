// usage: node bot.mjs <path> <seconds> <js-start or ''> [w h]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, path, secs='60', start='', W='1280', H='800', ls='{}'] = process.argv;
const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:+W,height:+H}});
const p = await ctx.newPage(); const errs=[];
p.on('pageerror', e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1])); p.on('console', m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()) });
await p.addInitScript(o=>{const v=JSON.parse(o);for(const k in v)localStorage.setItem(k,v[k])}, ls);
await p.goto('http://localhost:8080/'+path); await p.waitForTimeout(800);
if (start) await p.evaluate(start);
const t0=Date.now();
while (Date.now()-t0 < secs*1000) { await p.waitForTimeout(5000); const s = await p.evaluate('JSON.stringify(window.__g.stats())'); console.log(Math.round((Date.now()-t0)/1000)+'s', s); if(errs.length) break; }
console.log(errs.length? errs.slice(0,10).join('\n') : 'no errors');
await p.screenshot({path:`${process.env.OUT||'/tmp/x'}.png`});
await b.close();
