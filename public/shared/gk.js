/* Game Kit v2 (GK): plumbing only, NO look. Each game styles its own controls via CSS variables (see gk.css).
   Needs device.js, auto.js, speed.js first.
   GK.id(name)            per-game storage namespace
   GK.ls.get/set(key,def) JSON localStorage (safe)
   GK.rng(seed)           mulberry32
   GK.audio               ac(), tone(), noise(), mute toggle (shared key galaxicaMute)
   GK.controls(el,opts)   builds back/auto/speed/sound/pause/help buttons into el; returns refs
   GK.fit(cv,stage,W,H)   letterbox a logical WxH (or fill when W,H omitted); returns {s,w,h,dpr}
   GK.loop(tick,draw)     speed-aware fixed-step loop (Speed.steps ticks per frame, 12ms budget)
   GK.pointer(cv,h)       unified pointer: h.down/move/up(x,y,e) in canvas CSS px; h.key(code,down)
   GK.tutorial(o)         wordless first-run tutorial manager
*/
(function(){
var GK=window.GK={},NS='';
GK.id=function(n){NS='gk_'+n+'_';return GK};
GK.ls={get:function(k,d){try{var v=localStorage.getItem(NS+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(NS+k,JSON.stringify(v))}catch(e){}}};
GK.rng=function(seed){var a=seed|0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
GK.clamp=function(v,a,b){return v<a?a:v>b?b:v};
GK.lerp=function(a,b,t){return a+(b-a)*t};

/* ---------- audio ---------- */
var AC=null,mute=false;try{mute=localStorage.galaxicaMute==='true'||localStorage.galaxicaMute==='1'}catch(e){}
GK.audio={
  get ctx(){return AC},get mute(){return mute},
  ac:function(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC},
  setMute:function(v){mute=!!v;try{localStorage.galaxicaMute=String(mute)}catch(e){}GK._snd&&GK._snd.forEach(function(b){b.classList.toggle('off',mute)})},
  tone:function(f,d,type,vol,slide,when,dest){if(mute||!AC||Speed.v>2.5)return;var t=when||AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+d);g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest||AC.destination);o.start(t);o.stop(t+d+.02)},
  noise:function(d,vol,when,hp){if(mute||!AC||Speed.v>2.5)return;var n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),x=b.getChannelData(0);for(var i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);
    var s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=vol||.1;if(hp){var f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=hp;s.connect(f);f.connect(g)}else s.connect(g);g.connect(AC.destination);s.start(when||AC.currentTime)}};
document.addEventListener('pointerdown',function(){GK.audio.ac()},{capture:true});
document.addEventListener('keydown',function(){GK.audio.ac()},{capture:true});

/* ---------- controls ---------- */
var IC={
  back:'<path d="M14 4L7 11l7 7"/>',
  snd:'<path class="f" d="M3 8h3.5L11 4.5v13L6.5 14H3z"/><path class="w" d="M14 8c1.6 1.6 1.6 4.4 0 6M16.5 5.5c3 3 3 8 0 11"/><path class="x" d="M14 8l5 6M19 8l-5 6"/>',
  pause:'<path class="pa" d="M7.5 5v12M14.5 5v12"/><path class="pl f" d="M7 4.5l10 6.5-10 6.5z"/>',
  help:'<path d="M8 8.5a3 3 0 1 1 4.2 2.7c-.8.4-1.2 1-1.2 1.8"/><circle class="f" cx="11" cy="16.6" r="1"/>',
  auto:'<path d="M4 17L11 4l7 13M6.6 12.5h8.8"/>',
  restart:'<path d="M4.5 11a6.5 6.5 0 1 0 2.2-4.9"/><path d="M4 3.5v4.2h4.2"/>',
  info:'<circle cx="11" cy="11" r="8"/><path d="M11 10v6"/><circle class="f" cx="11" cy="6.6" r="1"/>'};
GK.icon=function(n){return'<svg viewBox="0 0 22 22" aria-hidden="true">'+(IC[n]||'')+'</svg>'};
GK.controls=function(el,o){o=o||{};var R={};GK._snd=[];
  function b(cls,html,title,fn,tag){var e=document.createElement(tag||'button');e.className='gk-b '+cls;e.innerHTML=html;e.title=title;e.setAttribute('aria-label',title);if(fn)e.onclick=fn;return e}
  var g1=document.createElement('div');g1.className='gk-g g1';var g2=document.createElement('div');g2.className='gk-g g2';var g3=document.createElement('div');g3.className='gk-g g3';
  if(o.bar)document.documentElement.dataset.bar=o.bar;var drawer=o.drawer!==false,more=null;if(drawer){more=document.createElement('div');more.className='gk-more';more.hidden=true}
  var back=b('back',GK.icon('back'),'Arcade',null,'a');back.href=o.home||'../../';g1.appendChild(back);R.back=back;
  (o.extra||[]).forEach(function(x){var e=b(x.cls||'',x.html,x.title,x.fn);g1.appendChild(e);R[x.id||'x']=e});
  if(o.pause!==false){R.pause=b('pause',GK.icon('pause'),'Pause',function(){GK.setPaused(!GK.paused)});g1.appendChild(R.pause)}
  if(o.auto!==false){R.auto=b('auto',GK.icon('auto'),'Auto',null);g2.appendChild(R.auto);Auto.bind(R.auto);R.auto.classList.add('gk-auto')}
  if(o.speed!==false){var sp=document.createElement('span');sp.setAttribute('data-speed','');(drawer?more:g2).appendChild(sp);Speed.mount(sp);R.speed=sp}
  if(drawer){g3=more;R.more=b('more','<svg viewBox="0 0 22 22" aria-hidden="true"><circle class="f" cx="5" cy="11" r="1.8"/><circle class="f" cx="11" cy="11" r="1.8"/><circle class="f" cx="17" cy="11" r="1.8"/></svg>','More',function(){more.hidden=!more.hidden;R.more.classList.toggle('on',!more.hidden)});g2.appendChild(R.more);R.panel=more;
    document.addEventListener('pointerdown',function(e){if(!more.hidden&&!more.contains(e.target)&&!R.more.contains(e.target)){more.hidden=true;R.more.classList.remove('on')}},true)}
  R.snd=b('snd',GK.icon('snd'),'Sound',function(){GK.audio.ac();GK.audio.setMute(!GK.audio.mute)});GK._snd.push(R.snd);R.snd.classList.toggle('off',mute);g3.appendChild(R.snd);
  R.names=b('names',GK.icon('info'),'Names',function(){GK.setNames(!GK.names)});g3.appendChild(R.names);R.names.classList.toggle('on',GK.names);
  if(o.help!==false){R.help=b('help',GK.icon('help'),'Tutorial',function(){o.onHelp&&o.onHelp()});g3.appendChild(R.help)}
  el.classList.add('gk-bar');el.append(g1,g2);if(!drawer)el.appendChild(g3);else el.appendChild(more);setTimeout(function(){dispatchEvent(new Event('resize'))},30);return R};
/* names mode: a caption under every button (title text) */
GK.names=false;try{GK.names=localStorage.galaxicaNames==='1'}catch(e){}
function capAll(root){[].forEach.call((root||document).querySelectorAll('.gk-b,.v,.tl'),function(b){var t=(b.title||b.getAttribute('aria-label')||'').replace(/ \(.*\)$/,'');if(t&&b.dataset.cap!==t)b.dataset.cap=t})}
GK.setNames=function(v){GK.names=!!v;document.documentElement.classList.toggle('gk-names',GK.names);try{localStorage.galaxicaNames=GK.names?'1':'0'}catch(e){}document.querySelectorAll('.gk-b.names').forEach(function(b){b.classList.toggle('on',GK.names)});capAll();setTimeout(function(){dispatchEvent(new Event('resize'))},60)};
document.documentElement.classList.toggle('gk-names',GK.names);
(function(){var t=0;function go(){if(t)return;t=setTimeout(function(){t=0;capAll()},40)}function boot(){capAll();if(GK.names)setTimeout(function(){dispatchEvent(new Event('resize'))},150);new MutationObserver(go).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['title']})}if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot)})();
GK.paused=false;
GK.setPaused=function(v){GK.paused=!!v;var ov=document.getElementById('gkpause');
  if(GK.paused&&!ov){var st=document.getElementById('stage')||document.body;ov=document.createElement('div');ov.id='gkpause';ov.innerHTML='<i></i><i></i>';ov.onclick=function(){GK.setPaused(false)};st.appendChild(ov)}else if(!GK.paused&&ov){ov.remove()}
document.querySelectorAll('.gk-b.pause').forEach(function(b){b.classList.toggle('paused',GK.paused)});GK.onPause&&GK.onPause(GK.paused)};
var autoPaused=false;document.addEventListener('visibilitychange',function(){if(document.hidden&&!GK.paused){autoPaused=true;GK.setPaused(true)}else if(!document.hidden&&autoPaused){autoPaused=false;GK.setPaused(false)}});
addEventListener('keydown',function(e){if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
  if(e.code==='KeyP'||e.code==='Escape'){GK.setPaused(!GK.paused)}else if(e.code==='KeyM'){GK.audio.setMute(!GK.audio.mute)}});

/* ---------- canvas fit ---------- */
GK.fit=function(cv,stage,W,H,max){var r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),cw=Math.max(40,r.width),ch=Math.max(40,r.height),w,h,s=1;
  if(W&&H){s=Math.min(cw/W,ch/H);if(max)s=Math.min(s,max);w=W*s;h=H*s}else{w=cw;h=ch}
  cv.style.width=w+'px';cv.style.height=h+'px';cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
  GK.view={s:s,w:w,h:h,dpr:dpr,W:W||w,H:H||h};return GK.view};

/* ---------- loop ---------- */
GK.loop=function(tick,draw,pre){var last=0;(function f(ts){
  if(pre)pre(ts);
  if(!GK.paused){var n=Speed.steps(),t0=performance.now();for(var i=0;i<n;i++){tick();if(i>0&&performance.now()-t0>12){Speed.acc=0;break}}}
  draw();requestAnimationFrame(f)})(0)};

/* ---------- pointer ---------- */
GK.keys={};
GK.pointer=function(cv,h){var down=null;
  function pos(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*(GK.view?GK.view.W/r.width:1),y:(e.clientY-r.top)*(GK.view?GK.view.H/r.height:1)}}
  cv.addEventListener('pointerdown',function(e){if(e.button>0)return;try{cv.setPointerCapture(e.pointerId)}catch(_){}var p=pos(e);down=e.pointerId;h.down&&h.down(p.x,p.y,e)});
  cv.addEventListener('pointermove',function(e){var p=pos(e);if(down===e.pointerId||h.hover)h.move&&h.move(p.x,p.y,e,down===e.pointerId)});
  var up=function(e){if(down!==e.pointerId)return;down=null;var p=pos(e);h.up&&h.up(p.x,p.y,e)};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  addEventListener('keydown',function(e){if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;GK.keys[e.code]=true;if(!e.repeat&&h.key)h.key(e.code,true,e);
    if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(e.code)>-1)e.preventDefault()});
  addEventListener('keyup',function(e){GK.keys[e.code]=false;h.key&&h.key(e.code,false,e)});
  return{pos:pos}};

/* ---------- wordless tutorial ---------- */
GK.tutorial=function(o){
  var T={i:-1,active:false,t:0,steps:o.steps,seen:GK.ls.get('tut',0)};
  var wrap=document.createElement('div');wrap.className='gk-tut';wrap.hidden=true;
  wrap.innerHTML='<div class="gk-pips"></div><button class="gk-skip" type="button">skip</button>';
  (o.parent||document.body).appendChild(wrap);
  var pips=wrap.querySelector('.gk-pips');T.steps.forEach(function(){pips.appendChild(document.createElement('i'))});
  function paint(){[].forEach.call(pips.children,function(p,j){p.className=j<T.i?'done':j===T.i?'now':''})}
  T.start=function(){T.i=0;T.active=true;T.t=0;wrap.hidden=false;o.onStart&&o.onStart();T.steps[0].init&&T.steps[0].init();paint()};
  T.end=function(){T.active=false;wrap.hidden=true;T.i=-1;GK.ls.set('tut',1);T.seen=1;o.onEnd&&o.onEnd()};
  wrap.querySelector('.gk-skip').onclick=T.end;
  T.tick=function(){if(!T.active)return;T.t++;var s=T.steps[T.i];s.update&&s.update(T.t);
    if(s.done&&s.done(T.t)){T.i++;T.t=0;if(T.i>=T.steps.length){T.end();return}T.steps[T.i].init&&T.steps[T.i].init();paint()}};
  T.draw=function(ctx){if(!T.active)return;var s=T.steps[T.i];s.draw&&s.draw(ctx,T.t)};
  T.maybe=function(){if(!T.seen&&!(window.Auto&&Auto.on))T.start()};
  return T};

/* helpers for hint animation: a pulsing ring + ghost finger dot */
GK.pulse=function(ctx,x,y,t,col,r0){var p=(t%70)/70;ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;ctx.globalAlpha=1-p;ctx.beginPath();ctx.arc(x,y,(r0||8)+p*28,0,6.2832);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,y,(r0||8)*.5,0,6.2832);ctx.fill();ctx.restore()};
GK.swipe=function(ctx,x0,y0,x1,y1,t,col){var p=(t%110)/110,e=p<.75?p/.75:1,x=x0+(x1-x0)*e,y=y0+(y1-y0)*e;ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;ctx.globalAlpha=p<.75?1:1-(p-.75)/.25;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(x0,y0,6,0,6.2832);ctx.stroke();ctx.beginPath();ctx.arc(x,y,7,0,6.2832);ctx.fill();ctx.restore()};
})();
