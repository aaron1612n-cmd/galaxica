/* Deepdig Expedition: five biomes, a boss at the foot of each, camps, relics, bombs and the Hall.
   Loaded before deepdig.js; everything here reads the game's globals (M, O, HID, D, ctx, GK...) only when called. */
var EX=(function(){
var R0=4,GW0=15,DL=44,AR=9,BOSS=5;                 /* R0 must equal SR in deepdig.js */
var g=[],at=[],af=[];                              /* ground row, arena top, arena floor of each biome */
for(var b0=0;b0<BOSS;b0++){g[b0]=b0?af[b0-1]+4:R0;at[b0]=g[b0]+DL;af[b0]=at[b0]+AR}
var GHX=af[BOSS-1]+6;
var VER='#c8432a',INK='#2b2219',PAPER='#ece2cc',CARD='#f6efdc';
var BIO=[
 {nm:'Loam Gardens',hard:.02,black:0,gas:.008,caves:6,lava:0,ore:[[1,.035],[2,.03],[3,.012],[9,.004],[4,.004]]},
 {nm:'Fungal Caverns',hard:.035,black:0,gas:.014,caves:9,lava:2,ore:[[2,.03],[3,.03],[4,.02],[9,.006],[5,.005]]},
 {nm:'Magma Vents',hard:.045,black:.012,gas:.012,caves:5,lava:7,ore:[[3,.02],[4,.03],[5,.022],[6,.005],[9,.004]]},
 {nm:'Crystal Vaults',hard:.06,black:.025,gas:.012,caves:6,lava:3,ore:[[5,.03],[6,.018],[7,.018],[8,.005],[9,.004]]},
 {nm:'The Core',hard:.07,black:.04,gas:.018,caves:4,lava:8,ore:[[5,.03],[6,.03],[7,.03],[8,.016]]}];
/* watercolour strata for each biome: three bands of [wash, hatching] */
var BANDS=[['#b9915f','dots'],['#c9a06b','lines'],['#a9835a','stip'],
 ['#8a9460','dots'],['#798556','thin'],['#939a68','stip'],
 ['#92583f','cross'],['#7b4a38','thin'],['#a5663f','dots'],
 ['#7e8d95','thin'],['#6b7b86','cross'],['#909ca2','stip'],
 ['#5b4a46','cross'],['#4b3e3b','thin'],['#6c5750','dots']];
var BOSSN=['Mole Queen','Spore Matron','Slag Colossus','Crystal Warden','Core Titan'],BHP=[6,8,10,8,12],BR=[1.15,1.2,1.5,1.1,1.6];
var PLATE=['The Queen kept the first vein for herself.','Under the caps, the old crews still hum.','A furnace someone forgot to bank.','Every crystal remembers a voice.','The relic was never buried. It was planted.'];
var ROM=['I','II','III','IV','V'];
var RELIC=[
 {id:'lens',ic:'eye',nm:'Lens'},{id:'oil',ic:'drop',nm:'Lamp oil'},{id:'plate',ic:'shield',nm:'Plating'},{id:'satchel',ic:'bomb',nm:'Satchel'},
 {id:'pockets',ic:'cart',nm:'Pockets'},{id:'boots',ic:'flame',nm:'Boots'},{id:'fingers',ic:'pick',nm:'Fingers'},{id:'seismo',ic:'bug',nm:'Seismograph'},
 {id:'chute',ic:'cloud',nm:'Parachute'},{id:'fossil',ic:'bone',nm:'Fossil hunter'},{id:'charge',ic:'bolt',nm:'Heavy charge'},{id:'tonic',ic:'heart',nm:'Tonic'}];
var PERK=[
 {k:'bombs',ic:'bomb',max:5,cost:[40,100,160,220,280]},{k:'tank',ic:'drop',max:3,cost:[80,200,400]},{k:'drill',ic:'pick',max:3,cost:[120,300,600]},
 {k:'lamp',ic:'star',max:2,cost:[150,400]},{k:'purse',ic:'coin',max:3,cost:[60,150,300]}];
var BOMBCOST=30,BOMBMAX=9,FUSE=48;
var s=null,HL=null;

function hall(){if(!HL){HL=GK.ls.get('hall',null)||{};HL.fame=HL.fame||0;HL.p=HL.p||{};PERK.forEach(function(p){HL.p[p.k]=HL.p[p.k]||0});HL.pl=HL.pl||[0,0,0,0,0];HL.runs=HL.runs||0;HL.best=HL.best||0;HL.wins=HL.wins||0}return HL}
function saveHall(){GK.ls.set('hall',hall())}
function bOf(y){for(var b=BOSS-1;b>0;b--)if(y>=g[b]-3)return b;return 0}
function arena(y){for(var b=0;b<BOSS;b++)if(y>=at[b]&&y<af[b])return b;return-1}
function camp(y){for(var b=0;b<BOSS;b++)if(y===g[b]-1)return b;return-1}
function has(id){return!!(s&&s.rel[id])}

/* ============ world ============ */
function gen(sd){var rn=GK.rng(sd),N=GW0*GHX;M=new Uint8Array(N);O=new Uint8Array(N);HID=new Uint8Array(N);
  function set(x,y,m,o,h){var i=y*GW0+x;M[i]=m;O[i]=o||0;HID[i]=h||0}
  for(var y=R0;y<GHX;y++)for(var x=0;x<GW0;x++)set(x,y,1);
  for(var b=0;b<BOSS;b++){var B=BIO[b];
    for(y=g[b]+1;y<at[b];y++){var rel=y-g[b];for(x=0;x<GW0;x++){var i=y*GW0+x,u=rn(),m=1;
      if(rel>3&&u<B.hard)m=5;else if(rel>3&&u<B.hard+B.black)m=6;else if(rel>6&&u>.985)m=0;
      M[i]=m;if(m&&rel>4&&y<at[b]-2&&rn()<B.gas)HID[i]=1;
      if(m===1||m===5)for(var k=0;k<B.ore.length;k++)if(rn()<B.ore[k][1]){O[i]=B.ore[k][0];break}}}
    for(var c=0;c<B.caves;c++){var cx=(rn()*GW0)|0,cy=g[b]+8+((rn()*(DL-14))|0),r=1+((rn()*2)|0);
      for(var dy=-r;dy<=r;dy++)for(var dx=-r-1;dx<=r+1;dx++){var xx=cx+dx,yy=cy+dy;if(xx>=0&&xx<GW0&&yy>g[b]+4&&yy<at[b]-2&&rn()<.8)set(xx,yy,0)}}
    for(c=0;c<B.lava;c++){var lx=1+((rn()*13)|0),ly=g[b]+10+((rn()*(DL-18))|0);if(lx>=6&&lx<=8&&ly<g[b]+14)lx=10;
      for(dy=0;dy<=1;dy++)for(dx=-1;dx<=1;dx++)if(rn()<.8&&lx+dx>=0&&lx+dx<GW0)set(lx+dx,ly+dy,8)}
    for(x=0;x<GW0;x++){set(x,g[b],1);for(y=at[b];y<af[b];y++)set(x,y,0);set(x,af[b],7)}  /* camp floor, arena, arena floor */
    if(b<BOSS-1)for(y=af[b]+1;y<=af[b]+3;y++)for(x=0;x<GW0;x++)set(x,y,0)}                  /* the camp room below */
  for(y=af[BOSS-1]+1;y<=af[BOSS-1]+3;y++)for(x=0;x<GW0;x++)set(x,y,0);                       /* the chamber of the relic */
  for(x=0;x<GW0;x++){set(x,af[BOSS-1]+4,1);set(x,af[BOSS-1]+5,7)}set(7,af[BOSS-1]+4,1,10);
  for(x=0;x<GW0;x++)for(y=0;y<R0;y++)set(x,y,0)}

/* ============ a run ============ */
function start(){var h=hall();var rl=GK.rng((Math.random()*1e9)|0);
  s={rel:{},got:{0:1},pick:{},bombs:3+h.p.bombs,bl:[],pr:[],pl:[],boss:[],iT:0,banner:{b:0,t:160},seen:0,bk:0,endT:0,fx:0,k:rl};
  for(var b=0;b<BOSS;b++)s.boss.push({hp:BHP[b],dead:0,spawned:0});
  return s}
function upgrades(){var h=hall();return{drill:h.p.drill,tank:h.p.tank,hull:0,cargo:0,engine:0}}
function purse(){return hall().p.purse*100}

/* ============ relic effects ============ */
function mult(o){return(has('lens')?1.3:1)*(o===9&&has('fossil')?3:1)}
function digMul(){return has('fingers')?.7:1}
function bonus(k){return k==='hull'&&has('plate')?50:k==='cap'&&has('pockets')?6:0}
function soften(n,why){if(why==='lava'&&has('boots'))return 0;if(why==='fall'&&has('chute'))return 0;return n}
function offer(b){var rn=GK.rng(s.k()*1e9+b*77),left=RELIC.filter(function(r){return!s.rel[r.id]});
  for(var i=left.length-1;i>0;i--){var j=(rn()*(i+1))|0,t=left[i];left[i]=left[j];left[j]=t}return left.slice(0,3+hall().p.lamp)}
function take(r){s.rel[r.id]=1;GK.audio.tone(523,.15,'triangle',.05);GK.audio.tone(784,.25,'triangle',.05,1,GK.audio.ctx&&GK.audio.ctx.currentTime+.1);
  if(r.id==='satchel')s.bombs=Math.min(BOMBMAX+3,s.bombs+3);if(r.id==='plate')D.hull=Math.min(hullMax(),D.hull+50);if(r.id==='pockets'){}
  for(var k=0;k<2;k++)GK.fx.burst((D.x+.5)*TS,(D.y+.5)*TS,16,{col:[VER,'#d9a72e'][k],speed:4,life:34,shape:'ci',size:3,up:2,grav:.1})}
function relicModal(b,done){if(s.pick[b])return;var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';
  var hd=document.createElement('div');hd.className='gk-mh';hd.innerHTML='<span>'+GK.icoSvg('star')+'</span>';var x=document.createElement('button');x.className='gk-b';x.textContent='×';x.onclick=function(){m.remove()};hd.appendChild(x);sh.appendChild(hd);
  var list=document.createElement('div');list.className='shop';
  offer(b).forEach(function(r,i){var bt=document.createElement('button');bt.className='srow rel'+(i===0&&D.tut?' hint':'');bt.innerHTML=GK.icoSvg(r.ic)+'<b>'+r.nm+'</b>';
    bt.onclick=function(){s.pick[b]=1;take(r);m.remove();done&&done(r)};list.appendChild(bt)});
  sh.appendChild(list);m.appendChild(sh);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m)}
function autoPick(b){if(s.pick[b])return;var o=offer(b);if(o.length){s.pick[b]=1;take(o[(s.k()*o.length)|0])}}

/* ============ the digger's position, in cells ============ */
function dpx(){var a=D.act,p=a&&a.k!=='dig'?a.t/a.n:0;return{x:D.x+.5+(a&&a.k!=='dig'?a.dx*p:0),y:D.y+.5+(a&&a.k!=='dig'?a.dy*p:0)}}

/* ============ bombs ============ */
function drop(){if(!s||D.dead||mode!=='play')return false;if(s.bombs<=0||s.bl.length>=3)return false;
  for(var i=0;i<s.bl.length;i++)if(s.bl[i].x===D.x&&s.bl[i].y===D.y)return false;
  s.bombs--;s.bl.push({x:D.x,y:D.y,t:FUSE});s.bk=(s.bk||0)+1;GK.audio.tone(300,.08,'square',.04);return true}
function radius(){return has('charge')?2:1}
function blast(cx,cy,R,chain){var q=[];
  for(var dy=-R;dy<=R;dy++)for(var dx=-R;dx<=R;dx++){var x=cx+dx,y=cy+dy;if(x<0||x>=GW0||y<R0||y>=GH)continue;var i=y*GW0+x;if(M[i]===7||O[i]===10)continue;
    if(HID[i]){HID[i]=0;q.push([x,y])}
    if(O[i]&&D.cargo.length<cap()){D.cargo.push(O[i]);if(!D.tut)ST.ores++}
    if(M[i]){M[i]=0;O[i]=0;if(!D.tut)ST.dug++}}
  GK.fx.burst((cx+.5)*TS,(cy+.5)*TS,36,{col:VER,speed:5.5,life:32,shape:'ci',size:4});GK.fx.burst((cx+.5)*TS,(cy+.5)*TS,26,{col:INK,speed:4,life:38,size:3,grav:.1});GK.fx.shake(9,18);GK.audio.noise(.6,.22,0,0);
  var p=dpx();if(Math.abs(p.x-(cx+.5))<=R+.62&&Math.abs(p.y-(cy+.5))<=R+.62)hurt(22,'bomb');
  var bs=s.boss[s.cur];if(bs&&s.B&&!bs.dead){var B=s.B,dd=Math.hypot(B.x-(cx+.5),B.y-(cy+.5));if(dd<=R+B.r+.7)hitBoss(B,has('charge')?3:2)}
  if(D.tut&&!chain)tutF.bomb=1;
  q.forEach(function(c){blast(c[0],c[1],1,1)})}
function tickBombs(){for(var i=s.bl.length-1;i>=0;i--){var b=s.bl[i];if(--b.t<=0){s.bl.splice(i,1);blast(b.x,b.y,radius())}}}

/* ============ bosses ============ */
function spawn(b){var K=s.boss[b],B={k:b,hp:K.hp,max:BHP[b],r:BR[b],x:7.5,y:at[b]+3,t:0,c:90,m:'walk',f:1,hit:0,n:0,rot:0,rad:3.2};
  if(b===0){B.x=3;B.y=af[b]-B.r*.8}if(b===2){B.x=11;B.y=af[b]-B.r}if(b===3){B.m='closed';B.c=190}
  s.B=B;s.cur=b;K.spawned=1;GK.fx.shake(8,24);GK.audio.tone(80,.9,'sawtooth',.07,.5)}
function hitBoss(B,n){if(B.hit>6)return;if(B.k===3&&B.m==='closed'){GK.audio.tone(900,.08,'square',.04);GK.fx.text(B.x*TS,B.y*TS,'×',INK,24);B.hit=10;return}
  if(B.k===0&&B.m==='stun')n*=2;B.hp-=n;s.boss[B.k].hp=B.hp;B.hit=14;GK.fx.text(B.x*TS,B.y*TS-16,'−'+n,VER,26);GK.fx.hitstop(5);GK.audio.tone(160,.2,'sawtooth',.07,.6);
  if(B.hp<=0)kill(B)}
function kill(B){var b=B.k,K=s.boss[b];K.dead=1;K.hp=0;s.B=null;s.pr=[];s.pl=[];ST.xboss=(ST.xboss||0)+1;saveST();
  for(var k=0;k<5;k++)GK.fx.burst(B.x*TS,B.y*TS,30,{col:[VER,INK,'#d9a72e',PAPER,'#9b8f86'][k],speed:6,life:60,size:4,up:1,grav:.1});GK.fx.shake(14,40);GK.audio.noise(1,.25,0,0);
  [392,523,659,784].forEach(function(f,j){GK.audio.tone(f,.5,'triangle',.06,1,GK.audio.ctx&&GK.audio.ctx.currentTime+.18*(j+1))});
  var pay=150*(b+1);D.money+=pay;D.earned+=pay;GK.fx.text(B.x*TS,B.y*TS,'+'+pay,VER,30);D.hull=Math.min(hullMax(),D.hull+30);
  var i=af[b]*GW0+7;M[i]=0;                                                                  /* the trap door opens */
  var h=hall();if(!h.pl[b]){h.pl[b]=1;saveHall();if(!Auto.on&&!D.tut)setTimeout(function(){plateModal(b)},900)}}
function shoot(x,y,a,v,life){s.pr.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:life||220})}
function pillar(col,delay){s.pl.push({x:col,t:-delay})}
function updBoss(B){var p=dpx(),b=B.k,y0=at[b],y1=af[b];B.t++;if(B.hit>0)B.hit--;
  if(b===0){var dx=p.x-B.x;if(B.m==='walk'){B.f=dx>0?1:-1;B.x+=B.f*.05;if(--B.c<=0){B.m='tele';B.c=55}}
    else if(B.m==='tele'){B.f=dx>0?1:-1;if(--B.c<=0){B.m='charge';B.vx=B.f*.34}}
    else if(B.m==='charge'){B.x+=B.vx;if(B.x<B.r||B.x>GW0-B.r){B.m='stun';B.c=120;GK.fx.shake(8,16);GK.audio.noise(.3,.15)}}
    else if(--B.c<=0){B.m='walk';B.c=140}
    B.x=GK.clamp(B.x,B.r,GW0-B.r);B.y=y1-B.r*.8}
  else if(b===1){B.x=7.5+Math.sin(B.t*.015)*5.2;B.y=y0+2.6+Math.sin(B.t*.033)*.9;
    if(--B.c<=0){B.c=B.hp<B.max/2?72:100;var a0=Math.atan2(p.y-B.y,p.x-B.x);[-.38,0,.38].forEach(function(a){shoot(B.x,B.y,a0+a,.11)})}}
  else if(b===2){var d2=p.x-B.x;B.x=GK.clamp(B.x+(d2>0?1:-1)*.022,B.r,GW0-B.r);B.y=y1-B.r;
    if(--B.c<=0){B.c=B.hp<B.max/2?85:125;pillar(Math.floor(p.x),50)}}
  else if(b===3){B.x=7.5+Math.sin(B.t*.015)*3;B.y=y0+3.2+Math.sin(B.t*.04)*.5;
    if(B.m==='closed'){B.rot+=.03;B.rad+=(3.2-B.rad)*.08;if(--B.c<=0){B.m='open';B.c=100}}else{B.rot+=.012;B.rad+=(1.2-B.rad)*.08;if(--B.c<=0){B.m='closed';B.c=190}}
    for(var i=0;i<4;i++){var an=B.rot+i*Math.PI/2,sx=B.x+Math.cos(an)*B.rad,sy=B.y+Math.sin(an)*B.rad;if(B.rad>2&&Math.hypot(sx-p.x,sy-p.y)<.62&&s.iT<=0){hurt(14,'shard');s.iT=50}}}
  else{B.x=7.5+Math.sin(B.t*.012)*4;B.y=y0+3.4+Math.sin(B.t*.027)*.7;
    if(--B.c<=0){B.c=B.hp<B.max*.5?62:92;B.n=(B.n+1)%3;
      if(B.n===0){var a1=Math.atan2(p.y-B.y,p.x-B.x);for(var j=-2;j<=2;j++)shoot(B.x,B.y,a1+j*.3,.1)}
      else if(B.n===1){var c=Math.floor(p.x);pillar(c,45);pillar(GW0-1-c,45)}
      else for(var q=0;q<8;q++)shoot(B.x,B.y,q*Math.PI/4+B.t*.01,.085)}}
  if(Math.hypot(p.x-B.x,p.y-B.y)<B.r+.42&&s.iT<=0){hurt(18,'boss');s.iT=50}}
function tickShots(){var p=dpx(),b=s.cur;
  for(var i=s.pr.length-1;i>=0;i--){var q=s.pr[i];q.x+=q.vx;q.y+=q.vy;
    if(--q.life<=0||q.x<0||q.x>GW0||q.y<at[b]||q.y>af[b]){s.pr.splice(i,1);continue}
    if(Math.hypot(q.x-p.x,q.y-p.y)<.45&&s.iT<=0){hurt(12,'spore');s.iT=40;s.pr.splice(i,1)}}
  for(i=s.pl.length-1;i>=0;i--){var l=s.pl[i];l.t++;if(l.t>38){s.pl.splice(i,1);continue}
    if(l.t===1)GK.fx.shake(5,10);if(l.t>0&&Math.abs(p.x-(l.x+.5))<.62&&s.iT<=0){hurt(24,'pillar');s.iT=50}}}

/* ============ the tick ============ */
function tick(){if(!s)return;if(s.iT>0)s.iT--;if(s.banner&&s.banner.t>0)s.banner.t--;
  if(s.endT>0&&--s.endT===0){end(1);return}
  var ab=arena(D.y);if(ab>=0&&!D.dead){if(!s.boss[ab].dead&&!s.boss[ab].spawned)spawn(ab)}
  if(s.B&&ab===s.cur&&!D.dead){updBoss(s.B);tickShots()}
  tickBombs();
  var bi=bOf(D.y);if(D.y>g[bi]&&bi!==s.seen&&bi>s.seen){s.seen=bi;s.banner={b:bi,t:170}}
  if(!D.tut&&D.dmax>(ST.xdepth||0)){ST.xdepth=D.dmax}}
function arrive(c){if(!s||s.got[c])return;s.got[c]=1;s.bombs=Math.min(BOMBMAX,s.bombs+3);GK.fx.text((D.x+.5)*TS,(D.y)*TS,'+3',INK,26);GK.audio.tone(660,.12,'triangle',.05);
  s.banner={b:c,t:170};s.seen=Math.max(s.seen,c)}
function end(win){if(D.dead&&D.over)return;var h=hall(),bk=s.boss.filter(function(k){return k.dead}).length,f=D.dmax+bk*150+(win?1000:0);
  h.fame+=f;h.runs++;h.best=Math.max(h.best,D.dmax*2);if(win){h.wins++;ST.xwin=(ST.xwin||0)+1}ST.xrel=Math.max(ST.xrel||0,Object.keys(s.rel).length);saveHall();saveST();
  D.dead=1;D.deadT=0;D.over=1;D.win=win?1:0;D.fame=f;D.bk=bk}
function win(){s.endT=110}

/* ============ drawing ============ */
function px(x){return x*TS}function py(y){return HUD+(y-cam)*TS}
function inCamp(y){for(var b=1;b<BOSS;b++)if(y>=g[b]-3&&y<g[b])return true;return false}
function bg(y){return arena(y)>=0?'#2a221c':inCamp(y)?'#d9ccaa':null}
function glyph(c,k,x,y,r,t,o){o=o||{};c.save();c.translate(x,y);c.lineWidth=Math.max(1.2,r*.06);c.strokeStyle=INK;
  if(o.hit>0&&((o.hit>>1)&1))c.globalAlpha=.55;
  if(k===0){var f=o.f||1;c.scale(f,1);var w=o.m==='tele'?Math.sin(t*.9)*1.5:0;c.translate(w,0);
    c.fillStyle='#8a7766';c.beginPath();c.ellipse(0,0,r,r*.78,0,0,6.3);c.fill();c.stroke();c.fillStyle='#b9a58e';c.beginPath();c.ellipse(-r*.1,r*.2,r*.62,r*.4,0,0,6.3);c.fill();
    c.fillStyle='#e3a99c';c.beginPath();c.moveTo(r*.78,-r*.2);c.lineTo(r*1.35,r*.1);c.lineTo(r*.78,r*.4);c.closePath();c.fill();c.stroke();
    c.fillStyle=INK;c.beginPath();c.arc(r*.52,-r*.28,r*.07,0,6.3);c.fill();c.beginPath();c.moveTo(r*.2,r*.7);c.lineTo(r*.5,r*1.0);c.moveTo(r*.45,r*.7);c.lineTo(r*.75,r*.98);c.moveTo(-r*.3,r*.7);c.lineTo(-r*.55,r*1.0);c.stroke();
    c.beginPath();for(var i=-3;i<=3;i++){c.moveTo(-r*.8,i*r*.18-r*.3);c.lineTo(-r*.3,i*r*.18-r*.34)}c.globalAlpha=.4;c.stroke();c.globalAlpha=1;if(o.m==='stun'){c.fillStyle=VER;for(i=0;i<3;i++){c.beginPath();c.arc(Math.cos(t*.2+i*2.1)*r*.5,-r*.95+Math.sin(t*.2+i*2.1)*r*.15,r*.08,0,6.3);c.fill()}}}
  else if(k===1){c.fillStyle=CARD;c.beginPath();c.moveTo(-r*.28,r*.9);c.lineTo(-r*.2,-r*.1);c.lineTo(r*.2,-r*.1);c.lineTo(r*.28,r*.9);c.closePath();c.fill();c.stroke();
    c.beginPath();for(i=0;i<4;i++){c.moveTo(-r*.5+i*r*.33,-r*.1);c.lineTo(-r*.3+i*r*.2,r*.12)}c.stroke();
    c.fillStyle=VER;c.beginPath();c.ellipse(0,-r*.1,r,r*.78,0,Math.PI,6.3);c.closePath();c.fill();c.stroke();c.fillStyle=CARD;[[-.5,-.4,.15],[.1,-.62,.2],[.52,-.3,.13],[-.1,-.28,.09]].forEach(function(q){c.beginPath();c.arc(q[0]*r,q[1]*r,q[2]*r,0,6.3);c.fill();c.stroke()})}
  else if(k===2){c.fillStyle='#7d7367';c.fillRect(-r*.8,-r*.1,r*1.6,r*.8);c.strokeRect(-r*.8,-r*.1,r*1.6,r*.8);c.fillRect(-r*.55,-r*.95,r*1.1,r*.85);c.strokeRect(-r*.55,-r*.95,r*1.1,r*.85);c.fillRect(-r*.9,r*.7,r*.7,r*.3);c.strokeRect(-r*.9,r*.7,r*.7,r*.3);c.fillRect(r*.2,r*.7,r*.7,r*.3);c.strokeRect(r*.2,r*.7,r*.7,r*.3);
    c.strokeStyle=VER;c.lineWidth=2;c.beginPath();c.moveTo(-r*.3,r*.05);c.lineTo(0,r*.3);c.lineTo(-r*.1,r*.6);c.moveTo(r*.3,-r*.75);c.lineTo(r*.1,-r*.5);c.stroke();c.fillStyle=VER;c.fillRect(-r*.3,-r*.7,r*.6,r*.12)}
  else if(k===3){c.fillStyle='#a9bcc1';c.beginPath();c.moveTo(0,-r);c.lineTo(r*.75,0);c.lineTo(0,r);c.lineTo(-r*.75,0);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(0,-r);c.lineTo(0,r);c.moveTo(-r*.75,0);c.lineTo(r*.75,0);c.stroke();
    if(o.m==='open'){c.fillStyle=VER;c.beginPath();c.arc(0,0,r*.2,0,6.3);c.fill();c.stroke()}
    for(i=0;i<4;i++){var an=(o.rot||0)+i*Math.PI/2,sx=Math.cos(an)*(o.rad||2),sy=Math.sin(an)*(o.rad||2);c.save();c.translate(sx*TSC(o),sy*TSC(o));c.rotate(an+1.57);c.fillStyle='#7e8d95';c.beginPath();c.moveTo(0,-r*.4);c.lineTo(r*.2,r*.25);c.lineTo(-r*.2,r*.25);c.closePath();c.fill();c.stroke();c.restore()}}
  else{c.fillStyle='#3a3436';c.beginPath();c.arc(0,0,r,0,6.3);c.fill();c.stroke();c.strokeStyle=PAPER;c.lineWidth=1.2;for(i=1;i<4;i++){c.beginPath();c.arc(0,0,r*i*.25,0,6.3);c.stroke()}
    c.strokeStyle=INK;c.lineWidth=2;for(i=0;i<8;i++){var a2=i*Math.PI/4+t*.01;c.beginPath();c.moveTo(Math.cos(a2)*r,Math.sin(a2)*r);c.lineTo(Math.cos(a2)*r*1.28,Math.sin(a2)*r*1.28);c.stroke()}
    c.fillStyle=VER;c.beginPath();c.arc(0,0,r*.26+Math.sin(t*.08)*r*.03,0,6.3);c.fill();c.strokeStyle=INK;c.stroke()}
  c.restore()}
function TSC(o){return o.px||1}
function drawWorld(){if(!s)return;var c=ctx;
  s.pl.forEach(function(l){var X=px(l.x),y0=py(at[s.cur]),y1=py(af[s.cur]);c.save();
    if(l.t<0){c.fillStyle='rgba(200,67,42,.22)';c.fillRect(X,y0,TS,y1-y0);c.strokeStyle=VER;c.lineWidth=1.2;c.beginPath();for(var yy=y0;yy<y1;yy+=10){c.moveTo(X,yy);c.lineTo(X+TS,yy+8)}c.stroke()}
    else{c.fillStyle=VER;c.fillRect(X+4,y0,TS-8,y1-y0);c.strokeStyle=INK;c.lineWidth=1.4;c.strokeRect(X+4,y0,TS-8,y1-y0)}c.restore()});
  if(s.B&&arena(D.y)===s.cur){var B=s.B;glyph(c,B.k,px(B.x),py(B.y),B.r*TS,B.t,{f:B.f,m:B.m,hit:B.hit,rot:B.rot,rad:B.rad,px:TS})}
  s.bl.forEach(function(b){var X=px(b.x+.5),Y=py(b.y+.5),f=b.t/FUSE;c.save();c.fillStyle=INK;c.strokeStyle=INK;c.beginPath();c.arc(X,Y+3,8,0,6.3);c.fill();
    c.strokeStyle=VER;c.lineWidth=2;c.beginPath();c.arc(X,Y+3,12,-1.57,-1.57+6.283*f);c.stroke();if((b.t>>2)&1){c.fillStyle=VER;c.beginPath();c.arc(X+5,Y-7,2.6,0,6.3);c.fill()}c.restore()});
  s.pr.forEach(function(q){var X=px(q.x),Y=py(q.y);c.fillStyle=VER;c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.arc(X,Y,6,0,6.3);c.fill();c.stroke();c.fillStyle=CARD;c.beginPath();c.arc(X-1.5,Y-1.5,1.6,0,6.3);c.fill()});
  if(has('seismo')){c.strokeStyle='rgba(200,67,42,.8)';c.lineWidth=1.6;var y0=Math.floor(cam)-1;for(var yy=y0;yy<y0+VIEWR+3;yy++)for(var x=0;x<GW0;x++)if(yy>=R0&&yy<GH&&HID[yy*GW0+x]&&M[yy*GW0+x]){var X=px(x+.5),Y=py(yy+.5);c.beginPath();c.moveTo(X-5,Y-5);c.lineTo(X+5,Y+5);c.moveTo(X+5,Y-5);c.lineTo(X-5,Y+5);c.stroke()}}}
function drawTrap(){if(!s)return;for(var b=0;b<BOSS;b++){var Y=py(af[b]);if(Y<HUD-TS||Y>H)continue;var open=s.boss[b].dead;
  ctx.fillStyle=open?'#2a221c':'#4a3b30';ctx.fillRect(7*TS,Y,TS,TS);ctx.strokeStyle=open?'rgba(236,226,204,.3)':VER;ctx.lineWidth=1.5;ctx.strokeRect(7*TS+3,Y+3,TS-6,TS-6);
  if(!open){ctx.beginPath();ctx.moveTo(7*TS+3,Y+3);ctx.lineTo(8*TS-3,Y+TS-3);ctx.moveTo(8*TS-3,Y+3);ctx.lineTo(7*TS+3,Y+TS-3);ctx.stroke()}}}
function hud(){if(!s)return;var c=ctx;c.fillStyle=INK;c.textAlign='left';
  GK.icoDraw(c,'bomb',W-120,26,20,s.bombs?INK:VER,1.5);c.font='24px "IM Fell English"';c.fillText(String(s.bombs),W-104,34);
  var n=0;RELIC.forEach(function(r){if(s.rel[r.id]){GK.icoDraw(c,r.ic,W/2+34+n*17,26,15,INK,1.4);n++}});
  var ab=arena(D.y),B=s.B;if(B&&ab===s.cur){var y=H-34,w=W-100;c.fillStyle='rgba(236,226,204,.9)';c.fillRect(46,y-4,w+8,28);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(50,y,w,9);c.fillStyle=VER;c.fillRect(51,y+1,(w-2)*Math.max(0,B.hp/B.max),7);
    c.fillStyle=INK;c.font='13px "IM Fell English SC"';c.textAlign='center';c.fillText(BOSSN[B.k],W/2,y+21)}}
function over(){if(!s||!s.banner||s.banner.t<=0||D.dead||D.tut)return;var t=s.banner.t,a=Math.min(1,t/30,(170-t)/20),c=ctx;c.save();c.globalAlpha=Math.max(0,a);
  c.fillStyle=CARD;c.strokeStyle=INK;c.lineWidth=1;var w=300,x=(W-w)/2,y=HUD+6;c.fillRect(x,y,w,50);c.strokeRect(x+.5,y+.5,w-1,49);c.strokeRect(x+4.5,y+4.5,w-9,41);
  c.fillStyle=INK;c.textAlign='center';c.font='22px "IM Fell English SC"';c.fillText(ROM[s.banner.b]+' · '+BIO[s.banner.b].nm,W/2,y+32);c.restore()}
function deadScreen(){var c=ctx;GK.icoDraw(c,D.win?'crown':'trophy',W/2,H/2-84,48,D.win?VER:INK,1.5);c.fillStyle=INK;c.textAlign='center';c.font='72px "IM Fell English"';c.fillText(String(D.fame||0),W/2,H/2);
  for(var b=0;b<BOSS;b++){var x=W/2-BOSS*14+b*28+14;c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.arc(x,H/2+34,8,0,6.3);if(s.boss[b].dead){c.fillStyle=VER;c.fill()}c.stroke()}
  if(D.deadT>40)GK.pulse(c,W/2,H/2+90,D.deadT,VER,10)}

/* ============ the Hall: perks bought with fame, and the story plates ============ */
function sheet(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m);return{m:m,sh:sh}}
function hallModal(){var o=sheet(),m=o.m,sh=o.sh;
  function paint(){var h=hall();sh.innerHTML='';var hd=document.createElement('div');hd.className='gk-mh';hd.innerHTML='<span>'+GK.icoSvg('trophy')+' '+h.fame+'</span>';var x=document.createElement('button');x.className='gk-b';x.textContent='×';x.onclick=function(){m.remove()};hd.appendChild(x);sh.appendChild(hd);
    var list=document.createElement('div');list.className='shop';
    PERK.forEach(function(p){var l=h.p[p.k],c=l>=p.max?0:p.cost[l],r=document.createElement('div');r.className='srow';
      r.innerHTML=GK.icoSvg(p.ic)+'<div class="pips">'+p.cost.map(function(_,j){return'<i class="'+(j<l?'on':'')+'"></i>'}).join('')+'</div>';
      var bt=document.createElement('button');bt.className='buy'+(c?'':' max');bt.innerHTML=GK.icoSvg('trophy')+' '+c;bt.disabled=!c||h.fame<c;bt.onclick=function(){if(h.fame>=c){h.fame-=c;h.p[p.k]++;saveHall();GK.audio.tone(523,.12,'triangle',.05);paint()}};r.appendChild(bt);list.appendChild(r)});sh.appendChild(list);
    var pl=document.createElement('div');pl.className='plates';for(var b=0;b<BOSS;b++)(function(b){var d=document.createElement('button');d.className='plate'+(h.pl[b]?' got':'');var cv=document.createElement('canvas');cv.width=cv.height=88;d.appendChild(cv);
      var k=cv.getContext('2d');if(h.pl[b]){k.fillStyle=CARD;k.fillRect(0,0,88,88);glyph(k,b,44,46,26,0,{f:1,rad:2,px:10})}else{k.strokeStyle=INK;k.setLineDash([3,4]);k.strokeRect(6,6,76,76);glyph(k,b,44,46,24,0,{px:10});k.globalCompositeOperation='source-atop';k.fillStyle='rgba(236,226,204,.93)';k.fillRect(8,8,72,72)}
      d.onclick=function(){if(h.pl[b])plateModal(b)};pl.appendChild(d)})(b);sh.appendChild(pl)}
  paint()}
function plateModal(b){var o=sheet(),sh=o.sh;sh.classList.add('plate-sheet');var cv=document.createElement('canvas');cv.width=cv.height=240;var k=cv.getContext('2d');
  k.fillStyle=CARD;k.fillRect(0,0,240,240);k.strokeStyle=INK;k.lineWidth=1;k.strokeRect(6.5,6.5,227,227);k.strokeRect(11.5,11.5,217,217);glyph(k,b,120,116,62,0,{f:1,rad:2,px:28});
  k.fillStyle=INK;k.textAlign='center';k.font='20px "IM Fell English SC"';k.fillText(ROM[b],120,38);sh.appendChild(cv);var p=document.createElement('p');p.className='cap';p.textContent=PLATE[b];sh.appendChild(p);
  var bt=document.createElement('button');bt.className='gk-b';bt.textContent='×';bt.onclick=function(){o.m.remove()};sh.appendChild(bt)}

/* ============ the camp shop's extra row ============ */
function buyBomb(){if(!s||D.money<BOMBCOST||s.bombs>=BOMBMAX)return false;D.money-=BOMBCOST;s.bombs++;return true}
function shopRow(list,paint){var r=document.createElement('div');r.className='srow';r.innerHTML=GK.icoSvg('bomb')+'<div class="cnt">'+s.bombs+'</div>';
  var bt=document.createElement('button');bt.className='buy';bt.innerHTML=GK.icoSvg('coin')+' '+BOMBCOST;bt.disabled=D.money<BOMBCOST||s.bombs>=BOMBMAX;
  bt.onclick=function(){if(buyBomb()){GK.audio.tone(523,.12,'triangle',.05);paint()}};r.appendChild(bt);list.appendChild(r)}

return{g:g,at:at,af:af,GH:GHX,BANDS:BANDS,BIO:BIO,RELIC:RELIC,BHP:BHP,BR:BR,BOSS:BOSS,gen:gen,start:start,upgrades:upgrades,purse:purse,
  mult:mult,digMul:digMul,bonus:bonus,soften:soften,has:has,bOf:bOf,arena:arena,camp:camp,bg:bg,
  relicModal:relicModal,autoPick:autoPick,offer:offer,drop:drop,tick:tick,arrive:arrive,end:end,win:win,
  drawWorld:drawWorld,drawTrap:drawTrap,hud:hud,over:over,deadScreen:deadScreen,hallModal:hallModal,plateModal:plateModal,shopRow:shopRow,hall:hall,
  state:function(){return s},glyph:glyph,
  boss:function(){return s&&s.B&&arena(D.y)===s.cur?s.B:null},bossDead:function(b){return s.boss[b].dead},
  bombsLeft:function(){return s?s.bombs:0},bombsOut:function(){return s?s.bl.length:0},bl:function(){return s?s.bl:[]},pl:function(){return s?s.pl:[]},R:radius,buyBomb:buyBomb,BOMBCOST:BOMBCOST}
})();
