/* Gravity Garden core: data tables, procedural names/species, N-body physics, life, stellar evolution, presets, save/load. */
(function(){
var G=1,EPS2=16,TAU=Math.PI*2,LIM=1700;
var GG=window.GG={G:G,TAU:TAU,EPS2:EPS2};
GG.lsGet=function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
GG.lsSet=function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
GG.rng=function(seed){var a=seed|0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};

/* ---------- procedural names (about 800k distinct) ---------- */
var NA=['Ae','Bo','Ca','Da','El','Fa','Gi','Ha','Il','Jo','Ka','Lu','Me','Na','Or','Pa','Qu','Ri','Sa','Te','Ul','Va','We','Xi','Yo','Za','Thy','Kro','Sha','Bre','Cly','Dra','Fen','Gla','Hy','Ish','Kel','Lyr','Mor','Nyx'];
var NM=['ra','lo','ne','ti','mu','ko','va','si','du','ph','th','ri','na','lu','be','xa','mi','to','qua','zel','ru','sh','ve','lan','dor','mar','sen','tri','vor','win'];
var NE=['n','s','x','th','r','l','is','on','ar','um','a','ia','os','ys','ek','or','en','ix','ae','us'];
GG.name=function(seed){var r=GG.rng((seed|0)*2654435761|0);var s=NA[r()*NA.length|0];if(r()<.75)s+=NM[r()*NM.length|0];if(r()<.45)s+=NM[r()*NM.length|0];return s+NE[r()*NE.length|0]};
var KIN=['kin','ari','oid','ans','ids','ori'];
GG.species=function(seed){var r=GG.rng((seed|0)^0x9e3779b1);return{name:GG.name((seed|0)+7)+KIN[r()*KIN.length|0],legs:[0,2,4,6,8][r()*5|0],eyes:1+(r()*4|0),tail:r()<.5,horns:r()*3|0,shell:r()<.35,fins:r()<.3,ant:r()<.4,size:.6+r()*.8}};

/* ---------- catalogs ---------- */
GG.CLS=[
 {id:'rocky', flux:[.55,1.7],life:4,m:.15},
 {id:'ocean', flux:[.6,1.9], life:6,m:.15},
 {id:'jungle',flux:[.7,1.6], life:6,m:.15},
 {id:'desert',flux:[1.2,2.6],life:5,m:.12},
 {id:'ice',   flux:[.08,.6], life:3,m:.15},
 {id:'lava',  flux:[3,99],   life:0,m:.15},
 {id:'barren',flux:[0,0],    life:0,m:.12},
 {id:'gas',   flux:[0,0],    life:0,m:1.5},
 {id:'ringed',flux:[0,0],    life:0,m:2.2}];
var CB={};GG.CLS.forEach(function(c){CB[c.id]=c});GG.CB=CB;
GG.STAR=[{id:'O',m:1100,rays:30},{id:'B',m:800,rays:26},{id:'A',m:600,rays:22},{id:'F',m:480,rays:18},{id:'G',m:400,rays:16},{id:'K',m:280,rays:12},{id:'M',m:140,rays:8}];
var SB={};GG.STAR.forEach(function(s){SB[s.id]=s});GG.SB=SB;
GG.THR=[0,150,450,1800,5500,14600,32850];   /* habitable ticks needed for life stages 0..6 */
GG.YR=365;
GG.lifeOfMass=function(m){return 450*GG.YR*Math.pow(400/Math.max(m,100),2.5)};
GG.starByMass=function(m){var b=GG.STAR[0],d=1e9;GG.STAR.forEach(function(s){var e=Math.abs(s.m-m);if(e<d){d=e;b=s}});return b.id};

/* ---------- world ---------- */
var W=GG.W={bodies:[],tick:0,dirty:true,fx:[],ev:[],wild:true,stats:GG.lsGet('ggStats',{years:0,coll:0,sn:0,imp:0,ext:0,presets:0,seeds:0,speed:0,saves:0}),seed:0};
function emit(t,b,x){if(W.ev.length<300)W.ev.push({t:t,b:b,x:x})}
GG.emit=emit;
var nid=1;
GG.defMass=function(b){switch(b.kind){
  case 'planet':return CB[b.cls].m*[.6,1,1.8][b.size==null?1:b.size];
  case 'moon':return .05;case 'rock':return .03;case 'comet':return .02;case 'station':return .01;
  case 'star':return SB[b.cls].m;case 'dwarf':return 220;case 'neutron':return 420;case 'hole':return 1500;
  case 'dark':return 250;case 'repulsor':return -150;default:return 0}};
GG.mk=function(kind,cls,x,y,vx,vy,o){o=o||{};
  var b={id:nid++,kind:kind,cls:cls,x:x,y:y,vx:vx||0,vy:vy||0,ax:0,ay:0,m:0,seed:(o.seed!=null?o.seed:Math.random()*1e9)|0,tr:[],age:0,hab:0,scar:0,fixed:false,ps:0,flux:0,heat:0,cold:0,
    par:o.par||0,host:0,hostIdx:10,pang:0,giant:false,sp:null,stage:0,size:o.size==null?1:o.size,link:0,rad:0,wt:0,dead:false};
  b.m=o.m!=null?o.m:GG.defMass(b);
  if(kind==='star')b.age=o.age!=null?o.age:Math.random()*.25*GG.lifeOfMass(b.m);
  if(kind==='nebula'){b.fixed=true;b.rad=o.rad||(60+Math.random()*40)}
  if(kind==='wormhole'||kind==='repulsor')b.fixed=true;
  if(o.fixed)b.fixed=true;
  b.name=GG.name(b.seed);return b};
GG.R=function(b){switch(b.kind){
  case 'planet':return 4+2.2*Math.cbrt(Math.max(b.m,.3));case 'moon':return 3;case 'rock':return 2;case 'comet':return 2.4;case 'station':return 2.6;
  case 'star':return(6+1.2*Math.cbrt(b.m))*(b.giant?2.2:1);case 'dwarf':return 5;case 'neutron':return 4;case 'hole':return 5+.5*Math.cbrt(b.m);
  case 'wormhole':return 10;case 'dark':return 12;case 'repulsor':return 9;case 'nebula':return b.rad||70}return 4};
function light(b){return b.kind==='moon'||b.kind==='rock'||b.kind==='comet'||b.kind==='station'}
GG.isLight=light;
GG.isSun=function(b){return b.kind==='star'||b.kind==='dwarf'||b.kind==='neutron'}; /* emits light */
GG.isHost=function(b){return b.kind==='star'||b.kind==='dwarf'||b.kind==='neutron'||b.kind==='hole'};
GG.lum=function(b){return b.kind==='star'?Math.pow(b.m/400,3)*(b.giant?3:1):b.kind==='dwarf'?.03:b.kind==='neutron'?.004:0};
GG.zone=function(b){var L=GG.lum(b);return[145*Math.sqrt(L/1.9),145*Math.sqrt(L/.6)]};   /* habitable ring (flux .6-1.9) */
GG.hostIdxOf=function(h){if(!h)return 10;if(h.kind==='star')return'OBAFGKM'.indexOf(h.cls);return h.kind==='dwarf'?7:h.kind==='neutron'?8:9};
GG.add=function(b,bulk){var A=W.bodies,i,nl=0,nh=0;
  A.push(b);W.dirty=true;
  for(i=0;i<A.length;i++){if(light(A[i])&&!A[i].fixed)nl++;else nh++}
  if(nl>360){for(i=0;i<A.length;i++)if(light(A[i])&&!A[i].fixed){A.splice(i,1);break}}
  if(nh>90){for(i=0;i<A.length;i++)if(A[i].kind==='planet'){A.splice(i,1);break}}
  if(!bulk)GG.zeroMom();return b};
GG.zeroMom=function(){var A=W.bodies,M=0,px=0,py=0,i,b;
  for(i=0;i<A.length;i++){b=A[i];if(b.fixed||b.m<=0)continue;M+=b.m;px+=b.m*b.vx;py+=b.m*b.vy}
  if(M<=0)return;px/=M;py/=M;for(i=0;i<A.length;i++){b=A[i];if(b.fixed)continue;b.vx-=px;b.vy-=py}};
GG.clear=function(){W.bodies.length=0;W.fx.length=0;W.ev.length=0;W.tick=0;W.dirty=true};
GG.byId=function(id){var A=W.bodies;for(var i=0;i<A.length;i++)if(A[i].id===id)return A[i];return null};
GG.dominant=function(x,y){var A=W.bodies,best=null,bs=0,i,b,dx,dy,s;for(i=0;i<A.length;i++){b=A[i];if(b.m<=0||b.fixed&&b.kind!=='star'&&b.kind!=='hole')continue;dx=x-b.x;dy=y-b.y;s=b.m/(dx*dx+dy*dy+EPS2);if(s>bs){bs=s;best=b}}return best};
GG.circ=function(x,y,dir){var d=GG.dominant(x,y);if(!d)return{vx:0,vy:0,d:null};var dx=x-d.x,dy=y-d.y,r=Math.hypot(dx,dy)||1,v=Math.sqrt(G*d.m/Math.max(r,GG.R(d)+2)),s=dir||1;
  return{vx:d.vx-dy/r*v*s,vy:d.vy+dx/r*v*s,d:d}};
GG.orbit=function(par,r,ang,dir){var x=par.x+Math.cos(ang)*r,y=par.y+Math.sin(ang)*r,v=Math.sqrt(G*Math.abs(par.m)/r),s=dir||1;return[x,y,par.vx-Math.sin(ang)*v*s,par.vy+Math.cos(ang)*v*s]};

/* ---------- forces (heavy bodies attract everything; light bodies are test particles) ---------- */
function acc(L){var H=[],T=[],i,j,a,b,dx,dy,r2,inv;
  for(i=0;i<L.length;i++){a=L[i];a.ax=0;a.ay=0;if(a.kind==='nebula'||a.kind==='wormhole')continue;(light(a)?T:H).push(a)}
  for(i=0;i<H.length;i++){a=H[i];for(j=i+1;j<H.length;j++){b=H[j];dx=b.x-a.x;dy=b.y-a.y;r2=dx*dx+dy*dy+EPS2;inv=G/(r2*Math.sqrt(r2));
    a.ax+=dx*inv*b.m;a.ay+=dy*inv*b.m;b.ax-=dx*inv*a.m;b.ay-=dy*inv*a.m}}
  for(i=0;i<T.length;i++){a=T[i];for(j=0;j<H.length;j++){b=H[j];dx=b.x-a.x;dy=b.y-a.y;r2=dx*dx+dy*dy+EPS2;inv=G/(r2*Math.sqrt(r2));a.ax+=dx*inv*b.m;a.ay+=dy*inv*b.m}}
  for(i=0;i<L.length;i++)if(L[i].fixed){L[i].ax=0;L[i].ay=0}}
function leap(L){for(var s=0;s<2;s++){var i,b;for(i=0;i<L.length;i++){b=L[i];if(b.fixed)continue;b.vx+=b.ax*.25;b.vy+=b.ay*.25;b.x+=b.vx*.5;b.y+=b.vy*.5}
  acc(L);for(i=0;i<L.length;i++){b=L[i];if(b.fixed)continue;b.vx+=b.ax*.25;b.vy+=b.ay*.25}}}
GG.predict=function(kind,m,x,y,vx,vy){
  var L=W.bodies.map(function(b){return{kind:b.kind,m:b.m,x:b.x,y:b.y,vx:b.vx,vy:b.vy,ax:0,ay:0,fixed:b.fixed,rad:b.rad,giant:b.giant,cls:b.cls}});
  var g={kind:kind,m:m,x:x,y:y,vx:vx,vy:vy,ax:0,ay:0,fixed:false};L.push(g);acc(L);var out=[],i,dead=false;
  for(var k=0;k<260&&!dead;k++){leap(L);if(k%4===3)out.push(g.x,g.y);
    for(i=0;i<L.length-1;i++){var o=L[i];if(o.fixed||o.kind==='dark')continue;if(Math.hypot(o.x-g.x,o.y-g.y)<GG.R(o)+1.5){dead=true;break}}
    if(Math.abs(g.x)>LIM*1.3||Math.abs(g.y)>LIM*1.3)break}
  return out};

/* ---------- collisions, impacts, wormholes ---------- */
function fx(x,y,max,kind,life){if(W.fx.length<80)W.fx.push({x:x,y:y,max:max,kind:kind||'ring',age:0,life:life||40})}
GG.fx=fx;
function ignite(b){if(b.kind==='planet'&&b.m>=120){b.kind='star';b.cls='M';b.hab=0;b.stage=0;b.age=0;emit('ignite',b)}
  if(b.kind==='star'){var c=GG.starByMass(b.m);if(b.m>1250){b.kind='hole';b.cls='H';emit('super',b);GG.blast(b);W.stats.sn++}else b.cls=c}
  if(b.kind==='neutron'&&b.m>900){b.kind='hole';b.cls='H';emit('super',b)}}
function impact(l,h){
  fx(l.x,l.y,14,'ring',18);W.stats.imp++;
  if(h.kind==='planet'){h.scar++;emit('impact',h);
    if(l.kind==='comet'&&CB[h.cls].life>0&&h.hab<160){h.hab=160;emit('seed',h)}
    else if(l.kind==='rock'&&h.stage>=2){h.hab*=.45;W.stats.ext++;emit('ext',h)}}
  else emit('absorb',h)}
function collide(){
  var A=W.bodies,H=[],T=[],i,j,a,b,k,dx,dy,d,ra,rb,need;
  for(i=0;i<A.length;i++){a=A[i];if(a.dead||a.fixed||a.kind==='dark')continue;(light(a)?T:H).push(a)}
  for(i=0;i<H.length;i++){a=H[i];if(a.dead)continue;
    for(j=i+1;j<H.length;j++){b=H[j];if(b.dead||a.dead)continue;dx=b.x-a.x;dy=b.y-a.y;d=Math.hypot(dx,dy);ra=GG.R(a);rb=GG.R(b);
      need=Math.max(ra,rb)+.5*Math.min(ra,rb)+((a.kind==='hole'||b.kind==='hole')?5:0);
      if(d<need){var big=a.m>=b.m?a:b,sm=big===a?b:a,m=a.m+b.m;
        big.x=(a.x*a.m+b.x*b.m)/m;big.y=(a.y*a.m+b.y*b.m)/m;big.vx=(a.vx*a.m+b.vx*b.m)/m;big.vy=(a.vy*a.m+b.vy*b.m)/m;
        var holeish=a.kind==='hole'||b.kind==='hole';
        if(holeish){big.kind='hole';big.cls='H'}
        else if((a.kind==='planet')!==(b.kind==='planet')){var st=a.kind==='planet'?b:a;big.kind=st.kind;big.cls=st.cls;big.age=st.age}
        big.m=m;
        if(big.kind==='planet'){big.hab*=.4;big.scar++;if(big.cls!=='gas'&&big.cls!=='ringed'){if(m>=.8)big.cls='gas'}else if(m>=3.5)big.cls='ringed'}
        ignite(big);sm.dead=true;W.dirty=true;W.stats.coll++;emit('merge',big);fx(big.x,big.y,24,'ring',22)}}}
  for(i=0;i<T.length;i++){a=T[i];if(a.dead)continue;
    for(j=0;j<H.length;j++){b=H[j];if(b.dead)continue;if(Math.abs(b.x-a.x)>40||Math.abs(b.y-a.y)>40)continue;
      if(Math.hypot(b.x-a.x,b.y-a.y)<GG.R(b)+GG.R(a)*.5){impact(a,b);a.dead=true;W.dirty=true;break}}}
  var any=false;for(i=0;i<A.length;i++)if(A[i].dead){any=true;break}
  if(any)W.bodies=A.filter(function(x){return!x.dead})}
function wormholes(){var A=W.bodies,i,j,w,o,b,d,ang;
  for(i=0;i<A.length;i++){w=A[i];if(w.kind!=='wormhole'||!w.link)continue;o=GG.byId(w.link);if(!o)continue;
    for(j=0;j<A.length;j++){b=A[j];if(b.fixed||b.wt>W.tick)continue;if(Math.abs(b.x-w.x)>12||Math.abs(b.y-w.y)>12)continue;
      if(Math.hypot(b.x-w.x,b.y-w.y)<9){var sp=Math.hypot(b.vx,b.vy)||1;b.x=o.x+b.vx/sp*13;b.y=o.y+b.vy/sp*13;b.wt=W.tick+45;b.tr.length=0;emit('warp',b);fx(o.x,o.y,18,'ring',20)}}}}
function nebulae(){var A=W.bodies,i,j,n,b,r2;
  for(i=0;i<A.length;i++){n=A[i];if(n.kind!=='nebula')continue;r2=n.rad*n.rad;
    for(j=0;j<A.length;j++){b=A[j];if(b.fixed)continue;var dx=b.x-n.x,dy=b.y-n.y;if(dx*dx+dy*dy<r2){b.vx*=.988;b.vy*=.988}}}}
GG.blast=function(s){var A=W.bodies,i,b,dx,dy,d,im;fx(s.x,s.y,520,'blast',90);
  for(i=0;i<A.length;i++){b=A[i];if(b===s||b.fixed)continue;dx=b.x-s.x;dy=b.y-s.y;d=Math.hypot(dx,dy)||1;
    if(d<520){im=3.2*(1-d/520);b.vx+=dx/d*im;b.vy+=dy/d*im}
    if(b.kind==='planet'&&d<280){b.hab=0;b.scar++}}
  W.dirty=true};
function dieStar(b){
  if(b.m<650){b.kind='dwarf';b.cls='W';b.m*=.55;b.giant=false;fx(b.x,b.y,140,'shell',120);emit('dwarf',b)}
  else{if(b.m<1000){b.kind='neutron';b.cls='N';b.m*=.4}else{b.kind='hole';b.cls='H';b.m*=.5}
    b.giant=false;GG.blast(b);W.stats.sn++;emit('super',b);b.tr.length=0}
  W.dirty=true}

/* ---------- life ---------- */
function lifePass(dt){
  var A=W.bodies,suns=[],hosts=[],i,j,p,s,F,d,C,ok,st,old;
  for(i=0;i<A.length;i++){if(GG.isSun(A[i]))suns.push(A[i]);if(GG.isHost(A[i]))hosts.push(A[i])}
  for(i=0;i<A.length;i++){p=A[i];if(p.kind!=='planet')continue;
    F=0;for(j=0;j<suns.length;j++){s=suns[j];d=Math.hypot(p.x-s.x,p.y-s.y);F+=GG.lum(s)*21025/(d*d+100)}
    p.flux=F;C=CB[p.cls];
    /* climate drift: scorched or frozen worlds change class */
    if(C.life>0||p.cls==='ice'||p.cls==='lava'||p.cls==='desert'){
      p.heat=F>2.7?p.heat+dt:Math.max(0,p.heat-dt);p.cold=F<.15?p.cold+dt:Math.max(0,p.cold-dt);
      if(p.heat>700){if(p.cls==='desert'&&F>4)p.cls='lava';else if(p.cls!=='lava'&&p.cls!=='desert')p.cls='desert';p.heat=0;emit('climate',p)}
      else if(p.cold>700&&p.cls!=='ice'&&p.cls!=='lava'){p.cls='ice';p.cold=0;emit('climate',p)}
      else if(p.cls==='ice'&&F>.7&&F<1.6){p.heat+=dt;if(p.heat>700){p.cls='ocean';p.heat=0;emit('climate',p)}}
      else if(p.cls==='lava'&&F<2.5){p.cold+=dt;if(p.cold>700){p.cls='barren';p.cold=0;emit('climate',p)}}}
    C=CB[p.cls];ok=C.life>0&&F>=C.flux[0]&&F<=C.flux[1];
    if(ok){p.hab+=dt}else p.hab=Math.max(0,p.hab-dt*3);
    p.hab=Math.min(p.hab,GG.THR[C.life]+400);
    old=p.stage;st=0;for(j=GG.THR.length-1;j>=0;j--)if(p.hab>=GG.THR[j]){st=j;break}
    p.stage=st;if(st>old){emit('stage',p,st);if(st>=3&&!p.sp)p.sp=GG.species(p.seed)}
    if(st>=3&&!p.sp)p.sp=GG.species(p.seed);
    if(st>=5&&Math.random()<.004*dt){var ns=0;for(j=0;j<A.length;j++)if(A[j].par===p.id&&A[j].kind==='station')ns++;
      if(ns<3){var a=Math.random()*TAU,rr=GG.R(p)+9+ns*4,v=Math.sqrt(G*p.m/rr);
        GG.add(GG.mk('station','',p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr,p.vx-Math.sin(a)*v,p.vy+Math.cos(a)*v,{par:p.id}),true);emit('station',p)}}}
  /* hosts + ring crossings (for the orrery notes) */
  for(i=0;i<A.length;i++){p=A[i];if(p.kind!=='planet')continue;var bh=null,bs=0;
    for(j=0;j<hosts.length;j++){s=hosts[j];var dx=p.x-s.x,dy=p.y-s.y,sc=s.m/(dx*dx+dy*dy+EPS2);if(sc>bs){bs=sc;bh=s}}
    p.host=bh?bh.id:0;p.hostIdx=GG.hostIdxOf(bh);
    if(bh){var ang=Math.atan2(p.y-bh.y,p.x-bh.x);if(p.pang<0&&ang>=0&&ang<1)emit('note',p,Math.hypot(p.x-bh.x,p.y-bh.y));p.pang=ang}}}
function stars(dt){var A=W.bodies,i,b,L;
  for(i=0;i<A.length;i++){b=A[i];if(b.kind!=='star')continue;b.age++;L=GG.lifeOfMass(b.m);
    if(!b.giant&&b.age>L*.88){b.giant=true;emit('giant',b)}
    if(b.age>L)dieStar(b);
    else if(W.wild&&Math.random()<.0006){fx(b.x,b.y,150,'flare',50);for(var j=0;j<A.length;j++){var p=A[j];if(p.kind==='planet'&&Math.hypot(p.x-b.x,p.y-b.y)<130)p.hab=Math.max(0,p.hab-80)}emit('flare',b)}}}
function events(){
  if(!W.wild||Math.random()>.00018)return;var A=W.bodies,ss=A.filter(function(b){return b.kind==='star'});if(!ss.length)return;
  var s=ss[Math.random()*ss.length|0],a=Math.random()*TAU,d=900,x=s.x+Math.cos(a)*d,y=s.y+Math.sin(a)*d,off=(Math.random()-.5)*260,sp=1.5;
  var tx=s.x+Math.cos(a+1.57)*off,ty=s.y+Math.sin(a+1.57)*off,dd=Math.hypot(tx-x,ty-y);
  GG.add(GG.mk('comet','',x,y,(tx-x)/dd*sp,(ty-y)/dd*sp),true);emit('comet')}

GG.step=function(){
  var A=W.bodies,i,b;
  if(W.dirty){acc(A);W.dirty=false}
  nebulae();leap(A);collide();wormholes();
  A=W.bodies;
  for(i=A.length-1;i>=0;i--){b=A[i];
    if(Math.abs(b.x)>LIM||Math.abs(b.y)>LIM){if(!b.fixed){A.splice(i,1);W.dirty=true;continue}}
    if(!b.fixed&&W.tick%3===0){b.tr.push(b.x,b.y);if(b.tr.length>(light(b)?36:90)*2)b.tr.splice(0,2)}}
  stars();if(W.tick%4===0)lifePass(4);events();
  for(i=W.fx.length-1;i>=0;i--){if(++W.fx[i].age>W.fx[i].life)W.fx.splice(i,1)}
  W.tick++;W.stats.years+=1/GG.YR};

/* ---------- codex: every (class x host x stage x size x moons) is a discovery ---------- */
GG.CODEX_N=9*11*7*3*3;
GG.codexIdx=function(p,moons){var C=CB[p.cls],ci=GG.CLS.indexOf(C),base=C.m,r=p.m/base,sz=r<.8?0:r<1.4?1:2,mo=moons===0?0:moons<3?1:2;
  return(((ci*11+p.hostIdx)*7+p.stage)*3+sz)*3+mo};
GG.codexInfo=function(i){var mo=i%3;i=(i-mo)/3;var sz=i%3;i=(i-sz)/3;var st=i%7;i=(i-st)/7;var h=i%11,ci=(i-h)/11;
  return{cls:GG.CLS[ci].id,host:['O','B','A','F','G','K','M','dwarf','neutron','hole','rogue'][h],stage:st,size:sz,moons:mo}};

/* ---------- save / load ---------- */
function rd(v){return Math.round(v*1000)/1000}
GG.save=function(){return{v:1,tick:W.tick,bodies:W.bodies.map(function(b){return[b.kind,b.cls,rd(b.x),rd(b.y),rd(b.vx),rd(b.vy),rd(b.m),b.seed,Math.round(b.age),Math.round(b.hab),b.scar,b.fixed?1:0,b.giant?1:0,b.par,b.link,Math.round(b.rad),b.size,b.id]})}};
GG.load=function(o){if(!o||!o.bodies)return false;GG.clear();var mx=0;
  o.bodies.forEach(function(r){var b=GG.mk(r[0],r[1],r[2],r[3],r[4],r[5],{m:r[6],seed:r[7],age:r[8],par:r[13],size:r[16]});b.hab=r[9];b.scar=r[10];b.fixed=!!r[11];b.giant=!!r[12];b.link=r[14];b.rad=r[15]||b.rad;
    nid--;b.id=r[17];mx=Math.max(mx,b.id);W.bodies.push(b)});
  nid=mx+1;W.tick=o.tick||0;W.dirty=true;return true};

/* ---------- systems: presets and the seeded generator ---------- */
function S(cls,x,y,vx,vy,f){return GG.mk('star',cls,x,y,vx,vy,{age:(f==null?.1:f)*GG.lifeOfMass(SB[cls].m)})}
function Pl(cls,par,r,ang,size,o){var a=GG.orbit(par,r,ang);return GG.mk('planet',cls,a[0],a[1],a[2],a[3],Object.assign({size:size==null?1:size},o||{}))}
function belt(par,r0,r1,n,rn){var o=[];for(var i=0;i<n;i++){var a=GG.orbit(par,r0+rn()*(r1-r0),rn()*TAU);o.push(GG.mk('rock','',a[0],a[1],a[2],a[3]))}return o}
function moons(pl,radii,rn){return radii.map(function(r){var a=GG.orbit(pl,r,rn()*TAU);return GG.mk('moon','',a[0],a[1],a[2],a[3],{par:pl.id})})}
function pair(c1,c2,x,y,sep,vx,vy,f){var m1=SB[c1].m,m2=SB[c2].m,vr=Math.sqrt(G*(m1+m2)/sep),a=Math.random()*TAU,ca=Math.cos(a),sa=Math.sin(a);
  return[S(c1,x-ca*sep*m2/(m1+m2),y-sa*sep*m2/(m1+m2),vx+sa*vr*m2/(m1+m2),vy-ca*vr*m2/(m1+m2),f),S(c2,x+ca*sep*m1/(m1+m2),y+sa*sep*m1/(m1+m2),vx-sa*vr*m1/(m1+m2),vy+ca*vr*m1/(m1+m2),f)]}
GG.PRESETS=[
 {id:'sol',build:function(rn){var s=S('G',0,0,0,0,.2),o=[s];
   o.push(Pl('lava',s,62,rn()*TAU,0),Pl('desert',s,112,rn()*TAU,1),Pl('ocean',s,140,rn()*TAU,1),Pl('jungle',s,178,rn()*TAU,1),Pl('rocky',s,218,rn()*TAU,0));
   var g=Pl('gas',s,320,rn()*TAU,1);o.push(g);o=o.concat(moons(g,[11,13.5,16],rn),belt(s,255,290,34,rn));var r=Pl('ringed',s,470,rn()*TAU,1);o.push(r);return o}},
 {id:'binary',build:function(rn){var p=pair('G','K',0,0,70,0,0,.15),o=p.slice();var com={x:0,y:0,m:SB.G.m+SB.K.m,vx:0,vy:0};
   o.push(Pl('ocean',com,290,rn()*TAU,1),Pl('ice',com,420,rn()*TAU,1));return o}},
 {id:'figure8',build:function(){var L=100,m=280,vs=Math.sqrt(G*m/L),p1=[.97000436,-.24308753],v3=[-.93240737,-.86473146],o=[];
   o.push(S('K',p1[0]*L,p1[1]*L,-v3[0]/2*vs,-v3[1]/2*vs,.1),S('K',-p1[0]*L,-p1[1]*L,-v3[0]/2*vs,-v3[1]/2*vs,.1),S('K',0,0,v3[0]*vs,v3[1]*vs,.1));return o}},
 {id:'trojans',build:function(rn){var s=S('G',0,0,0,0,.2),g=Pl('gas',s,250,0,1),o=[s,g];
   [1.047,-1.047].forEach(function(da){for(var i=0;i<14;i++){var a=GG.orbit(s,250+(rn()-.5)*14,da+(rn()-.5)*.28);o.push(GG.mk('rock','',a[0],a[1],a[2],a[3]))}});
   o.push(Pl('ocean',s,140,rn()*TAU,1));return o}},
 {id:'moons',build:function(rn){var s=S('G',0,0,0,0,.2),r=Pl('ringed',s,270,rn()*TAU,1),o=[s,r,Pl('ocean',s,140,rn()*TAU,1)];return o.concat(moons(r,[11,13,15,17],rn))}},
 {id:'sling',build:function(rn){var s=S('G',0,0,0,0,.2),g=Pl('gas',s,200,0,2),o=[s,g,Pl('ocean',s,138,2.5,1),Pl('jungle',s,300,4,1)];
   for(var i=0;i<3;i++)o.push(GG.mk('comet','',-700+i*40,-300+i*70,1.7,.6));return o}},
 {id:'chaos',build:function(rn){var o=[];['G','K','F'].forEach(function(c,i){var a=i/3*TAU;o.push(S(c,Math.cos(a)*110,Math.sin(a)*110,-Math.sin(a)*.8,Math.cos(a)*.8,.1))});
   o.push(GG.mk('planet','ocean',260,0,0,1.2),GG.mk('planet','rocky',-250,60,0,-1.1));return o}},
 {id:'beltworld',build:function(rn){var s=S('K',0,0,0,0,.2),o=[s].concat(belt(s,90,135,110,rn));o.push(Pl('ocean',s,80,rn()*TAU,0),Pl('jungle',s,190,rn()*TAU,1));return o}},
 {id:'hole',build:function(rn){var h=GG.mk('hole','H',0,0,0,0),o=[h].concat(belt(h,60,150,90,rn));o.push(Pl('rocky',h,260,rn()*TAU,1));var st=S('K',0,0,0,0,.3),a=GG.orbit(h,380,rn()*TAU);st.x=a[0];st.y=a[1];st.vx=a[2];st.vy=a[3];o.push(st);o.push(Pl('ocean',st,70,rn()*TAU,0));return o}},
 {id:'worm',build:function(rn){var s=S('G',0,0,0,0,.2),a=GG.mk('wormhole','',-330,0,0,0),b=GG.mk('wormhole','',330,0,0,0);a.link=b.id;b.link=a.id;
   return[s,a,b,Pl('ocean',s,140,rn()*TAU,1),Pl('desert',s,230,rn()*TAU,1),GG.mk('comet','',-600,-120,1.9,.2)]}},
 {id:'doom',build:function(rn){var s=S('B',0,0,0,0,.45),o=[s,Pl('ocean',s,330,rn()*TAU,1),Pl('jungle',s,400,rn()*TAU,1),Pl('rocky',s,260,rn()*TAU,0)];return o}},
 {id:'kepler',build:function(rn){var s=S('M',0,0,0,0,.1),o=[s];for(var i=0;i<7;i++){var c=['lava','rocky','ocean','ice','desert','jungle','barren'][i];o.push(Pl(c,s,24+i*13,rn()*TAU,0))}return o}},
 {id:'flyby',build:function(rn){var s=S('G',0,0,0,0,.2),o=[s,Pl('ocean',s,140,rn()*TAU,1),Pl('desert',s,110,rn()*TAU,1),Pl('gas',s,300,rn()*TAU,0)];var t=S('K',-650,0,0,.38,.3);o.push(t,Pl('ice',t,60,0,0));return o}},
 {id:'twins',build:function(rn){var o=[],a=S('G',-260,0,0,.9,.2),b=S('G',260,0,0,-.9,.2);o.push(a,b,Pl('ocean',a,140,rn()*TAU,1),Pl('ocean',b,140,rn()*TAU,1));return o}},
 {id:'empty',build:function(){return[]}}];
GG.randomSystem=function(seed){var rn=GG.rng(seed),o=[],cl=['O','B','A','F','F','G','G','G','K','K','M'],c=cl[rn()*cl.length|0];
  var s=S(c,0,0,0,0,rn()*.5),host=s,k=Math.pow(SB[c].m/400,1.5);
  if(rn()<.22){var p=pair(c,cl[rn()*cl.length|0],0,0,60+rn()*50,0,0,.2);o=p.slice();host={x:0,y:0,m:SB[c].m*1.5,vx:0,vy:0};k*=1.4}else o=[s];
  var n=3+(rn()*7|0),r=(host===s?GG.R(s):0)+24+rn()*30,minr=host===s?0:210;r=Math.max(r,minr);
  for(var i=0;i<n;i++){r*=1.25+rn()*.45;var F=GG.lum(s)*21025/(r*r),cls;
    if(F>4)cls=['lava','barren'][rn()*2|0];else if(F>1.9)cls=['desert','rocky','barren'][rn()*3|0];else if(F>.6)cls=['ocean','jungle','rocky','ocean'][rn()*4|0];else if(F>.08)cls=['ice','rocky','gas','ringed'][rn()*4|0];else cls=['gas','ringed','ice'][rn()*3|0];
    var pl=Pl(cls,host,r,rn()*TAU,rn()*3|0,{seed:(rn()*1e9)|0});o.push(pl);
    if((cls==='gas'||cls==='ringed')&&rn()<.7)o=o.concat(moons(pl,[11,13.5,16].slice(0,1+(rn()*3|0)),rn))}
  if(rn()<.45)o=o.concat(belt(host,r*.6,r*.7,26,rn));if(rn()<.3)o.push(GG.mk('comet','',-700,-200+rn()*400,1.6,.2));
  return o};
GG.loadSystem=function(arr){GG.clear();arr.forEach(function(b){GG.add(b,true)});GG.zeroMom();W.dirty=true};
GG.newWorld=function(){GG.clear();GG.add(S('G',0,0,0,0,.15),true)};
GG.metrics=function(){var A=W.bodies,M={planets:0,blooms:0,civs:0,space:0,asc:0,stars:0,binary:0,holes:0,worms:0,comets:0,moons:0,bodies:A.length,classes:0,species:0,score:0},i,j,cls={},sp={},moonC={},suns=[];
  for(i=0;i<A.length;i++){var b=A[i];
    if(b.kind==='planet'){M.planets++;var st=b.stage;if(st>=2)M.blooms+=Math.min(12,Math.floor(b.hab/150));if(st>=4)M.civs++;if(st>=5)M.space++;if(st>=6)M.asc++;
      cls[b.cls]=1;if(b.sp)sp[b.sp.name]=1;M.score+=Math.min(12,Math.floor(b.hab/150))+Math.max(0,st-2)*6}
    else if(b.kind==='star'||b.kind==='dwarf'||b.kind==='neutron'){M.stars++;suns.push(b)}
    else if(b.kind==='hole')M.holes++;else if(b.kind==='wormhole')M.worms++;else if(b.kind==='comet')M.comets++;
    else if(b.kind==='moon'||b.kind==='station'){if(b.par)moonC[b.par]=(moonC[b.par]||0)+1;if(b.kind==='moon')M.moons=Math.max(M.moons,moonC[b.par])}}
  for(i=0;i<suns.length;i++)for(j=i+1;j<suns.length;j++)if(Math.hypot(suns[i].x-suns[j].x,suns[i].y-suns[j].y)<140){M.binary=1}
  M.worms=Math.floor(M.worms/2);M.classes=Object.keys(cls).length;M.species=Object.keys(sp).length;M.moonMap=moonC;return M};
})();
