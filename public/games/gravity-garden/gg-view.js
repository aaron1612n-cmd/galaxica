/* Gravity Garden view: themes, camera, engraved glyphs for every body, world renderer. */
(function(){
var GG=window.GG,TAU=GG.TAU,W=GG.W;
var PAL={
 paper:{bg:'#eee6d1',ink:'#1c2233',rust:'#cf4a2c',dim:'#7b7a70',rule:'rgba(28,34,51,.14)',ir:'28,34,51',rr:'207,74,44'},
 night:{bg:'#10131c',ink:'#e6dfcc',rust:'#ff7a4a',dim:'#8a8c94',rule:'rgba(230,223,204,.14)',ir:'230,223,204',rr:'255,122,74'},
 blue:{bg:'#203a5e',ink:'#eaf1f8',rust:'#ffcf5c',dim:'#9db3cc',rule:'rgba(234,241,248,.16)',ir:'234,241,248',rr:'255,207,92'}};
GG.PAL=PAL;GG.pal=PAL.paper;GG.themeName='paper';
GG.setTheme=function(n){var P=PAL[n]||PAL.paper;GG.pal=P;GG.themeName=PAL[n]?n:'paper';var s=document.documentElement.style;
  s.setProperty('--paper',P.bg);s.setProperty('--ink',P.ink);s.setProperty('--rust',P.rust);s.setProperty('--dim',P.dim);s.setProperty('--rule',P.rule);
  var m=document.querySelector('meta[name=theme-color]');if(m)m.content=P.bg};
GG.ia=function(a){return'rgba('+GG.pal.ir+','+a+')'};GG.ra=function(a){return'rgba('+GG.pal.rr+','+a+')'};

var V=GG.V={cam:{x:0,y:0,z:1},w:1,h:1,S:1,dpr:1,sel:0,follow:0,opt:{trails:1,bands:1,labels:0,grid:1},overlay:null,drag:null,path:null,pend:null,brush:null};
V.k=function(){return V.S*V.cam.z};
V.fit=function(cv,stage){var r=stage.getBoundingClientRect();V.dpr=Math.min(devicePixelRatio||1,2);V.w=Math.max(1,r.width);V.h=Math.max(1,r.height);
  cv.width=Math.round(V.w*V.dpr);cv.height=Math.round(V.h*V.dpr);V.S=Math.min(V.w,V.h)/700;if(Math.max(V.w,V.h)/V.S<900)V.S=Math.max(V.w,V.h)/900};
V.toWorld=function(px,py){var k=V.k();return{x:(px-V.w/2)/k+V.cam.x,y:(py-V.h/2)/k+V.cam.y}};
V.toScreen=function(x,y){var k=V.k();return{x:(x-V.cam.x)*k+V.w/2,y:(y-V.cam.y)*k+V.h/2}};

function arc(c,x,y,r){c.moveTo(x+r,y);c.arc(x,y,r,0,TAU)}

/* ---------- surfaces: every planet class has its own engraving ---------- */
function surface(c,cls,seed,r,hx){
  var P=GG.pal,rn=GG.rng(seed),i,y,x,a,n;
  c.save();c.beginPath();arc(c,0,0,r);c.clip();c.lineWidth=hx*1.1;c.strokeStyle=P.ink;c.fillStyle=P.ink;
  switch(cls){
  case 'gas':case 'ringed':
    for(i=0;i<5;i++){y=-r+(i+.6)*(2*r/5.4)+(rn()-.5)*r*.14;c.globalAlpha=.75;c.beginPath();c.moveTo(-r,y);c.quadraticCurveTo(0,y+(rn()-.5)*r*.3,r,y+(rn()-.5)*r*.1);c.stroke();
      if(rn()<.5){c.globalAlpha=.16;c.fillRect(-r,y-r*.13,2*r,r*.26)}}
    c.globalAlpha=1;c.fillStyle=P.rust;c.beginPath();c.ellipse((rn()-.5)*r,(rn()-.3)*r*.6,r*.2,r*.1,0,0,TAU);c.fill();break;
  case 'ocean':
    c.globalAlpha=.8;for(i=0;i<7;i++){x=(rn()-.5)*r*1.5;y=(rn()-.5)*r*1.5;c.beginPath();c.arc(x,y,r*(.14+rn()*.1),Math.PI*1.1,Math.PI*1.9);c.stroke()}
    c.globalAlpha=.5;c.beginPath();c.ellipse(-r*.2,r*.1,r*.35,r*.22,.5,0,TAU);c.stroke();break;
  case 'ice':
    c.globalAlpha=.8;for(i=0;i<5;i++){c.beginPath();c.moveTo((rn()-.5)*2*r,(rn()-.5)*2*r);for(n=0;n<3;n++)c.lineTo((rn()-.5)*2*r,(rn()-.5)*2*r);c.stroke()}
    c.globalAlpha=.25;for(i=-4;i<5;i++){c.beginPath();c.moveTo(i*r*.3-r,-r);c.lineTo(i*r*.3+r,r);c.stroke()}break;
  case 'desert':
    c.globalAlpha=.8;for(i=0;i<4;i++){y=-r+(i+.7)*r*.5;c.beginPath();for(x=-r;x<=r;x+=r*.2)c.lineTo(x,y+Math.sin(x/r*5+i*2+rn())*r*.1);c.stroke()}
    for(i=0;i<8;i++){c.globalAlpha=.6;c.beginPath();arc(c,(rn()-.5)*2*r,(rn()-.5)*2*r,hx*.7);c.fill()}break;
  case 'lava':
    c.globalAlpha=1;c.strokeStyle=P.rust;c.lineWidth=hx*1.5;for(i=0;i<5;i++){c.beginPath();c.moveTo((rn()-.5)*2*r,(rn()-.5)*2*r);for(n=0;n<3;n++)c.lineTo((rn()-.5)*2*r,(rn()-.5)*2*r);c.stroke()}
    c.fillStyle=P.rust;c.globalAlpha=.8;for(i=0;i<3;i++){c.beginPath();arc(c,(rn()-.5)*r*1.4,(rn()-.5)*r*1.4,r*.12);c.fill()}break;
  case 'jungle':
    for(i=0;i<22;i++){c.globalAlpha=.4+rn()*.5;c.beginPath();arc(c,(rn()-.5)*2*r,(rn()-.5)*2*r,r*(.05+rn()*.08));c.fill()}break;
  case 'rocky':
    c.globalAlpha=.85;for(i=0;i<3;i++){c.beginPath();c.ellipse((rn()-.5)*r*1.2,(rn()-.5)*r*1.2,r*(.25+rn()*.3),r*(.15+rn()*.2),rn()*3,0,TAU);c.stroke()}
    for(i=0;i<3;i++){c.beginPath();arc(c,(rn()-.5)*r*1.3,(rn()-.5)*r*1.3,r*.1);c.stroke()}break;
  default:/* barren */
    c.globalAlpha=.85;for(i=0;i<5;i++){c.beginPath();arc(c,(rn()-.5)*r*1.4,(rn()-.5)*r*1.4,r*(.08+rn()*.14));c.stroke()}}
  /* hatched shadow, lower right */
  c.globalAlpha=.3;c.strokeStyle=P.ink;c.lineWidth=hx*.9;
  for(i=-8;i<10;i++){var o=i*r*.17;c.beginPath();c.moveTo(o+r*.1,r*1.2);c.lineTo(o+r*1.3,-r*.1);c.stroke()}
  c.restore();c.globalAlpha=1}
function ringArcs(c,r,k,front,seed){var P=GG.pal;c.save();c.rotate(GG.rng(seed)()*1.2-.6);c.strokeStyle=P.ink;c.lineWidth=k*1.1;
  for(var i=0;i<2;i++){var rx=r*(1.7+i*.35),ry=rx*.28;c.globalAlpha=i?.5:.9;c.beginPath();c.ellipse(0,0,rx,ry,0,front?0:Math.PI,front?Math.PI:TAU);c.stroke()}c.restore();c.globalAlpha=1}
function life(c,b,r,hx){var P=GG.pal,rn=GG.rng(b.seed+11),st=b.stage,i,a;
  if(b.hab>0&&st>=1){c.fillStyle=P.rust;for(i=0;i<6;i++){c.globalAlpha=.5;c.beginPath();arc(c,(rn()-.5)*r*1.3,(rn()-.5)*r*1.3,hx*.9);c.fill()}c.globalAlpha=1}
  var n=st>=2?Math.min(12,b.hab/150|0):0;b.ps+=(n-b.ps)*.08;if(Math.abs(n-b.ps)<.01)b.ps=n;
  var cnt=Math.ceil(b.ps-1e-6),ph=(b.seed%628)/100;c.fillStyle=P.rust;
  for(i=0;i<cnt;i++){var sc=Math.min(1,b.ps-i);a=ph+i/12*TAU;c.save();c.translate(Math.cos(a)*(r+3.4),Math.sin(a)*(r+3.4));c.rotate(a);c.beginPath();c.ellipse(0,0,3.6*sc,1.7*sc,0,0,TAU);c.fill();c.restore()}
  if(st>=3){c.strokeStyle=P.ink;c.lineWidth=hx;for(i=0;i<3;i++){var x=(rn()-.5)*r,y=(rn()-.5)*r;c.beginPath();arc(c,x,y,hx*1.2);c.moveTo(x-hx*2,y+hx*3);c.lineTo(x,y+hx);c.lineTo(x+hx*2,y+hx*3);c.stroke()}}
  if(st>=4){c.fillStyle=P.rust;for(i=0;i<5;i++){c.fillRect(-r*.7+i*r*.3,r*.55+Math.sin(i*2)*r*.1,hx*1.6,hx*1.6)}}
  if(st>=5){c.strokeStyle=P.ink;c.lineWidth=hx;c.setLineDash([hx*2,hx*3]);c.beginPath();arc(c,0,0,r*2.3);c.stroke();c.setLineDash([]);var ta=W.tick*.03+b.seed;c.fillStyle=P.ink;c.beginPath();arc(c,Math.cos(ta)*r*2.3,Math.sin(ta)*r*2.3,hx*1.8);c.fill()}
  if(st>=6){c.strokeStyle=P.rust;c.lineWidth=hx;c.setLineDash([hx*5,hx*3]);c.beginPath();arc(c,0,0,r*3);c.stroke();c.setLineDash([]);var aa=W.tick*.004;for(i=0;i<8;i++){var q=aa+i/8*TAU;c.beginPath();c.moveTo(Math.cos(q)*r*3.2,Math.sin(q)*r*3.2);c.lineTo(Math.cos(q)*r*3.8,Math.sin(q)*r*3.8);c.stroke()}}}

/* ---------- bodies ---------- */
function drawBody(c,b,hx,full){
  var P=GG.pal,r=GG.R(b),i,q,t=W.tick;
  switch(b.kind){
  case 'planet':
    if(b.cls==='ringed')ringArcs(c,r,hx,false,b.seed);
    c.beginPath();arc(c,0,0,r);c.fillStyle=P.bg;c.fill();surface(c,b.cls,b.seed,r,hx);
    c.beginPath();arc(c,0,0,r);c.strokeStyle=P.ink;c.lineWidth=hx*1.5;c.stroke();
    if(b.cls==='ringed')ringArcs(c,r,hx,true,b.seed);
    if(b.scar){c.fillStyle=P.ink;var rn=GG.rng(b.seed+3);for(i=0;i<Math.min(6,b.scar);i++){c.beginPath();arc(c,(rn()-.5)*r*1.2,(rn()-.5)*r*1.2,hx*1.1);c.fill()}}
    if(full)life(c,b,r,hx);break;
  case 'moon':c.beginPath();arc(c,0,0,r);c.fillStyle=P.bg;c.fill();c.strokeStyle=P.ink;c.lineWidth=hx*1.3;c.stroke();c.beginPath();arc(c,r*.3,-r*.3,r*.28);c.fillStyle=P.ink;c.fill();break;
  case 'rock':c.beginPath();var rn2=GG.rng(b.seed);for(i=0;i<6;i++){q=i/6*TAU;var rr=r*(.7+rn2()*.5);c.lineTo(Math.cos(q)*rr,Math.sin(q)*rr)}c.closePath();c.fillStyle=P.ink;c.fill();break;
  case 'comet':c.beginPath();arc(c,0,0,r);c.fillStyle=P.rust;c.fill();break;
  case 'station':c.strokeStyle=P.ink;c.lineWidth=hx*1.3;c.strokeRect(-r*.45,-r*.45,r*.9,r*.9);c.beginPath();c.moveTo(-r*1.5,0);c.lineTo(-r*.45,0);c.moveTo(r*.45,0);c.lineTo(r*1.5,0);c.moveTo(-r*1.5,-r*.5);c.lineTo(-r*1.5,r*.5);c.moveTo(r*1.5,-r*.5);c.lineTo(r*1.5,r*.5);c.stroke();break;
  case 'star':{var S=GG.SB[b.cls]||GG.SB.G,n=S.rays,rb=r/(b.giant?2.2:1);
    c.beginPath();for(i=0;i<n;i++){q=i/n*TAU+t*.0004;var l=i%2?5:9;c.moveTo(Math.cos(q)*(r+2),Math.sin(q)*(r+2));c.lineTo(Math.cos(q)*(r+2+l*(b.giant?1.6:1)),Math.sin(q)*(r+2+l*(b.giant?1.6:1)))}
    c.strokeStyle=P.ink;c.lineWidth=hx*1.1;c.stroke();c.beginPath();arc(c,0,0,r);c.fillStyle=P.rust;c.fill();c.lineWidth=hx*1.4;c.stroke();
    if(b.cls==='O'||b.cls==='B'){c.beginPath();arc(c,0,0,r*.55);c.strokeStyle=P.bg;c.lineWidth=hx;c.stroke()}
    if(b.cls==='M'||b.cls==='K'){c.beginPath();c.moveTo(-r*.5,0);c.lineTo(r*.5,0);c.strokeStyle=P.ink;c.lineWidth=hx*.8;c.stroke()}
    if(b.giant){c.beginPath();arc(c,0,0,r*1.55);c.setLineDash([hx*2,hx*2]);c.strokeStyle=P.rust;c.stroke();c.setLineDash([])}break}
  case 'dwarf':c.beginPath();for(i=0;i<10;i++){q=i/10*TAU;c.moveTo(Math.cos(q)*(r+1.5),Math.sin(q)*(r+1.5));c.lineTo(Math.cos(q)*(r+4),Math.sin(q)*(r+4))}c.strokeStyle=P.ink;c.lineWidth=hx;c.stroke();
    c.beginPath();arc(c,0,0,r);c.fillStyle=P.bg;c.fill();c.lineWidth=hx*1.5;c.stroke();break;
  case 'neutron':{var sw=t*.09+b.seed;c.beginPath();arc(c,0,0,r);c.fillStyle=P.ink;c.fill();c.strokeStyle=P.rust;c.lineWidth=hx*1.3;c.beginPath();
    c.moveTo(Math.cos(sw)*r,Math.sin(sw)*r);c.lineTo(Math.cos(sw)*(r+34),Math.sin(sw)*(r+34));c.moveTo(-Math.cos(sw)*r,-Math.sin(sw)*r);c.lineTo(-Math.cos(sw)*(r+34),-Math.sin(sw)*(r+34));c.stroke();break}
  case 'hole':c.beginPath();arc(c,0,0,r+6);c.setLineDash([hx*2,hx*3]);c.strokeStyle=P.ink;c.lineWidth=hx;c.stroke();c.beginPath();arc(c,0,0,r+13);c.globalAlpha=.4;c.stroke();c.globalAlpha=1;c.setLineDash([]);
    c.beginPath();arc(c,0,0,r);c.fillStyle=P.ink;c.fill();break;
  case 'wormhole':c.strokeStyle=P.ink;c.lineWidth=hx*1.2;c.beginPath();for(i=0;i<80;i++){q=i*.35+t*.02;var rr=1+i*.11;c.lineTo(Math.cos(q)*rr,Math.sin(q)*rr)}c.stroke();
    c.beginPath();arc(c,0,0,r);c.strokeStyle=P.rust;c.setLineDash(b.link?[]:[hx*3,hx*3]);c.stroke();c.setLineDash([]);break;
  case 'dark':c.setLineDash([hx*1.5,hx*3]);c.strokeStyle=P.ink;c.lineWidth=hx;c.beginPath();arc(c,0,0,r);c.stroke();c.setLineDash([]);var rn3=GG.rng(b.seed);c.fillStyle=GG.ia(.5);for(i=0;i<14;i++){c.beginPath();arc(c,(rn3()-.5)*r*1.6,(rn3()-.5)*r*1.6,hx);c.fill()}break;
  case 'repulsor':c.strokeStyle=P.rust;c.lineWidth=hx*1.3;c.beginPath();arc(c,0,0,r*.5);for(i=0;i<8;i++){q=i/8*TAU;c.moveTo(Math.cos(q)*r*.7,Math.sin(q)*r*.7);c.lineTo(Math.cos(q)*r*1.2,Math.sin(q)*r*1.2)}c.stroke();break;
  case 'nebula':{var rn4=GG.rng(b.seed),R=b.rad;c.fillStyle=GG.ra(.07);c.beginPath();arc(c,0,0,R);c.fill();c.fillStyle=GG.ia(.45);for(i=0;i<90;i++){q=rn4()*TAU;var d=Math.sqrt(rn4())*R;c.beginPath();arc(c,Math.cos(q)*d,Math.sin(q)*d,hx*(.7+rn4()*.8));c.fill()}
    c.setLineDash([hx*2,hx*4]);c.strokeStyle=GG.ia(.5);c.lineWidth=hx;c.beginPath();arc(c,0,0,R);c.stroke();c.setLineDash([]);break}}}
GG.drawBodyAt=drawBody;

/* ---------- glyph canvases (palette, inspector, codex) ---------- */
GG.glyph=function(cv,kind,cls,opt){opt=opt||{};var d=Math.min(devicePixelRatio||1,2),s=cv.clientWidth||cv.width/d||32,c=cv.getContext('2d');
  cv.width=Math.round(s*d);cv.height=Math.round(s*d);c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,s,s);
  var b=GG.mk(kind,cls,0,0,0,0,{seed:opt.seed==null?7:opt.seed,size:1});b.stage=opt.stage||0;b.hab=opt.hab||0;if(kind==='nebula')b.rad=20;GG.revertId();
  var R=GG.R(b),ext=kind==='star'?R+11:kind==='hole'?R+14:kind==='planet'&&cls==='ringed'?R*1.9:kind==='neutron'?R+30:kind==='nebula'?22:kind==='station'?R*1.6:kind==='wormhole'?14:kind==='dark'||kind==='repulsor'?R*1.2:R+4;
  var k=(s*.46)/ext;c.translate(s/2,s/2);c.scale(k,k);drawBody(c,b,1/k,!!opt.full)};
var _id=0;GG.revertId=function(){};
GG.creature=function(c,sp,cx,cy,s){var P=GG.pal,sz=s*sp.size;c.save();c.translate(cx,cy);c.strokeStyle=P.ink;c.fillStyle=P.bg;c.lineWidth=Math.max(1,s*.06);
  c.beginPath();c.ellipse(0,0,sz*.5,sz*.32,0,0,TAU);c.fill();c.stroke();
  if(sp.shell){c.beginPath();c.arc(0,-sz*.05,sz*.3,Math.PI,TAU);c.stroke()}
  var n=sp.legs;for(var i=0;i<n;i++){var x=-sz*.38+i*(sz*.76/Math.max(1,n-1));c.beginPath();c.moveTo(x,sz*.26);c.lineTo(x+(i%2?1:-1)*sz*.06,sz*.58);c.stroke()}
  if(sp.tail){c.beginPath();c.moveTo(-sz*.5,0);c.quadraticCurveTo(-sz*.8,-sz*.2,-sz*.85,-sz*.5);c.stroke()}
  if(sp.fins){c.beginPath();c.moveTo(0,-sz*.32);c.lineTo(-sz*.12,-sz*.55);c.lineTo(sz*.12,-sz*.34);c.stroke()}
  for(i=0;i<sp.eyes;i++){c.beginPath();c.arc(sz*.26+(i%2)*sz*.06,-sz*.1+Math.floor(i/2)*sz*.1,Math.max(.8,s*.04),0,TAU);c.fillStyle=P.ink;c.fill()}
  for(i=0;i<sp.horns;i++){c.beginPath();c.moveTo(sz*.2+i*sz*.1,-sz*.3);c.lineTo(sz*.26+i*sz*.1,-sz*.55);c.stroke()}
  if(sp.ant){c.beginPath();c.moveTo(sz*.4,-sz*.22);c.lineTo(sz*.62,-sz*.5);c.stroke();c.beginPath();c.arc(sz*.62,-sz*.5,s*.04,0,TAU);c.fillStyle=P.rust;c.fill()}
  c.restore()};

/* ---------- the world ---------- */
GG.draw=function(c){
  var P=GG.pal,k=V.k(),hx=1/k,A=W.bodies,i,j,b,cam=V.cam,vw=V.w,vh=V.h,dpr=V.dpr;
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=P.bg;c.fillRect(0,0,vw,vh);
  c.save();c.translate(vw/2,vh/2);c.scale(k,k);c.translate(-cam.x,-cam.y);
  var x0=cam.x-vw/2/k,x1=cam.x+vw/2/k,y0=cam.y-vh/2/k,y1=cam.y+vh/2/k;
  if(V.opt.grid){c.lineWidth=hx;c.strokeStyle=P.rule;c.beginPath();for(i=70;i<=1750;i+=70)arc(c,0,0,i);c.stroke();
    c.strokeStyle=GG.ia(.3);c.beginPath();for(i=0;i<72;i++){var a=i/72*TAU,l=i%6===0?12:5,ca=Math.cos(a),sa=Math.sin(a);c.moveTo(ca*350,sa*350);c.lineTo(ca*(350+l),sa*(350+l))}arc(c,0,0,350);c.stroke()}
  var suns=[];
  for(i=0;i<A.length;i++){b=A[i];if(GG.isSun(b))suns.push(b)}
  if(V.opt.bands)for(i=0;i<suns.length;i++){b=suns[i];var z=GG.zone(b);if(z[1]<8)continue;
    c.beginPath();arc(c,b.x,b.y,z[1]);arc(c,b.x,b.y,z[0]);c.fillStyle=GG.ra(.07);c.fill('evenodd');
    c.strokeStyle=GG.ra(.5);c.setLineDash([hx*3,hx*6]);c.lineWidth=hx;c.beginPath();arc(c,b.x,b.y,z[0]);arc(c,b.x,b.y,z[1]);c.stroke();c.setLineDash([])}
  for(i=0;i<A.length;i++){b=A[i];if(b.kind==='nebula'){c.save();c.translate(b.x,b.y);drawBody(c,b,hx,true);c.restore()}}
  for(i=0;i<A.length;i++){b=A[i];if(b.kind==='wormhole'&&b.link&&b.id<b.link){var o=GG.byId(b.link);if(o){c.strokeStyle=GG.ra(.5);c.setLineDash([hx*2,hx*5]);c.lineWidth=hx;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(o.x,o.y);c.stroke();c.setLineDash([])}}}
  if(V.opt.trails){c.lineWidth=hx;for(i=0;i<A.length;i++){b=A[i];var tr=b.tr;if(tr.length<4)continue;c.strokeStyle=GG.ia(GG.isLight(b)?.22:.36);c.beginPath();c.moveTo(tr[0],tr[1]);for(j=2;j<tr.length;j+=2)c.lineTo(tr[j],tr[j+1]);c.lineTo(b.x,b.y);c.stroke()}}
  var lab=V.opt.labels;
  for(i=0;i<A.length;i++){b=A[i];if(b.kind==='nebula')continue;var rr=GG.R(b)+40;if(b.x<x0-rr||b.x>x1+rr||b.y<y0-rr||b.y>y1+rr)continue;
    c.save();c.translate(b.x,b.y);
    if(b.kind==='comet'&&suns.length){var s0=suns[0],bd=1e9;for(j=0;j<suns.length;j++){var dd=Math.hypot(b.x-suns[j].x,b.y-suns[j].y);if(dd<bd){bd=dd;s0=suns[j]}}
      var ang=Math.atan2(b.y-s0.y,b.x-s0.x),len=Math.min(70,6000/(bd+20));c.strokeStyle=GG.ra(.7);c.lineWidth=hx;c.beginPath();for(j=-1;j<=1;j++){c.moveTo(0,0);c.lineTo(Math.cos(ang+j*.08)*len,Math.sin(ang+j*.08)*len)}c.stroke()}
    drawBody(c,b,hx,true);c.restore();
    if((lab||b.id===V.sel)&&b.kind!=='rock'&&b.kind!=='moon'&&b.kind!=='station'&&b.kind!=='comet'){c.font='italic '+(13*hx)+'px "Instrument Serif",Georgia,serif';c.fillStyle=P.ink;c.textAlign='center';c.fillText(b.name,b.x,b.y-GG.R(b)-12*hx-(b.stage>=5?GG.R(b)*1.5:0))}
    if(b.id===V.sel){var q=GG.R(b)+7+(b.stage>=5?GG.R(b)*1.5:0),e=q*.5;c.strokeStyle=P.rust;c.lineWidth=hx*1.5;c.beginPath();
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(s){c.moveTo(b.x+s[0]*q,b.y+s[1]*(q-e));c.lineTo(b.x+s[0]*q,b.y+s[1]*q);c.lineTo(b.x+s[0]*(q-e),b.y+s[1]*q)});c.stroke()}}
  for(i=0;i<W.fx.length;i++){var f=W.fx[i],u=f.age/f.life,rad=f.max*u;c.globalAlpha=1-u;c.lineWidth=hx*(f.kind==='blast'?2.5:1.3);c.strokeStyle=f.kind==='flare'?P.rust:f.kind==='blast'?P.rust:P.ink;
    c.beginPath();arc(c,f.x,f.y,rad);c.stroke();if(f.kind==='blast'||f.kind==='shell'){c.beginPath();arc(c,f.x,f.y,rad*.7);c.stroke()}c.globalAlpha=1}
  if(V.pend){c.strokeStyle=P.rust;c.setLineDash([hx*3,hx*3]);c.lineWidth=hx*1.3;c.beginPath();arc(c,V.pend.x,V.pend.y,10);c.stroke();c.setLineDash([])}
  if(V.brush){c.strokeStyle=GG.ra(.8);c.lineWidth=hx*1.2;c.setLineDash([hx*3,hx*4]);c.beginPath();arc(c,V.brush.x,V.brush.y,V.brush.r);c.stroke();c.setLineDash([])}
  var dn=V.drag;
  if(dn&&dn.far){c.strokeStyle=P.rust;c.fillStyle=P.rust;c.lineWidth=hx*1.2;c.beginPath();c.moveTo(dn.x,dn.y);c.lineTo(dn.x1,dn.y1);c.stroke();c.beginPath();arc(c,dn.x,dn.y,5*hx*3);c.stroke();
    if(V.path)for(i=0;i<V.path.length;i+=2){c.beginPath();arc(c,V.path[i],V.path[i+1],hx*1.8);c.fill()}}
  if(V.overlay)V.overlay(c,hx);
  c.restore()};
})();
