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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',S.mountAll);else S.mountAll();
  addEventListener('storage',function(e){if(e.key==='galaxicaSpeed'){S.v=read();cbs.forEach(function(f){f(S.v)})}});
})();
