/* Galaxica Online client: global leaderboards (humans and bots on separate boards) and optional ghosts.
   Online.post(game,board,score,{low,ghost}) sends a score only when it beats this device's best already sent.
   Online.open(game,boards,opts) shows the board sheet; it takes its colours and font from the page (--gk-* or theme vars). */
(function(){
  if(window.Online)return;
  function ls(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
  function lss(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function pid(){var p=ls('galaxicaPid',null);if(!p){p='';var a='abcdefghijklmnopqrstuvwxyz0123456789';for(var i=0;i<16;i++)p+=a[Math.floor(Math.random()*36)];lss('galaxicaPid',p)}return p}
  var ROOT=(function(){var s=document.currentScript&&document.currentScript.src||'';return s?s.replace(/shared\/online\.js.*$/,''):'/'})();
  var API=ROOT.replace(/^(https?:\/\/[^/]+).*$/,'$1')+'/api';
  var O=window.Online={pid:pid,name:function(){return ls('galaxicaName','')},
    setName:function(n){n=String(n||'').slice(0,14);lss('galaxicaName',n);fetch(API+'/name',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pid:pid(),name:n})}).catch(function(){})},
    defName:function(){return'Player '+pid().slice(0,4).toUpperCase()},
    post:function(game,board,score,o){o=o||{};if(!isFinite(score))return Promise.resolve(null);var A=window.Auto,bot=A&&A.on,kind=bot?'bot':'human',key=game+'|'+board+'|'+kind+'|'+(bot?A.profile.n:''),best=ls('galaxicaSent',{}),b=best[key];
      if(b!=null&&(o.low?score>=b:score<=b))return Promise.resolve(null);
      var body={game:game,board:board,score:score,low:!!o.low,pid:pid(),kind:kind,name:O.name()||O.defName()};if(bot)body.bot=A.card();if(o.ghost)body.ghost=o.ghost;
      return fetch(API+'/score',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){best=ls('galaxicaSent',{});best[key]=j.best;lss('galaxicaSent',best);O.toast(j)}return j}).catch(function(){return null})},
    top:function(game,board,kind,low){return fetch(API+'/top?game='+encodeURIComponent(game)+'&board='+encodeURIComponent(board)+'&kind='+kind+'&low='+(low?1:0)+'&pid='+pid()+'&limit=30').then(function(r){return r.json()})},
    ghost:function(id){return fetch(API+'/ghost?id='+id).then(function(r){return r.json()})},
    fmt:function(v,f){if(f==='time'){v=Math.round(v);return Math.floor(v/60)+':'+String(v%60).padStart(2,'0')}if(f==='kg')return(Math.round(v*100)/100).toFixed(2);return String(Math.round(v))},
    toast:function(j){if(!j||!j.improved||j.rank>50)return;var t=document.createElement('div');t.className='ol-toast';t.innerHTML=ICON.podium+'<b>'+j.rank+'</b>';(document.getElementById('stage')||document.body).appendChild(t);setTimeout(function(){t.remove()},2600)}};
  var SV=function(p,extra){return'<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" '+(extra||'')+'>'+p+'</svg>'};
  var ICON={podium:SV('<path d="M2 19h18M3 19v-6h5v6M8 19V7h6v12M14 19v-9h5v9"/>'),person:SV('<circle cx="11" cy="7" r="3.5"/><path d="M4 20c1-5 4-7 7-7s6 2 7 7"/>'),bot:SV('<rect x="4" y="7" width="14" height="11" rx="2"/><path d="M11 3v4M8 12h.5M13.5 12h.5M8 15h6"/>'),
    pen:SV('<path d="M4 18l1-4L15 4l3 3L8 17z"/>'),ghost:SV('<path d="M5 20V10a6 6 0 0 1 12 0v10l-2-2-2 2-2-2-2 2-2-2z"/><circle cx="9" cy="10" r="1"/><circle cx="13" cy="10" r="1"/>'),off:SV('<path d="M3 3l16 16M8 16a5 5 0 0 1 6 0M5 12a10 10 0 0 1 4-2M17 12a10 10 0 0 0-3-2"/>')};
  O.ICON=ICON;
  var css='.ol-m{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:12px}'+
   '.ol-s{background:var(--gk-bg,var(--ink,#0b1016));color:var(--gk-ink,var(--paper,#efe6d2));border:var(--gk-bw,2px) solid currentColor;border-radius:var(--gk-pr,0);width:min(560px,100%);max-height:100%;display:flex;flex-direction:column;gap:10px;padding:14px;font:15px var(--gk-font,var(--mono,monospace))}'+
   '.ol-h{display:flex;gap:8px;align-items:center}.ol-h label{display:flex;align-items:center;gap:6px;flex:1;min-width:0}.ol-h svg,.ol-tabs svg,.ol-r svg,.ol-f svg{width:20px;height:20px;flex:none}'+
   '.ol-h input{flex:1;min-width:0;height:36px;padding:0 8px;background:transparent;color:inherit;border:var(--gk-bw,2px) solid currentColor;border-radius:var(--gk-pr,0);font:inherit}'+
   '.ol-x,.ol-tabs button,.ol-g{height:36px;min-width:36px;padding:0 9px;display:inline-flex;align-items:center;justify-content:center;gap:5px;background:transparent;color:inherit;border:var(--gk-bw,2px) solid currentColor;border-radius:var(--gk-pr,0);font:inherit;cursor:pointer}'+
   '.ol-tabs{display:flex;flex-wrap:wrap;gap:6px}.ol-tabs button.on{background:var(--gk-acc,var(--amber,#ffb000));border-color:var(--gk-acc,var(--amber,#ffb000));color:var(--gk-bg,var(--ink,#0b1016))}.ol-k{display:flex;gap:6px;margin-left:auto}'+
   '.ol-list{overflow:auto;min-height:120px;display:flex;flex-direction:column}.ol-r{display:grid;grid-template-columns:2.4em 1fr auto auto;gap:8px;align-items:center;padding:6px 2px;border-bottom:1px solid color-mix(in srgb,currentColor 25%,transparent)}'+
   '.ol-r.me{background:color-mix(in srgb,var(--gk-acc,var(--amber,#ffb000)) 25%,transparent)}.ol-r b{font-variant-numeric:tabular-nums}.ol-r .nm{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.ol-r .dot{width:12px;height:12px;border-radius:50%;flex:none}'+
   '.ol-e{opacity:.7;padding:20px 4px;display:flex;gap:8px;align-items:center}.ol-f{display:flex;align-items:center;gap:8px;opacity:.85}'+
   '.ol-toast{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 50px);z-index:30;display:flex;align-items:center;gap:6px;padding:4px 10px;background:var(--gk-acc,var(--amber,#ffb000));color:var(--gk-bg,var(--ink,#0b1016));font:700 18px var(--gk-font,monospace);border-radius:var(--gk-pr,0);pointer-events:none}.ol-toast svg{width:20px;height:20px}';
  var st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
  /* boards: [{key,ic(svg string),low,fmt,title}] */
  O.open=function(game,boards,opts){opts=opts||{};var bi=0,kind=window.Auto&&Auto.on?'bot':'human',m=document.createElement('div');m.className='ol-m';var s=document.createElement('div');s.className='ol-s';m.appendChild(s);
    var h=document.createElement('div');h.className='ol-h';h.innerHTML='<label>'+ICON.pen+'<input maxlength="14" aria-label="Name" placeholder="'+O.defName()+'"></label>';var inp=h.querySelector('input');inp.value=O.name();
    inp.addEventListener('change',function(){O.setName(inp.value.trim());load()});['keydown','keyup'].forEach(function(n){inp.addEventListener(n,function(e){e.stopPropagation()})});
    var x=document.createElement('button');x.className='ol-x';x.textContent='×';x.title='Close';x.onclick=function(){m.remove()};h.appendChild(x);s.appendChild(h);
    var tabs=document.createElement('div');tabs.className='ol-tabs';s.appendChild(tabs);var list=document.createElement('div');list.className='ol-list';s.appendChild(list);var foot=document.createElement('div');foot.className='ol-f';s.appendChild(foot);
    function paintTabs(){tabs.innerHTML='';boards.forEach(function(b,i){var t=document.createElement('button');t.className=i===bi?'on':'';t.title=b.title||b.key;t.innerHTML=(b.ic||'')+(b.label?'<span>'+b.label+'</span>':'');t.onclick=function(){bi=i;paintTabs();load()};tabs.appendChild(t)});
      var kg=document.createElement('span');kg.className='ol-k';tabs.appendChild(kg);[['human','person','People'],['bot','bot','Bots']].forEach(function(k){var t=document.createElement('button');t.className=kind===k[0]?'on':'';t.title=k[2];t.innerHTML=ICON[k[1]];t.onclick=function(){kind=k[0];paintTabs();load()};kg.appendChild(t)})}
    function load(){var b=boards[bi];list.innerHTML='<div class="ol-e">…</div>';foot.innerHTML='';
      O.top(game,b.key,kind,b.low).then(function(j){list.innerHTML='';if(!j.rows||!j.rows.length){list.innerHTML='<div class="ol-e">'+ICON.podium+'0</div>';return}
        j.rows.forEach(function(r,i){var row=document.createElement('div');row.className='ol-r'+(r.me?' me':'');var nm=r.bot?'<span class="dot" style="background:'+(r.bot.c||'currentColor')+'"></span>'+esc(r.name):esc(r.name);
          row.innerHTML='<b>'+(i+1)+'</b><span class="nm">'+nm+'</span><b>'+O.fmt(r.score,b.fmt)+'</b>';var g=document.createElement('span');if(r.g&&opts.onGhost){var gb=document.createElement('button');gb.className='ol-g';gb.title='Race this ghost';gb.innerHTML=ICON.ghost;gb.onclick=function(){O.ghost(r.id).then(function(gj){m.remove();opts.onGhost(gj,b)})};g.appendChild(gb)}row.appendChild(g);list.appendChild(row)});
        foot.innerHTML=ICON.podium+'<span>'+(j.mine?j.mine.rank+' / '+j.total:j.total)+'</span>'}).catch(function(){list.innerHTML='<div class="ol-e">'+ICON.off+'</div>'})}
    function esc(t){var d=document.createElement('span');d.textContent=t;return d.innerHTML}
    paintTabs();load();m.addEventListener('pointerdown',function(e){if(e.target===m)m.remove()});document.body.appendChild(m);return m};
})();
/* games with their own bars: read a saved best from localStorage, post improvements, add a matching Scores button */
(function(){var O=window.Online;function rd(k){try{var v=localStorage.getItem(k);return v==null?null:JSON.parse(v)}catch(e){return null}}
  O.watch=function(game,boards){var last={};function poll(){boards.forEach(function(b){var v=b.read(rd);if(v==null||!isFinite(v)||v<=0||last[b.key]===v)return;last[b.key]=v;O.post(game,b.key,v,{low:b.low})})}setInterval(poll,4000);setTimeout(poll,2000)};
  O.button=function(game,boards,host){if(!host)return;var sib=host.querySelector('button'),b=document.createElement('button');b.type='button';b.className=sib?sib.className.replace(/\b(on|active|pulse)\b/g,''):'';b.title='Scores';b.setAttribute('aria-label','Scores');
    b.innerHTML=O.ICON.podium;var sv=b.querySelector('svg');sv.setAttribute('width','18');sv.setAttribute('height','18');b.onclick=function(e){e.stopPropagation();O.open(game,boards.map(function(x){return{key:x.key,ic:x.ic||O.ICON.podium,low:x.low,fmt:x.fmt,label:x.label,title:x.title}}))};host.appendChild(b);return b}})();
