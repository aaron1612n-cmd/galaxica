/* Duckling Parade: ducklings waddle on their own; hand out jobs so the parade reaches Mother Duck's pond.
   Levels are built section by section, each with a planned answer; the whole parade is simulated with that plan and a level
   is only kept when enough ducklings get home. AUTO follows the same plan. */
(function(){
GK.id('parade');Auto.deep=true;
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),stage=document.getElementById('stage'),padEl=document.getElementById('pad');
var CREAM='#f3ead2',INK='#2b2622',YOLK='#ffcf33',BEAK='#e8892b',EARTH='#8a5a3b',EARTH2='#7a4e33',GRASS='#6a8f3a',STEEL='#7d8089',STEEL2='#5f626a',TWIG='#c9a26b',TWIG2='#8f6b3c',WATER='#4a7d96',THORN='#5b3a2e';
var CELL=4,LH=90,HUDH=40,T=0,TAU=Math.PI*2;
var AIR=0,DIRT=1,ROCK=2,BRICK=3,WAT=4,THN=5;
var SK=['stop','build','dig','bash','float','climb'];
Object.assign(GK.ico,{
 duck:'<circle cx="9" cy="13" r="6"/><circle cx="15" cy="7" r="3.5"/><path d="M18 7l3 1-3 1"/>',
 stop:'<circle cx="11" cy="8" r="3"/><path d="M11 11v6M4 10l7 2 7-2M8 20l3-3 3 3"/>',
 build:'<path d="M3 19h4v-3h4v-3h4v-3h4v-3"/><path d="M15 4l4 0"/>',
 dig:'<path d="M11 3v10M7 13h8l-4 7z"/>',
 bash:'<path d="M3 11h11M10 6l5 5-5 5M17 4v14"/>',
 float:'<path d="M3 10c2-6 14-6 16 0z"/><path d="M11 10v9M11 19c-1 0-2-1-2-2"/>',
 climb:'<path d="M17 2v18M13 6l4 0M13 11l4 0M13 16l4 0M6 20l4-7 3 2"/>',
 egg:'<path d="M11 3c4 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2-10 6-10z"/>',
 pond:'<ellipse cx="11" cy="15" rx="9" ry="4"/><path d="M8 11c0-3 2-5 4-5s3 2 3 4l3 1-3 1"/>'});

/* ---------- world ---------- */
function solidT(t){return t===DIRT||t===ROCK||t===BRICK}
function mk(LW){return{LW:LW,M:new Uint8Array(LW*LH),ducks:[],out:0,saved:0,dead:0,t:0,dirty:[]}}
function cell(W,x,y){if(x<0||x>=W.LW)return ROCK;if(y<0)return AIR;if(y>=LH)return AIR;return W.M[y*W.LW+x]}
function solid(W,x,y){return solidT(cell(W,x,y))}
function setC(W,x,y,t){if(x<0||x>=W.LW||y<0||y>=LH)return;W.M[y*W.LW+x]=t;W.dirty.push(x,y)}
function blocker(W,d,nx){for(var i=0;i<W.ducks.length;i++){var e=W.ducks[i];if(e===d)continue;if((e.st==='stop'||e.st==='build'||e.st==='bash')&&e.x===nx&&Math.abs(e.y-d.y)<=2)return true}return false}
function stepUp(W,x,y,nx){for(var h=1;h<=3;h++){if(solid(W,nx,y-h+1)&&!solid(W,nx,y-h)&&!solid(W,nx,y-h-1)&&!solid(W,nx,y-h-2)&&!solid(W,x,y-h)&&!solid(W,x,y-h-1))return h}return 0}
function kill(W,d,why){d.st='dead';d.why=why;d.t=0;W.dead++;W.ev&&W.ev(why,d)}
function hazard(W,d){var c=cell(W,d.x,d.y);if(c===WAT){kill(W,d,'drown');return true}if(c===THN){kill(W,d,'thorn');return true}
  var L=W.L;if(d.x>=L.ex0&&d.x<=L.ex1&&d.y>=L.ey-3&&d.st!=='dead'){d.st='exit';d.t=0;return true}return false}
function upd(W,d){d.t++;switch(d.st){
  case'fall':if(d.float&&d.t%3)return;if(solid(W,d.x,d.y+1)){if(d.fd>20&&!d.float){kill(W,d,'splat');return}d.st=d.job==='dig'?'dig':'walk';d.fd=0;return}d.y++;d.fd++;if(d.y>=LH-1){kill(W,d,'fall');return}hazard(W,d);return;
  case'walk':if(d.t%4)return;if(!solid(W,d.x,d.y+1)){d.st='fall';d.fd=0;return}var nx=d.x+d.dir;
    if(blocker(W,d,nx)){d.dir=-d.dir;return}
    if(!solid(W,nx,d.y)&&!solid(W,nx,d.y-1)&&!solid(W,nx,d.y-2)){d.x=nx}
    else{var up=stepUp(W,d.x,d.y,nx);if(up){d.x=nx;d.y-=up}else if(d.job==='bash'){d.st='bash';d.bt=0;return}else if(d.climber){d.st='climb';return}else{d.dir=-d.dir;return}}
    hazard(W,d);return;
  case'build':if(d.t%14)return;if(d.bricks>=12){d.st='walk';return}var a1=d.x+d.dir;
    if(solid(W,a1,d.y)){d.st='walk';if(!stepUp(W,d.x,d.y,a1))d.dir=-d.dir;return}
    if(solid(W,a1,d.y-1)||solid(W,a1,d.y-2)){d.st='walk';d.dir=-d.dir;return}
    for(var k=1;k<=3;k++){var c=cell(W,d.x+d.dir*k,d.y);if(!solidT(c))setC(W,d.x+d.dir*k,d.y,BRICK)}d.bricks++;W.ev&&W.ev('brick',d);
    var a2=d.x+2*d.dir;if(!solid(W,a2,d.y-1)&&!solid(W,a2,d.y-2)&&!solid(W,a2,d.y-3)){d.x=a2;d.y-=1}else if(!solid(W,a1,d.y-1)&&!solid(W,a1,d.y-2)&&!solid(W,a1,d.y-3)){d.x=a1;d.y-=1}else{d.st='walk';d.dir=-d.dir}return;
  case'dig':if(d.t%10)return;if(cell(W,d.x,d.y+1)===ROCK){d.st='walk';d.job=null;return}if(!solid(W,d.x,d.y+1)){d.st='fall';d.fd=0;d.job=null;return}
    for(var dx=-1;dx<=1;dx++){var cc=cell(W,d.x+dx,d.y+1);if(cc===DIRT||cc===BRICK)setC(W,d.x+dx,d.y+1,AIR)}d.y++;W.ev&&W.ev('dig',d);if(!solid(W,d.x,d.y+1)){d.st='fall';d.fd=0;d.job=null}return;
  case'bash':if(d.t%8)return;var ax=d.x+d.dir,any=false;for(var s=0;s<4;s++)for(var r=0;r<3;r++){var q=cell(W,d.x+d.dir*(s+1),d.y-r);if(q===DIRT||q===BRICK)any=true}
    for(var r2=0;r2<3;r2++)if(cell(W,ax,d.y-r2)===ROCK){d.st='walk';d.job=null;d.dir=-d.dir;return}
    if(!any){d.st='walk';d.job=null;return}for(var r3=0;r3<3;r3++){var q2=cell(W,ax,d.y-r3);if(q2===DIRT||q2===BRICK)setC(W,ax,d.y-r3,AIR)}d.x=ax;W.ev&&W.ev('dig',d);if(!solid(W,d.x,d.y+1)){d.st='fall';d.fd=0}return;
  case'climb':if(d.t%5)return;if(solid(W,d.x,d.y-3)){d.st='fall';d.fd=0;d.dir=-d.dir;return}if(solid(W,d.x+d.dir,d.y)||solid(W,d.x+d.dir,d.y-1)){d.y--;return}d.x+=d.dir;d.st='walk';return;
  case'exit':if(d.t>24){d.st='saved';W.saved++;W.ev&&W.ev('saved',d)}return;
  case'dead':return}}
function tick(W){var L=W.L;W.t++;if(W.out<L.n&&W.t%W.rate===0&&W.t>30){W.ducks.push({x:L.sx,y:L.sy,dir:1,st:'fall',t:0,fd:-8,job:null,bricks:0,float:false,climber:false,id:W.out});W.out++}
  for(var i=0;i<W.ducks.length;i++){var d=W.ducks[i];if(d.st!=='saved')upd(W,d)}}
function done(W){if(W.out<W.L.n)return false;for(var i=0;i<W.ducks.length;i++){var s=W.ducks[i].st;if(s!=='saved'&&s!=='dead')return false}return true}
function assign(W,d,sk){if(!d||d.st==='dead'||d.st==='saved'||d.st==='exit')return false;
  if(sk==='float'){if(d.float)return false;d.float=true;return true}if(sk==='climb'){if(d.climber)return false;d.climber=true;return true}
  if(d.st!=='walk'||d.job==='bash')return false;if(sk==='stop'){d.st='stop';return true}if(sk==='build'){d.st='build';d.bricks=0;d.t=0;return true}if(sk==='dig'){d.st='dig';d.job='dig';d.t=0;return true}if(sk==='bash'){d.job='bash';return true}return false}
/* the plan follower: hand job k to the frontmost rightward walker once it is inside the window */
function planStep(W,P){if(P.k>=P.items.length)return null;var it=P.items[P.k],best=null;for(var i=0;i<W.ducks.length;i++){var d=W.ducks[i];if(d.st==='walk'&&d.dir===1&&!d.job&&!(it.sk==='climb'&&d.climber)&&!(it.sk==='float'&&d.float)&&d.x>=it.lo&&d.x<=it.hi&&(!best||d.x>best.x))best=d}
  if(best&&assign(W,best,it.sk)){P.k++;return{d:best,sk:it.sk}}return null}

/* ---------- level builder ---------- */
function build(seed,d,tutorial){var R=GK.rng(seed);function ri(a,b){return a+Math.floor(R()*(b-a+1))}
  var W0=mk(900),M=W0.M,LW=900,x=0,g=56,plan=[],need={};function col(x,top,type){for(var y=top;y<LH;y++)M[y*LW+x]=type||DIRT}
  function flat(n){for(var i=0;i<n;i++)col(x++,g)}
  for(var y=0;y<LH;y++)M[y*LW]=ROCK;x=1;flat(30);var sx=8,sy=g-14;
  var kinds=tutorial==='climb'?['cwall']:tutorial?['pit']:[],n=tutorial?1:1+Math.floor(d*6)+(d>.15?ri(0,1):0),pool=['pit','wall','floor','step','steel','drop','thorns'];
  for(var k=0;k<n&&!tutorial;k++){var kd=pool[ri(0,pool.length-1)];if(kd==='floor'&&g>62)kd='wall';if(kd==='step'&&g<30)kd='drop';if(kd==='drop'&&g>66)kd='steel';kinds.push(kd)}
  kinds.forEach(function(kd,i){flat(ri(10,18));
    if(kd==='pit'){var w=ri(8,Math.min(20,10+Math.floor(d*12))),edge=x-1;for(var i2=0;i2<w;i2++){for(var y=g+7;y<LH;y++)M[y*LW+x]=DIRT;for(var y2=g+1;y2<g+7;y2++)M[y2*LW+x]=WAT;x++}plan.push({sk:'build',lo:edge-3,hi:edge});add('build')}
    else if(kd==='thorns'){var w2=ri(6,14),edge2=x-1;for(var i3=0;i3<w2;i3++){col(x,g);M[(g-1)*LW+x]=THN;x++}plan.push({sk:'build',lo:edge2-3,hi:edge2});add('build')}
    else if(kd==='wall'){var h=ri(5,12),th=ri(5,10);plan.push({sk:'bash',lo:x-12,hi:x-3});for(var i4=0;i4<th;i4++)col(x++,g-h);add('bash')}
    else if(kd==='cwall'){var ch=ri(6,9),cth=ri(4,6);for(var cj=0;cj<3;cj++)plan.push({sk:'climb',lo:x-12,hi:x-3});for(var i7=0;i7<cth;i7++)col(x++,g-ch);add('climb');add('climb');add('climb')}
    else if(kd==='floor'){var Tk=ri(4,8),L2=ri(14,22),g2=g+Tk+9,z0=x;for(var i5=0;i5<L2;i5++){for(var y3=g;y3<g+Tk;y3++)M[y3*LW+x]=DIRT;for(var y4=g2;y4<LH;y4++)M[y4*LW+x]=DIRT;x++}
      for(var y5=g-26;y5<g+Tk;y5++)M[y5*LW+x]=ROCK;for(var y6=g2;y6<LH;y6++)M[y6*LW+x]=DIRT;x++;plan.push({sk:'dig',lo:z0+3,hi:z0+L2-4});g=g2;add('dig')}
    else if(kd==='step'){var h2=ri(5,9),cx=x;plan.push({sk:'build',lo:cx-21,hi:cx-2*h2+3});g-=h2;add('build')}
    else if(kd==='steel'){var sh=ri(4,8),sw=ri(3,6);plan.push({sk:'build',lo:x-21,hi:x-2*sh+3});for(var i6=0;i6<sw;i6++){col(x,g);for(var y7=g-sh;y7<g;y7++)M[y7*LW+x]=ROCK;x++}add('build')}
    else if(kd==='drop'){g+=ri(8,13)}});
  flat(10);var ex0=x+2,ex1=x+16;flat(26);for(var y8=0;y8<LH;y8++)M[y8*LW+x]=ROCK;x++;
  /* the pond is shallow and safe: it is the exit */ for(var px=ex0;px<=ex1;px++)for(var py=g;py<g+3;py++)M[py*LW+px]=AIR;
  var Wn=mk(x);for(var yy=0;yy<LH;yy++)for(var xx=0;xx<x;xx++)Wn.M[yy*x+xx]=M[yy*LW+xx];
  var nd=tutorial==='climb'?3:tutorial?5:ri(12,18)+Math.floor(d*14);
  var L={LW:x,sx:sx,sy:sy,ex0:ex0,ex1:ex1,ey:g+2,g:g,n:nd,plan:plan,M0:Wn.M,skills:{}};
  SK.forEach(function(s){L.skills[s]=(need[s]||0)});if(!tutorial){var sp=1+Math.floor(d*2);for(var q=0;q<sp;q++){var s2=SK[ri(0,SK.length-1)];L.skills[s2]++}L.skills.stop=Math.max(L.skills.stop,1)}
  function add(s){need[s]=(need[s]||0)+1}
  return L}
function trial(L,rate){var W=mk(L.LW);W.M.set(L.M0);W.L=L;W.rate=rate||40;var P={k:0,items:L.plan};for(var t=0;t<30000;t++){tick(W);planStep(W,P);if(done(W))break}return{saved:W.saved,t:W.t,k:P.k}}
function makeLevel(seed,d,tut){for(var a=0;a<40;a++){var L=build(seed+a*7919,d,tut),r=trial(L);if(r.saved>=Math.ceil(L.n*.7)&&r.k===L.plan.length){L.req=Math.max(1,Math.floor(r.saved*(tut?.8:.8+d*.1)));if(L.req>r.saved)L.req=r.saved;L.botSaved=r.saved;return L}}var L2=build(seed,0,true);L2.req=3;return L2}

/* ---------- game state ---------- */
var PROG=GK.ls.get('prog',{}),ST=GK.ls.get('st',{levels:0,saved:0,bridges:0,dug:0,perfect:0,endless:0,daily:0}),MODE=GK.ls.get('mode','parade');
function save(){ST.levels=Object.keys(PROG).length;GK.ls.set('prog',PROG);GK.ls.set('st',ST)}
var cache={},G=null;
function levelFor(m,i){var k=m+':'+i;if(cache[k])return cache[k];var L=m==='parade'?makeLevel(7000+i*131,Math.min(1,i/29)):m==='endless'?makeLevel((Date.now()%1e6)+i*17,Math.min(1,.1+i*.06)):makeLevel(GK.daily.seed()*29+1,.55);cache[k]=L;return L}
function load(m,i,L){L=L||levelFor(m,i);var W=mk(L.LW);W.M.set(L.M0);W.L=L;W.rate=40;W.ev=onEvent;G={m:m,i:i,L:L,W:W,skills:Object.assign({},L.skills),sel:null,st:'play',end:0,cam:0,follow:true,ft:0,P:{k:0,items:L.plan},limit:21600};
  bakeTerrain();paintPad();fit()}
function curLevel(){var i=0;while(PROG['p'+i]!=null&&i<29)i++;return i}
function onEvent(k,d){if(!G||G.W.sim)return;var px=d.x*CELL,py=d.y*CELL;if(k==='drown'){GK.fx.burst(px,py,10,{col:WATER,speed:2,life:20,up:2,grav:.15});sfx('splash')}else if(k==='splat'||k==='thorn'||k==='fall'){GK.fx.burst(px,py-4,12,{col:YOLK,speed:2.2,life:24,grav:.1});sfx('poof')}
  else if(k==='saved'){sfx('quack');ST.saved++}else if(k==='brick'){if(T%2===0)sfx('brick');ST.bridges+=0}else if(k==='dig'){if(T%3===0)sfx('dig')}}

/* ---------- terrain painting (offscreen; only touched cells are redrawn) ---------- */
var TC=document.createElement('canvas'),tx=TC.getContext('2d');
function bakeTerrain(){var W=G.W;TC.width=W.LW*CELL;TC.height=LH*CELL;tx.clearRect(0,0,TC.width,TC.height);for(var y=0;y<LH;y++)for(var x=0;x<W.LW;x++)paintCell(W,x,y);W.dirty.length=0}
function paintCell(W,x,y){var c=cell(W,x,y),X=x*CELL,Y=y*CELL;tx.clearRect(X,Y,CELL,CELL);if(c===AIR)return;
  if(c===DIRT){tx.fillStyle=((x*7+y*13)%11===0)?EARTH2:EARTH;tx.fillRect(X,Y,CELL,CELL);if(!solidT(cell(W,x,y-1))&&cell(W,x,y-1)!==THN){tx.fillStyle=GRASS;tx.fillRect(X,Y,CELL,2+((x*5)%3===0?1:0))}}
  else if(c===ROCK){tx.fillStyle=STEEL;tx.fillRect(X,Y,CELL,CELL);tx.fillStyle=STEEL2;if((x+y*3)%5===0)tx.fillRect(X,Y,CELL,1);if((x*3+y)%6===0)tx.fillRect(X,Y,1,CELL)}
  else if(c===BRICK){tx.fillStyle=TWIG;tx.fillRect(X,Y,CELL,CELL);tx.fillStyle=TWIG2;tx.fillRect(X,Y+CELL-1,CELL,1)}
  else if(c===WAT){tx.fillStyle=WATER;tx.fillRect(X,Y,CELL,CELL)}
  else if(c===THN){tx.fillStyle=THORN;tx.beginPath();tx.moveTo(X,Y+CELL);tx.lineTo(X+CELL/2,Y-2);tx.lineTo(X+CELL,Y+CELL);tx.fill()}}
function flushTerrain(){var W=G.W,D=W.dirty;for(var i=0;i<D.length;i+=2){for(var oy=-1;oy<=1;oy++)paintCell(W,D[i],D[i+1]+oy)}D.length=0}

/* ---------- input: pick a job on the pad, tap a duckling; drag to look along the parade ---------- */
var drag=null;
GK.pointer(cv,{down:function(x,y){if(!G)return;if(G.st!=='play'){if(G.end>50)after();return}drag={x0:x,y0:y,c0:G.cam,moved:false}},
  move:function(x,y,e,dn){if(!dn||!drag)return;var dx=x-drag.x0;if(Math.abs(dx)>10)drag.moved=true;if(drag.moved){G.cam=drag.c0-dx/scale();G.follow=false;G.ft=240}},
  up:function(x,y){if(!drag||!G)return;var d=drag;drag=null;if(d.moved)return;tapAt(x,y)}});
function scale(){return GK.view.h/(LH*CELL+HUDH)}
function tapAt(px,py){var s=scale(),wx=px/s+G.cam,wy=py/s-HUDH,best=null,bd=18*18;G.W.ducks.forEach(function(d){if(d.st==='dead'||d.st==='saved')return;var dx=d.x*CELL-wx,dy=(d.y-1)*CELL-wy,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=d}});
  if(!best)return;if(!G.sel||!G.skills[G.sel]){bump();return}if(assign(G.W,best,G.sel)){G.skills[G.sel]--;sfx('job');paintPad();G.flash={d:best,t:20};if(G.sel==='dig')ST.dug++;if(G.sel==='build')ST.bridges++}else bump()}
function bump(){sfx('no')}
function paintPad(){padEl.innerHTML='';SK.forEach(function(s){var b=document.createElement('button');b.title=['Stopper','Builder','Digger','Basher','Floater','Climber'][SK.indexOf(s)];b.innerHTML=GK.icoSvg(s)+'<span>'+(G?G.skills[s]:0)+'</span>';b.disabled=!G||!G.skills[s];if(G&&G.sel===s)b.classList.add('on');
    b.onclick=function(){if(!G)return;G.sel=G.sel===s?null:s;sfx('pick');paintPad()};padEl.appendChild(b)});
  var r=document.createElement('button');r.className='rate';r.title='Hatching speed';r.innerHTML='<i>−</i>'+GK.icoSvg('egg')+'<b>'+(G?Math.round((100-G.W.rate)):60)+'</b><i>+</i>';
  r.onclick=function(e){if(!G)return;var rc=r.getBoundingClientRect(),left=e.clientX<rc.left+rc.width/2;G.W.rate=GK.clamp(G.W.rate+(left?6:-6),10,90);paintPad()};padEl.appendChild(r)}

/* ---------- AUTO ---------- */
function botTick(){if(G.st!=='play'){if(G.end>100)after();return}if(!Auto.think())return;if(G.blag==null)G.blag=Auto.react();if(G.blag>0){G.blag--;return}
  if(Auto.slip()&&G.W.t%30===0){var ws=G.W.ducks.filter(function(d){return d.st==='walk'}),sk=SK.filter(function(s){return G.skills[s]>0});if(ws.length&&sk.length){var dk=ws[Math.floor(Math.random()*ws.length)],s2=sk[Math.floor(Math.random()*sk.length)];if(assign(G.W,dk,s2)){G.skills[s2]--;paintPad()}}}
  var a=planStep(G.W,G.P);if(a)G.blag=null;if(a){G.skills[a.sk]=Math.max(0,(G.skills[a.sk]||0)-1);paintPad();G.flash={d:a.d,t:20}}}
function after(){if(G.st==='won'&&G.m==='parade')load('parade',Math.min(29,G.i+1));else if(G.st==='won'&&G.m==='endless')load('endless',G.i+1);else load(G.m,G.i,G.m==='tut'?G.L:null)}

/* ---------- tick ---------- */
function step(){T++;GK.goals.tick();tut.tick();if(!G)return;if(G.st==='play'){tick(G.W);if(Auto.on&&!tut.active)botTick();G.limit--;
    var W=G.W,sd=W.saved+W.dead;if(sd!==G.lsd){G.lsd=sd;G.lt=W.t}var stuck=W.out>=G.L.n&&W.t-(G.lt||0)>1500;
    if(done(W)||G.limit<=0||stuck){var won=W.saved>=G.L.req;G.st=won?'won':'lost';G.end=0;sfx(won?'win':'lose');
      if(won){if(G.m==='parade'){var k='p'+G.i;PROG[k]=Math.max(PROG[k]||0,W.saved);if(W.saved===G.L.n)ST.perfect++}else if(G.m==='endless')ST.endless=Math.max(ST.endless,G.i+1);else if(G.m==='daily')ST.daily=GK.daily.claim(W.saved).n;save()}}}
  else{G.end++;if(Auto.on&&!tut.active)botTick()}
  if(G.flash&&--G.flash.t<=0)G.flash=null;
  /* camera follows the front of the parade unless the player is looking around */ if(G.ft>0)G.ft--;else G.follow=true;if(G.follow){var lead=null;G.W.ducks.forEach(function(d){if(d.st!=='dead'&&d.st!=='saved'&&(!lead||d.x>lead.x))lead=d});var tx2=(lead?lead.x*CELL:G.L.sx*CELL)-viewW()*.45;G.cam+=(tx2-G.cam)*.06}
  G.cam=GK.clamp(G.cam,0,Math.max(0,G.L.LW*CELL-viewW()))}
function viewW(){return GK.view.w/scale()}

/* ---------- drawing ---------- */
function render(){var v=GK.view,c=ctx,s=scale();c.setTransform(v.dpr,0,0,v.dpr,0,0);c.fillStyle=CREAM;c.fillRect(0,0,v.w,v.h);if(!G)return;flushTerrain();var so=GK.fx.offset();
  c.setTransform(v.dpr*s,0,0,v.dpr*s,v.dpr*(-G.cam*s+so.x),v.dpr*(HUDH*s+so.y));
  /* paper hills, two layers moving slower than the ground */ var vw=viewW();[[.3,'#e2d7b6',30],[.55,'#d6caa4',52]].forEach(function(h){c.fillStyle=h[1];c.beginPath();var base=LH*CELL*.62+h[2]-30;c.moveTo(G.cam-10,LH*CELL);for(var x=0;x<=vw+40;x+=20){var wx=G.cam+x,ph=(wx*h[0])*0.012;c.lineTo(wx,base-Math.sin(ph)*26-Math.sin(ph*2.3)*12)}c.lineTo(G.cam+vw+40,LH*CELL);c.fill()});
  c.imageSmoothingEnabled=false;c.drawImage(TC,0,0);
  /* water shimmer on top */ c.strokeStyle='rgba(243,234,210,.55)';c.lineWidth=1;var L=G.L;
  /* basket and pond */ basket(c,L.sx*CELL,L.sy*CELL);pond(c,L);
  G.W.ducks.forEach(function(d){if(d.st==='saved')return;duck(c,d)});
  if(G.flash){var fd=G.flash.d;c.strokeStyle=YOLK;c.lineWidth=2;c.beginPath();c.arc(fd.x*CELL,(fd.y-1)*CELL,10+(20-G.flash.t)*.6,0,TAU);c.stroke()}
  GK.fx.draw(c);
  c.setTransform(v.dpr,0,0,v.dpr,0,0);hud(c,v.w,s);if(G.st!=='play'&&G.end>20)endCard(c,v.w,v.h);if(tut.active)tutDraw(c)}
function basket(c,x,y){c.fillStyle=TWIG;c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.moveTo(x-14,y-6);c.lineTo(x+14,y-6);c.lineTo(x+10,y+6);c.lineTo(x-10,y+6);c.closePath();c.fill();c.stroke();c.beginPath();for(var k=-10;k<=10;k+=5){c.moveTo(x+k,y-6);c.lineTo(x+k*.8,y+6)}c.stroke();
  c.fillStyle=CREAM;[-6,0,6].forEach(function(o,i){c.beginPath();c.ellipse(x+o,y-8-(i===1?2:0),3.5,4.5,0,0,TAU);c.fill();c.stroke()})}
function pond(c,L){var x0=L.ex0*CELL,x1=(L.ex1+1)*CELL,y=L.g*CELL;c.fillStyle=WATER;c.beginPath();c.ellipse((x0+x1)/2,y+4,(x1-x0)/2,9,0,0,Math.PI);c.fill();c.fillStyle=WATER;c.fillRect(x0,y,x1-x0,4);
  c.strokeStyle=CREAM;c.lineWidth=1;for(var k=0;k<3;k++){var wx=x0+10+((T*.3+k*20)%(x1-x0-20));c.beginPath();c.moveTo(wx,y+2);c.lineTo(wx+6,y+2);c.stroke()}
  /* mother duck, waiting */ var mx=(x0+x1)/2+16,my=y-2+Math.sin(T*.05)*1.2;c.fillStyle=CREAM;c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.ellipse(mx,my,13,7,0,0,TAU);c.fill();c.stroke();c.beginPath();c.arc(mx-10,my-9,5,0,TAU);c.fill();c.stroke();c.fillStyle=BEAK;c.beginPath();c.moveTo(mx-15,my-10);c.lineTo(mx-21,my-8);c.lineTo(mx-15,my-7);c.fill();c.fillStyle=INK;c.fillRect(mx-12,my-11,1.6,1.6)}
function duck(c,d){var x=d.x*CELL,y=(d.y+1)*CELL,f=d.dir,bob=d.st==='walk'?((d.t>>2)%2):0;c.save();c.translate(x,y);if(d.st==='dead'){c.globalAlpha=Math.max(0,1-d.t/30);d.t++}if(d.st==='exit'){c.globalAlpha=1-d.t/24;c.translate(0,d.t*.3)}c.scale(f,1);
  if(d.float&&d.st==='fall'){c.fillStyle=GRASS;c.beginPath();c.ellipse(0,-19,9,4,0,Math.PI,0);c.fill();c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(0,-19);c.lineTo(0,-10);c.stroke()}
  c.fillStyle=BEAK;c.fillRect(-3,-2,2,2);c.fillRect(1,-2+bob,2,2);
  c.fillStyle=YOLK;c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.ellipse(-1,-6,5.5,4.5,0,0,TAU);c.fill();c.stroke();c.beginPath();c.arc(2.5,-11.5-bob*.5,3.4,0,TAU);c.fill();c.stroke();
  c.fillStyle=BEAK;c.beginPath();c.moveTo(5.5,-12);c.lineTo(8.5,-11);c.lineTo(5.5,-10);c.fill();c.fillStyle=INK;c.fillRect(3.3,-13,1.3,1.3);
  if(d.st==='stop'){c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(-5,-7);c.lineTo(-10,-11);c.moveTo(3,-7);c.lineTo(8,-11);c.stroke()}
  if(d.st==='build'){c.strokeStyle=TWIG2;c.lineWidth=2;c.beginPath();c.moveTo(3,-6);c.lineTo(9,-4);c.stroke()}
  if(d.st==='dig'||d.job==='dig'){c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.moveTo(4,-8);c.lineTo(5,1);c.stroke();c.fillStyle=STEEL;c.fillRect(3.5,0,3,3)}
  if(d.job==='bash'){c.strokeStyle=INK;c.lineWidth=1.6;var sw=d.st==='bash'?Math.sin(d.t*.8)*3:0;c.beginPath();c.moveTo(3,-7);c.lineTo(9,-7+sw);c.stroke()}
  if(d.climber){c.fillStyle=INK;c.fillRect(-6,-3,2,2)}
  c.restore()}
function hud(c,W,s){var G2=G.W,L=G.L;c.fillStyle=INK;c.textBaseline='middle';c.font='800 24px "Gluten",serif';c.textAlign='left';var hx=14;if(G.m==='parade'){GK.icoDraw(c,'flag',hx+8,22,20,INK,1.8);c.fillText(String(G.i+1),hx+22,24);hx+=30+c.measureText(String(G.i+1)).width}GK.icoDraw(c,'duck',hx+8,22,24,INK,1.8);c.fillText((L.n-G2.out)+'',hx+26,24);
  GK.icoDraw(c,'pond',W/2-34,22,26,INK,1.8);c.fillStyle=G2.saved>=L.req?'#3d7a2a':INK;c.fillText(G2.saved+' / '+L.req,W/2-16,24);c.fillStyle=INK;
  var sec=Math.max(0,Math.ceil(G.limit/60));c.textAlign='right';c.fillText(Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'),W-14,24);
}
function endCard(c,W,H){var won=G.st==='won',sc=Math.max(1,1.8-(G.end-20)*.08);c.save();c.translate(W/2,H/2);c.scale(sc,sc);c.rotate(won?-.05:.05);c.fillStyle=won?YOLK:CREAM;c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.moveTo(-90,-46);c.lineTo(90,-50);c.lineTo(86,46);c.lineTo(-88,50);c.closePath();c.fill();c.stroke();
  GK.icoDraw(c,won?'pond':'duck',-44,0,44,INK,2);c.fillStyle=INK;c.font='800 34px "Gluten",serif';c.textAlign='center';c.textBaseline='middle';c.fillText(G.W.saved+'/'+G.L.n,30,2);c.restore();if(G.end>50)GK.pulse(c,W/2,H/2+84,G.end,INK,10)}

/* ---------- levels ---------- */
function openLevels(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);sh.innerHTML='<div class="gk-mh"><span style="display:flex;gap:10px;align-items:center">'+GK.icoSvg('duck')+ST.levels+' / 30</span></div>';
  var g=document.createElement('div');g.className='lvs';for(var i=0;i<30;i++){(function(i){var b=document.createElement('button');b.className=PROG['p'+i]!=null?'done':'';b.textContent=i+1;b.disabled=i>0&&PROG['p'+(i-1)]==null&&PROG['p'+i]==null;b.onclick=function(){MODE='parade';GK.ls.set('mode',MODE);paint();load('parade',i);m.remove()};g.appendChild(b)})(i)}
  sh.appendChild(g);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m)}

/* ---------- sound ---------- */
function sfx(k){var A=GK.audio,t=A.ctx&&A.ctx.currentTime;if(!A.ctx)return;switch(k){case'quack':A.tone(520,.07,'square',.025,.7);A.tone(470,.08,'square',.02,.7,t+.08);break;case'job':A.tone(880,.08,'triangle',.04,1.3);break;case'pick':A.tone(660,.05,'triangle',.03);break;case'no':A.tone(180,.1,'square',.03);break;
  case'brick':A.tone(300+Math.random()*80,.04,'triangle',.02);break;case'dig':A.noise(.05,.02,0,600);break;case'splash':A.noise(.25,.05,0,700);break;case'poof':A.tone(240,.15,'sine',.04,.5);break;
  case'win':[523,659,784,1047].forEach(function(f,i){A.tone(f,.25,'triangle',.05,1,t+i*.1)});break;case'lose':A.tone(330,.5,'sine',.04,.6);break}}

/* ---------- tutorial: choose the builder, hand it to the leader, watch them cross ---------- */
var tut=GK.tutorial({parent:stage,onStart:function(){var L=makeLevel(4242,0,true);L.skills={stop:0,build:1,dig:0,bash:0,float:0,climb:0};load('tut',0,L)},onEnd:function(){load(MODE,MODE==='parade'?curLevel():0)},steps:[
  {done:function(){return G&&G.sel==='build'||G&&G.skills.build===0}},
  {done:function(){return G&&G.skills.build===0}},
  {done:function(){return G&&G.st==='won'&&G.end>60||G&&G.st==='lost'&&(load('tut',0,G.L),false)}},
  {init:function(){load('tut',1,makeLevel(4243,0,'climb'))},done:function(){return G&&G.i===1&&(G.sel==='climb'||G.skills.climb<3)}},
  {done:function(){return G&&G.skills.climb===0}},
  {done:function(){return G&&G.i===1&&(G.st==='won'&&G.end>60||G.st==='lost'&&(load('tut',1,G.L),false))}}]});
function tutDraw(c){if(!G)return;if(tut.i===0||tut.i===3){var b=padEl.children[tut.i?5:1];if(b){b.classList.toggle('on',(tut.t>>4)%2===0||G.sel===(tut.i?'climb':'build'))}}else if(tut.i===1||tut.i===4){var it=G.L.plan[0],lead=null;G.W.ducks.forEach(function(d){if(d.st==='walk'&&(!lead||d.x>lead.x))lead=d});
    if(lead){var s=scale();GK.pulse(c,(lead.x*CELL-G.cam)*s,((lead.y-1)*CELL+HUDH)*s,tut.t,YOLK,10)}}}

/* ---------- bar ---------- */
var B=GK.controls(document.getElementById('bar'),{bar:'bottom',onHelp:function(){tut.start()},extra:[
  {id:'lv',html:GK.icoSvg('duck'),title:'Levels',fn:openLevels},
  {id:'rs',html:GK.icon('restart'),title:'Restart',fn:function(){if(G&&!tut.active)load(G.m,G.i)}},
  {id:'m_parade',cls:'md',html:GK.icoSvg('flag'),title:'Parade',fn:function(){setMode('parade')}},
  {id:'m_endless',cls:'md',html:GK.icoSvg('infinity'),title:'Endless',fn:function(){setMode('endless')}},
  {id:'m_daily',cls:'md',html:GK.icoSvg('sun'),title:'Daily',fn:function(){setMode('daily')}}]});
['m_parade','m_endless','m_daily'].forEach(function(id){B.panel.insertBefore(B[id],B.panel.firstChild)});
function setMode(m){if(tut.active)return;MODE=m;GK.ls.set('mode',m);paint();load(m,m==='parade'?curLevel():0)}
function paint(){['parade','endless','daily'].forEach(function(k){B['m_'+k].classList.toggle('on',MODE===k)})}
GK.goals.setup({metrics:function(){return ST},defs:{levels:{ic:'flag',t:[1,5,10,20,30]},saved:{ic:'duck',t:[25,250,1000,5000]},bridges:{ic:'build',t:[5,50,200]},dug:{ic:'dig',t:[5,50,200]},perfect:{ic:'star',t:[1,5,15]},endless:{ic:'infinity',t:[5,15,30]},daily:{ic:'sun',t:[1,3,7,14,30]}}});
GK.goals.mount(B);
function dpic(fn){return function(c,s){c.fillStyle=CREAM;c.fillRect(0,0,s,s);c.translate(s/2,s-8);c.scale(1.7,1.7);fn(c)}}
function dduck(extra){return dpic(function(c){var d={x:0,y:-1,dir:1,st:'walk',t:0,job:null,float:false,climber:false};Object.assign(d,extra||{});duck(c,d)})}
GK.guide({title:'Duckling Parade',goal:'Get enough ducklings into Mother Duck\'s pond. The number you need is at the top.',
 how:['Ducklings hatch from the basket and waddle forward on their own. They turn around at walls.','Pick a job on the pad, then tap a duckling to give it that job. The pad shows how many of each you have.','Water, thorns and long falls are deadly. A fall of more than about five duckling heights is too far without a leaf.','Ducklings that meet a builder, basher or stopper turn back, so the parade waits safely while the work gets done.','The egg button sets how fast new ducklings hatch.'],
 keys:[['Click a duckling','give the chosen job'],['Drag','look along the level']],touch:[['Tap a duckling','give the chosen job'],['Drag','look along the level']],
 legend:[{pic:dduck({st:'stop'}),name:'Stopper',note:'stands still and turns the others back'},{pic:dduck({st:'build'}),name:'Builder',note:'lays a 12-step twig staircase'},{pic:dduck({job:'dig'}),name:'Digger',note:'digs straight down'},{pic:dduck({job:'bash'}),name:'Basher',note:'tunnels through the next wall'},
  {pic:dduck({float:true,st:'fall'}),name:'Floater',note:'leaf umbrella: survives any fall'},{pic:dduck({climber:true}),name:'Climber',note:'climbs walls instead of turning'},
  {sw:WATER,name:'Water',note:'deadly'},{sw:THORN,name:'Thorns',note:'deadly'},{sw:STEEL,name:'Stone',note:'cannot be dug or bashed'},{sw:TWIG,name:'Twigs',note:'builder steps; can be dug'},{sw:EARTH,name:'Earth',note:'diggable'},{ic:'pond',name:'Pond',note:'home: Mother Duck waits here'}],
 tips:['Give jobs to the leading duckling so the rest follow its path.','Running out of time ends the level, so plan the first few jobs quickly.']});GK.online.mount(B,{game:'duckling-parade',boards:[{key:'levels',m:'levels',ic:'flag'},{key:'perfect',m:'perfect',ic:'star'},{key:'endless',m:'endless',ic:'infinity'},{daily:{}}]});
function fit(){GK.fit(cv,stage)}addEventListener('resize',fit);addEventListener('orientationchange',fit);fit();
save();paint();load(MODE,MODE==='parade'?curLevel():0);GK.loop(step,render);tut.maybe();
window.__g={tut:tut,G:function(){return G},levelFor:levelFor,trial:trial,load:load,prog:PROG,st:ST,
  stats:function(){return{m:G.m,i:G.i,st:G.st,out:G.W.out,n:G.L.n,saved:G.W.saved,dead:G.W.dead,req:G.L.req,plan:G.P.k+'/'+G.L.plan.length,levels:ST.levels,t:G.W.t}}};
})();
