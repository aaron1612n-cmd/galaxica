/* Sounding: survey a reef. Each sounding shows how many hazards lie next to it; buoy the hazards, sound the rest.
   Every chart is generated so a logical surveyor can finish it from the first opening without a single guess. */
(function(){
GK.id('sounding');
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
var CHART='#f7f5ee',SHOAL='#cde3e6',NAVY='#1f2a33',MAG='#c0267c',TAU=Math.PI*2;
var CS=40,PAD=16,HUD=100,T=0;
Object.assign(GK.ico,{buoy:'<path d="M11 3v12M7 19h8M11 3l6 3-6 3"/><circle cx="11" cy="17" r="2"/>',wreck:'<ellipse cx="11" cy="11" rx="9" ry="5" stroke-dasharray="2 2"/><path d="M4 11h14M8 8v6M11 8v6M14 8v6"/>',compass:'<circle cx="11" cy="11" r="8"/><path d="M11 2l2 9-2 9-2-9z"/>',hexgrid:'<path d="M6 4l5-2 5 2v5l-5 2-5-2zM11 11l5 2v5l-5 2-5-2v-5"/>',chart:'<path d="M3 4h16v14H3z"/><path d="M5 14c3-4 6 2 9-2 2-2 3-1 4 0"/>'});

/* ---------- boards ---------- */
function mkBoard(w,h,hex){var n=w*h,NB=[];for(var i=0;i<n;i++){var x=i%w,y=i/w|0,a=[];var off=hex?(y&1?[[0,-1],[1,-1],[-1,0],[1,0],[0,1],[1,1]]:[[-1,-1],[0,-1],[-1,0],[1,0],[-1,1],[0,1]]):[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    off.forEach(function(o){var nx=x+o[0],ny=y+o[1];if(nx>=0&&ny>=0&&nx<w&&ny<h)a.push(ny*w+nx)});NB.push(a)}return{w:w,h:h,hex:hex,n:n,NB:NB}}
/* what a careful surveyor can prove from what is showing: {safe:[],mine:[]} */
function deduce(B,rev,flag,mines){var safe={},mine={},cons=[],byCell={};
  for(var i=0;i<B.n;i++){if(!rev[i]||B.N[i]===0)continue;var U=[],f=0;B.NB[i].forEach(function(j){if(flag[j])f++;else if(!rev[j])U.push(j)});if(!U.length)continue;var need=B.N[i]-f;
    if(need===0)U.forEach(function(j){safe[j]=1});else if(need===U.length)U.forEach(function(j){mine[j]=1});var c={U:U,need:need};cons.push(c);U.forEach(function(j){(byCell[j]=byCell[j]||[]).push(c)})}
  if(Object.keys(safe).length||Object.keys(mine).length)return out();
  /* subset rule */ for(var a=0;a<cons.length;a++){var c1=cons[a],seen=[];c1.U.forEach(function(j){byCell[j].forEach(function(c2){if(c2!==c1&&seen.indexOf(c2)<0)seen.push(c2)})});
    for(var b=0;b<seen.length;b++){var c2=seen[b];if(c1.U.length>=c2.U.length)continue;if(!c1.U.every(function(j){return c2.U.indexOf(j)>=0}))continue;var rest=c2.U.filter(function(j){return c1.U.indexOf(j)<0}),d=c2.need-c1.need;
      if(d===0)rest.forEach(function(j){safe[j]=1});else if(d===rest.length)rest.forEach(function(j){mine[j]=1})}}
  if(Object.keys(safe).length||Object.keys(mine).length)return out();
  /* enumerate small frontier pockets */ var cells=Object.keys(byCell).map(Number),comp={},cid=0;
  cells.forEach(function(s){if(comp[s]!=null)return;var q=[s];comp[s]=cid;while(q.length){var x=q.pop();byCell[x].forEach(function(c){c.U.forEach(function(y){if(comp[y]==null){comp[y]=cid;q.push(y)}})})}cid++});
  var left=mines;for(var k=0;k<B.n;k++)if(flag[k])left--;var unknown=0;for(var u=0;u<B.n;u++)if(!rev[u]&&!flag[u])unknown++;
  for(var g=0;g<cid;g++){var cs=cells.filter(function(x){return comp[x]===g});if(cs.length>22)continue;var cc=cons.filter(function(c){return comp[c.U[0]]===g}),as={},cnt={},sols=0,budget=200000;
    cs.forEach(function(x){cnt[x]=0});
    (function bt(i){if(--budget<0)return;if(i===cs.length){for(var q=0;q<cc.length;q++){var s=0;for(var z=0;z<cc[q].U.length;z++)s+=as[cc[q].U[z]];if(s!==cc[q].need)return}var tot=0;for(var w2 in as)tot+=as[w2];if(tot>left)return;sols++;cs.forEach(function(x){cnt[x]+=as[x]});return}
      for(var v=0;v<2;v++){as[cs[i]]=v;var ok=true;for(var q2=0;q2<cc.length&&ok;q2++){var c=cc[q2],sm=0,open=0;for(var z2=0;z2<c.U.length;z2++){var y=c.U[z2];if(as[y]==null||cs.indexOf(y)>i)open++;else sm+=as[y]}if(sm>c.need||sm+open<c.need)ok=false}if(ok)bt(i+1)}delete as[cs[i]]})(0);
    if(budget<0||!sols)continue;cs.forEach(function(x){if(cnt[x]===0)safe[x]=1;else if(cnt[x]===sols)mine[x]=1})}
  if(Object.keys(safe).length||Object.keys(mine).length)return out();
  /* the mine count settles the rest */ if(left===0||left===unknown)for(var r=0;r<B.n;r++)if(!rev[r]&&!flag[r])(left===0?safe:mine)[r]=1;
  return out();function out(){return{safe:Object.keys(safe).map(Number),mine:Object.keys(mine).map(Number)}}}
function flood(B,rev,i,list){var q=[[i,0]];if(rev[i])return;rev[i]=1;list&&list.push([i,0]);while(q.length){var h=q.shift(),c=h[0];if(B.N[c]!==0)continue;B.NB[c].forEach(function(j){if(!rev[j]&&!B.M[j]){rev[j]=1;list&&list.push([j,h[1]+1]);q.push([j,h[1]+1])}})}}
function gen(seed,P){var R=GK.rng(seed),m=P.m;for(var tries=0;;tries++){if(tries&&tries%120===0&&m>3)m--;var B=mkBoard(P.w,P.h,P.hex),M=new Uint8Array(B.n),st=(P.h>>1)*P.w+(P.w>>1),ban={};ban[st]=1;B.NB[st].forEach(function(j){ban[j]=1});
    var placed=0;while(placed<m){var c=Math.floor(R()*B.n);if(M[c]||ban[c])continue;M[c]=1;placed++}B.M=M;B.m=m;B.N=new Uint8Array(B.n);for(var i=0;i<B.n;i++)B.N[i]=B.NB[i].reduce(function(s,j){return s+M[j]},0);B.start=st;
    if(provable(B))return B}}
function provable(B){var rev=new Uint8Array(B.n),flag=new Uint8Array(B.n),safeLeft=B.n-B.m;flood(B,rev,B.start);for(var it=0;it<4000;it++){var cnt=0;for(var i=0;i<B.n;i++)if(rev[i])cnt++;if(cnt===safeLeft)return true;var d=deduce(B,rev,flag,B.m);if(!d.safe.length&&!d.mine.length)return false;d.mine.forEach(function(j){flag[j]=1});d.safe.forEach(function(j){flood(B,rev,j)})}return false}

/* ---------- campaign + state ---------- */
function params(n){var c=Math.min(4,n>>3),f=(n%8)/7;return[{w:7,h:9,m:8+Math.round(f*3),hex:0},{w:9,h:12,m:15+Math.round(f*4),hex:0},{w:8,h:11,m:13+Math.round(f*4),hex:1},{w:10,h:14,m:23+Math.round(f*5),hex:0},{w:10,h:15,m:26+Math.round(f*7),hex:1}][c]}
var SIZES=[{w:8,h:10,m:12,hex:0},{w:10,h:14,m:26,hex:0},{w:10,h:16,m:36,hex:1}];
var PROG=GK.ls.get('prog',{}),ST=GK.ls.get('st',{charts:0,cells:0,buoys:0,fast:0,free:0,daily:0,hex:0}),MODE=GK.ls.get('mode','survey'),SIZE=GK.ls.get('size',1);
function save(){ST.charts=Object.keys(PROG).length;GK.ls.set('prog',PROG);GK.ls.set('st',ST)}
var cache={},G=null;
function boardFor(m,i){var k=m+':'+i;if(cache[k])return cache[k];var B=m==='survey'?gen(5000+i*977,params(i)):m==='free'?gen((Date.now()%1e7)+i,SIZES[SIZE]):gen(GK.daily.seed()*17+3,SIZES[1]);cache[k]=B;return B}
function load(m,i){var B=boardFor(m,i);G={m:m,i:i,B:B,rev:new Uint8Array(B.n),flag:new Uint8Array(B.n),revT:new Float32Array(B.n),st:'play',t:0,pings:[],end:0,mark:false,hit:-1};var l=[];flood(B,G.rev,B.start,l);l.forEach(function(p){G.revT[p[0]]=p[1]*2});ping(B.start);bot.t=0;fit()}
function curChart(){var i=0;while(PROG['s'+i]&&i<39)i++;return i}
function left(){var f=0;for(var i=0;i<G.B.n;i++)if(G.flag[i])f++;return G.B.m-f}

/* ---------- moves ---------- */
function sound(i){if(G.st!=='play'||i<0||G.flag[i])return;var B=G.B;
  if(G.rev[i]){/* chord on a settled sounding */ var f=0;B.NB[i].forEach(function(j){if(G.flag[j])f++});if(f!==B.N[i]||!B.N[i])return;B.NB[i].forEach(function(j){if(!G.rev[j]&&!G.flag[j])open(j)});ping(i);return}
  open(i);ping(i)}
function open(i){var B=G.B;if(G.rev[i]||G.st!=='play')return;if(B.M[i]){G.hit=i;G.st='lost';G.end=0;GK.fx.shake(8,16);sfx('aground');return}var l=[];flood(B,G.rev,i,l);l.forEach(function(p){G.revT[p[0]]=G.t+p[1]*2.2});ST.cells+=l.length;sfx('sound',l.length);checkWin()}
function mark(i){if(G.st!=='play'||i<0||G.rev[i])return;G.flag[i]^=1;if(G.flag[i])ST.buoys++;sfx('buoy');ping(i,1)}
function checkWin(){var B=G.B,c=0;for(var i=0;i<B.n;i++)if(G.rev[i])c++;if(c<B.n-B.m)return;G.st='won';G.end=0;for(var j=0;j<B.n;j++)if(B.M[j])G.flag[j]=1;var sec=Math.round(G.t/60);sfx('done');
  if(G.m==='survey'){var k='s'+G.i;PROG[k]=PROG[k]?Math.min(PROG[k],sec):sec;if(B.hex)ST.hex++}else if(G.m==='free')ST.free++;else if(G.m==='daily')ST.daily=GK.daily.claim(1e4-sec).n;if(sec<60)ST.fast=Math.max(ST.fast,1);save()}
function ping(i,small){var p=center(i);G.pings.push({x:p.x,y:p.y,t:0,s:small?1:0})}

/* ---------- geometry ---------- */
function hexR(){return CS/Math.sqrt(3)}
function dims(B){if(B.hex){var r=hexR();return{w:(B.w+.5)*CS,h:(B.h-1)*1.5*r+2*r}}return{w:B.w*CS,h:B.h*CS}}
function center(i){var B=G.B,x=i%B.w,y=i/B.w|0;if(B.hex){var r=hexR();return{x:PAD+x*CS+(y&1?CS/2:0)+CS/2,y:HUD+r+y*1.5*r}}return{x:PAD+x*CS+CS/2,y:HUD+y*CS+CS/2}}
function cellAt(px,py){var B=G.B,best=-1,bd=1e9;if(!B.hex){var x=Math.floor((px-PAD)/CS),y=Math.floor((py-HUD)/CS);return x<0||y<0||x>=B.w||y>=B.h?-1:y*B.w+x}
  var r=hexR(),gy=Math.round((py-HUD-r)/(1.5*r));for(var y2=gy-1;y2<=gy+1;y2++){if(y2<0||y2>=B.h)continue;for(var x2=0;x2<B.w;x2++){var c=center(y2*B.w+x2),d=(c.x-px)*(c.x-px)+(c.y-py)*(c.y-py);if(d<bd){bd=d;best=y2*B.w+x2}}}return bd<r*r?best:-1}
function fit(){if(!G)return;var d=dims(G.B);GK.fit(cv,stage,d.w+PAD*2,d.h+HUD+PAD,1.6)}

/* ---------- input: tap to sound, hold (or right-click, or the buoy key) to mark ---------- */
var press=null,mk=document.getElementById('mk');mk.onclick=function(){if(G){G.mark=!G.mark;mk.classList.toggle('on',G.mark)}};
GK.pointer(cv,{down:function(x,y){if(!G)return;if(G.st!=='play'){if(G.end>50)after();return}press={i:cellAt(x,y),t:performance.now(),x:x,y:y,done:false}},
  move:function(x,y,e,dn){if(press&&dn&&Math.abs(x-press.x)+Math.abs(y-press.y)>14)press=null},
  up:function(){if(!press||!G)return;var p=press;press=null;if(p.done)return;if(G.mark)mark(p.i);else sound(p.i)}});
cv.addEventListener('contextmenu',function(e){e.preventDefault();if(!G||G.st!=='play')return;var r=cv.getBoundingClientRect();mark(cellAt((e.clientX-r.left)*GK.view.W/r.width,(e.clientY-r.top)*GK.view.H/r.height));press=null});
function holdCheck(){if(press&&!press.done&&performance.now()-press.t>380){press.done=true;if(G.mark)sound(press.i);else mark(press.i);if(navigator.vibrate)try{navigator.vibrate(12)}catch(e){}}}

/* ---------- AUTO: the same surveyor that proved the chart ---------- */
var bot={t:0,plan:null};
function botTick(){if(G.st!=='play'){if(G.end>100)after();return}if(++bot.t<7)return;bot.t=0;var d=deduce(G.B,G.rev,G.flag,G.B.m);
  if(d.safe.length){var s=d.safe[0];sound(s);return}if(d.mine.length){mark(d.mine[0]);return}
  var c=[];for(var i=0;i<G.B.n;i++)if(!G.rev[i]&&!G.flag[i])c.push(i);if(c.length)sound(c[Math.floor(Math.random()*c.length)])}
function after(){if(G.m==='survey'){if(G.st==='won')load('survey',Math.min(39,G.i+1));else load('survey',G.i)}else if(G.m==='free')load('free',G.i+1);else load('daily',0)}

/* ---------- tick ---------- */
function step(){T++;GK.goals.tick();tut.tick();if(!G)return;holdCheck();if(G.st==='play')G.t++;else G.end++;for(var i=G.pings.length-1;i>=0;i--)if(++G.pings[i].t>40)G.pings.splice(i,1);if(Auto.on&&!tut.active)botTick()}

/* ---------- drawing ---------- */
function hexPath(c,x,y,r){c.beginPath();for(var k=0;k<6;k++){var a=Math.PI/6+k*Math.PI/3;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath()}
function cellPath(c,i,shrink){var p=center(i);if(G.B.hex)hexPath(c,p.x,p.y,hexR()-(shrink||0));else{c.beginPath();c.rect(p.x-CS/2+(shrink||0),p.y-CS/2+(shrink||0),CS-2*(shrink||0),CS-2*(shrink||0))}}
function render(){var v=GK.view,c=ctx;c.setTransform(v.dpr*v.s,0,0,v.dpr*v.s,0,0);var Wd=v.W,Hd=v.H;c.fillStyle=CHART;c.fillRect(0,0,Wd,Hd);if(!G)return;var B=G.B,so=GK.fx.offset();c.save();c.translate(so.x,so.y);
  var d=dims(B);c.strokeStyle=NAVY;c.lineWidth=1.5;c.strokeRect(PAD-6,HUD-6,d.w+12,d.h+12);c.lineWidth=.8;c.strokeRect(PAD-10,HUD-10,d.w+20,d.h+20);
  /* graduated neat line, like a chart border */ for(var gx=0;gx<d.w+20;gx+=10){c.fillStyle=(gx/10)%2?NAVY:CHART;c.fillRect(PAD-10+gx,HUD-10,Math.min(10,d.w+20-gx),4)}
  for(var i=0;i<B.n;i++){var p=center(i),shown=G.rev[i]&&G.revT[i]<=G.t,lost=G.st==='lost';
    if(shown){cellPath(c,i);c.fillStyle=B.N[i]?SHOAL:CHART;c.fill();if(B.N[i]){c.fillStyle=NAVY;c.font='italic 700 '+Math.round(CS*.5)+'px "Libre Caslon Text",serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(B.N[i]),p.x,p.y+1)}}
    else{cellPath(c,i);c.fillStyle=CHART;c.fill();c.save();cellPath(c,i);c.clip();c.strokeStyle='rgba(31,42,51,.28)';c.lineWidth=1;c.beginPath();for(var hx=-CS;hx<CS;hx+=6){c.moveTo(p.x+hx,p.y-CS/2-2);c.lineTo(p.x+hx+CS,p.y+CS/2+2)}c.stroke();c.restore();
      if(G.flag[i])buoy(c,p.x,p.y,G.st==='lost'&&!B.M[i]);else if(lost&&B.M[i])wreck(c,p.x,p.y,i===G.hit)}
    c.strokeStyle='rgba(31,42,51,.35)';c.lineWidth=.7;cellPath(c,i);c.stroke()}
  /* depth contour where surveyed meets unsurveyed (square charts) */ if(!B.hex){c.strokeStyle=NAVY;c.lineWidth=2;c.beginPath();for(var j=0;j<B.n;j++){if(!(G.rev[j]&&G.revT[j]<=G.t))continue;var x=j%B.w,y=j/B.w|0,X=PAD+x*CS,Y=HUD+y*CS;var un=function(a,b){return a<0||b<0||a>=B.w||b>=B.h||!(G.rev[b*B.w+a]&&G.revT[b*B.w+a]<=G.t)};
      if(un(x,y-1)){c.moveTo(X,Y);c.lineTo(X+CS,Y)}if(un(x,y+1)){c.moveTo(X,Y+CS);c.lineTo(X+CS,Y+CS)}if(un(x-1,y)){c.moveTo(X,Y);c.lineTo(X,Y+CS)}if(un(x+1,y)){c.moveTo(X+CS,Y);c.lineTo(X+CS,Y+CS)}}c.stroke()}
  G.pings.forEach(function(pg){c.strokeStyle=MAG;c.globalAlpha=1-pg.t/40;c.lineWidth=pg.s?1.5:2.5;c.beginPath();c.arc(pg.x,pg.y,pg.t*(pg.s?.8:3.2),0,TAU);c.stroke();c.globalAlpha=1});
  if(press&&!press.done&&press.i>=0){var pp=center(press.i),fr=Math.min(1,(performance.now()-press.t)/380);c.strokeStyle=MAG;c.lineWidth=3;c.beginPath();c.arc(pp.x,pp.y,CS*.42,-Math.PI/2,-Math.PI/2+fr*TAU);c.stroke()}
  GK.fx.draw(c);c.restore();drawHud(c,Wd);if(G.st!=='play'&&G.end>30)drawEnd(c,Wd,Hd);if(tut.active)tutDraw(c)}
function buoy(c,x,y,wrong){c.strokeStyle=wrong?NAVY:MAG;c.fillStyle=wrong?NAVY:MAG;c.lineWidth=2;c.beginPath();c.moveTo(x,y+9);c.lineTo(x,y-11);c.stroke();c.beginPath();c.moveTo(x,y-11);c.lineTo(x+9,y-7);c.lineTo(x,y-3);c.fill();c.beginPath();c.arc(x,y+9,4,0,TAU);c.fill();if(wrong){c.beginPath();c.moveTo(x-9,y-9);c.lineTo(x+9,y+9);c.stroke()}}
function wreck(c,x,y,hit){if(hit){c.fillStyle=MAG;c.beginPath();c.ellipse(x,y,CS*.42,CS*.28,0,0,TAU);c.fill()}c.strokeStyle=hit?CHART:NAVY;c.lineWidth=1.6;c.setLineDash([2,2.5]);c.beginPath();c.ellipse(x,y,CS*.38,CS*.22,0,0,TAU);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(x-CS*.3,y);c.lineTo(x+CS*.3,y);for(var k=-1;k<=1;k++){c.moveTo(x+k*CS*.13,y-5);c.lineTo(x+k*CS*.13,y+5)}c.stroke()}
function drawHud(c,Wd){c.fillStyle=NAVY;c.textBaseline='middle';c.font='italic 700 30px "Libre Caslon Text",serif';c.textAlign='left';var lab=G.m==='survey'?String(G.i+1):G.m==='tut'?'':'';
  if(G.m==='free')GK.icoDraw(c,'infinity',PAD+12,34,22,NAVY,1.6);if(G.m==='daily')GK.icoDraw(c,'sun',PAD+12,34,22,MAG,1.6);c.fillText(lab,PAD,36);
  GK.icoDraw(c,'buoy',Wd/2-28,34,22,MAG,1.7);c.font='italic 700 24px "Libre Caslon Text",serif';c.fillText(String(left()),Wd/2-12,36);
  var s=Math.floor(G.t/60);c.textAlign='right';c.fillText(Math.floor(s/60)+':'+String(s%60).padStart(2,'0'),Wd-PAD,36);
  /* compass rose, chart furniture */ c.save();c.translate(Wd-PAD-96,34);c.rotate(T*.002);c.strokeStyle=MAG;c.lineWidth=1.2;c.beginPath();c.arc(0,0,11,0,TAU);c.stroke();c.fillStyle=MAG;c.beginPath();c.moveTo(0,-15);c.lineTo(3,0);c.lineTo(0,15);c.lineTo(-3,0);c.fill();c.restore()}
function drawEnd(c,Wd,Hd){var won=G.st==='won',sc=Math.max(1,1.8-(G.end-30)*.08);c.save();c.translate(Wd/2,Hd/2);c.scale(sc,sc);c.rotate(-.08);c.strokeStyle=won?MAG:NAVY;c.lineWidth=4;c.beginPath();c.arc(0,0,58,0,TAU);c.stroke();c.lineWidth=1.5;c.beginPath();c.arc(0,0,50,0,TAU);c.stroke();
  GK.icoDraw(c,won?'anchor':'wreck',0,won?-8:-6,won?44:52,won?MAG:NAVY,2);if(won){c.fillStyle=MAG;c.font='italic 700 18px "Libre Caslon Text",serif';c.textAlign='center';c.textBaseline='middle';var s=Math.round(G.t/60);c.fillText(Math.floor(s/60)+':'+String(s%60).padStart(2,'0'),0,30)}c.restore();
  if(G.end>50)GK.pulse(c,Wd/2,Hd/2+92,G.end,MAG,9)}

/* ---------- menus ---------- */
function openCharts(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);
  sh.innerHTML='<div class="gk-mh"><span style="display:flex;gap:10px;align-items:center">'+GK.icoSvg('chart')+ST.charts+' / 40</span></div>';var g=document.createElement('div');g.className='charts';
  for(var i=0;i<40;i++){(function(i){var b=document.createElement('button'),t=PROG['s'+i],p=params(i);b.className='ch'+(t?' done':'')+(G&&G.m==='survey'&&G.i===i?' cur':'');b.disabled=i>0&&!PROG['s'+(i-1)]&&!t;
    b.innerHTML=(i+1)+(p.hex?GK.icoSvg('hexgrid'):'')+'<small>'+(t?Math.floor(t/60)+':'+String(t%60).padStart(2,'0'):'')+'</small>';b.onclick=function(){MODE='survey';GK.ls.set('mode',MODE);paint();load('survey',i);m.remove()};g.appendChild(b)})(i)}
  sh.appendChild(g);var x=document.createElement('button');x.className='gk-b';x.textContent='×';x.style.alignSelf='flex-end';x.onclick=function(){m.remove()};sh.insertBefore(x,sh.firstChild);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m)}
function openSizes(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);var row=document.createElement('div');row.className='sizes';
  SIZES.forEach(function(sz,i){var b=document.createElement('button');b.title=['Small','Medium','Large'][i];b.innerHTML=GK.icoSvg(sz.hex?'hexgrid':'grid')+'<span>'+sz.w+'×'+sz.h+'</span><span>'+GK.icoSvg('buoy').replace('<svg','<svg width="16" height="16"')+sz.m+'</span>';b.onclick=function(){SIZE=i;GK.ls.set('size',i);MODE='free';GK.ls.set('mode',MODE);paint();cache={};load('free',0);m.remove()};row.appendChild(b)});
  sh.appendChild(row);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m)}
GK.ico.grid=GK.ico.grid||'<path d="M3 3h16v16H3zM3 9h16M3 15h16M9 3v16M15 3v16"/>';

/* ---------- sound ---------- */
function sfx(k,n){var A=GK.audio,t=A.ctx&&A.ctx.currentTime;if(!A.ctx)return;if(k==='sound'){A.tone(1320,.5,'sine',.035,.92);if(n>6)A.tone(990,.6,'sine',.02,.95,t+.06)}else if(k==='buoy')A.tone(700,.08,'triangle',.04,1.4);
  else if(k==='aground'){A.noise(.8,.12,0,0);A.tone(70,.9,'sawtooth',.05,.6)}else if(k==='done')[659,784,988,1319].forEach(function(f,i){A.tone(f,.4,'sine',.04,1,t+i*.1)})}

/* ---------- tutorial: sound a proven cell, buoy a proven hazard, finish ---------- */
var tut=GK.tutorial({parent:stage,onStart:function(){var B=gen(77,{w:6,h:7,m:5,hex:0});G={m:'tut',i:0,B:B,rev:new Uint8Array(B.n),flag:new Uint8Array(B.n),revT:new Float32Array(B.n),st:'play',t:0,pings:[],end:0,mark:false,hit:-1};flood(B,G.rev,B.start);fit()},
  onEnd:function(){load(MODE,MODE==='survey'?curChart():0)},steps:[
  {init:function(){tutF.p=prog()},done:function(){return G&&prog()>tutF.p}},
  {init:function(){tutF.p=prog()},done:function(){return G&&prog()>tutF.p}},
  {done:function(){return G&&G.st!=='play'&&G.end>40}}]});
var tutF={};function prog(){var c=0;for(var i=0;i<G.B.n;i++)if(G.rev[i]||G.flag[i]&&G.B.M[i])c++;return c}
function tutDraw(c){if(!G||G.st!=='play')return;var d=deduce(G.B,G.rev,G.flag,G.B.m),i=d.safe[0],hold=false;if(i==null){i=d.mine[0];hold=true}if(i==null||i<0)return;var p=center(i);
  if(hold){var fr=(tut.t%70)/50;c.strokeStyle=MAG;c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,CS*.42,-Math.PI/2,-Math.PI/2+Math.min(1,fr)*TAU);c.stroke();c.fillStyle=MAG;c.beginPath();c.arc(p.x,p.y,5,0,TAU);c.fill()}else GK.pulse(c,p.x,p.y,tut.t,MAG,10)}

/* ---------- bar ---------- */
var B=GK.controls(document.getElementById('bar'),{bar:'left',onHelp:function(){tut.start()},extra:[
  {id:'ch',html:GK.icoSvg('chart'),title:'Charts',fn:openCharts},
  {id:'rs',html:GK.icon('restart'),title:'Restart',fn:function(){if(G&&!tut.active)load(G.m,G.i)}},
  {id:'m_survey',cls:'md',html:GK.icoSvg('compass'),title:'Survey',fn:function(){setMode('survey')}},
  {id:'m_free',cls:'md',html:GK.icoSvg('infinity'),title:'Free charts',fn:function(){openSizes()}},
  {id:'m_daily',cls:'md',html:GK.icoSvg('sun'),title:'Daily chart',fn:function(){setMode('daily')}}]});
['m_survey','m_free','m_daily'].forEach(function(id){B.panel.insertBefore(B[id],B.panel.firstChild)});
function setMode(m){if(tut.active)return;MODE=m;GK.ls.set('mode',m);paint();load(m,m==='survey'?curChart():0)}
function paint(){['survey','free','daily'].forEach(function(k){B['m_'+k].classList.toggle('on',MODE===k)})}
GK.goals.setup({metrics:function(){return ST},defs:{charts:{ic:'chart',t:[1,8,16,24,40]},cells:{ic:'compass',t:[500,5000,20000,100000]},buoys:{ic:'buoy',t:[50,500,2000]},hex:{ic:'hexgrid',t:[1,8,16]},free:{ic:'infinity',t:[5,25,100]},daily:{ic:'sun',t:[1,3,7,14,30]},fast:{ic:'clock',t:[1]}}});
GK.goals.mount(B);
addEventListener('resize',fit);addEventListener('orientationchange',fit);
save();paint();load(MODE,MODE==='survey'?curChart():0);GK.loop(step,render);tut.maybe();
window.__g={tut:tut,G:function(){return G},boardFor:boardFor,deduce:deduce,provable:provable,load:load,prog:PROG,st:ST,
  stats:function(){var r=0;for(var i=0;i<G.B.n;i++)if(G.rev[i])r++;return{m:G.m,i:G.i,st:G.st,w:G.B.w,h:G.B.h,hex:G.B.hex,mines:G.B.m,rev:r+'/'+(G.B.n-G.B.m),charts:ST.charts,t:Math.round(G.t/60)}}};
})();
