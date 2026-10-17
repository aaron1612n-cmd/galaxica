/* Lamplight: set mirrors so the lighthouse beam reaches every ship. All ships lit at once and they sail home.
   Levels are generated from fixed seeds along a planned beam path, then checked by a beam-tracing solver that also finds par. */
(function(){
GK.id('lamplight');Auto.deep=true;
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
var SEA='#0f3b3a',SEA2='#0c3433',DEEP='#082524',CREAM='#efe3c8',LAMP='#f2b705',TAU=Math.PI*2;
var TS=64,PAD=18,HUD=84,T=0;
var DX=[1,0,-1,0],DY=[0,1,0,-1];
/* reflection tables: orientation 0 is '/', 1 is '\' */
var REF=[[3,2,1,0],[1,0,3,2]];
/* tile types */ var W_=0,ROCK=1,SHIP=2,LIGHT=3,FIX=4,ROT=5,SPLIT=6;
Object.assign(GK.ico,{mirror:'<path d="M5 17L17 5"/><path d="M7 19L19 7" stroke-dasharray="2 2"/>',lighthouse:'<path d="M8 20l1.5-12h3L14 20zM8 8h6M9 5h4v3H9zM11 2v3M4 4l3 2M18 4l-3 2"/>',ship:'<path d="M3 15h16l-3 4H6zM11 15V3l6 10H11M11 5L6 13h5"/>',grid:'<path d="M3 3h16v16H3zM3 9h16M3 15h16M9 3v16M15 3v16"/>'});

/* ---------- beam tracing ---------- */
function trace(L,pl,rot){/* returns {seg:[[cell,inDir,outDir]],lit:Uint8Array} */var n=L.w*L.h,vis=new Uint8Array(n*4),lit=new Uint8Array(n),seg=[],q=[];
  for(var i=0;i<n;i++)if(L.T[i]===LIGHT)q.push([i,L.D[i]]);
  while(q.length){var h=q.pop(),c=h[0],d=h[1];seg.push([c,-1,d]);
    for(;;){var x=c%L.w+DX[d],y=(c/L.w|0)+DY[d];if(x<0||y<0||x>=L.w||y>=L.h){seg.push([-1,d,x,y,c]);break}var j=y*L.w+x,k=j*4+d;if(vis[k])break;vis[k]=1;var t=L.T[j],nd=d;
      if(t===ROCK||t===LIGHT){seg.push([j,d,-1]);break}
      if(t===SHIP)lit[j]=1;
      else if(t===W_){if(pl[j]>0)nd=REF[pl[j]-1][d]}
      else if(t===FIX)nd=REF[L.O[j]][d];
      else if(t===ROT)nd=REF[rot[j]][d];
      else if(t===SPLIT){var sd=REF[L.O[j]][d];seg.push([j,d,sd]);q.push([j,sd])}
      seg.push([j,d,nd]);c=j;d=nd}}
  return{seg:seg,lit:lit}}
/* ---------- solver: depth-first along the beams, deciding each open cell the first time light reaches it ---------- */
function solve(L,K,rot0){var n=L.w*L.h,ships=[];for(var i=0;i<n;i++)if(L.T[i]===SHIP)ships.push(i);var budget={c:0};
  function cl(s){return{pl:s.pl.slice(),rot:s.rot.slice(),vis:s.vis.slice(),lit:s.lit.slice(),q:s.q.map(function(a){return a.slice()}),used:s.used}}
  function run(st){if(++budget.c>60000)return null;
    while(st.q.length){var h=st.q.pop(),c=h[0],d=h[1];
      for(;;){var x=c%L.w+DX[d],y=(c/L.w|0)+DY[d];if(x<0||y<0||x>=L.w||y>=L.h)break;var j=y*L.w+x,t=L.T[j];
        if(t===W_&&st.pl[j]<0){if(st.used<K){for(var o=0;o<3;o++){var s2=cl(st);s2.pl[j]=o;if(o)s2.used++;s2.q.push([c,d]);var r=run(s2);if(r)return r}return null}st.pl[j]=0}
        if(t===ROT&&st.rot[j]<0){for(var o2=0;o2<2;o2++){var s3=cl(st);s3.rot[j]=o2;s3.q.push([c,d]);var r2=run(s3);if(r2)return r2}return null}
        var k=j*4+d;if(st.vis[k])break;st.vis[k]=1;
        if(t===ROCK||t===LIGHT)break;
        if(t===SHIP)st.lit[j]=1;else if(t===W_){if(st.pl[j]>0)d=REF[st.pl[j]-1][d]}else if(t===FIX)d=REF[L.O[j]][d];else if(t===ROT)d=REF[st.rot[j]][d];else if(t===SPLIT)st.q.push([j,REF[L.O[j]][d]]);
        c=j}}
    for(var s=0;s<ships.length;s++)if(!st.lit[ships[s]])return null;return st}
  var st={pl:new Int8Array(n).fill(-1),rot:new Int8Array(n).fill(-1),vis:new Uint8Array(n*4),lit:new Uint8Array(n),q:[],used:0};
  for(var a=0;a<n;a++){if(L.T[a]===LIGHT)st.q.push([a,L.D[a]]);if(L.T[a]!==W_)st.pl[a]=0}
  var r=run(st);if(!r)return null;var out={pl:[],rot:{}};for(var b=0;b<n;b++){if(L.T[b]===W_&&r.pl[b]>0)out.pl.push([b,r.pl[b]]);if(L.T[b]===ROT)out.rot[b]=r.rot[b]<0?(rot0?rot0[b]:0):r.rot[b]}out.n=out.pl.length;return out}
function par(L){for(var k=0;k<=L.K;k++){var s=solve(L,k);if(s)return{k:k,sol:s}}return null}

/* ---------- generator ---------- */
function params(n){/* n: 0-based difficulty index */var c=Math.min(4,Math.floor(n/12)),f=(n%12)/11;
  return{w:[6,7,7,8,9][c]+(f>.6&&c<4?1:0),h:[6,8,9,9,10][c]+(f>.5?1:0),ships:[1,2,3,3,4][c]+(f>.7?1:0),rocks:[.05,.08,.09,.1,.11][c],turn:[.32,.36,.38,.42,.45][c],minPar:[1,1.5,2,2.5,3][c]+(f>.5?.5:0),rot:c>=1?.5:0,split:c>=2?1:0,lights:c>=3?2:1,spare:c>=4?1:0}}
function gen(seed,P){var R=GK.rng(seed);for(var tries=0;tries<400;tries++){var L=build(R,P);if(L)return L}var Q=Object.assign({},P,{minPar:1});for(var t2=0;t2<400;t2++){var L2=build(R,Q);if(L2)return L2}return build(R,{w:6,h:6,ships:1,rocks:0,turn:.5,rot:0,split:0,lights:1,spare:0,minPar:1})}
function build(R,P){var w=P.w,h=P.h,n=w*h,T=new Uint8Array(n),O=new Uint8Array(n),D=new Uint8Array(n),sol={},path=new Uint8Array(n),order=[];
  function ri(a){return Math.floor(R()*a)}
  var nr=Math.round(n*P.rocks);for(var k=0;k<nr;k++){var c=ri(n);T[c]=ROCK}
  var lights=[];for(var l=0;l<P.lights;l++){for(var t=0;t<30;t++){var side=ri(4),x,y,d;if(side===0){x=0;y=1+ri(h-2);d=0}else if(side===1){x=w-1;y=1+ri(h-2);d=2}else if(side===2){x=1+ri(w-2);y=0;d=1}else{x=1+ri(w-2);y=h-1;d=3}var ci=y*w+x;if(T[ci]===W_){T[ci]=LIGHT;D[ci]=d;lights.push([ci,d]);break}}}
  if(lights.length<P.lights)return null;
  var splits=P.split,q=lights.map(function(a){return a.slice()}),turns=0,seen=new Uint8Array(n*4);
  while(q.length){var hd=q.shift(),c2=hd[0],dd=hd[1],len=0,maxLen=4+ri(w+h);
    for(;;){var nx=c2%w+DX[dd],ny=(c2/w|0)+DY[dd];if(nx<0||ny<0||nx>=w||ny>=h)break;var j=ny*w+nx;if(T[j]===ROCK||T[j]===LIGHT||seen[j*4+dd])break;seen[j*4+dd]=1;
      if(sol[j]!=null){dd=REF[sol[j]][dd];c2=j;continue}if(T[j]===SPLIT){q.push([j,REF[O[j]][dd]]);c2=j;continue}
      var fresh=!path[j];path[j]=1;order.push(j);len++;
      if(fresh&&len>=2&&splits>0&&R()<.25){T[j]=SPLIT;O[j]=ri(2);splits--;q.push([j,REF[O[j]][dd]]);c2=j;continue}
      if(fresh&&len>=1&&R()<P.turn){var o=ri(2),nd=REF[o][dd],tx=nx+DX[nd],ty=ny+DY[nd];if(tx>=0&&ty>=0&&tx<w&&ty<h&&T[ty*w+tx]!==ROCK){sol[j]=o;dd=nd;turns++;c2=j;continue}}
      if(len>maxLen)break;c2=j}}
  if(turns<1||splits>0&&P.split)return null;
  /* ships ride the lit path, not on mirrors; favour cells beyond a turn */
  var cand=order.filter(function(j,i){return sol[j]==null&&T[j]===W_&&order.indexOf(j)===i});if(cand.length<P.ships)return null;
  var lastTurn=-1;order.forEach(function(j,i){if(sol[j]!=null)lastTurn=i});
  var ships=[];var late=cand.filter(function(j){return order.indexOf(j)>lastTurn});if(late.length)ships.push(late[ri(late.length)]);
  while(ships.length<P.ships){var s=cand[ri(cand.length)];if(ships.indexOf(s)<0)ships.push(s)}ships.forEach(function(s){T[s]=SHIP});
  /* some solution mirrors are bolted (rotate only, set wrong), the rest go back to the keeper's crate */
  var K=P.spare;Object.keys(sol).forEach(function(j){j=+j;if(P.rot&&R()<P.rot){T[j]=ROT;O[j]=R()<.6?1-sol[j]:sol[j]}else K++});
  var L={w:w,h:h,T:T,O:O,D:D,K:K};
  var rot0={};for(var a=0;a<n;a++)if(T[a]===ROT)rot0[a]=O[a];
  var tr=trace(L,new Int8Array(n),O);var all=true;ships.forEach(function(s){if(!tr.lit[s])all=false});if(all)return null;
  var p=par(L);if(!p)return null;var wrong=0;for(var rc in p.sol.rot)if(p.sol.rot[rc]!==rot0[rc])wrong++;if(p.k+wrong*.5<(P.minPar||1))return null;
  L.K=p.k+P.spare;L.par=p.k;L.sol=p.sol;return L}

/* ---------- campaign + state ---------- */
var PROG=GK.ls.get('prog',{}),ST=GK.ls.get('st',{solved:0,stars:0,perfect:0,watch:0,daily:0,ships:0}),MODE=GK.ls.get('mode','voyage');
function save(){var s=0,p=0,c=0;for(var k in PROG){c++;s+=PROG[k];if(PROG[k]===3)p++}ST.solved=c;ST.stars=s;ST.perfect=p;GK.ls.set('prog',PROG);GK.ls.set('st',ST)}
var cache={},G=null;
function levelDef(m,i){var key=m+':'+i;if(cache[key])return cache[key];var L;
  if(m==='voyage')L=gen(9001+i*7919,params(i));else if(m==='watch')L=gen((Date.now()%1e6)+i*31,params(Math.min(59,6+i*2)));else L=gen(GK.daily.seed()*13+5,params(30+GK.daily.seed()%30));
  cache[key]=L;return L}
function load(m,i){var L=levelDef(m,i),n=L.w*L.h;G={m:m,i:i,L:L,pl:new Int8Array(n),rot:new Uint8Array(L.O),left:L.K,won:0,wt:0,moves:0,hist:[],sail:[],flash:{}};
  for(var a=0;a<n;a++)if(L.T[a]===ROT)G.rot[a]=L.O[a];G.tr=trace(L,G.pl,G.rot);bot.q=null;bot.t=0;fit()}
function curLevel(){var i=0;while(PROG['v'+i]!=null&&i<59)i++;return i}
function apply(){G.tr=trace(G.L,G.pl,G.rot);var L=G.L,all=true,n=L.w*L.h,nl=0;for(var a=0;a<n;a++)if(L.T[a]===SHIP){if(G.tr.lit[a]){nl++;if(!G.flash[a]){G.flash[a]=1;chime(nl)}}else{all=false;G.flash[a]=0}}
  if(all&&!G.won)win()}
function win(){G.won=1;G.wt=0;if(G.m==='tut'){G.stars=3;sfx('horn');var L0=G.L;for(var a0=0;a0<L0.w*L0.h;a0++)if(L0.T[a0]===SHIP)G.sail.push({c:a0,x:a0%L0.w,y:a0/L0.w|0});return}var used=G.L.K-G.left,st=used<=G.L.par?3:used<=G.L.par+1?2:1;G.stars=st;sfx('horn');var L=G.L;
  for(var a=0;a<L.w*L.h;a++)if(L.T[a]===SHIP){ST.ships++;G.sail.push({c:a,x:a%L.w,y:a/L.w|0})}
  if(G.m==='voyage'){var k='v'+G.i;PROG[k]=Math.max(PROG[k]||0,st)}else if(G.m==='watch'){G.streak=(G.streak||0)+1;ST.watch=Math.max(ST.watch,G.streak)}else ST.daily=GK.daily.claim(st).n;save()}
function next(){if(G.m==='voyage')load('voyage',Math.min(59,G.i+1));else if(G.m==='watch'){var s=G.streak;load('watch',G.i+1);G.streak=s}else load('daily',0)}

/* ---------- input ---------- */
function cellAt(x,y){var L=G.L,gx=Math.floor((x-PAD)/TS),gy=Math.floor((y-HUD)/TS);if(gx<0||gy<0||gx>=L.w||gy>=L.h)return-1;return gy*L.w+gx}
function tap(c){if(G.won||c<0)return;var L=G.L,t=L.T[c];
  if(t===W_){var p=G.pl[c];if(p===0){if(G.left<=0){shake(c);return}G.pl[c]=1;G.left--}else if(p===1)G.pl[c]=2;else{G.pl[c]=0;G.left++}G.hist.push(['p',c,p]);G.moves++;sfx('click');apply()}
  else if(t===ROT){G.hist.push(['r',c,G.rot[c]]);G.rot[c]^=1;G.moves++;sfx('turn');apply()}
  else shake(c)}
function shake(c){G.shk={c:c,t:12};sfx('no')}
function undo(){if(!G||G.won)return;var h=G.hist.pop();if(!h)return;if(h[0]==='p'){var now=G.pl[h[1]];if(now>0&&h[2]===0)G.left++;if(now===0&&h[2]>0)G.left--;G.pl[h[1]]=h[2]}else G.rot[h[1]]=h[2];apply()}
GK.pointer(cv,{down:function(x,y){if(!G)return;if(G.won){if(G.wt>60&&G.m!=='tut')next();return}tap(cellAt(x,y))}});

/* ---------- AUTO: replay the solver's answer one tap at a time ---------- */
var bot={q:null,t:0};
function botTick(){if(!G)return;if(G.won){if(G.wt>110)next();return}if(!Auto.think())return;if(++bot.t<16+(bot.lag||0))return;bot.t=0;bot.lag=Auto.react();if(bot.q&&Auto.slip()){var w=[];for(var z=0;z<G.L.w*G.L.h;z++)if(G.L.T[z]===W_)w.push(z);if(w.length){tap(w[Math.floor(Math.random()*w.length)]);bot.q=null;return}}
  if(!bot.q){/* start from a clean board, then lay the solution */ var n=G.L.w*G.L.h;G.pl=new Int8Array(n);G.left=G.L.K;for(var a=0;a<n;a++)if(G.L.T[a]===ROT)G.rot[a]=G.L.O[a];apply();
    var s=G.L.sol,q=[];s.pl.forEach(function(p){q.push(p[0]);if(p[1]===2)q.push(p[0])});Object.keys(s.rot).forEach(function(c){if(s.rot[c]!==G.rot[c])q.push(+c)});bot.q=q;return}
  if(bot.q.length)tap(bot.q.shift())}

/* ---------- draw ---------- */
function fit(){if(!G)return;var L=G.L;GK.fit(cv,stage,L.w*TS+PAD*2,L.h*TS+HUD+PAD,1.7)}
function render(){var v=GK.view,c=ctx;c.setTransform(v.dpr*v.s,0,0,v.dpr*v.s,0,0);var Wd=v.W,Hd=v.H;c.fillStyle=SEA;c.fillRect(0,0,Wd,Hd);if(!G)return;var L=G.L;
  /* deco sunburst behind the board: flat wedges, no blend */ c.save();c.translate(Wd/2,HUD+L.h*TS*.5);c.fillStyle=SEA2;for(var r=0;r<16;r++){c.beginPath();c.moveTo(0,0);c.arc(0,0,Math.max(Wd,Hd),r/16*TAU+T*.0008,(r+.5)/16*TAU+T*.0008);c.fill()}c.restore();
  c.save();c.translate(PAD,HUD);
  for(var y=0;y<L.h;y++)for(var x=0;x<L.w;x++){var i=y*L.w+x,X=x*TS,Y=y*TS;c.fillStyle=(x+y)%2?SEA:SEA2;c.fillRect(X,Y,TS,TS);
    if(L.T[i]===W_||L.T[i]===SHIP){c.strokeStyle='rgba(239,227,200,.13)';c.lineWidth=1.5;c.beginPath();for(var k=0;k<2;k++){var wy=Y+22+k*22;c.moveTo(X+10,wy);c.quadraticCurveTo(X+20,wy-5,X+30,wy);c.quadraticCurveTo(X+40,wy+5,X+54,wy)}c.stroke()}}
  c.strokeStyle=CREAM;c.lineWidth=3;c.strokeRect(-6,-6,L.w*TS+12,L.h*TS+12);c.lineWidth=1;c.strokeRect(-11,-11,L.w*TS+22,L.h*TS+22);
  drawBeam(c);
  for(var j=0;j<L.w*L.h;j++){var t=L.T[j],X2=(j%L.w)*TS,Y2=(j/L.w|0)*TS,sx=G.shk&&G.shk.c===j?Math.sin(G.shk.t*1.8)*3:0;c.save();c.translate(X2+TS/2+sx,Y2+TS/2);
    if(t===ROCK)rock(c,j);else if(t===LIGHT)light(c,L.D[j]);else if(t===SHIP&&!G.sail.some(function(s){return s.c===j}))ship(c,G.tr.lit[j],0);
    else if(t===FIX)mirror(c,L.O[j],'fix');else if(t===ROT)mirror(c,G.rot[j],'rot');else if(t===SPLIT)mirror(c,L.O[j],'split');else if(t===W_&&G.pl[j]>0)mirror(c,G.pl[j]-1,'mine');
    c.restore()}
  G.sail.forEach(function(s){var p=Math.min(1,G.wt/100),ex=s.x,ey=s.y+p*p*(L.h-s.y+1.5);c.save();c.translate(ex*TS+TS/2,ey*TS+TS/2+Math.sin(T*.2+s.c)*2);ship(c,1,p);c.restore();
    c.strokeStyle=CREAM;c.globalAlpha=.4*(1-p);c.lineWidth=2;c.beginPath();c.moveTo(ex*TS+TS/2-10,s.y*TS+TS/2);c.lineTo(ex*TS+TS/2,ey*TS+TS/2-14);c.lineTo(ex*TS+TS/2+10,s.y*TS+TS/2);c.stroke();c.globalAlpha=1});
  c.restore();
  drawHud(c,Wd);if(G.won&&G.wt>50)drawStars(c,Wd,Hd);if(tut.active)tutDraw(c)}
function drawBeam(c){var L=G.L,w=TS*.24,cx=function(j){return(j%L.w)*TS+TS/2},cy=function(j){return(j/L.w|0)*TS+TS/2};c.lineCap='butt';
  G.tr.seg.forEach(function(s){var j=s[0];if(j===-1){/* leaves the board */var from=s[4],d=s[1];c.fillStyle=LAMP;var x0=cx(from),y0=cy(from);band(c,x0,y0,x0+DX[d]*(TS/2+8),y0+DY[d]*(TS/2+8),w);return}
    var x=cx(j),y=cy(j);if(s[1]>=0){var di=s[1];band(c,x-DX[di]*TS/2,y-DY[di]*TS/2,x,y,w)}if(s[2]>=0){var d2=s[2];band(c,x,y,x+DX[d2]*TS/2,y+DY[d2]*TS/2,w)}});
  /* travelling dashes show which way the light runs (the one steady motion on the board) */ c.strokeStyle=CREAM;c.lineWidth=2;c.setLineDash([6,14]);c.lineDashOffset=-T*.9;
  G.tr.seg.forEach(function(s){var j=s[0];if(j<0)return;var x=cx(j),y=cy(j);c.beginPath();if(s[1]>=0)c.moveTo(x-DX[s[1]]*TS/2,y-DY[s[1]]*TS/2);else c.moveTo(x,y);c.lineTo(x,y);if(s[2]>=0)c.lineTo(x+DX[s[2]]*TS/2,y+DY[s[2]]*TS/2);c.stroke()});c.setLineDash([])}
function band(c,x0,y0,x1,y1,w){c.fillStyle=LAMP;var mx=Math.min(x0,x1),my=Math.min(y0,y1);if(x0===x1)c.fillRect(x0-w/2,my-w/2,w,Math.abs(y1-y0)+w);else c.fillRect(mx-w/2,y0-w/2,Math.abs(x1-x0)+w,w)}
function rock(c,j){var r=TS*.42,k=(j*37)%5;c.fillStyle=DEEP;c.strokeStyle=CREAM;c.lineWidth=2;c.beginPath();c.moveTo(-r,r*.6);c.lineTo(-r*.7,-r*.3+k);c.lineTo(-r*.2,-r*.8);c.lineTo(r*.4,-r*.55+k);c.lineTo(r*.85,r*.1);c.lineTo(r*.7,r*.6);c.closePath();c.fill();c.stroke();
  c.beginPath();c.moveTo(-r*.2,-r*.8);c.lineTo(-r*.1,r*.6);c.moveTo(r*.4,-r*.55+k);c.lineTo(r*.25,r*.6);c.stroke()}
function light(c,d){c.save();c.rotate([0,Math.PI/2,Math.PI,-Math.PI/2][d]);c.fillStyle=DEEP;c.beginPath();c.arc(0,0,TS*.44,0,TAU);c.fill();c.restore();
  c.fillStyle=CREAM;c.beginPath();c.moveTo(-10,22);c.lineTo(-7,-12);c.lineTo(7,-12);c.lineTo(10,22);c.closePath();c.fill();c.fillStyle=SEA;c.fillRect(-9,0,18,6);c.fillRect(-8,-8,16,4);
  c.fillStyle=LAMP;c.fillRect(-6,-22,12,10);c.fillStyle=CREAM;c.beginPath();c.moveTo(-8,-22);c.lineTo(0,-29);c.lineTo(8,-22);c.fill();
  c.strokeStyle=LAMP;c.lineWidth=3;c.beginPath();var a=[0,Math.PI/2,Math.PI,-Math.PI/2][d];c.moveTo(Math.cos(a)*16,-17+Math.sin(a)*16);c.lineTo(Math.cos(a)*27,-17+Math.sin(a)*27);c.stroke()}
function ship(c,lit,p){var s=1-p*.2;c.scale(s,s);c.fillStyle=CREAM;c.beginPath();c.moveTo(-20,6);c.lineTo(20,6);c.lineTo(14,16);c.lineTo(-14,16);c.closePath();c.fill();
  c.fillStyle=lit?LAMP:CREAM;c.beginPath();c.moveTo(-2,4);c.lineTo(-2,-24);c.lineTo(14,2);c.closePath();c.fill();c.beginPath();c.moveTo(-4,2);c.lineTo(-4,-18);c.lineTo(-16,2);c.closePath();c.fill();
  c.fillStyle=SEA;c.fillRect(-1,-26,2,32);if(lit){c.fillStyle=LAMP;c.fillRect(16,-2,5,5)}}
function mirror(c,o,kind){c.save();c.rotate(o?Math.PI/4:-Math.PI/4);var L2=TS*.78;
  if(kind==='split'){c.fillStyle=CREAM;for(var k=-3;k<=3;k++)c.fillRect(k*L2/7-L2/16,-3,L2/8,6)}
  else{c.fillStyle=DEEP;c.fillRect(-L2/2,1,L2,6);c.fillStyle=CREAM;c.fillRect(-L2/2,-4,L2,5);
    if(kind==='fix'){c.fillStyle=DEEP;c.fillRect(-L2/2+4,-3,3,3);c.fillRect(L2/2-7,-3,3,3)}
    if(kind==='rot'){c.restore();c.strokeStyle=CREAM;c.lineWidth=2;c.beginPath();c.arc(0,0,TS*.4,0,TAU);c.stroke();c.fillStyle=CREAM;c.beginPath();c.arc(TS*.4,0,4,0,TAU);c.fill();return}}
  c.restore()}
function drawHud(c,Wd){c.textBaseline='middle';c.fillStyle=CREAM;c.font='34px "Limelight",serif';c.textAlign='left';
  var lab=G.m==='voyage'?String(G.i+1):G.m==='watch'?String((G.streak||0)+1):'';if(G.m==='tut')lab='';if(G.m==='watch'||G.m==='daily')GK.icoDraw(c,G.m==='watch'?'moon':'sun',PAD+14,40,26,LAMP,1.8);c.fillText(lab,PAD+(G.m==='voyage'?0:34),42);
  /* the crate: mirrors left to set */ var n=G.L.K,x0=Wd-PAD-n*22;for(var k=0;k<n;k++){c.save();c.translate(x0+k*22+10,40);c.rotate(-Math.PI/4);c.fillStyle=k<G.left?CREAM:'rgba(239,227,200,.2)';c.fillRect(-14,-3,28,6);c.restore()}
  /* par as three diamonds */ var used=G.L.K-G.left,st=used<=G.L.par?3:used<=G.L.par+1?2:1;for(var s2=0;s2<3;s2++){c.save();c.translate(Wd/2-18+s2*18,40);c.rotate(Math.PI/4);c.fillStyle=s2<st?LAMP:'rgba(239,227,200,.2)';c.fillRect(-5,-5,10,10);c.restore()}}
function drawStars(c,Wd,Hd){var p=Math.min(1,(G.wt-50)/20);c.fillStyle='rgba(8,37,36,'+(.6*p)+')';c.fillRect(0,0,Wd,Hd);for(var k=0;k<3;k++){var sh=G.wt-50-k*8;if(sh<0)continue;var sc=Math.max(1,2.2-sh*.12);c.save();c.translate(Wd/2+(k-1)*70,Hd/2);c.scale(sc,sc);c.rotate(Math.PI/4);c.fillStyle=k<G.stars?LAMP:'rgba(239,227,200,.25)';c.fillRect(-18,-18,36,36);c.restore()}
  if(G.wt>90)GK.pulse(c,Wd/2,Hd/2+80,G.wt,LAMP,10)}

/* ---------- level select ---------- */
var CH=['ship','anchor','mirror','lighthouse','star'];
function openLevels(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);
  var hd=document.createElement('div');hd.className='gk-mh';hd.innerHTML='<span style="display:flex;gap:10px;align-items:center">'+GK.icoSvg('star')+ST.stars+'</span>';var x=document.createElement('button');x.className='gk-b';x.textContent='×';x.onclick=function(){m.remove()};hd.appendChild(x);sh.appendChild(hd);
  for(var c=0;c<5;c++){var done=0;for(var q=0;q<12;q++)if(PROG['v'+(c*12+q)]!=null)done++;var prevDone=0;if(c>0)for(var q2=0;q2<12;q2++)if(PROG['v'+((c-1)*12+q2)]!=null)prevDone++;var open=c===0||prevDone>=8;
    var box=document.createElement('div');box.className='chap';box.innerHTML='<h3>'+GK.icoSvg(CH[c])+done+'/12</h3>';var g=document.createElement('div');g.className='lvls';
    for(var q3=0;q3<12;q3++){(function(i){var b=document.createElement('button'),s=PROG['v'+i];b.className='lv'+(s!=null?' done':'')+(G&&G.m==='voyage'&&G.i===i?' cur':'');b.disabled=!open||(i>0&&PROG['v'+(i-1)]==null&&s==null&&i%12!==0);
      b.innerHTML=(i+1)+'<i>'+[0,1,2].map(function(k){return'<b class="'+(s!=null&&k<s?'on':'')+'"></b>'}).join('')+'</i>';b.onclick=function(){MODE='voyage';GK.ls.set('mode',MODE);paint();load('voyage',i);m.remove()};g.appendChild(b)})(c*12+q3)}
    box.appendChild(g);sh.appendChild(box)}
  m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m)}

/* ---------- sound ---------- */
function chime(n){var A=GK.audio;if(!A.ctx)return;var f=[523,659,784,988,1175][Math.min(4,n-1)];A.tone(f,.6,'sine',.05);A.tone(f*2,.3,'sine',.015)}
function sfx(k){var A=GK.audio,t=A.ctx&&A.ctx.currentTime;if(!A.ctx)return;if(k==='click')A.tone(1400,.03,'square',.02);else if(k==='turn')A.tone(900,.05,'triangle',.03,1.3);else if(k==='no')A.tone(160,.12,'square',.03);
  else if(k==='horn'){A.tone(110,1.4,'sawtooth',.04,1.01);A.tone(165,1.4,'sawtooth',.03,1.01);[523,659,784,1047].forEach(function(f,i){A.tone(f,.5,'triangle',.04,1,t+.5+i*.1)})}}

/* ---------- tick ---------- */
function step(){T++;GK.goals.tick();tut.tick();if(!G)return;if(G.shk&&--G.shk.t<=0)G.shk=null;if(G.won)G.wt++;if(Auto.on&&!tut.active)botTick()}

/* ---------- tutorial: set a mirror, then flip one ---------- */
function tutBoard(k){var w=5,h=5,n=w*h,T2=new Uint8Array(n),O=new Uint8Array(n),D=new Uint8Array(n),K=1;T2[2*w]=LIGHT;D[2*w]=0;
  if(k===0)T2[0*w+3]=SHIP;else if(k===1)T2[4*w+3]=SHIP;
  else if(k===2){T2[2*w+3]=ROT;O[2*w+3]=1;T2[0*w+3]=SHIP;K=0}
  else if(k===3){T2[2*w+2]=SPLIT;O[2*w+2]=0;T2[0*w+2]=SHIP;T2[0*w+3]=SHIP}
  else{T2[2*w+3]=ROCK;T2[0*w+4]=SHIP;K=2}
  var L={w:w,h:h,T:T2,O:O,D:D,K:K,par:K||1};L.sol=solve(L,K);return L}
var tut=GK.tutorial({parent:stage,onStart:function(){tutLoad(0)},onEnd:function(){load(MODE,MODE==='voyage'?curLevel():0)},steps:[
  {done:function(){return G&&G.won&&G.wt>70}},
  {init:function(){tutLoad(1)},done:function(){return G&&G.won&&G.wt>70}},
  {init:function(){tutLoad(2)},done:function(){return G&&G.won&&G.wt>70}},
  {init:function(){tutLoad(3)},done:function(){return G&&G.won&&G.wt>70}},
  {init:function(){tutLoad(4)},done:function(){return G&&G.won&&G.wt>70}}]});
function tutLoad(k){var L=tutBoard(k),n=L.w*L.h;G={m:'tut',i:0,L:L,pl:new Int8Array(n),rot:new Uint8Array(L.O),left:L.K,won:0,wt:0,moves:0,hist:[],sail:[],flash:{}};G.tr=trace(L,G.pl,G.rot);fit()}
function tutDraw(c){if(!G||G.won)return;var s0=G.L.sol,cell=-1;if(s0){s0.pl.forEach(function(q){if(cell<0&&G.pl[q[0]]!==q[1])cell=q[0]});if(cell<0)for(var rc in s0.rot){if(cell<0&&G.rot[rc]!==s0.rot[rc])cell=+rc}}
  if(cell<0)return;var x=PAD+(cell%G.L.w)*TS+TS/2,y=HUD+((cell/G.L.w)|0)*TS+TS/2;GK.pulse(c,x,y,tut.t,LAMP,14)}

/* ---------- bar ---------- */
var B=GK.controls(document.getElementById('bar'),{bar:'top',onHelp:function(){tut.start()},extra:[
  {id:'lv',html:GK.icoSvg('grid'),title:'Levels',fn:openLevels},
  {id:'un',html:'<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M8 5L3 10l5 5"/><path d="M3 10h10a6 6 0 0 1 0 12h-3"/></svg>',title:'Undo',fn:undo},
  {id:'rs',html:GK.icon('restart'),title:'Reset',fn:function(){if(G&&!tut.active)load(G.m,G.i)}},
  {id:'m_voyage',cls:'md',html:GK.icoSvg('ship'),title:'Voyage',fn:function(){setMode('voyage')}},
  {id:'m_watch',cls:'md',html:GK.icoSvg('moon'),title:'Night watch',fn:function(){setMode('watch')}},
  {id:'m_daily',cls:'md',html:GK.icoSvg('sun'),title:'Daily',fn:function(){setMode('daily')}}]});
['m_voyage','m_watch','m_daily'].forEach(function(id){B.panel.insertBefore(B[id],B.panel.firstChild)});
function setMode(m){if(tut.active)return;MODE=m;GK.ls.set('mode',m);paint();load(m,m==='voyage'?curLevel():0);if(m==='watch')G.streak=0}
function paint(){['voyage','watch','daily'].forEach(function(k){B['m_'+k].classList.toggle('on',MODE===k)})}
GK.goals.setup({metrics:function(){return ST},defs:{solved:{ic:'grid',t:[1,10,25,40,60]},stars:{ic:'star',t:[10,50,100,150,180]},perfect:{ic:'crown',t:[5,20,40,60]},watch:{ic:'moon',t:[5,15,30]},daily:{ic:'sun',t:[1,3,7,14,30]},ships:{ic:'ship',t:[10,100,300,1000]}}});
GK.goals.mount(B);
function lpic(fn){return function(c,s){c.fillStyle=SEA;c.fillRect(0,0,s,s);c.translate(s/2,s/2);c.scale(s/TS*.9,s/TS*.9);fn(c)}}
GK.guide({title:'Lamplight',goal:'Light every ship at the same time. Then they sail home.',
 how:['The lighthouse throws a beam in a straight line.','Tap open water to set a mirror /. Tap again to flip it to \\, and once more to take it back.','Ringed mirrors are bolted down: tap to turn them, but they cannot move.','You only have the mirrors in the crate (top right). Use as few as possible: the three diamonds show your stars.'],
 keys:[['Click','set, flip or turn a mirror'],['Undo button','take back a move']],touch:[['Tap','set, flip or turn a mirror']],
 legend:[{pic:lpic(function(c){light(c,0)}),name:'Lighthouse',note:'shines one way'},{pic:lpic(function(c){ship(c,0,0)}),name:'Ship',note:'waiting for light'},{pic:lpic(function(c){ship(c,1,0)}),name:'Lit ship',note:'yellow sails'},
  {pic:lpic(function(c){rock(c,3)}),name:'Rock',note:'blocks the beam'},{pic:lpic(function(c){mirror(c,0,'mine')}),name:'Your mirror',note:'tap to flip or remove'},{pic:lpic(function(c){mirror(c,1,'fix')}),name:'Fixed mirror',note:'cannot change'},
  {pic:lpic(function(c){mirror(c,0,'rot')}),name:'Bolted mirror',note:'tap to turn only'},{pic:lpic(function(c){mirror(c,0,'split')}),name:'Half-mirror',note:'beam goes through and bounces'}],
 tips:['Follow the moving dashes: they show which way the light runs.','From chapter four there are two lighthouses.','Night watch is an endless run of fresh puzzles.']});GK.online.mount(B,{game:'lamplight',boards:[{key:'stars',m:'stars',ic:'star'},{key:'watch',m:'watch',ic:'moon'},{daily:{}}]});
addEventListener('resize',fit);addEventListener('orientationchange',fit);
save();paint();load(MODE,MODE==='voyage'?curLevel():0);if(MODE==='watch')G.streak=0;GK.loop(step,render);tut.maybe();
window.__g={tut:tut,G:function(){return G},prog:PROG,st:ST,load:load,levelDef:levelDef,par:par,solve:solve,trace:trace,
  stats:function(){return{m:G.m,i:G.i,w:G.L.w,h:G.L.h,K:G.L.K,par:G.L.par,left:G.left,won:G.won,solved:ST.solved,stars:ST.stars}}};
})();
