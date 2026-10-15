/* Gravity Garden UI: palette, input, camera, inspector, menus, codex, goals, saves, sound, AUTO gardener, tutorial, main loop. */
(function(){
var GG=window.GG,V=GG.V,W=GG.W,TAU=GG.TAU;
function $(i){return document.getElementById(i)}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
var cv=$('c'),ctx=cv.getContext('2d'),stage=$('stage');

/* ---------- icons ---------- */
var IC={
 planet:'<circle cx="10" cy="12" r="4.5"/><circle class="f" cx="17" cy="5" r="1.8"/>',
 star:'<circle class="f" cx="11" cy="11" r="3.6"/><path d="M11 2v3.5M11 16.5V20M2 11h3.5M16.5 11H20M4.6 4.6l2.4 2.4M15 15l2.4 2.4M4.6 17.4L7 15M15 7l2.4-2.4"/>',
 small:'<circle cx="7" cy="14" r="2.4"/><circle class="f" cx="15" cy="7" r="1.7"/><circle cx="16" cy="16" r="1.3"/>',
 exotic:'<circle cx="11" cy="11" r="2"/><circle cx="11" cy="11" r="5.2" stroke-dasharray="2 2.4"/><circle cx="11" cy="11" r="8.6" stroke-dasharray="1 3"/>',
 tools:'<path d="M5 3l12 7-5 1.5L10 18z"/>',
 select:'<path d="M5 3l12 7-5 1.5L10 18z"/>',
 hand:'<path d="M11 3v16M3 11h16M11 3l-2 2M11 3l2 2M11 19l-2-2M11 19l2-2M3 11l2-2M3 11l2 2M19 11l-2-2M19 11l-2 2"/>',
 erase:'<path d="M5 5l12 12M17 5L5 17"/>',
 pull:'<circle class="f" cx="11" cy="11" r="1.8"/><path d="M3 3l5 5M19 3l-5 5M3 19l5-5M19 19l-5-5M8 5v3h-3M14 5v3h3M8 17v-3h-3M14 17v-3h3"/>',
 push:'<circle class="f" cx="11" cy="11" r="1.8"/><path d="M8 8L3 3M14 8l5-5M8 14l-5 5M14 14l5 5M3 7V3h4M19 7V3h-4M3 15v4h4M19 15v4h-4"/>',
 anchor:'<circle cx="11" cy="5" r="2"/><path d="M11 7v12M6.5 11.5h9M4.5 14.5a6.5 6.5 0 0 0 13 0"/>',
 pause:'<path class="pa" d="M7.5 5v12M14.5 5v12"/><path class="pl f" d="M7 4.5l10 6.5-10 6.5z"/>',
 undo:'<path d="M4 9h9a5 5 0 0 1 0 10H8M4 9l4-4M4 9l4 4"/>',
 reset:'<path d="M4.5 11a6.5 6.5 0 1 0 2.2-4.9"/><path d="M4 3.5v4.2h4.2"/>',
 sound:'<path class="f" d="M3 8h3.5L11 4.5v13L6.5 14H3z"/><path class="w" d="M14 8c1.6 1.6 1.6 4.4 0 6M16.5 5.5c3 3 3 8 0 11"/><path class="x" d="M14 8l5 6M19 8l-5 6"/>',
 presets:'<rect x="3" y="3" width="6.5" height="6.5"/><rect x="12.5" y="3" width="6.5" height="6.5"/><rect x="3" y="12.5" width="6.5" height="6.5"/><rect x="12.5" y="12.5" width="6.5" height="6.5"/>',
 dice:'<rect x="3" y="3" width="16" height="16"/><circle class="f" cx="8" cy="8" r="1.3"/><circle class="f" cx="14" cy="8" r="1.3"/><circle class="f" cx="11" cy="11" r="1.3"/><circle class="f" cx="8" cy="14" r="1.3"/><circle class="f" cx="14" cy="14" r="1.3"/>',
 save:'<path d="M4 4h12l3 3v11H4z"/><path d="M8 4v5h7V4M7 18v-5h8v5"/>',
 book:'<path d="M4 4h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM18 4h-6v15a2 2 0 0 1 2-2h4z"/>',
 goals:'<circle cx="11" cy="9" r="5"/><path d="M8 13l-2 6 5-2 5 2-2-6"/>',
 shot:'<rect x="3" y="7" width="16" height="11"/><circle cx="11" cy="12.5" r="3"/><path d="M8 7l1-2h4l1 2"/>',
 gear:'<path d="M4 6h14M4 11h14M4 16h14"/><circle class="f" cx="8" cy="6" r="2"/><circle class="f" cx="14" cy="11" r="2"/><circle class="f" cx="7" cy="16" r="2"/>',
 menu:'<path d="M4 6h14M4 11h14M4 16h14"/>',
 info:'<circle cx="11" cy="11" r="8"/><path d="M11 10v6"/><circle class="f" cx="11" cy="6.6" r="1"/>',
 center:'<circle cx="11" cy="11" r="3"/><path d="M11 2v4M11 16v4M2 11h4M16 11h4"/>',
 follow:'<circle cx="11" cy="11" r="6"/><circle class="f" cx="11" cy="11" r="1.6"/><path d="M11 2v3M11 17v3M2 11h3M17 11h3"/>',
 clone:'<rect x="3" y="7" width="11" height="11"/><path d="M8 7V3h11v11h-5"/>',
 minus:'<path d="M5 11h12"/>',plus:'<path d="M5 11h12M11 5v12"/>',
 trash:'<path d="M4 6h14M8 6V3h6v3M6 6l1 13h8l1-13"/>',
 trails:'<path d="M3 16c4-9 8 4 16-9"/>',
 bands:'<circle cx="11" cy="11" r="4" stroke-dasharray="2 2"/><circle cx="11" cy="11" r="8" stroke-dasharray="2 2"/>',
 labels:'<path d="M4 17l4-11 4 11M5.5 13h5M14 17V9M14 11c1-2 4-2 4 1v5"/>',
 grid:'<path d="M3 8h16M3 14h16M8 3v16M14 3v16"/>',
 wild:'<path d="M12 2L6 12h5l-1 8 6-10h-5z"/>',
 music:'<path d="M8 16V5l9-2v11"/><circle class="f" cx="6" cy="16" r="2"/><circle class="f" cx="15" cy="14" r="2"/>',
 petal:'<circle cx="11" cy="11" r="2"/><ellipse cx="11" cy="5" rx="1.8" ry="3"/><ellipse cx="11" cy="17" rx="1.8" ry="3"/><ellipse cx="5" cy="11" rx="3" ry="1.8"/><ellipse cx="17" cy="11" rx="3" ry="1.8"/>',
 city:'<path d="M3 19V10h4v9M9 19V4h4v15M15 19v-7h4v7M3 19h16"/>',
 sat:'<circle cx="11" cy="11" r="3"/><circle cx="11" cy="11" r="8" stroke-dasharray="2 2.5"/><circle class="f" cx="17" cy="5.5" r="1.6"/>',
 halo:'<circle cx="11" cy="11" r="3"/><circle cx="11" cy="11" r="6" stroke-dasharray="3 2"/><circle cx="11" cy="11" r="9" stroke-dasharray="1 3"/>',
 binary:'<circle class="f" cx="7" cy="11" r="3"/><circle cx="16" cy="11" r="2.2"/><path d="M10 6c3-2 5 0 6 3M10 16c3 2 5 0 6-3" stroke-dasharray="1.5 2"/>',
 hole:'<circle class="f" cx="11" cy="11" r="4"/><circle cx="11" cy="11" r="8.4" stroke-dasharray="2 3"/>',
 worm:'<path d="M11 11m0 0a1 1 0 1 1 2 0a3 3 0 1 1-5 -1a5 5 0 1 1 8 5a7 7 0 1 1-11-8"/>',
 comet:'<circle class="f" cx="16" cy="6" r="2.2"/><path d="M14 8L3 19M14 6L5 8M16 8l-2 9"/>',
 moon:'<path d="M15 4a8 8 0 1 0 3 12A7 7 0 0 1 15 4z"/>',
 dots:'<circle class="f" cx="6" cy="6" r="1.5"/><circle class="f" cx="15" cy="5" r="1.5"/><circle class="f" cx="10" cy="11" r="1.5"/><circle class="f" cx="5" cy="16" r="1.5"/><circle class="f" cx="16" cy="15" r="1.5"/>',
 hour:'<circle cx="11" cy="11" r="8"/><path d="M11 6v5l3 2"/>',
 merge:'<circle cx="8" cy="11" r="5"/><circle cx="14" cy="11" r="5"/>',
 burst:'<path d="M11 2l2 6 6-2-4 5 4 5-6-2-2 6-2-6-6 2 4-5-4-5 6 2z"/>',
 crater:'<circle cx="11" cy="11" r="8"/><circle cx="8" cy="9" r="1.6"/><circle cx="14" cy="13" r="2"/><circle cx="13" cy="7" r="1"/>',
 cross:'<path d="M5 5l12 12M17 5L5 17"/><circle cx="11" cy="11" r="9"/>',
 bolt:'<path d="M12 2L6 12h5l-1 8 6-10h-5z"/>',
 classes:'<circle cx="6" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="11" cy="16" r="3"/>',
 species:'<ellipse cx="11" cy="11" rx="7" ry="5"/><circle class="f" cx="14" cy="9" r="1"/><path d="M7 16l-1 3M15 16l1 3M4 11c-2-1-2-3-1-5"/>',
 seed:'<path d="M11 19V9M11 9c-5 0-6-4-6-6 5 0 6 3 6 6zM11 12c4 0 6-3 6-5-4 0-6 2-6 5z"/>'};
function svg(n){return'<svg viewBox="0 0 22 22" aria-hidden="true">'+(IC[n]||'')+'</svg>'}

/* ---------- state ---------- */
var set=Object.assign({trails:1,bands:1,labels:0,grid:1,wild:1,music:1,caps:0,theme:'paper'},GG.lsGet('ggSet',{}));
function applySet(){V.opt.trails=set.trails;V.opt.bands=set.bands;V.opt.labels=set.labels;V.opt.grid=set.grid;W.wild=!!set.wild;GG.setTheme(set.theme);document.body.classList.toggle('caps',!!set.caps);GG.lsSet('ggSet',set)}
var AC=null,mute=GG.lsGet('galaxicaMute',false),paused=false,tool=null,size=1,best=GG.lsGet('ggBest',0),tut=null,tutT=0,botN=0,fr=0,hist=[];
var undo=[];
function snap(){try{undo.push(JSON.stringify(GG.save()));if(undo.length>30)undo.shift()}catch(e){}}

/* ---------- audio ---------- */
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f,d,type,vol,slide){if(mute||!AC||Speed.v>2.5)return;var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)}
function noise(d,vol){if(mute||!AC||Speed.v>2.5)return;var n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),x=b.getChannelData(0);for(var i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);
  var s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=vol||.1;s.connect(g);g.connect(AC.destination);s.start()}
var PENTA=[0,2,4,7,9];
function note(r){if(mute||!AC||!set.music||Speed.v>4)return;var i=Math.max(0,Math.min(14,Math.round(14-Math.log(r/22)*5))),f=196*Math.pow(2,PENTA[i%5]/12+Math.floor(i/5));
  var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.03,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.9);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+1)}

/* ---------- tools ---------- */
var TOOLS=[],GROUPS=['planet','star','small','exotic','tools'];
GG.CLS.forEach(function(c){TOOLS.push({id:c.id,g:'planet',kind:'planet',cls:c.id})});
GG.STAR.forEach(function(s){TOOLS.push({id:'s'+s.id,g:'star',kind:'star',cls:s.id})});
TOOLS.push({id:'dwarf',g:'star',kind:'dwarf',cls:'W'},{id:'neutron',g:'star',kind:'neutron',cls:'N'},{id:'hole',g:'star',kind:'hole',cls:'H'});
TOOLS.push({id:'moon',g:'small',kind:'moon',cls:''},{id:'rock',g:'small',kind:'rock',cls:''},{id:'belt',g:'small',kind:'rock',cls:'',belt:1},{id:'comet',g:'small',kind:'comet',cls:''},{id:'station',g:'small',kind:'station',cls:''});
TOOLS.push({id:'binary',g:'exotic',kind:'star',cls:'G',pair:1},{id:'wormhole',g:'exotic',kind:'wormhole',cls:''},{id:'dark',g:'exotic',kind:'dark',cls:''},{id:'repulsor',g:'exotic',kind:'repulsor',cls:''},{id:'nebula',g:'exotic',kind:'nebula',cls:''});
['select','hand','erase','pull','push','anchor'].forEach(function(n){TOOLS.push({id:n,g:'tools',icon:n,act:1})});
var TB={};TOOLS.forEach(function(t){TB[t.id]=t});
tool=TB.ocean;var group='planet';
var tabsEl=$('tabs'),palEl=$('pal'),sizesEl=$('sizes');
GROUPS.forEach(function(g){var b=el('button','ib','');b.innerHTML=svg(g);b.dataset.g=g;b.title=({planet:'planets',star:'stars',small:'small',exotic:'exotic',tools:'tools'})[g];b.setAttribute('aria-label',g);b.onclick=function(){ac();setGroup(g)};tabsEl.appendChild(b)});
function setGroup(g){group=g;[].forEach.call(tabsEl.children,function(b){b.classList.toggle('sel',b.dataset.g===g)});buildPal();sizesEl.style.display=g==='planet'?'flex':'none'}
function buildPal(){palEl.innerHTML='';TOOLS.filter(function(t){return t.g===group}).forEach(function(t){
  var b=el('button','tl'+(t===tool?' sel':''),'');b.title=t.g==='star'&&t.cls.length===1&&t.kind==='star'?t.cls+' star':t.id;b.dataset.t=t.id;
  if(t.act)b.innerHTML=svg(t.icon);else{var c=el('canvas');b.appendChild(c);requestAnimationFrame(function(){GG.glyph(c,t.kind,t.cls,{seed:t.belt?3:7})})}
  b.onclick=function(){ac();setTool(t)};palEl.appendChild(b)})}
function setTool(t){tool=t;V.pend=null;[].forEach.call(palEl.children,function(b){b.classList.toggle('sel',b.dataset.t===t.id)})}
[.6,1,1.8].forEach(function(s,i){var b=el('button','ib'+(i===1?' sel':''),'<svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="'+(3+i*2)+'" fill="currentColor" stroke="none"/></svg>');b.title='size '+(i+1);b.onclick=function(){size=i;[].forEach.call(sizesEl.children,function(x,j){x.classList.toggle('sel',j===i)})};sizesEl.appendChild(b)});

/* ---------- actions ---------- */
function toggleSnd(){ac();mute=!mute;GG.lsSet('galaxicaMute',mute);paintSnd()}
var sndBtns=[];function paintSnd(){sndBtns.forEach(function(b){b.classList.toggle('off',mute)})}
function setPause(v){paused=v;[].forEach.call(document.querySelectorAll('[data-a=pause]'),function(b){b.classList.toggle('paused',v)})}
function doUndo(){var s=undo.pop();if(s){GG.load(JSON.parse(s));V.sel=0;hideInsp()}}
function doReset(){snap();GG.newWorld();V.sel=0;hideInsp();V.cam.x=0;V.cam.y=0;V.cam.z=1}
function center(){V.cam.x=0;V.cam.y=0;V.cam.z=1;V.follow=0}
function shot(){cv.toBlob(function(b){if(!b)return;var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='gravity-garden.png';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)})}
var ACTS={
 pause:{ic:'pause',t:'Pause (Space)',f:function(){setPause(!paused)}},undo:{ic:'undo',t:'Undo (Z)',f:doUndo},reset:{ic:'reset',t:'New (R)',f:doReset},
 sound:{ic:'sound',t:'Sound (M)',f:toggleSnd},help:{ic:'q',t:'Tutorial',f:function(){startTut()}},
 presets:{ic:'presets',t:'Systems',f:function(){openM('pre')}},dice:{ic:'dice',t:'Random',f:function(){openM('pre')}},
 saves:{ic:'save',t:'Saves',f:function(){openM('sav')}},codex:{ic:'book',t:'Codex',f:function(){openM('cod')}},goals:{ic:'goals',t:'Goals',f:function(){openM('gol')}},
 shot:{ic:'shot',t:'Picture (P)',f:shot},settings:{ic:'gear',t:'Settings',f:function(){openM('set')}},center:{ic:'center',t:'Centre (0)',f:center},
 caps:{ic:'info',t:'Names',f:function(){set.caps=set.caps?0:1;applySet();var b=document.querySelectorAll('[data-a=caps]');[].forEach.call(b,function(x){x.classList.toggle('on',!!set.caps)})}},
 menu:{ic:'menu',t:'Menu',f:function(){openM('menu')}}};
function mkBtn(id,cls){var a=ACTS[id],b=el('button','ib'+(cls?' '+cls:''),'');b.dataset.a=id;b.title=a.t;b.setAttribute('aria-label',a.t);b.innerHTML=a.ic==='q'?'?':svg(a.ic);if(a.ic==='q')b.classList.add('q');
  b.onclick=function(){ac();a.f()};if(id==='sound')sndBtns.push(b);return b}
['pause','undo','reset','sound','help'].forEach(function(i){$('r1').appendChild(mkBtn(i))});
var menuB=mkBtn('menu','mob');$('r1').appendChild(menuB);
['presets','dice','saves','codex','goals'].forEach(function(i){$('r2').appendChild(mkBtn(i,'dsk'))});
['caps','shot','settings','center'].forEach(function(i){$('r3').insertBefore(mkBtn(i,'dsk'),$('r3').firstChild)});
(function(){var s=$('r3');var ord=['caps','shot','settings','center'];ord.forEach(function(n){var b=s.querySelector('[data-a='+n+']');s.insertBefore(b,s.querySelector('[data-speed]'))})})();
var autoB=el('button','ib auto ghost','auto');autoB.title='Auto play';$('r3').insertBefore(autoB,$('r3').querySelector('[data-speed]'));Auto.bind(autoB);
var st=document.createElement('style');st.textContent='@media(max-width:760px),(max-aspect-ratio:1/1){.dsk{display:none}}@media(min-width:761px) and (min-aspect-ratio:1/1){.mob{display:none}}';document.head.appendChild(st);
Speed.mountAll();paintSnd();
function capAll(root){[].forEach.call((root.querySelectorAll?root.querySelectorAll('.ib,.tl'):[]),function(b){var t=b.title||b.getAttribute('aria-label');if(t&&b.dataset.cap!==t.replace(/ \(.*\)$/,''))b.dataset.cap=t.replace(/ \(.*\)$/,'')});
  if(root.matches&&root.matches('.ib,.tl')){var t2=root.title;if(t2)root.dataset.cap=t2.replace(/ \(.*\)$/,'')}}
var capT=0;new MutationObserver(function(){if(capT)return;capT=setTimeout(function(){capT=0;capAll(document.body)},30)}).observe(document.body,{childList:true,subtree:true});
setTimeout(function(){capAll(document.body)},0);

/* ---------- placing things ---------- */
function pickBody(px,py){var A=W.bodies,k=V.k(),best=null,bd=1e9,i,b,s,d;for(i=0;i<A.length;i++){b=A[i];s=V.toScreen(b.x,b.y);d=Math.hypot(s.x-px,s.y-py)-GG.R(b)*k;if(d<bd){bd=d;best=b}}return bd<(Device.mobile?26:18)?best:null}
function mass(t){var b={kind:t.kind,cls:t.cls,size:size};return GG.defMass(b)}
function place(t,x,y,vx,vy,tap,kind){
  snap();var b,c,d;
  if(t.belt){var dm=GG.dominant(x,y);if(!dm)return;var r=Math.hypot(x-dm.x,y-dm.y);for(var i=0;i<36;i++){var a=GG.orbit(dm,r+(Math.random()-.5)*18,Math.random()*TAU);GG.add(GG.mk('rock','',a[0],a[1],a[2]*(1+(Math.random()-.5)*.06),a[3]*(1+(Math.random()-.5)*.06)),true)}GG.zeroMom();finish(t,x,y,kind);return}
  if(t.pair){var m1=GG.SB.G.m,m2=GG.SB.K.m,sep=48,vr=Math.sqrt(GG.G*(m1+m2)/sep),a2=Math.random()*TAU,ca=Math.cos(a2),sa=Math.sin(a2);
    GG.add(GG.mk('star','G',x-ca*sep*m2/(m1+m2),y-sa*sep*m2/(m1+m2),vx+sa*vr*m2/(m1+m2),vy-ca*vr*m2/(m1+m2)),true);GG.add(GG.mk('star','K',x+ca*sep*m1/(m1+m2),y+sa*sep*m1/(m1+m2),vx-sa*vr*m1/(m1+m2),vy+ca*vr*m1/(m1+m2)),true);GG.zeroMom();finish(t,x,y,kind);return}
  if(t.kind==='wormhole'){b=GG.mk('wormhole','',x,y,0,0);GG.add(b);if(V.pend){var o=GG.byId(V.pend.id);if(o){o.link=b.id;b.link=o.id}V.pend=null}else V.pend={x:x,y:y,id:b.id};finish(t,x,y,kind);return}
  if(t.kind==='dark'||t.kind==='repulsor'||t.kind==='nebula'){GG.add(GG.mk(t.kind,'',x,y,0,0));finish(t,x,y,kind);return}
  b=GG.mk(t.kind,t.cls,x,y,vx,vy,{size:size});
  if(tap){if(t.kind==='planet'||t.kind==='moon'||t.kind==='rock'||t.kind==='station'||t.kind==='comet'){c=GG.circ(x,y);b.vx=c.vx*(t.kind==='comet'?.5:1);b.vy=c.vy*(t.kind==='comet'?.5:1);if(c.d&&c.d.kind==='planet')b.par=c.d.id}}
  GG.add(b);finish(t,x,y,kind)}
function finish(t,x,y,kind){var d=Math.hypot(x,y);tone(Math.max(180,Math.min(900,760-d*1.2)),.28,'sine',.05,t.kind==='planet'?1.4:.6);if(tut)tutHook(kind,t)}
function erase(x,y){var b=pickBodyW(x,y);if(b){snap();var i=W.bodies.indexOf(b);W.bodies.splice(i,1);W.dirty=true;if(V.sel===b.id){V.sel=0;hideInsp()}tone(300,.12,'triangle',.04,.5)}}
function pickBodyW(x,y){var s=V.toScreen(x,y);return pickBody(s.x,s.y)}
function anchorAt(x,y){var b=pickBodyW(x,y);if(b){b.fixed=!b.fixed;if(b.fixed){b.vx=0;b.vy=0}W.dirty=true;tone(b.fixed?500:350,.1,'square',.03)}}

/* ---------- pointer / camera ---------- */
var dn=null,ptrs={},pan=null,pinch=null;
function cpos(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function dragV(){var vx=(dn.x1-dn.x)*.02,vy=(dn.y1-dn.y)*.02,m=Math.hypot(vx,vy);if(m>4){vx*=4/m;vy*=4/m}return[vx,vy]}
function zoomAt(px,py,f){var a=V.toWorld(px,py);V.cam.z=Math.max(.15,Math.min(6,V.cam.z*f));var b=V.toWorld(px,py);V.cam.x+=a.x-b.x;V.cam.y+=a.y-b.y}
cv.addEventListener('contextmenu',function(e){e.preventDefault()});
cv.addEventListener('wheel',function(e){e.preventDefault();var p=cpos(e);zoomAt(p.x,p.y,Math.exp(-e.deltaY*.0015))},{passive:false});
cv.addEventListener('pointerdown',function(e){ac();try{cv.setPointerCapture(e.pointerId)}catch(_){}
  var p=cpos(e);ptrs[e.pointerId]={x:p.x,y:p.y};var ids=Object.keys(ptrs);
  if(ids.length===2){var a=ptrs[ids[0]],b=ptrs[ids[1]];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:V.cam.z,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,x:V.cam.x,y:V.cam.y};dn=null;V.drag=null;V.path=null;pan=null;V.brush=null;return}
  if(e.button===1||e.button===2||tool.id==='hand'){pan={id:e.pointerId,sx:p.x,sy:p.y,cx:V.cam.x,cy:V.cam.y};V.follow=0;return}
  var w=V.toWorld(p.x,p.y);
  if(tool.id==='erase'){erase(w.x,w.y);return}
  if(tool.id==='anchor'){anchorAt(w.x,w.y);return}
  if(tool.id==='pull'||tool.id==='push'){dn={id:e.pointerId,brush:tool.id==='pull'?1:-1,x:w.x,y:w.y};V.brush={x:w.x,y:w.y,r:150};return}
  dn={id:e.pointerId,sx:p.x,sy:p.y,x:w.x,y:w.y,x1:w.x,y1:w.y,far:false};V.path=null});
cv.addEventListener('pointermove',function(e){
  var p=cpos(e);if(ptrs[e.pointerId]){ptrs[e.pointerId].x=p.x;ptrs[e.pointerId].y=p.y}
  if(pinch){var ids=Object.keys(ptrs);if(ids.length>=2){var a=ptrs[ids[0]],b=ptrs[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y)||1,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
    V.cam.z=Math.max(.15,Math.min(6,pinch.z*d/pinch.d));var k=V.k();V.cam.x=pinch.x-(cx-pinch.cx)/k;V.cam.y=pinch.y-(cy-pinch.cy)/k}return}
  if(pan&&pan.id===e.pointerId){var k2=V.k();V.cam.x=pan.cx-(p.x-pan.sx)/k2;V.cam.y=pan.cy-(p.y-pan.sy)/k2;return}
  if(!dn||dn.id!==e.pointerId)return;var w=V.toWorld(p.x,p.y);
  if(dn.brush){dn.x=w.x;dn.y=w.y;V.brush.x=w.x;V.brush.y=w.y;return}
  dn.x1=w.x;dn.y1=w.y;if(Math.hypot(p.x-dn.sx,p.y-dn.sy)>10)dn.far=true;V.drag=dn.far?dn:null;
  if(dn.far&&!tool.act&&!tool.belt&&tool.kind!=='wormhole'&&tool.kind!=='dark'&&tool.kind!=='nebula'&&tool.kind!=='repulsor'){var v=dragV();V.path=GG.predict(tool.kind,mass(tool),dn.x,dn.y,v[0],v[1])}});
function endPtr(e){delete ptrs[e.pointerId];if(Object.keys(ptrs).length<2)pinch=null;if(pan&&pan.id===e.pointerId)pan=null}
cv.addEventListener('pointerup',function(e){var wasDn=dn&&dn.id===e.pointerId?dn:null;endPtr(e);if(!wasDn)return;dn=null;V.drag=null;V.path=null;V.brush=null;if(wasDn.brush)return;
  if(tool.id==='select'){var b=pickBodyW(wasDn.x,wasDn.y);if(b)select(b);else{V.sel=0;hideInsp()}return}
  if(tool.act)return;
  if(wasDn.far){var v=[(wasDn.x1-wasDn.x)*.02,(wasDn.y1-wasDn.y)*.02],m=Math.hypot(v[0],v[1]);if(m>4){v[0]*=4/m;v[1]*=4/m}place(tool,wasDn.x,wasDn.y,v[0],v[1],false,'drag')}
  else place(tool,wasDn.x,wasDn.y,0,0,true,'tap')});
cv.addEventListener('pointercancel',function(e){endPtr(e);dn=null;V.drag=null;V.path=null;V.brush=null});

/* ---------- inspector ---------- */
var inspEl=$('insp'),inspKey='',ir={};
function select(b){V.sel=b.id;buildInsp(b)}
function hideInsp(){inspEl.hidden=true;inspKey='';V.follow=0}
var STAGE=['barren','microbes','flora','fauna','civilization','spacefaring','ascended'];
function buildInsp(b){
  inspEl.hidden=false;inspKey=b.kind+b.cls+(b.sp?1:0);inspEl.innerHTML='';
  var top=el('div','top'),gl=el('canvas','gl');top.appendChild(gl);var tx=el('div');ir.nm=el('div','nm');ir.sub=el('div','sub');tx.append(ir.nm,ir.sub);top.appendChild(tx);inspEl.appendChild(top);
  GG.glyph(gl,b.kind,b.cls,{seed:b.seed,stage:b.stage,hab:b.hab});
  gl.onclick=function(){var o=GG.byId(V.sel);if(o&&o.kind==='planet'){snap();var i=GG.CLS.findIndex(function(c){return c.id===o.cls});o.cls=GG.CLS[(i+1)%GG.CLS.length].id;buildInsp(o)}};
  if(b.kind==='planet'){ir.pips=el('div','pips');for(var i=1;i<=6;i++)ir.pips.appendChild(el('i'));inspEl.appendChild(ir.pips);
    ir.bar=el('div','bar');ir.barf=el('i');ir.baru=el('u');ir.bar.append(ir.baru,ir.barf);inspEl.appendChild(ir.bar)}
  ir.kv=el('div','kv');inspEl.appendChild(ir.kv);
  if(b.sp){var sp=el('div','sp'),cc=el('canvas');cc.width=96;cc.height=68;sp.appendChild(cc);ir.sp=el('div','sub');sp.appendChild(ir.sp);inspEl.appendChild(sp);
    var c2=cc.getContext('2d');c2.setTransform(2,0,0,2,0,0);GG.creature(c2,b.sp,24,17,30);ir.sp.innerHTML='<i style="font:italic 18px var(--serif);color:var(--ink)">'+b.sp.name+'</i><br>'+b.sp.legs+' legs · '+b.sp.eyes+' eyes'}
  var acts=el('div','acts');
  [['track',function(){V.follow=V.follow?0:b.id}],['pin',function(){var o=GG.byId(V.sel);if(o){o.fixed=!o.fixed;if(o.fixed){o.vx=0;o.vy=0}W.dirty=true}}],
   ['copy',function(){var o=GG.byId(V.sel);if(o){snap();var n=GG.mk(o.kind,o.cls,o.x+16,o.y+10,o.vx,o.vy,{m:o.m,size:o.size,age:o.age});GG.add(n);select(n)}}],
   ['less',function(){var o=GG.byId(V.sel);if(o&&o.m>.06){snap();o.m/=1.3;W.dirty=true}}],['more',function(){var o=GG.byId(V.sel);if(o&&o.m>0){snap();o.m*=1.3;W.dirty=true}}],
   ['delete',function(){var o=GG.byId(V.sel);if(o){snap();W.bodies.splice(W.bodies.indexOf(o),1);W.dirty=true;V.sel=0;hideInsp()}}]].forEach(function(a){
    var ico={track:'follow',pin:'anchor',copy:'clone',less:'minus',more:'plus','delete':'trash'}[a[0]];var bt=el('button','ib',svg(ico));bt.title=a[0];bt.onclick=function(){ac();a[1]()};acts.appendChild(bt)});
  inspEl.appendChild(acts);refreshInsp(b)}
function refreshInsp(b){
  ir.nm.textContent=b.name;
  var P=GG.CB[b.cls],M=W.bodies.length?GG.metrics():null,rows=[];
  var host=b.host?GG.byId(b.host):null;
  if(b.kind==='planet'){ir.sub.textContent=b.cls+' · '+STAGE[b.stage];
    [].forEach.call(ir.pips.children,function(p,i){p.classList.toggle('on',b.stage>=i+1)});
    var mx=3;ir.barf.style.width=Math.min(100,b.flux/mx*100)+'%';ir.baru.style.left=Math.min(100,P.flux[0]/mx*100)+'%';ir.baru.style.width=Math.max(0,Math.min(100,(P.flux[1]-P.flux[0])/mx*100))+'%';ir.baru.style.display=P.life?'block':'none';
    var rr=host?Math.hypot(b.x-host.x,b.y-host.y):0,per=host?TAU*Math.sqrt(rr*rr*rr/(GG.G*Math.abs(host.m)))/GG.YR:0;
    rows=[['year',host?per.toFixed(2):'–'],['mass',b.m.toFixed(1)],['moons',(M.moonMap[b.id]||0)],['scars',b.scar],['light',b.flux.toFixed(2)],['host',host?host.name:'none']]}
  else if(b.kind==='star'){var L=GG.lifeOfMass(b.m);ir.sub.textContent='class '+b.cls+(b.giant?' · giant':'');var z=GG.zone(b);
    rows=[['mass',Math.round(b.m)],['life left',Math.max(0,Math.round((1-b.age/L)*100))+'%'],['zone',Math.round(z[0])+'–'+Math.round(z[1])],['span',(L/GG.YR).toFixed(0)+' yr']]}
  else{ir.sub.textContent=b.kind;rows=[['mass',Math.round(b.m*100)/100],['speed',Math.hypot(b.vx,b.vy).toFixed(2)]]}
  ir.kv.innerHTML=rows.map(function(r){return'<span>'+r[0]+'</span><b>'+r[1]+'</b>'}).join('')}

/* ---------- modals ---------- */
var modals=$('modals'),openId=null;
function openM(id){ac();closeM();var m=el('div','modal'),sh=el('div','sheet');m.appendChild(sh);m.onpointerdown=function(e){if(e.target===m)closeM()};modals.appendChild(m);openId=id;BUILD[id](sh)}
function closeM(){modals.innerHTML='';openId=null}
function head(sh,icon,extra){var h=el('h2','',svg(icon).replace('<svg','<svg style="width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.4"')),x=el('button','ib','×');x.onclick=closeM;h.appendChild(x);sh.appendChild(h);return h}
var PN={sol:'Home',binary:'Twin suns',figure8:'Figure eight',trojans:'Trojans',moons:'Moon court',sling:'Slingshot',chaos:'Three bodies',beltworld:'Belt world',hole:'Event horizon',worm:'Wormhole',doom:'Doomed star',kepler:'Packed',flyby:'Flyby',twins:'Two gardens',empty:'Empty'};
function thumb(c,arr){var d=Math.min(devicePixelRatio||1,2),s=c.clientWidth||110;c.width=c.height=s*d;var x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);var P=GG.pal;x.fillStyle=P.bg;x.fillRect(0,0,s,s);
  var mx=60;arr.forEach(function(b){mx=Math.max(mx,Math.min(420,Math.hypot(b.x,b.y)+GG.R(b)))});var k=s*.46/mx;
  arr.forEach(function(b){var px=s/2+b.x*k,py=s/2+b.y*k,r=Math.max(b.kind==='star'?4:b.kind==='rock'?1.2:2.6,GG.R(b)*k*(b.kind==='star'?.8:1.6));x.lineWidth=1.3;x.beginPath();x.arc(px,py,Math.min(r,s*.12),0,TAU);
    if(b.kind==='star'||b.kind==='comet'){x.fillStyle=P.rust;x.fill()}else if(b.kind==='hole'||b.kind==='rock'){x.fillStyle=P.ink;x.fill()}else if(b.kind==='wormhole'){x.strokeStyle=P.rust;x.stroke()}else{x.strokeStyle=P.ink;x.lineWidth=1;x.stroke()}})}
function loadSys(arr,label){snap();GG.loadSystem(arr);V.sel=0;hideInsp();center();closeM();if(tut)endTut()}
var BUILD={
 menu:function(sh){head(sh,'menu');var g=el('div','grid tg');['presets','saves','codex','goals','shot','settings','center','caps','sound','help'].forEach(function(i){var b=mkBtn(i);b.onclick=function(){ac();var a=ACTS[i];closeM();a.f()};g.appendChild(b)});sh.appendChild(g)},
 pre:function(sh){head(sh,'presets');var g=el('div','grid pre');
   GG.PRESETS.forEach(function(p,i){var b=el('button','',''),c=el('canvas');b.appendChild(c);b.appendChild(document.createTextNode(PN[p.id]||p.id));g.appendChild(b);
     requestAnimationFrame(function(){thumb(c,p.build(GG.rng(i+1)))});b.onclick=function(){ac();GG.W.stats.presets++;W.seed=0;loadSys(p.build(GG.rng(Date.now()&0xffff)))}});sh.appendChild(g);
   var r=el('div','row'),inp=el('input');inp.type='text';inp.inputMode='numeric';inp.maxLength=9;inp.value=String(W.seed||(Math.random()*1e6|0));var go=el('button','ib',svg('dice'));go.style.width='46px';go.title='Generate';
   go.onclick=function(){ac();var s=parseInt(inp.value,10);if(!isFinite(s))s=Math.random()*1e6|0;W.seed=s;W.stats.seeds++;loadSys(GG.randomSystem(s))};
   var rd=el('button','ib',svg('reset'));rd.style.width='46px';rd.title='Another seed';rd.onclick=function(){inp.value=String(Math.random()*1e6|0)};r.append(inp,go,rd);sh.appendChild(r)},
 sav:function(sh){head(sh,'save');var g=el('div','grid slots');
   for(var i=0;i<6;i++)(function(i){var d=GG.lsGet('ggSlot'+i,null),s=el('div','slot');
     if(d&&d.img){var im=el('img');im.src=d.img;im.style.cssText='width:100%;aspect-ratio:4/3;object-fit:cover;border:1px solid var(--rule);display:block';s.appendChild(im)}else s.appendChild(el('div','none'));
     var r=el('div','r'),sv=el('button','ib',svg('save')),ld=el('button','ib',svg('undo')),dl=el('button','ib',svg('trash'));sv.title='save here';ld.title='load';dl.title='delete';
     sv.onclick=function(){var t=document.createElement('canvas');t.width=160;t.height=120;var x=t.getContext('2d');x.drawImage(cv,0,0,160,120);GG.lsSet('ggSlot'+i,{s:GG.save(),img:t.toDataURL('image/jpeg',.6)});W.stats.saves++;openM('sav')};
     ld.onclick=function(){if(d){snap();GG.load(d.s);V.sel=0;hideInsp();closeM()}};dl.onclick=function(){try{localStorage.removeItem('ggSlot'+i)}catch(e){}openM('sav')};
     r.append(sv,ld,dl);s.appendChild(r);g.appendChild(s)})(i);sh.appendChild(g);
   var ta=el('textarea');ta.placeholder='code';sh.appendChild(ta);var r2=el('div','row'),ex=el('button','ib',svg('shot')),im=el('button','ib',svg('undo'));ex.style.width=im.style.width='60px';ex.title='export code';im.title='import code';
   ex.onclick=function(){try{ta.value=btoa(unescape(encodeURIComponent(JSON.stringify(GG.save()))));ta.select()}catch(e){}};
   im.onclick=function(){try{var o=JSON.parse(decodeURIComponent(escape(atob(ta.value.trim()))));snap();GG.load(o);V.sel=0;hideInsp();closeM()}catch(e){ta.value=''}};r2.append(ex,im);sh.appendChild(r2)},
 cod:function(sh){head(sh,'book');var n=codexCount(),info=el('div','');info.id='cxi';info.textContent=n+' / '+GG.CODEX_N;var c=el('canvas');c.id='cx';sh.append(c,info);drawCodex(c,info)},
 gol:function(sh){head(sh,'goals');var g=el('div','grid stamps'),got=GG.lsGet('ggGoals',[]),n=0;
   GOALS.forEach(function(go){var ok=got.indexOf(go.id)>=0;if(ok)n++;g.appendChild(el('div','stamp'+(ok?' got':''),svg(go.ic)+'<b>'+fmt(go.t)+'</b>'))});
   sh.querySelector('h2').insertBefore(el('span','',n+' / '+GOALS.length),sh.querySelector('h2').lastChild);sh.appendChild(g)},
 set:function(sh){head(sh,'gear');var g=el('div','grid tg');
   [['trails','trails'],['bands','bands'],['labels','labels'],['grid','grid'],['wild','wild'],['music','music']].forEach(function(p){var b=el('button','ib'+(set[p[0]]?' on':''),svg(p[1]));b.title=p[0];b.onclick=function(){set[p[0]]=set[p[0]]?0:1;b.classList.toggle('on',!!set[p[0]]);applySet()};g.appendChild(b)});sh.appendChild(g);
   var th=el('div','row');['paper','night','blue'].forEach(function(n){var b=el('button','sw'+(set.theme===n?' sel':''),'<i style="background:'+GG.PAL[n].bg+';border-color:'+GG.PAL[n].ink+'"><b style="display:block;width:40%;height:40%;margin:30%;background:'+GG.PAL[n].rust+'"></b></i>');b.onclick=function(){set.theme=n;applySet();openM('set');rebuildGlyphs()};th.appendChild(b)});sh.appendChild(th);
   var rs=el('button','ib',svg('trash'));rs.style.width='60px';rs.title='erase progress';var armed=0;rs.onclick=function(){if(!armed){armed=1;rs.classList.add('on');setTimeout(function(){armed=0;rs.classList.remove('on')},2500)}else{['ggGoals','ggCodex','ggStats','ggBest','ggWorld','ggTut'].forEach(function(k){try{localStorage.removeItem(k)}catch(e){}});location.reload()}};sh.appendChild(rs)}};
function rebuildGlyphs(){buildPal();if(V.sel){var b=GG.byId(V.sel);if(b)buildInsp(b)}}

/* ---------- codex ---------- */
var CX=GG.lsGet('ggCodex',''),cxBits=new Uint8Array(Math.ceil(GG.CODEX_N/8));
try{if(CX){var raw=atob(CX);for(var i=0;i<raw.length&&i<cxBits.length;i++)cxBits[i]=raw.charCodeAt(i)}}catch(e){}
var cxN=0;for(var qi=0;qi<GG.CODEX_N;qi++)if(cxBits[qi>>3]&(1<<(qi&7)))cxN++;
function codexCount(){return cxN}
function cxSave(){var s='';for(var i=0;i<cxBits.length;i++)s+=String.fromCharCode(cxBits[i]);GG.lsSet('ggCodex',btoa(s))}
var cxDirty=false;
function cxHas(i){return!!(cxBits[i>>3]&(1<<(i&7)))}
function cxMark(i){if(cxHas(i))return false;cxBits[i>>3]|=1<<(i&7);cxN++;cxDirty=true;return true}
var CXP={cell:8,pad:1};
function cxXY(i){var mo=i%3,r=(i-mo)/3,sz=r%3;r=(r-sz)/3;var st=r%7;r=(r-st)/7;var h=r%11,ci=(r-h)/11;return{x:h*8+st,y:ci*10+sz*3+mo}}
function drawCodex(c,info){var cell=8,w=88*cell,h=90*cell;c.width=w;c.height=h;var x=c.getContext('2d'),P=GG.pal;x.fillStyle=P.bg;x.fillRect(0,0,w,h);
  for(var i=0;i<GG.CODEX_N;i++){var p=cxXY(i),has=cxHas(i);if(has){x.fillStyle=P.rust;x.fillRect(p.x*cell+1,p.y*cell+1,cell-2,cell-2)}else{x.fillStyle=GG.ia(.28);x.fillRect(p.x*cell+3,p.y*cell+3,2,2)}}
  var HN=['O','B','A','F','G','K','M','dwarf','neutron','hole','rogue'];
  c.onclick=function(e){var r=c.getBoundingClientRect(),gx=Math.floor((e.clientX-r.left)/r.width*88),gy=Math.floor((e.clientY-r.top)/r.height*90),ci=Math.floor(gy/10),h=Math.floor(gx/8),st=gx%8,ry=gy%10;
    if(ci>8||h>10||st>6||ry>8)return;var sz=Math.floor(ry/3),mo=ry%3,idx=(((ci*11+h)*7+st)*3+sz)*3+mo,inf=GG.codexInfo(idx);
    info.textContent=(cxHas(idx)?'':'? ')+inf.cls+' · '+HN[h]+' · '+STAGE[inf.stage]+' · '+['small','medium','large'][inf.size]+' · '+['no moons','1–2 moons','3+ moons'][inf.moons]}}

/* ---------- goals: pictograms, no sentences ---------- */
var METR={planets:['planet',[3,6,10,16,25,40]],blooms:['petal',[5,12,25,50,100,200,400]],civs:['city',[1,2,3,5,8]],space:['sat',[1,2,4,6]],asc:['halo',[1,2,3,5]],stars:['star',[2,3,4,6,10]],
  binary:['binary',[1]],holes:['hole',[1,2,3]],worms:['worm',[1,2]],comets:['comet',[1,3,6,12]],moons:['moon',[1,2,3,4,6,8]],bodies:['dots',[25,50,100,200,300]],
  codex:['book',[5,10,25,50,100,250,500,1000,2000,3000,4500,6000]],years:['hour',[10,50,100,250,500,1000,2500,5000]],coll:['merge',[1,5,10,25,50,100,250]],sn:['burst',[1,3,5,10,25]],
  imp:['crater',[1,5,10,25,50]],ext:['cross',[1,3,10]],presets:['presets',[1,5,15]],seeds:['dice',[1,5,25,100]],saves:['save',[1,5,20]],speed:['bolt',[1]],classes:['classes',[3,5,7,9]],species:['species',[1,3,6,10]],score:['seed',[10,25,50,100,200,400,800]]};
var GOALS=[];Object.keys(METR).forEach(function(m){METR[m][1].forEach(function(t){GOALS.push({id:m+':'+t,m:m,t:t,ic:METR[m][0]})})});
function fmt(n){return n>=1000?(n/1000)+'k':String(n)}
var goalsGot=GG.lsGet('ggGoals',[]);
function toast(ic,txt){var t=el('div','tst',svg(ic)+'<span>'+txt+'</span>');$('toast').appendChild(t);setTimeout(function(){t.remove()},2900)}
function checkGoals(M){var S=W.stats,val={codex:cxN,years:Math.floor(S.years),coll:S.coll,sn:S.sn,imp:S.imp,ext:S.ext,presets:S.presets,seeds:S.seeds,saves:S.saves,speed:Speed.v>=50?1:0};
  var newg=0,shown=0;GOALS.forEach(function(g){if(goalsGot.indexOf(g.id)>=0)return;var v=val[g.m]!=null?val[g.m]:M[g.m];if(v>=g.t){goalsGot.push(g.id);newg++;if(!tut&&shown<3&&$('toast').children.length<3){shown++;toast(g.ic,fmt(g.t))}}});
  if(newg){GG.lsSet('ggGoals',goalsGot);tone(660,.15,'triangle',.05);setTimeout(function(){tone(990,.25,'triangle',.05)},120)}}

/* ---------- ledger ---------- */
function ledger(){var M=GG.metrics(),i,p,mo;
  for(i=0;i<W.bodies.length;i++){p=W.bodies[i];if(p.kind==='planet')cxMark(GG.codexIdx(p,M.moonMap[p.id]||0))}
  if(M.score>best){best=M.score;GG.lsSet('ggBest',best)}
  $('lp').textContent=M.planets;$('lb').textContent=M.score;$('lbest').textContent=best;$('lage').textContent=Math.floor(W.tick/GG.YR);$('mb').textContent=M.score;
  hist.push(M.score);if(hist.length>80)hist.shift();spark();checkGoals(M);
  if(cxDirty){cxDirty=false;cxSave()}
  if(V.sel){var b=GG.byId(V.sel);if(!b){V.sel=0;hideInsp()}else{if(inspKey!==b.kind+b.cls+(b.sp?1:0))buildInsp(b);else refreshInsp(b)}}}
function spark(){var c=$('spark'),d=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;if(!w)return;if(c.width!==w*d){c.width=w*d;c.height=h*d}var x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);
  var mx=Math.max.apply(null,hist),mn=Math.min.apply(null,hist);if(mx-mn<5)mx=mn+5;x.strokeStyle=GG.pal.rust;x.lineWidth=1.3;x.beginPath();hist.forEach(function(v,i){var px=i/79*w,py=h-2-(v-mn)/(mx-mn)*(h-4);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}

/* ---------- AUTO gardener ---------- */
function bot(){
  var A=W.bodies,suns=A.filter(function(b){return b.kind==='star'});
  if(!suns.length){GG.add(GG.mk('star','G',0,0,0,0),true);return}
  var s=suns.reduce(function(a,b){return b.m>a.m?b:a}),z=GG.zone(s),planets=A.filter(function(b){return b.kind==='planet'});
  botN++;
  if(planets.length<6){var slots=[0,1,2,3,4].filter(function(i){var r=z[0]+(i+.5)/5*(z[1]-z[0]);return!planets.some(function(p){return Math.abs(Math.hypot(p.x-s.x,p.y-s.y)-r)<(z[1]-z[0])/11})});
    if(!slots.length)return;var r=z[0]+(slots[Math.random()*slots.length|0]+.5)/5*(z[1]-z[0]),a=Math.random()*TAU,F=GG.lum(s)*21025/(r*r),cls=F>1.5?'desert':['ocean','jungle','rocky','ocean'][Math.random()*4|0],o=GG.orbit(s,r,a);
    GG.add(GG.mk('planet',cls,o[0],o[1],o[2],o[3],{size:Math.random()*3|0}));tone(Math.max(180,760-r),.25,'sine',.04,1.4);return}
  if(!A.some(function(b){return b.cls==='gas'||b.cls==='ringed'})){var o2=GG.orbit(s,z[1]*1.7,Math.random()*TAU),g=GG.mk('planet','ringed',o2[0],o2[1],o2[2],o2[3]);GG.add(g);
    for(var i=0;i<3;i++){var m=GG.orbit(g,11+i*2.5,Math.random()*TAU);GG.add(GG.mk('moon','',m[0],m[1],m[2],m[3],{par:g.id}),true)}return}
  if(Math.random()<.2&&A.filter(function(b){return b.kind==='comet'}).length<2)GG.add(GG.mk('comet','',-700,-200+Math.random()*400,1.6,.2))}

/* ---------- wordless tutorial ---------- */
var skipB=$('skip'),spdEl=document.querySelector('[data-speed]');
function startTut(){tut={step:0};tutT=0;GG.newWorld();center();V.sel=0;hideInsp();setTool(TB.ocean);setGroup('planet');skipB.hidden=false;spdEl.classList.remove('nudge');V.overlay=drawTut}
function endTut(){tut=null;skipB.hidden=true;spdEl.classList.remove('nudge');V.overlay=null;GG.lsSet('ggTut',1)}
function tutHook(kind,t){if(tut.step===0&&kind==='tap'&&t.kind==='planet'){tut.step=1;tutT=0}else if(tut.step===1&&kind==='drag'&&t.kind==='planet'){tut.step=2;tutT=0;spdEl.classList.add('nudge');if(Speed.v>=8)endTut()}}
skipB.onclick=endTut;
function drawTut(c,hx){tutT++;c.strokeStyle=GG.pal.rust;c.fillStyle=GG.pal.rust;c.lineWidth=hx*1.6;
  if(tut.step===0){var ph=(tutT%70)/70;c.beginPath();c.arc(170,-30,6+ph*30,0,TAU);c.globalAlpha=1-ph;c.stroke();c.globalAlpha=1;c.beginPath();c.arc(170,-30,5,0,TAU);c.fill()}
  else if(tut.step===1){var p2=(tutT%110)/110,e=p2<.8?p2/.8:1,x0=-170,y0=130,x1=-70,y1=40,x=x0+(x1-x0)*e,y=y0+(y1-y0)*e;c.globalAlpha=p2<.8?1:1-(p2-.8)/.2;c.beginPath();c.moveTo(x0,y0);c.lineTo(x,y);c.stroke();c.beginPath();c.arc(x0,y0,5,0,TAU);c.stroke();c.beginPath();c.arc(x,y,5,0,TAU);c.fill();c.globalAlpha=1}
  else if(tut.step===2&&Speed.v>=8)endTut()}
$('tutb')&&0;

/* ---------- keys ---------- */
addEventListener('keydown',function(e){if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;ac();var c=e.code;
  if(c==='Escape'){if(openId)closeM();else{V.sel=0;hideInsp()}return}
  if(openId)return;
  if(e.ctrlKey&&c==='KeyZ'){doUndo();e.preventDefault();return}
  if(c.indexOf('Digit')===0&&+c[5]>=1&&+c[5]<=5){setGroup(GROUPS[+c[5]-1]);return}
  if(c==='Space'){e.preventDefault();setPause(!paused)}else if(c==='KeyR')doReset();else if(c==='KeyM')toggleSnd();else if(c==='KeyA')Auto.toggle();else if(c==='KeyZ')doUndo();
  else if(c==='KeyP')shot();else if(c==='KeyH')ACTS.caps.f();else if(c==='Digit0')center();else if(c==='KeyF'&&V.sel)V.follow=V.follow?0:V.sel;
  else if((c==='Delete'||c==='Backspace')&&V.sel){var o=GG.byId(V.sel);if(o){snap();W.bodies.splice(W.bodies.indexOf(o),1);W.dirty=true;V.sel=0;hideInsp()}}
  else if(c==='Equal'||c==='NumpadAdd')zoomAt(V.w/2,V.h/2,1.2);else if(c==='Minus'||c==='NumpadSubtract')zoomAt(V.w/2,V.h/2,1/1.2)});

/* ---------- sounds from sim events ---------- */
function events(){var ev=W.ev,n=0;
  for(var i=0;i<ev.length;i++){var e=ev[i];
    switch(e.t){case'merge':tone(120,.2,'triangle',.06,.5);break;case'impact':noise(.15,.05);break;case'super':noise(.8,.2);tone(70,.9,'sawtooth',.06,.4);break;
      case'stage':tone(500+e.x*110,.4,'sine',.04);break;case'seed':tone(900,.2,'sine',.04,1.3);break;case'warp':tone(300,.25,'sine',.04,2.2);break;
      case'station':tone(1400,.08,'square',.02);break;case'dwarf':tone(260,.6,'sine',.04,.5);break;case'ignite':tone(440,.5,'triangle',.05,2);break;
      case'note':if(n++<3)note(e.x);break}}
  ev.length=0}

/* ---------- main loop ---------- */
function fit(){V.fit(cv,stage)}
function loop(){
  var n=paused?0:Speed.steps(),t0=performance.now();
  if(V.brush&&dn&&dn.brush){var A=W.bodies,R=V.brush.r;for(var j=0;j<A.length;j++){var b=A[j];if(b.fixed)continue;var dx=dn.x-b.x,dy=dn.y-b.y,d=Math.hypot(dx,dy);if(d<R&&d>2){var a=.09*(1-d/R)*dn.brush;b.vx+=dx/d*a;b.vy+=dy/d*a;W.dirty=true}}}
  for(var i=0;i<n;i++){if(Auto.on&&W.tick%45===0)bot();GG.step();if(i>0&&performance.now()-t0>12){Speed.acc=0;break}}
  if(Speed.v>=50)W.stats.speed=1;
  events();
  if(V.follow){var f=GG.byId(V.follow);if(f){V.cam.x+=(f.x-V.cam.x)*.12;V.cam.y+=(f.y-V.cam.y)*.12}else V.follow=0}
  GG.draw(ctx);if(++fr%15===0)ledger();if(fr%240===0&&!tut){GG.lsSet('ggWorld',{s:GG.save(),c:V.cam});GG.lsSet('ggStats',W.stats)}
  requestAnimationFrame(loop)}
fit();addEventListener('resize',fit);addEventListener('orientationchange',fit);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){fit();rebuildGlyphs()});
applySet();setGroup('planet');[].forEach.call(document.querySelectorAll('[data-a=caps]'),function(x){x.classList.toggle('on',!!set.caps)});
var saved=GG.lsGet('ggWorld',null);
if(saved&&saved.s&&GG.load(saved.s)){V.cam=Object.assign({x:0,y:0,z:1},saved.c||{})}else GG.newWorld();
if(!GG.lsGet('ggTut',0))startTut();
$('tutb')&&0;
window.addEventListener('beforeunload',function(){if(!tut){GG.lsSet('ggWorld',{s:GG.save(),c:V.cam});GG.lsSet('ggStats',W.stats)}});
GG.ui={setTool:setTool,setGroup:setGroup,place:place,bot:bot,TB:TB,tut:function(){return tut},select:select,openM:openM,closeM:closeM,ledger:ledger,GOALS:GOALS,cx:function(){return cxN},undo:doUndo,set:set,applySet:applySet,setPause:setPause,snap:snap,endTut:endTut,size:function(s){size=s}};
loop();
})();
