/* Game Kit v2, part 2: the "fun layer". Needs gk.js first.
   GK.fx      particles, floating text, screen shake, hit-stop (update runs inside GK.loop)
   GK.ico     pictogram library (svg inner paths, 22x22)
   GK.goals   achievements: GK.goals.setup({metrics(),defs:{key:{ic,t:[..]}}}), tick(), open(), mount(R)
   GK.daily   daily seed + streak
*/
(function(){
var GK=window.GK;
/* ---------- fx ---------- */
var F=GK.fx={p:[],tx:[],sk:0,skm:0,hit:0};
F.burst=function(x,y,n,o){o=o||{};for(var i=0;i<n;i++){var a=(o.arc!=null?o.a0+Math.random()*o.arc:Math.random()*6.2832),s=(o.speed||3)*(.3+Math.random()*.9);
  if(F.p.length<700)F.p.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(o.up||0),l:0,life:(o.life||28)*(.6+Math.random()*.6),g:o.grav||0,c:o.col||'#fff',sz:o.size||3,sh:o.shape||'sq',dr:o.drag==null?.96:o.drag})}};
F.text=function(x,y,s,col,size){if(F.tx.length<60)F.tx.push({x:x,y:y,s:String(s),c:col||'#fff',z:size||18,l:0})};
F.shake=function(m,t){if(m>=F.skm||F.sk<=0){F.skm=m;F.sk=t||12}};
F.hitstop=function(f){F.hit=Math.max(F.hit,f)};
F.offset=function(){if(F.sk<=0)return{x:0,y:0};var k=F.skm*(F.sk/12>1?1:F.sk/12);return{x:(Math.random()-.5)*2*k,y:(Math.random()-.5)*2*k}};
F.update=function(){var i,p;for(i=F.p.length-1;i>=0;i--){p=F.p[i];p.l++;p.vx*=p.dr;p.vy=p.vy*p.dr+p.g;p.x+=p.vx;p.y+=p.vy;if(p.l>p.life)F.p.splice(i,1)}
  for(i=F.tx.length-1;i>=0;i--){var t=F.tx[i];t.l++;t.y-=.7;if(t.l>46)F.tx.splice(i,1)}if(F.sk>0)F.sk--};
F.clear=function(){F.p.length=0;F.tx.length=0;F.sk=0;F.hit=0};
F.draw=function(ctx){var i,p;for(i=0;i<F.p.length;i++){p=F.p[i];var a=1-p.l/p.life;ctx.globalAlpha=a<0?0:a;ctx.fillStyle=p.c;
    if(p.sh==='ci'){ctx.beginPath();ctx.arc(p.x,p.y,p.sz*a+.5,0,6.3);ctx.fill()}else if(p.sh==='ln'){ctx.strokeStyle=p.c;ctx.lineWidth=Math.max(1,p.sz*.5);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*2,p.y-p.vy*2);ctx.stroke()}else ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz)}
  ctx.globalAlpha=1;ctx.textAlign='center';for(i=0;i<F.tx.length;i++){var t=F.tx[i];ctx.globalAlpha=Math.max(0,1-t.l/46);ctx.fillStyle=t.c;ctx.font='700 '+t.z+'px '+(getComputedStyle(document.body).getPropertyValue('--gk-font')||'sans-serif');ctx.fillText(t.s,t.x,t.y)}ctx.globalAlpha=1};
/* hook the loop: skip ticks during hit-stop, advance particles every tick */
var oldLoop=GK.loop;
GK.loop=function(tick,draw,pre){oldLoop(function(){if(F.hit>0){F.hit--;F.update();return}tick();F.update()},draw,pre)};

/* ---------- pictograms ---------- */
GK.ico={
 star:'<path d="M11 2l2.6 6 6.4.6-4.9 4.3 1.5 6.4L11 16l-5.6 3.3 1.5-6.4L2 8.6 8.4 8z"/>',
 heart:'<path d="M11 19C3 13 3 6 7 5c2-.4 3.4.8 4 2 .6-1.2 2-2.4 4-2 4 1 4 8-4 14z"/>',
 coin:'<circle cx="11" cy="11" r="8"/><path d="M11 6v10M8 9h5a2 2 0 0 1 0 4H8"/>',
 flame:'<path d="M11 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
 drop:'<path d="M11 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
 bolt:'<path d="M12 2L6 12h5l-1 8 6-10h-5z"/>',
 skull:'<path d="M5 12a6 6 0 1 1 12 0v3h-2v3H7v-3H5z"/><circle cx="8.5" cy="11.5" r="1.4"/><circle cx="13.5" cy="11.5" r="1.4"/>',
 crown:'<path d="M3 17l-1-9 5 4 4-7 4 7 5-4-1 9z"/>',
 clock:'<circle cx="11" cy="11" r="8"/><path d="M11 6v5l3 2"/>',
 flag:'<path d="M5 3v17M5 4h11l-3 4 3 4H5"/>',
 gem:'<path d="M3 8l3-4h10l3 4-8 11z"/><path d="M3 8h16M8 4l3 15M14 4l-3 15"/>',
 leaf:'<path d="M4 18C4 9 9 4 19 3c0 10-5 15-14 15zM4 18l9-9"/>',
 bug:'<ellipse cx="11" cy="12" rx="4" ry="6"/><path d="M11 6V3M8 9L4 7M14 9l4-2M7 13H3M15 13h4M8 17l-3 3M14 17l3 3"/>',
 fish:'<path d="M3 11c3-5 9-5 12 0-3 5-9 5-12 0zM15 11l4-3v6z"/><circle class="f" cx="7" cy="10" r="1"/>',
 key:'<circle cx="7" cy="9" r="4"/><path d="M10 11l9 8M15 16l2-2M17 18l2-2"/>',
 lock:'<rect x="5" y="10" width="12" height="9"/><path d="M8 10V7a3 3 0 0 1 6 0v3"/>',
 boat:'<path d="M3 13h16l-3 5H6zM11 13V4l5 8"/>',
 note:'<path d="M8 16V5l9-2v11"/><circle class="f" cx="6" cy="16" r="2"/><circle class="f" cx="15" cy="14" r="2"/>',
 ball:'<circle cx="11" cy="11" r="8"/><path d="M5 7c4 2 8 2 12 0M5 15c4-2 8-2 12 0"/>',
 box:'<path d="M3 7l8-4 8 4v9l-8 4-8-4zM3 7l8 4 8-4M11 11v9"/>',
 sword:'<path d="M4 18L17 5l1-3 3-1-1 3-3 1L5 20zM3 15l4 4"/>',
 shield:'<path d="M11 2l7 3v6c0 5-3 8-7 10-4-2-7-5-7-10V5z"/>',
 paw:'<circle cx="6" cy="9" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="9" r="2"/><path d="M11 11c4 0 6 5 4 7-1 1-3 0-4 0s-3 1-4 0c-2-2 0-7 4-7z"/>',
 tree:'<path d="M11 20v-6M11 3l6 7h-3l4 5H4l4-5H5z"/>',
 flower:'<circle cx="11" cy="11" r="2"/><circle cx="11" cy="5" r="2.4"/><circle cx="11" cy="17" r="2.4"/><circle cx="5" cy="11" r="2.4"/><circle cx="17" cy="11" r="2.4"/>',
 cloud:'<path d="M6 17a4 4 0 0 1 0-8 5 5 0 0 1 9-1 4 4 0 0 1 1 9z"/>',
 sun:'<circle cx="11" cy="11" r="4"/><path d="M11 2v3M11 17v3M2 11h3M17 11h3M4.6 4.6l2 2M15.4 15.4l2 2M4.6 17.4l2-2M15.4 6.6l2-2"/>',
 moon:'<path d="M15 4a8 8 0 1 0 3 12A7 7 0 0 1 15 4z"/>',
 snow:'<path d="M11 2v18M3 6l16 10M3 16L19 6"/>',
 anchor:'<circle cx="11" cy="5" r="2"/><path d="M11 7v12M6 11h10M4 14a7 7 0 0 0 14 0"/>',
 dice:'<rect x="3" y="3" width="16" height="16"/><circle class="f" cx="8" cy="8" r="1.3"/><circle class="f" cx="14" cy="8" r="1.3"/><circle class="f" cx="11" cy="11" r="1.3"/><circle class="f" cx="8" cy="14" r="1.3"/><circle class="f" cx="14" cy="14" r="1.3"/>',
 target:'<circle cx="11" cy="11" r="8"/><circle cx="11" cy="11" r="4"/><circle class="f" cx="11" cy="11" r="1"/>',
 trophy:'<path d="M6 3h10v6a5 5 0 0 1-10 0zM6 5H3v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3M11 14v4M7 19h8"/>',
 hand:'<path d="M7 11V5a1.5 1.5 0 0 1 3 0v5V4a1.5 1.5 0 0 1 3 0v6V6a1.5 1.5 0 0 1 3 0v8c0 4-2 6-5 6-3 0-4-2-5-4l-2-4a1.5 1.5 0 0 1 3-1z"/>',
 eye:'<path d="M2 11c3-5 15-5 18 0-3 5-15 5-18 0z"/><circle cx="11" cy="11" r="3"/>',
 bomb:'<circle cx="10" cy="13" r="6"/><path d="M14 8l3-3M16 3l1 2 2 1"/>',
 up:'<path d="M11 19V4M5 10l6-6 6 6"/>',
 house:'<path d="M3 11l8-8 8 8M5 10v9h12v-9"/>',
 wrench:'<path d="M14 3a4 4 0 0 0-3 5L3 16l3 3 8-8a4 4 0 0 0 5-3l-3 2-2-2z"/>',
 book:'<path d="M4 4h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM18 4h-6v15a2 2 0 0 1 2-2h4z"/>',
 bee:'<ellipse cx="11" cy="12" rx="5" ry="4"/><path d="M8 9V6M14 9V6M6 12h10M8 14h6"/>',
 bat:'<path d="M11 8c-3-4-8-3-9 1 2 0 3 1 3 3 2-1 4 0 6 4 2-4 4-5 6-4 0-2 1-3 3-3-1-4-6-5-9-1z"/>',
 moth:'<path d="M11 11c-3-6-8-5-9-1 1 4 6 5 9 1 3 4 8 3 9-1-1-4-6-5-9 1z"/><path d="M11 5v9"/>',
 pearl:'<circle cx="11" cy="11" r="7"/><circle class="f" cx="8.5" cy="8.5" r="1.6"/>',
 mushroom:'<path d="M3 11a8 7 0 0 1 16 0zM9 11v6h4v-6"/>',
 pick:'<path d="M3 8c3-4 13-4 16 0M11 5v15"/>',
 cart:'<path d="M3 5h3l2 9h9l2-6H7"/><circle cx="9" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/>',
 spiral:'<path d="M11 11a1 1 0 1 1 2 0a3 3 0 1 1-5 -1a5 5 0 1 1 8 5"/>',
 infinity:'<path d="M11 11c-2-4-8-4-8 0s6 4 8 0 8-4 8 0-6 4-8 0z"/>',
 cat:'<path d="M4 18V6l4 3h6l4-3v12z"/><circle class="f" cx="9" cy="12" r="1"/><circle class="f" cx="14" cy="12" r="1"/>',
 egg:'<path d="M11 3c4 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2-10 6-10z"/>',
 gear:'<circle cx="11" cy="11" r="3"/><path d="M11 2v3M11 17v3M2 11h3M17 11h3M5 5l2 2M15 15l2 2M5 17l2-2M15 7l2-2"/>',
 mouse:'<ellipse cx="11" cy="12" rx="6" ry="5"/><circle cx="6" cy="6" r="2.4"/><circle cx="16" cy="6" r="2.4"/>',
 bone:'<path d="M5 8a2 2 0 1 1 2-3l9 9a2 2 0 1 1 3 2 2 2 0 1 1-3 2L7 8z"/>',
 candle:'<path d="M9 8h4v11H9zM11 3c1 2 2 3 0 5-2-2-1-3 0-5z"/>',
 cube:'<rect x="4" y="4" width="14" height="14"/><path d="M4 9h14M9 4v14"/>'};
/* floating thumbstick for touch: GK.stick() -> {down(x,y),move(x,y),up(),vec(),draw(ctx,col)}; appears where the thumb lands */
GK.stick=function(R){R=R||46;var S={on:false,ox:0,oy:0,x:0,y:0,t0:0,moved:0,
  down:function(x,y){S.on=true;S.ox=S.x=x;S.oy=S.y=y;S.t0=performance.now();S.moved=0},
  move:function(x,y){if(!S.on)return;S.x=x;S.y=y;S.moved=Math.max(S.moved,Math.hypot(x-S.ox,y-S.oy))},
  up:function(){var tap=S.on&&S.moved<10&&performance.now()-S.t0<260;S.on=false;return tap},
  vec:function(){if(!S.on)return{x:0,y:0,m:0};var dx=S.x-S.ox,dy=S.y-S.oy,d=Math.hypot(dx,dy),m=Math.min(1,d/R);return d<4?{x:0,y:0,m:0}:{x:dx/d*m,y:dy/d*m,m:m}},
  draw:function(ctx,col){if(!S.on)return;var v=S.vec();ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(S.ox,S.oy,R,0,6.2832);ctx.stroke();ctx.globalAlpha=.55;ctx.fillStyle=col;ctx.beginPath();ctx.arc(S.ox+v.x*R,S.oy+v.y*R,R*.38,0,6.2832);ctx.fill();ctx.restore()}};return S};
/* draw a pictogram on a canvas: GK.icoDraw(ctx,name,cx,cy,size,col,lineWidth) */
var IC2={};function icoParts(n){if(IC2[n])return IC2[n];var src=GK.ico[n]||GK.ico.star,out=[],re=/<(path|circle|ellipse|rect)([^>]*)\/>/g,m;
  while((m=re.exec(src))){var a={},r2=/([\w-]+)="([^"]*)"/g,q;while((q=r2.exec(m[2])))a[q[1]]=q[2];var P=new Path2D();
    if(m[1]==='path')P=new Path2D(a.d);else if(m[1]==='circle')P.arc(+a.cx,+a.cy,+a.r,0,6.2832);else if(m[1]==='ellipse')P.ellipse(+a.cx,+a.cy,+a.rx,+a.ry,0,0,6.2832);else P.rect(+a.x,+a.y,+a.width,+a.height);
    out.push({p:P,f:a['class']==='f'})}return IC2[n]=out}
GK.icoDraw=function(ctx,n,x,y,size,col,lw){var parts=icoParts(n),k=size/22;ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(k,k);ctx.strokeStyle=ctx.fillStyle=col||'#000';ctx.lineWidth=lw||1.6;ctx.lineCap='round';ctx.lineJoin='round';
  parts.forEach(function(o){if(o.f)ctx.fill(o.p);else ctx.stroke(o.p)});ctx.restore()};
GK.icoSvg=function(n,cls){return'<svg viewBox="0 0 22 22" class="'+(cls||'')+'" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(GK.ico[n]||GK.ico.star)+'</svg>'};

/* ---------- goals (achievements) ---------- */
var Gl=GK.goals={defs:null,metricFn:null,got:null,list:[],stats:{},t:0,toastN:0};
function fmt(n){return n>=1e6?(n/1e6)+'M':n>=1000?(n/1000)+'k':String(n)}
Gl.setup=function(o){Gl.defs=o.defs;Gl.metricFn=o.metrics;Gl.got=GK.ls.get('goals',[]);Gl.list=[];Object.keys(o.defs).forEach(function(k){o.defs[k].t.forEach(function(t){Gl.list.push({id:k+':'+t,k:k,t:t,ic:o.defs[k].ic})})})};
Gl.total=function(){return Gl.list.length};
Gl.count=function(){return Gl.got.length};
Gl.tick=function(){if(!Gl.metricFn)return;if(++Gl.t%45)return;var m=Gl.metricFn(),n=0;
  Gl.list.forEach(function(g){if(Gl.got.indexOf(g.id)>=0)return;var v=m[g.k];if(v!=null&&v>=g.t){Gl.got.push(g.id);n++;if(Gl.toastN<3)toast(g)}});
  if(n){GK.ls.set('goals',Gl.got);GK.audio.tone(660,.14,'triangle',.05);setTimeout(function(){GK.audio.tone(990,.22,'triangle',.05)},110)}};
function toast(g){var host=document.getElementById('stage')||document.body,t=document.createElement('div');t.className='gk-toast';t.innerHTML=GK.icoSvg(g.ic)+'<b>'+fmt(g.t)+'</b>';host.appendChild(t);Gl.toastN++;setTimeout(function(){t.remove();Gl.toastN--},2800)}
Gl.open=function(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';
  var h=document.createElement('div');h.className='gk-mh';h.innerHTML='<span>'+Gl.count()+' / '+Gl.total()+'</span>';var x=document.createElement('button');x.className='gk-b';x.textContent='×';x.onclick=function(){m.remove()};h.appendChild(x);sh.appendChild(h);
  var g=document.createElement('div');g.className='gk-stamps';var cur=Gl.metricFn?Gl.metricFn():{};
  Gl.list.forEach(function(it){var got=Gl.got.indexOf(it.id)>=0,d=document.createElement('div');d.className='gk-stamp'+(got?' got':'');d.innerHTML=GK.icoSvg(it.ic)+'<b>'+fmt(it.t)+'</b>';d.title=got?'done':(cur[it.k]!=null?Math.min(100,Math.floor(cur[it.k]/it.t*100))+'%':'');g.appendChild(d)});
  sh.appendChild(g);m.appendChild(sh);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m)};
Gl.mount=function(R){if(!R||!R.snd)return;var b=document.createElement('button');b.className='gk-b goals';b.title='Goals';b.setAttribute('aria-label','Goals');b.innerHTML=GK.icoSvg('trophy');b.onclick=function(){Gl.open()};R.snd.parentNode.insertBefore(b,R.snd);R.goals=b};

/* ---------- daily ---------- */
GK.daily={key:function(){var d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()},seed:function(){return GK.daily.key()%100000},
  streak:function(){return GK.ls.get('dstreak',{n:0,last:0}).n},
  claim:function(score){var s=GK.ls.get('dstreak',{n:0,last:0,best:0}),k=GK.daily.key();if(s.last===k){if(score>(s.best||0)){s.best=score;GK.ls.set('dstreak',s)}return s}
    var y=new Date(Date.now()-864e5),yk=y.getFullYear()*10000+(y.getMonth()+1)*100+y.getDate();s.n=s.last===yk?s.n+1:1;s.last=k;s.best=score;GK.ls.set('dstreak',s);return s}};
})();
