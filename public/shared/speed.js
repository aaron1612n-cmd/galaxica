/* Universal game-speed multiplier shared by the hub and every game (localStorage `galaxicaSpeed`, synced across tabs).
   Games call Speed.steps() once per animation frame and run that many simulation ticks (with a time budget guard).
   Typed values are clamped to [MIN, MAX]. */
(function(){
  var MAX=50,MIN=.25,cbs=[];
  function clamp(v){v=parseFloat(v);if(!isFinite(v))return null;return Math.min(MAX,Math.max(MIN,v))}
  function read(){try{return clamp(localStorage.galaxicaSpeed)||1}catch(e){return 1}}
  var S=window.Speed={v:read(),MAX:MAX,MIN:MIN,acc:0,
    set:function(v){var c=clamp(v);if(c===null)c=S.v;S.v=c;S.acc=0;try{localStorage.galaxicaSpeed=String(c)}catch(e){}cbs.forEach(function(f){f(c)})},
    watch:function(f){cbs.push(f);f(S.v)},
    steps:function(){S.acc+=S.v;var n=Math.floor(S.acc);S.acc-=n;return Math.min(n,MAX)},
    mount:function(el){
      el.className=(el.className+' spd').trim();el.title='Game speed multiplier (max '+MAX+'x)';
      var inp=document.createElement('input');inp.type='text';inp.inputMode='decimal';inp.maxLength=6;inp.setAttribute('aria-label','Speed multiplier');
      var x=document.createElement('b');x.textContent='x';x.className='px';
      el.append(inp,x);var qb=[['1',1],['2',2],['MAX',MAX]].map(function(q){var b=document.createElement('button');b.type='button';b.className='btn ghost';b.textContent=q[0]==='MAX'?'MAX':q[0]+'x';
        b.title=q[0]==='MAX'?'Maximum speed ('+MAX+'x)':'Speed '+q[0]+'x';b.onclick=function(){S.set(q[1])};el.append(b);return[b,q[1]]});
      function commit(){S.set(inp.value);inp.value=fmt(S.v)}
      inp.addEventListener('change',commit);inp.addEventListener('focus',function(){inp.select()});
      ['keydown','keyup'].forEach(function(n){inp.addEventListener(n,function(e){e.stopPropagation();if(n==='keydown'&&e.key==='Enter'){commit();inp.blur()}})});
      function fmt(v){return String(Math.round(v*100)/100)}
      S.watch(function(v){if(document.activeElement!==inp)inp.value=fmt(v);qb.forEach(function(q){q[0].classList.toggle('ghost',q[1]!==v)})})},
    mountAll:function(){document.querySelectorAll('[data-speed]').forEach(function(el){if(!el.firstChild)S.mount(el)})}};

  /* Keep running while away. Every game loop calls Speed.run(tick,paused) once per animation frame.
     Gaps between frames (hidden tab, phone asleep, page frozen) are owed as ticks and caught up as fast as the device allows;
     while the tab is hidden a 1-second timer keeps ticking (browsers stop animation frames there). Pause owes nothing. */
  var owe=0,last=0,drv=null,ff=null,ffN=0,CAP=60*60*60*8;
  function badge(){if(!document.body)return;if(!ff){ff=document.createElement('div');ff.setAttribute('aria-hidden','true');
      ff.style.cssText='position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 6px);transform:translateX(-50%);z-index:99;display:flex;align-items:center;gap:6px;padding:3px 9px;pointer-events:none;background:var(--gk-ink,#111);color:var(--gk-bg,#eee);font:700 13px var(--gk-font,monospace);border-radius:var(--gk-pr,3px)';
      ff.innerHTML='<svg viewBox="0 0 22 14" width="20" height="13" fill="currentColor"><path d="M1 1l9 6-9 6zM11 1l9 6-9 6z"/></svg><span></span>';document.body.appendChild(ff)}
    var sec=Math.ceil(owe/60),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),z=sec%60;ff.lastChild.textContent=(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(z).padStart(2,'0');ff.hidden=false}
  S.ff=false;
  S.ticks=0;
  S.run=function(tick0,paused){var now=Date.now(),tick=function(){var A=window.Auto;if(A&&A.on&&!A.deep&&A.isAce&&!A.isAce()&&!A.think()){A.on=false;try{tick0()}finally{A.on=true}}else tick0();S.ticks++};drv={tick:tick0,paused:paused};
    if(paused){last=now;S.acc=0;if(ff)ff.hidden=true;return 0}
    if(last){var gap=now-last;if(gap>250)owe=Math.min(CAP*S.v,owe+gap/1000*60*S.v)}last=now;
    var n=S.steps(),t0=performance.now(),i=0;
    for(;i<n;i++){tick();if(i>0&&performance.now()-t0>12){S.acc=0;break}}
    if(owe>=1){S.ff=true;var lim=document.hidden?250:(owe>120?28:12);while(owe>=1&&performance.now()-t0<lim){tick();owe--;i++}
      S.ff=owe>=1;if(S.ff&&owe>60){if(++ffN%10===1)badge()}else if(ff)ff.hidden=true}else if(ff&&!ff.hidden)ff.hidden=true;
    return i};
  S.owed=function(){return owe};
  setInterval(function(){if(document.hidden&&drv)S.run(drv.tick,drv.paused)},1000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',S.mountAll);else S.mountAll();
  addEventListener('storage',function(e){if(e.key==='galaxicaSpeed'){S.v=read();cbs.forEach(function(f){f(S.v)})}});
})();
