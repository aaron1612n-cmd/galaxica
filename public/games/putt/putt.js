/* Putt: mini golf printed in two riso inks. Drag anywhere to pull back, release to putt.
   Holes are grown from seeds as paths of fairway cells; a shot-searching bot plays each one to set par and prove it can be finished. */
(function(){
GK.id('putt');
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
var PAPER='#f4efe4',GREEN='#00835f',PINK='#ff4f9a',TAU=Math.PI*2;
var W=480,H=800,HUD=78,CS=104,BR=6,T=0;
function sq(x){return x*x}
Object.assign(GK.ico,{golf:'<path d="M7 20V3l9 4-9 4"/><ellipse cx="9" cy="20" rx="6" ry="1.5"/>',mill:'<path d="M11 11L5 5M11 11l6-6M11 11l6 6M11 11l-6 6M9 21l2-10 2 10"/>',wave:'<path d="M2 9c3-3 6 3 9 0s6 3 9 0M2 15c3-3 6 3 9 0s6 3 9 0"/>',pier:'<path d="M2 8h18M4 8v12M10 8v12M16 8v12M2 13h18"/>',tent:'<path d="M2 19L11 4l9 15zM11 4v15M11 4l4-2"/>',card:'<path d="M3 4h16v14H3zM3 9h16M8 4v14M13 4v14"/>'});

/* ---------- physics ---------- */
function slopeAt(Hl,x,y){for(var i=0;i<Hl.slopes.length;i++){var s=Hl.slopes[i];if(x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h)return s}return null}
function inRect(a,x,y){return x>a.x&&x<a.x+a.w&&y>a.y&&y<a.y+a.h}
function collideSeg(b,x1,y1,x2,y2,e,vx0,vy0){var dx=x2-x1,dy=y2-y1,L2=dx*dx+dy*dy,t=L2?GK.clamp(((b.x-x1)*dx+(b.y-y1)*dy)/L2,0,1):0,px=x1+dx*t,py=y1+dy*t,ox=b.x-px,oy=b.y-py,d2=ox*ox+oy*oy;
  if(d2>=BR*BR||d2===0)return false;var d=Math.sqrt(d2),nx=ox/d,ny=oy/d;b.x=px+nx*BR;b.y=py+ny*BR;var rvx=b.vx-(vx0||0),rvy=b.vy-(vy0||0),vn=rvx*nx+rvy*ny;if(vn<0){b.vx-=(1+e)*vn*nx;b.vy-=(1+e)*vn*ny}return true}
function collideCirc(b,cx,cy,r,e){var ox=b.x-cx,oy=b.y-cy,d2=ox*ox+oy*oy,R=r+BR;if(d2>=R*R)return false;var d=Math.sqrt(d2)||1,nx=ox/d,ny=oy/d;b.x=cx+nx*R;b.y=cy+ny*R;var vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=(1+e)*vn*nx;b.vy-=(1+e)*vn*ny}return true}
function millSegs(m,t){var out=[],a0=t*m.sp+m.ph;for(var k=0;k<m.n;k++){var a=a0+k*TAU/m.n;out.push([m.x,m.y,m.x+Math.cos(a)*m.R,m.y+Math.sin(a)*m.R,a])}return out}
function barX(b,t){return b.x+Math.sin(t*b.sp+b.ph)*b.amp}
/* one tick of ball motion; returns 'roll'|'stop'|'sunk'|'water' */
function stepBall(b,Hl,t){var s=slopeAt(Hl,b.x,b.y);if(s){b.vx+=s.fx;b.vy+=s.fy}
  var sand=false;for(var i=0;i<Hl.sand.length;i++)if(inRect(Hl.sand[i],b.x,b.y)){sand=true;break}
  var fr=sand?.93:.986;b.vx*=fr;b.vy*=fr;var sp=Math.sqrt(b.vx*b.vx+b.vy*b.vy);if(sp>0){var dec=Math.min(sp,.012);b.vx-=b.vx/sp*dec;b.vy-=b.vy/sp*dec;sp-=dec}
  var n=Math.max(1,Math.ceil(sp/2.5));for(var k=0;k<n;k++){b.x+=b.vx/n;b.y+=b.vy/n;
    for(var j=0;j<Hl.segs.length;j++){var g=Hl.segs[j];collideSeg(b,g[0],g[1],g[2],g[3],.72)}
    for(var p=0;p<Hl.posts.length;p++){var q=Hl.posts[p];if(collideCirc(b,q.x,q.y,q.r,q.bump?1.15:.7)&&q.bump)b.hit=1}
    for(var m=0;m<Hl.mills.length;m++){var ms=millSegs(Hl.mills[m],t);for(var z=0;z<ms.length;z++){var bl=ms[z],om=Hl.mills[m].sp,cxp=(b.x-Hl.mills[m].x),cyp=(b.y-Hl.mills[m].y);collideSeg(b,bl[0],bl[1],bl[2],bl[3],.6,-om*cyp,om*cxp)}}
    for(var r=0;r<Hl.bars.length;r++){var br=Hl.bars[r],bx=barX(br,t),bv=Math.cos(t*br.sp+br.ph)*br.amp*br.sp;collideSeg(b,bx-br.len/2,br.y,bx+br.len/2,br.y,.7,bv,0)}}
  if(b.tc>0)b.tc--;else for(var u=0;u<Hl.tunnels.length;u++){var tu=Hl.tunnels[u];for(var e=0;e<2;e++){var A=tu[e],Bq=tu[1-e];if(sq(b.x-A.x)+sq(b.y-A.y)<64){b.x=Bq.x+b.vx*2;b.y=Bq.y+b.vy*2;b.tc=30;b.tun=1;break}}}
  for(var w=0;w<Hl.water.length;w++){var wa=Hl.water[w];if(sq((b.x-wa.x)/wa.rx)+sq((b.y-wa.y)/wa.ry)<1)return'water'}
  var cd=sq(b.x-Hl.cup.x)+sq(b.y-Hl.cup.y);if(cd<64){var spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);if(spd<4.6)return'sunk';var a=Math.atan2(b.vy,b.vx)+(b.x>Hl.cup.x?.5:-.5);b.vx=Math.cos(a)*spd*.75;b.vy=Math.sin(a)*spd*.75}
  if(sp<.12)b.low=(b.low||0)+1;else b.low=0;
  if(sp<.04&&!s||b.low>40){b.vx=0;b.vy=0;b.low=0;return'stop'}
  return'roll'}
function simulate(Hl,x,y,vx,vy,t0,max,trail){var b={x:x,y:y,vx:vx,vy:vy,tc:0},t=t0,res='roll';for(var i=0;i<(max||1500);i++){res=stepBall(b,Hl,t++);if(trail&&i%3===0)trail.push(b.x,b.y);if(res!=='roll')break}return{x:b.x,y:b.y,res:res==='roll'?'stop':res,t:t}}

/* ---------- holes ---------- */
function genHole(seed,d){var R=GK.rng(seed);for(var tries=0;tries<60;tries++){var Hl=tryHole(R,d);if(Hl&&bestPar(Hl)&&(Hl.botPar>=2||d<.08||tries>40))return Hl}return tryHole(GK.rng(seed+1),0)}
function tryHole(R,d){function ri(a){return Math.floor(R()*a)}
  var C=3+(R()<.3+d*.5?1:0),Rw=4+ri(3),want=4+Math.floor(d*5)+ri(3),grid=new Uint8Array(C*Rw),path=[];
  var sx=ri(C),sy=Rw-1;function dfs(x,y){grid[y*C+x]=1;path.push(y*C+x);if(path.length>=want)return true;var dirs=[[0,-1],[1,0],[-1,0],[0,1]].sort(function(){return R()-.5});dirs.sort(function(a,b){return(a[1]===-1?-1:0)-(b[1]===-1?-1:0)});
    for(var i=0;i<4;i++){var nx=x+dirs[i][0],ny=y+dirs[i][1];if(nx<0||ny<0||nx>=C||ny>=Rw||grid[ny*C+nx])continue;if(dfs(nx,ny))return true}grid[y*C+x]=0;path.pop();return false}
  if(!dfs(sx,sy))return null;
  /* widen a few spots so it is not always a corridor */ path.slice(1,-1).forEach(function(c){if(R()<.18+(1-d)*.12){var x=c%C,y=c/C|0,nb=[[1,0],[-1,0],[0,1],[0,-1]][ri(4)],nx=x+nb[0],ny=y+nb[1];if(nx>=0&&ny>=0&&nx<C&&ny<Rw)grid[ny*C+nx]=1}});
  var ox=(W-C*CS)/2,oy=HUD+(H-HUD-Rw*CS)/2,cen=function(c){return{x:ox+(c%C)*CS+CS/2,y:oy+(c/C|0)*CS+CS/2}};
  var Hl={C:C,R:Rw,grid:grid,ox:ox,oy:oy,path:path,segs:[],posts:[],sand:[],water:[],slopes:[],mills:[],bars:[],tunnels:[]};
  for(var y=0;y<Rw;y++)for(var x=0;x<C;x++){if(!grid[y*C+x])continue;var X=ox+x*CS,Y=oy+y*CS;
    if(y===0||!grid[(y-1)*C+x])Hl.segs.push([X,Y,X+CS,Y]);if(y===Rw-1||!grid[(y+1)*C+x])Hl.segs.push([X,Y+CS,X+CS,Y+CS]);
    if(x===0||!grid[y*C+x-1])Hl.segs.push([X,Y,X,Y+CS]);if(x===C-1||!grid[y*C+x+1])Hl.segs.push([X+CS,Y,X+CS,Y+CS])}
  var t0=cen(path[0]),c1=cen(path[path.length-1]);Hl.tee={x:t0.x,y:t0.y+20};Hl.cup={x:c1.x+(R()-.5)*36,y:c1.y+(R()-.5)*36};
  var n=Math.floor(1+d*4+R()*2),inner=path.slice(1,-1),used={};
  for(var k=0;k<n&&inner.length;k++){var c=inner[ri(inner.length)];if(used[c])continue;used[c]=1;var p=cen(c),X0=p.x-CS/2,Y0=p.y-CS/2,kind=R();
    if(kind<.2)Hl.posts.push({x:p.x+(R()-.5)*30,y:p.y+(R()-.5)*30,r:9+ri(6),bump:R()<.4});
    else if(kind<.34)Hl.sand.push({x:X0+10+ri(30),y:Y0+10+ri(30),w:44+ri(20),h:40+ri(20)});
    else if(kind<.46&&d>.2)Hl.water.push({x:p.x+(R()<.5?-1:1)*22,y:p.y+(R()-.5)*20,rx:18+ri(8),ry:14+ri(6)});
    else if(kind<.62){var di=ri(4),f=.035+d*.03;Hl.slopes.push({x:X0,y:Y0,w:CS,h:CS,fx:[f,0,-f,0][di],fy:[0,f,0,-f][di]})}
    else if(kind<.76&&d>.25)Hl.mills.push({x:p.x,y:p.y,R:38,n:4,sp:(R()<.5?1:-1)*(.02+d*.02),ph:R()*TAU});
    else if(kind<.88&&d>.35)Hl.bars.push({x:p.x,y:p.y,len:40,amp:26,sp:.03+d*.02,ph:R()*TAU});
    else if(inner.length>2&&d>.45){var c2=inner[ri(inner.length)];if(c2!==c&&!used[c2]){used[c2]=1;var q=cen(c2);Hl.tunnels.push([{x:p.x,y:p.y},{x:q.x,y:q.y}])}}
    else Hl.posts.push({x:p.x,y:p.y,r:12,bump:false})}
  /* never block the tee or the cup */
  Hl.posts=Hl.posts.filter(function(q){return sq(q.x-Hl.cup.x)+sq(q.y-Hl.cup.y)>sq(q.r+20)});Hl.water=Hl.water.filter(function(w){return sq(w.x-Hl.cup.x)+sq(w.y-Hl.cup.y)>900});
  /* cell-graph distance to the cup for the bot's judgement */ var dist=new Int16Array(C*Rw).fill(-1),cc=path[path.length-1],q2=[cc];dist[cc]=0;while(q2.length){var a=q2.shift(),ax=a%C,ay=a/C|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var bx=ax+o[0],by=ay+o[1],bi=by*C+bx;if(bx<0||by<0||bx>=C||by>=Rw||!grid[bi]||dist[bi]>=0)return;dist[bi]=dist[a]+1;q2.push(bi)})}
  Hl.dist=dist;return Hl}
function cellOf(Hl,x,y){var cx=Math.floor((x-Hl.ox)/CS),cy=Math.floor((y-Hl.oy)/CS);if(cx<0||cy<0||cx>=Hl.C||cy>=Hl.R)return-1;return cy*Hl.C+cx}
function judge(Hl,r){if(r.res==='sunk')return-1e6;if(r.res==='water')return 1e5;var c=cellOf(Hl,r.x,r.y),dc=c>=0?Hl.dist[c]:9;if(dc<0)dc=9;return dc*CS*1.4+Math.sqrt(sq(r.x-Hl.cup.x)+sq(r.y-Hl.cup.y))}
/* shot search: angles x powers, each played out exactly */
function bestShot(Hl,x,y,t,fine){var best=null,bv=1e18,NA=fine?120:72,PW=fine?[2.2,3.2,4.4,5.8,7.4,9.2,11.2,13.4]:[2.6,4,5.8,8,10.6,13.4];
  for(var i=0;i<NA;i++){var a=i/NA*TAU;for(var j=0;j<PW.length;j++){var r=simulate(Hl,x,y,Math.cos(a)*PW[j],Math.sin(a)*PW[j],t,900),v=judge(Hl,r);if(v<bv){bv=v;best={a:a,p:PW[j],r:r}}}}return best}
function bestPar(Hl){var x=Hl.tee.x,y=Hl.tee.y,t=0;for(var s=1;s<=6;s++){var b=bestShot(Hl,x,y,t);if(!b)return false;if(b.r.res==='sunk'){Hl.par=GK.clamp(s+1,2,5);Hl.botPar=s;return true}if(b.r.res==='water')return false;x=b.r.x;y=b.r.y;t=b.r.t+60}return false}

/* ---------- courses + state ---------- */
var COURSES=[{id:'sea',ic:'wave',seed:1100},{id:'pier',ic:'pier',seed:2200},{id:'fair',ic:'tent',seed:3300}];
var PROG=GK.ls.get('prog',{best:{},open:1}),ST=GK.ls.get('st',{holes:0,aces:0,under:0,courses:0,free:0,daily:0,strokes:0}),MODE=GK.ls.get('mode','course'),COURSE=GK.ls.get('course',0);
function save(){GK.ls.set('prog',PROG);GK.ls.set('st',ST)}
var hcache={},G=null;
function holeFor(m,i){var k=m+':'+(m==='course'?COURSE:0)+':'+i;if(hcache[k])return hcache[k];var Hl;
  if(m==='course')Hl=genHole(COURSES[COURSE].seed+i*101,Math.min(1,(COURSE*18+i)/40));else if(m==='free')Hl=genHole(((Date.now()/1000)|0)*7+i,Math.min(1,.15+i*.05));else Hl=genHole(GK.daily.seed()*31+i,Math.min(1,.2+i*.08));
  hcache[k]=Hl;return Hl}
function newRound(m){G={m:m,hole:0,cards:[],total:0};loadHole()}
function loadHole(){var Hl=holeFor(G.m,G.hole);G.H=Hl;G.ball={x:Hl.tee.x,y:Hl.tee.y,vx:0,vy:0,tc:0,s:1};G.st='aim';G.strokes=0;G.t=0;G.last={x:Hl.tee.x,y:Hl.tee.y};G.res=null;G.rt=0;G.aim={a:-Math.PI/2,p:6};G.drag=null;bot.wait=0}
function holes(){return G.m==='daily'?9:G.m==='free'?1e9:18}
function shoot(a,p){if(G.st!=='aim')return;G.ball.vx=Math.cos(a)*p;G.ball.vy=Math.sin(a)*p;G.last={x:G.ball.x,y:G.ball.y};G.st='roll';G.strokes++;ST.strokes++;G.drag=null;sfx('putt',p)}
function finishHole(){var Hl=G.H,s=G.strokes,rel=s-Hl.par;G.cards.push(s);G.total+=s;ST.holes++;if(s===1)ST.aces++;if(rel<0)ST.under++;G.st='done';G.rt=0;G.rel=rel;sfx(s===1?'ace':rel<0?'birdie':'cup');
  if(s===1){for(var k=0;k<3;k++)GK.fx.burst(Hl.cup.x,Hl.cup.y,20,{col:k%2?PINK:GREEN,speed:4,life:40,size:4})}save()}
function nextHole(){if(G.m==='free'){G.hole++;ST.free=Math.max(ST.free,G.hole);save();loadHole();return}
  if(G.hole+1>=holes()){endRound();return}G.hole++;loadHole()}
function endRound(){var tot=G.total,par=0;for(var i=0;i<G.cards.length;i++)par+=holeFor(G.m,i).par;G.par=par;
  if(G.m==='course'){var k=COURSES[COURSE].id;PROG.best[k]=PROG.best[k]?Math.min(PROG.best[k],tot):tot;PROG.open=Math.max(PROG.open,Math.min(3,COURSE+2));ST.courses=Object.keys(PROG.best).length}
  if(G.m==='daily')ST.daily=GK.daily.claim(1000-tot).n;save();G.st='card';G.rt=0;openCard()}

/* ---------- input: pull back anywhere ---------- */
var trail=[];
GK.pointer(cv,{down:function(x,y){if(!G||Auto.on&&!tut.active)return;if(G.st==='done'&&G.rt>50){nextHole();return}if(G.st!=='aim')return;G.drag={x0:x,y0:y,x:x,y:y}},
  move:function(x,y,e,dn){if(dn&&G&&G.drag){G.drag.x=x;G.drag.y=y;var dx=G.drag.x0-x,dy=G.drag.y0-y,d=Math.sqrt(dx*dx+dy*dy);if(d>6){G.aim.a=Math.atan2(dy,dx);G.aim.p=Math.min(14,d*.11)}}},
  up:function(){if(!G||!G.drag)return;var dx=G.drag.x0-G.drag.x,dy=G.drag.y0-G.drag.y,d=Math.sqrt(dx*dx+dy*dy);G.drag=null;if(d>10)shoot(G.aim.a,G.aim.p)},
  key:function(code,dn){if(!dn||!G)return;if(code==='Space'){if(G.st==='aim')shoot(G.aim.a,G.aim.p);else if(G.st==='done'&&G.rt>50)nextHole()}}});
function keyAim(){if(!G||G.st!=='aim')return;var K=GK.keys;if(K.ArrowLeft||K.KeyA)G.aim.a-=.025;if(K.ArrowRight||K.KeyD)G.aim.a+=.025;if(K.ArrowUp||K.KeyW)G.aim.p=Math.min(14,G.aim.p+.08);if(K.ArrowDown||K.KeyS)G.aim.p=Math.max(1,G.aim.p-.08)}

/* ---------- AUTO ---------- */
var bot={wait:0};
function botTick(){if(G.st==='aim'){if(++bot.wait<30)return;bot.wait=0;var b=bestShot(G.H,G.ball.x,G.ball.y,G.t,true);if(b){G.aim={a:b.a,p:b.p};shoot(b.a,b.p)}}
  else if(G.st==='done'&&G.rt>90)nextHole();else if(G.st==='card'&&G.rt>150){closeCard();if(G.m==='course'&&COURSE+1<PROG.open){COURSE++;GK.ls.set('course',COURSE)}newRound(G.m)}}

/* ---------- tick ---------- */
function step(){T++;GK.goals.tick();tut.tick();if(!G)return;G.t++;G.rt++;keyAim();if(Auto.on&&!tut.active)botTick();
  if(G.st==='roll'){var r=stepBall(G.ball,G.H,G.t);if(G.ball.hit){G.ball.hit=0;sfx('bump')}if(G.ball.tun){G.ball.tun=0;sfx('tunnel')}
    if(r==='sunk'){G.ball.vx=G.ball.vy=0;G.ball.x=G.H.cup.x;G.ball.y=G.H.cup.y;finishHole()}
    else if(r==='water'){GK.fx.burst(G.ball.x,G.ball.y,16,{col:PINK,speed:2.5,life:26,shape:'ci',size:3});sfx('splash');G.strokes++;G.ball={x:G.last.x,y:G.last.y,vx:0,vy:0,tc:0};G.st='aim'}
    else if(r==='stop'){G.st='aim';if(G.strokes>=10){G.strokes++;finishHole()}}}
  if(G.st==='done')G.ball.s=Math.max(0,1-G.rt/18)}

/* ---------- riso drawing ---------- */
var pats={};function pat(col,r,gap){var k=col+r+gap;if(pats[k])return pats[k];var c=document.createElement('canvas');c.width=c.height=gap;var x=c.getContext('2d');x.fillStyle=col;x.beginPath();x.arc(gap/2,gap/2,r,0,TAU);x.fill();return pats[k]=ctx.createPattern(c,'repeat')}
function render(){var v=GK.view,c=ctx;c.setTransform(v.dpr*v.s,0,0,v.dpr*v.s,0,0);c.fillStyle=PAPER;c.fillRect(0,0,W,H);if(!G)return;var Hl=G.H,so=GK.fx.offset();c.save();c.translate(so.x,so.y);
  decor(c,Hl);
  /* the walls' pink echo, printed off-register under the green */ c.save();c.globalCompositeOperation='multiply';c.strokeStyle=PINK;c.lineWidth=7;c.lineCap='square';c.beginPath();Hl.segs.forEach(function(g){c.moveTo(g[0]+3,g[1]+3);c.lineTo(g[2]+3,g[3]+3)});c.stroke();c.restore();
  /* green ink */ c.fillStyle=pat(GREEN,1.7,6);for(var y=0;y<Hl.R;y++)for(var x=0;x<Hl.C;x++)if(Hl.grid[y*Hl.C+x])c.fillRect(Hl.ox+x*CS,Hl.oy+y*CS,CS,CS);
  Hl.slopes.forEach(function(s){c.strokeStyle=GREEN;c.lineWidth=3;var a=Math.atan2(s.fy,s.fx),cx=s.x+s.w/2,cy=s.y+s.h/2,off=(T*.6)%24;for(var k=-2;k<=1;k++){var d=k*24+off;c.save();c.translate(cx+Math.cos(a)*d,cy+Math.sin(a)*d);c.rotate(a);c.beginPath();c.moveTo(-6,-12);c.lineTo(4,0);c.lineTo(-6,12);c.stroke();c.restore()}});
  c.fillStyle=GREEN;Hl.posts.forEach(function(q){if(!q.bump){c.beginPath();c.arc(q.x,q.y,q.r,0,TAU);c.fill()}});
  c.strokeStyle=GREEN;c.lineWidth=7;c.lineCap='square';c.beginPath();Hl.segs.forEach(function(g){c.moveTo(g[0],g[1]);c.lineTo(g[2],g[3])});c.stroke();
  Hl.mills.forEach(function(m){var ms=millSegs(m,G.t);c.lineWidth=6;c.lineCap='round';ms.forEach(function(s){c.beginPath();c.moveTo(s[0],s[1]);c.lineTo(s[2],s[3]);c.stroke()});c.fillStyle=GREEN;c.beginPath();c.arc(m.x,m.y,7,0,TAU);c.fill()});
  Hl.bars.forEach(function(b){var bx=barX(b,G.t);c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(bx-b.len/2,b.y);c.lineTo(bx+b.len/2,b.y);c.stroke();c.lineWidth=1.5;c.setLineDash([3,4]);c.beginPath();c.moveTo(b.x-b.amp-b.len/2,b.y);c.lineTo(b.x+b.amp+b.len/2,b.y);c.stroke();c.setLineDash([])});
  /* pink ink, printed a hair off-register so overlaps go dark */ c.save();c.globalCompositeOperation='multiply';c.translate(1.6,-1.1);
  Hl.water.forEach(function(w){c.fillStyle=pat(PINK,2.4,5);c.beginPath();c.ellipse(w.x,w.y,w.rx,w.ry,0,0,TAU);c.fill();c.strokeStyle=PINK;c.lineWidth=2;c.stroke()});
  Hl.sand.forEach(function(s){c.fillStyle=pat(PINK,1.1,5);c.beginPath();c.ellipse(s.x+s.w/2,s.y+s.h/2,s.w/2,s.h/2,0,0,TAU);c.fill()});
  Hl.posts.forEach(function(q){if(q.bump){c.fillStyle=PINK;c.beginPath();c.arc(q.x,q.y,q.r,0,TAU);c.fill();c.fillStyle=PAPER;c.beginPath();c.arc(q.x,q.y,q.r*.45,0,TAU);c.fill()}});
  Hl.tunnels.forEach(function(tu){tu.forEach(function(p){c.strokeStyle=PINK;c.lineWidth=4;c.beginPath();c.arc(p.x,p.y,10,0,TAU);c.stroke();c.fillStyle=PINK;c.beginPath();c.arc(p.x,p.y,4,0,TAU);c.fill()})});
  /* cup and flag */ c.fillStyle=PINK;c.beginPath();c.arc(Hl.cup.x,Hl.cup.y,8,0,TAU);c.fill();var fl=G.st==='done'?Math.min(1,G.rt/12)*14:0;c.strokeStyle=PINK;c.lineWidth=2.5;c.beginPath();c.moveTo(Hl.cup.x,Hl.cup.y);c.lineTo(Hl.cup.x,Hl.cup.y-42-fl);c.stroke();
  c.beginPath();c.moveTo(Hl.cup.x,Hl.cup.y-42-fl);c.lineTo(Hl.cup.x+20+Math.sin(T*.12)*2,Hl.cup.y-35-fl);c.lineTo(Hl.cup.x,Hl.cup.y-28-fl);c.fill();
  /* aim: pull line and a short ghost of the roll */ if(G.st==='aim'&&(G.drag||GK.keys.ArrowLeft||GK.keys.ArrowRight||GK.keys.ArrowUp||GK.keys.ArrowDown||Device.desktop&&!Auto.on)){trail.length=0;simulate(Hl,G.ball.x,G.ball.y,Math.cos(G.aim.a)*G.aim.p,Math.sin(G.aim.a)*G.aim.p,G.t,60,trail);
    c.fillStyle=PINK;for(var k=0;k<trail.length;k+=2){c.beginPath();c.arc(trail[k],trail[k+1],2.2,0,TAU);c.fill()}var L=18+G.aim.p*5;c.strokeStyle=PINK;c.lineWidth=3;c.beginPath();c.moveTo(G.ball.x,G.ball.y);c.lineTo(G.ball.x-Math.cos(G.aim.a)*L,G.ball.y-Math.sin(G.aim.a)*L);c.stroke()}
  c.restore();
  /* the ball, on top in paper with a green rim */ var b=G.ball;if(b.s>0){c.fillStyle=PAPER;c.strokeStyle=GREEN;c.lineWidth=2.4;c.beginPath();c.arc(b.x,b.y,BR*b.s,0,TAU);c.fill();c.stroke()}
  GK.fx.draw(c);c.restore();drawHud(c);if(G.st==='done'&&G.rt>12)drawResult(c);if(tut.active)tutDraw(c)}
function drawHud(c){c.textBaseline='middle';c.fillStyle=GREEN;c.font='32px "Bowlby One SC",Impact,sans-serif';c.textAlign='left';GK.icoDraw(c,G.m==='course'?COURSES[COURSE].ic:G.m==='free'?'infinity':'sun',26,38,26,GREEN,1.8);c.fillText(String(G.hole+1),46,40);
  /* strokes as dots against par circles */ var par=G.H.par,n=Math.max(par,G.strokes),x0=W-20-n*18;for(var k=0;k<n;k++){var x=x0+k*18;c.lineWidth=2;c.strokeStyle=k<par?GREEN:PINK;c.beginPath();c.arc(x+9,40,7,0,TAU);c.stroke();if(k<G.strokes){c.fillStyle=k<par?GREEN:PINK;c.beginPath();c.arc(x+9,40,4.5,0,TAU);c.fill()}}
  if(G.m!=='free'&&G.cards.length){c.font='18px "Bowlby One SC",sans-serif';var rel=0;for(var i=0;i<G.cards.length;i++)rel+=G.cards[i]-holeFor(G.m,i).par;c.fillStyle=rel>0?PINK:GREEN;c.fillText((rel>0?'+':rel<0?'−':'±')+Math.abs(rel),W/2-14,40)}}
function drawResult(c){var rel=G.rel,s=G.strokes,txt=s===1?'1':(rel>0?'+':rel<0?'−':'±')+Math.abs(rel),sc=Math.max(1,2.2-(G.rt-12)*.12);c.save();c.translate(W/2,H/2);c.scale(sc,sc);c.rotate(-.06);
  c.fillStyle=s===1?PINK:GREEN;c.fillRect(-70,-40,140,80);c.globalCompositeOperation='multiply';c.fillStyle=PINK;c.fillRect(-66,-36,140,80);c.globalCompositeOperation='source-over';c.fillStyle=PAPER;c.font='46px "Bowlby One SC",sans-serif';c.textAlign='center';c.textBaseline='middle';if(s===1){GK.icoDraw(c,'star',-34,0,40,PAPER,2.4);c.fillText(txt,22,4)}else c.fillText(txt,0,4);c.restore();
  if(G.rt>50)GK.pulse(c,W/2,H/2+90,G.rt,PINK,10)}

/* margins: each course prints its own seaside furniture */
function decor(c,Hl){var th=G.m==='course'?COURSE:(G.hole%3),R=GK.rng(G.hole*97+th*13+5),x0=Hl.ox,x1=Hl.ox+Hl.C*CS,y0=Hl.oy,y1=Hl.oy+Hl.R*CS;c.save();c.globalCompositeOperation='multiply';
  if(th===0){/* waves down both margins, umbrellas */ c.strokeStyle=PINK;c.lineWidth=2.5;for(var yy=HUD+20;yy<H-10;yy+=26){[[8,x0-14],[x1+14,W-8]].forEach(function(m){if(m[1]-m[0]<20)return;c.beginPath();for(var xx=m[0];xx<m[1];xx+=4)c.lineTo(xx,yy+Math.sin(xx*.25+yy+T*.04)*3);c.stroke()})}
    for(var k=0;k<3;k++){var ux=R()<.5?R()*(x0-30)+15:x1+15+R()*(W-x1-30),uy=HUD+40+R()*(H-HUD-80);if(ux<0||ux>W)continue;c.fillStyle=GREEN;c.beginPath();c.arc(ux,uy,16,Math.PI,0);c.fill();c.strokeStyle=GREEN;c.lineWidth=2;c.beginPath();c.moveTo(ux,uy);c.lineTo(ux+4,uy+22);c.stroke();c.fillStyle=PINK;c.beginPath();c.arc(ux,uy,16,Math.PI*1.33,Math.PI*1.66);c.lineTo(ux,uy);c.fill()}}
  else if(th===1){/* pier planks */ c.strokeStyle=GREEN;c.globalAlpha=.35;c.lineWidth=2;for(var py=HUD+6;py<H;py+=18){c.beginPath();c.moveTo(4,py);c.lineTo(x0-12,py);c.moveTo(x1+12,py);c.lineTo(W-4,py);c.stroke()}c.globalAlpha=1;c.fillStyle=PINK;for(var q=0;q<6;q++){var px=q%2?x1+18+R()*Math.max(1,W-x1-36):6+R()*Math.max(1,x0-24);c.beginPath();c.arc(px,HUD+30+R()*(H-HUD-60),5,0,TAU);c.fill()}}
  else{/* funfair bunting and stripes */ c.strokeStyle=GREEN;c.lineWidth=1.5;c.beginPath();c.moveTo(0,HUD+8);c.quadraticCurveTo(W/2,HUD+34,W,HUD+8);c.stroke();for(var f=0;f<14;f++){var fx=f/13*W,fy=HUD+8+Math.sin(f/13*Math.PI)*13;c.fillStyle=f%2?PINK:GREEN;c.beginPath();c.moveTo(fx-9,fy);c.lineTo(fx+9,fy);c.lineTo(fx,fy+16);c.fill()}
    c.fillStyle=PINK;c.globalAlpha=.5;for(var st=0;st<W;st+=24){c.fillRect(st,H-16,12,16)}c.globalAlpha=1}
  /* tee mat */ c.fillStyle=PINK;c.globalAlpha=.55;c.fillRect(Hl.tee.x-18,Hl.tee.y-12,36,24);c.globalAlpha=1;c.restore()}
/* ---------- scorecard + courses ---------- */
var cardEl=null;
function openCard(){closeCard();var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);var tot=G.total;
  sh.innerHTML='<div class="gk-mh"><span style="display:flex;gap:10px;align-items:center">'+GK.icoSvg('card')+tot+' / '+G.par+'</span></div>';var wr=document.createElement('div');wr.className='wrap';var tb='<table class="card">';
  for(var half=0;half<Math.ceil(G.cards.length/9);half++){var a=half*9,b=Math.min(G.cards.length,a+9);tb+='<tr><th></th>';for(var i=a;i<b;i++)tb+='<th>'+(i+1)+'</th>';tb+='</tr><tr><td>'+GK.icoSvg('flag').replace('<svg','<svg width="16" height="16"')+'</td>';for(var j=a;j<b;j++)tb+='<td>'+holeFor(G.m,j).par+'</td>';
    tb+='</tr><tr><td>'+'<svg width="16" height="16" viewBox="0 0 22 22"><circle cx="11" cy="11" r="6" fill="currentColor"/></svg></td>';for(var k=a;k<b;k++){var s=G.cards[k],p=holeFor(G.m,k).par;tb+='<td class="'+(s===1?'ace':s>p?'u':'')+'">'+s+'</td>'}tb+='</tr>'}
  wr.innerHTML=tb+'</table>';sh.appendChild(wr);var x=document.createElement('button');x.className='gk-b';x.style.alignSelf='center';x.innerHTML=GK.icon('restart');x.title='Again';x.onclick=function(){closeCard();newRound(G.m)};sh.appendChild(x);
  document.body.appendChild(m);cardEl=m}
function closeCard(){if(cardEl){cardEl.remove();cardEl=null}}
function openCourses(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);sh.innerHTML='<div class="gk-mh"><span>'+GK.icoSvg('golf')+'</span></div>';var row=document.createElement('div');row.className='crs';
  COURSES.forEach(function(cs,i){var b=document.createElement('button');b.className=COURSE===i&&MODE==='course'?'on':'';b.disabled=i>=PROG.open;b.title=['Seaside','Pier','Funfair'][i];b.innerHTML=GK.icoSvg(cs.ic)+'<span>'+(PROG.best[cs.id]||'—')+'</span>';b.onclick=function(){COURSE=i;GK.ls.set('course',i);MODE='course';GK.ls.set('mode',MODE);paint();newRound('course');m.remove()};row.appendChild(b)});
  sh.appendChild(row);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m)}

/* ---------- sound ---------- */
function sfx(k,p){var A=GK.audio,t=A.ctx&&A.ctx.currentTime;if(!A.ctx)return;if(k==='putt'){A.noise(.04,.05+p*.004,0,1800);A.tone(300,.05,'triangle',.03)}else if(k==='bump')A.tone(520,.12,'square',.03,1.5);else if(k==='tunnel')A.tone(200,.3,'sine',.05,3);
  else if(k==='splash')A.noise(.4,.07,0,500);else if(k==='cup'){A.tone(880,.08,'triangle',.05);A.tone(660,.15,'triangle',.04,1,t+.06)}else if(k==='birdie')[784,988,1175].forEach(function(f,i){A.tone(f,.2,'triangle',.05,1,t+i*.07)});
  else if(k==='ace')[523,659,784,1047,1319].forEach(function(f,i){A.tone(f,.3,'square',.035,1,t+i*.08)})}

/* ---------- tutorial: pull back, sink it ---------- */
function tutHole(){var C=3,Rw=4,grid=new Uint8Array(C*Rw);grid[1]=grid[4]=grid[7]=grid[10]=1;var ox=(W-C*CS)/2,oy=HUD+(H-HUD-Rw*CS)/2;
  var Hl={C:C,R:Rw,grid:grid,ox:ox,oy:oy,path:[10,7,4,1],segs:[],posts:[],sand:[],water:[],slopes:[],mills:[],bars:[],tunnels:[],par:2};for(var y=0;y<Rw;y++){var X=ox+CS,Y=oy+y*CS;Hl.segs.push([X,Y,X,Y+CS],[X+CS,Y,X+CS,Y+CS])}Hl.segs.push([ox+CS,oy,ox+2*CS,oy],[ox+CS,oy+Rw*CS,ox+2*CS,oy+Rw*CS]);
  Hl.tee={x:ox+CS*1.5,y:oy+Rw*CS-40};Hl.cup={x:ox+CS*1.5,y:oy+50};Hl.dist=new Int16Array(C*Rw);return Hl}
var tut=GK.tutorial({parent:stage,onStart:function(){G={m:'tut',hole:0,cards:[],total:0};var Hl=tutHole();G.H=Hl;G.ball={x:Hl.tee.x,y:Hl.tee.y,vx:0,vy:0,tc:0,s:1};G.st='aim';G.strokes=0;G.t=0;G.last={x:Hl.tee.x,y:Hl.tee.y};G.rt=0;G.aim={a:-Math.PI/2,p:6}},
  onEnd:function(){newRound(MODE)},steps:[{done:function(){return G&&G.strokes>0}},{done:function(){return G&&G.st==='done'&&G.rt>60}}]});
function tutDraw(c){if(!G)return;if(tut.i===0||tut.i===1&&G.st==='aim')GK.swipe(c,G.ball.x+40,G.ball.y-60,G.ball.x+40,G.ball.y+40,tut.t,PINK)}

/* ---------- bar ---------- */
var B=GK.controls(document.getElementById('bar'),{bar:'bottom',onHelp:function(){closeCard();tut.start()},extra:[
  {id:'cs',html:GK.icoSvg('golf'),title:'Courses',fn:openCourses},
  {id:'rs',html:GK.icon('restart'),title:'Restart round',fn:function(){if(!tut.active){closeCard();newRound(MODE)}}},
  {id:'m_course',cls:'md',html:GK.icoSvg('flag'),title:'Course',fn:function(){setMode('course')}},
  {id:'m_free',cls:'md',html:GK.icoSvg('infinity'),title:'Free play',fn:function(){setMode('free')}},
  {id:'m_daily',cls:'md',html:GK.icoSvg('sun'),title:'Daily nine',fn:function(){setMode('daily')}}]});
['m_course','m_free','m_daily'].forEach(function(id){B.panel.insertBefore(B[id],B.panel.firstChild)});
function setMode(m){if(tut.active)return;MODE=m;GK.ls.set('mode',m);paint();closeCard();newRound(m)}
function paint(){['course','free','daily'].forEach(function(k){B['m_'+k].classList.toggle('on',MODE===k)})}
GK.goals.setup({metrics:function(){return ST},defs:{holes:{ic:'flag',t:[1,18,54,200,500]},aces:{ic:'star',t:[1,5,15,40]},under:{ic:'up',t:[1,10,40,100]},courses:{ic:'golf',t:[1,2,3]},free:{ic:'infinity',t:[10,30,60]},daily:{ic:'sun',t:[1,3,7,14,30]},strokes:{ic:'target',t:[100,1000,5000]}}});
GK.goals.mount(B);
function fit(){GK.fit(cv,stage,W,H,1.6)}addEventListener('resize',fit);addEventListener('orientationchange',fit);fit();
paint();newRound(MODE);GK.loop(step,render);tut.maybe();
window.__g={tut:tut,G:function(){return G},holeFor:holeFor,bestShot:bestShot,newRound:newRound,prog:PROG,st:ST,
  stats:function(){return{m:G.m,hole:G.hole+1,st:G.st,strokes:G.strokes,par:G.H.par,botPar:G.H.botPar,total:G.total,cards:G.cards.join(','),holes:ST.holes,aces:ST.aces}}};
})();
