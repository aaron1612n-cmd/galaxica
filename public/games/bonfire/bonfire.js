/* Bonfire: survive the night in the woods until dawn. Weapons fire on their own; you walk, gather embers and choose.
   Papercut look: pine-black ground, bone-paper silhouettes, ember is the only colour. */
(function(){
GK.id('bonfire');
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
var BONE='#e7dcc4',EMB='#ff6a1f',NIGHT='#10140f',MID='#1c2319',MID2='#262f23',TAU=Math.PI*2;
var Z=1,VW=600,VH=600,T=0,mode='camp',modeT=0;
function sq(x){return x*x}
function rint(n){return(Math.random()*n)|0}

/* ---------- pictograms (added to the kit's set) ---------- */
Object.assign(GK.ico,{
 darts:'<path d="M4 18L15 7"/><path d="M10 7.5l5-.5-.5 5"/><path d="M15 7c1.5-1.5 2.5-3 4-4-.5 2-1.5 3.5-3 5"/>',
 scythe:'<path d="M6 20L13 4"/><path d="M13 4c4 0 7 3 7 7-3-3-6-4-9-3"/>',
 lantern:'<path d="M8 6h6M9 6V4h4v2M7 7h8l-1 11H8zM8 18h6"/><path d="M11 10c1.2 1.2 1.2 3.2 0 4.4-1.2-1.2-1.2-3.2 0-4.4z"/>',
 axe:'<path d="M7 20L15 5"/><path d="M12.5 4.5c3-2 7 0 8 3-3 0-5 1-6.5 3.2"/>',
 bell:'<path d="M6 16c0-6 1-10 5-10s5 4 5 10zM4 16h14M11 3v3M9 18a2 2 0 0 0 4 0"/>',
 torch:'<path d="M9 21l1-10h2l1 10z"/><path d="M11 3c2 2 3 3 3 5a3 3 0 0 1-6 0c0-1 1-2 1-3 1 1 1 2 2 2 0-2-1-3 0-4z"/>',
 sickle:'<path d="M15 3a8 8 0 1 0 3.5 13A6 6 0 0 1 15 3zM7 17l-3 3"/>',
 owl:'<path d="M6 8L4 4l4 2a6 6 0 0 1 6 0l4-2-2 4c1 2 1 7-5 11C5 15 5 10 6 8z"/><circle cx="9" cy="10" r="1.6"/><circle cx="13" cy="10" r="1.6"/>',
 boot:'<path d="M7 3h5v9l6 3v4H5V12z"/>',
 plus:'<path d="M11 4v14M4 11h14"/>',
 magnet:'<path d="M5 4v7a6 6 0 0 0 12 0V4h-4v7a2 2 0 0 1-4 0V4zM5 7h4M13 7h4"/>',
 clover:'<circle cx="8" cy="8" r="3"/><circle cx="14" cy="8" r="3"/><circle cx="8" cy="14" r="3"/><circle cx="14" cy="14" r="3"/><path d="M13 13l5 7"/>',
 echo:'<path d="M5 6v10M10 4v14M15 6v10M19 8v6"/>',
 reach:'<circle cx="11" cy="11" r="3"/><path d="M11 2v3M11 17v3M2 11h3M17 11h3M4.6 4.6l2 2M15.4 15.4l2 2M4.6 17.4l2-2M15.4 6.6l2-2"/>',
 tent:'<path d="M2 19L11 4l9 15zM11 4v15M8 19l3-6 3 6"/>',
 grave:'<path d="M6 20V9a5 5 0 0 1 10 0v11zM4 20h14M11 10v6M9 12h4"/>',
 bread:'<path d="M4 12c0-4 3-6 7-6s7 2 7 6v6H4z"/><path d="M8 9l1 3M12 8l1 3M15 9l1 3"/>',
 x:'<path d="M5 5l12 12M17 5L5 17"/>',
 skip:'<path d="M4 11h12M12 6l5 5-5 5M19 5v12"/>',
 fire:'<path d="M11 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 2 1 3 2 3 0-3-1-5 1-8z"/><path d="M4 20h14"/>',
 chest:'<path d="M3 9h16v10H3zM3 9a8 5 0 0 1 16 0M3 13h16"/><path d="M10 12h2v3h-2z"/>',
 flask:'<path d="M9 3h4M10 3v5l-5 9a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-5-9V3M7 14h8"/>'});

/* ---------- data ---------- */
var WD={
 darts:{ic:'darts',nm:'Ember Darts',pair:'echo',b:{d:10,cd:50,n:1,a:1,p:1},up:[{n:1},{d:5},{n:1},{p:1},{n:1},{d:5},{cd:-12}]},
 scythe:{ic:'scythe',nm:'Scythe Ring',pair:'reach',b:{d:9,cd:150,n:2,a:1,dur:200},up:[{n:1},{d:4},{dur:60},{n:1},{d:4},{a:.15},{n:1}]},
 lantern:{ic:'lantern',nm:'Lantern',pair:'heart',b:{d:5,cd:24,n:0,a:1},up:[{a:.2},{d:3},{a:.2},{cd:-4},{d:3},{a:.2},{d:4}]},
 axe:{ic:'axe',nm:'Hand Axe',pair:'might',b:{d:22,cd:72,n:1,a:1,p:3},up:[{n:1},{d:10},{p:2},{n:1},{d:10},{a:.2},{n:1}]},
 thunder:{ic:'bolt',nm:'Thunder',pair:'luck',b:{d:28,cd:120,n:1,a:1},up:[{n:1},{d:12},{cd:-15},{n:1},{d:12},{a:.3},{n:1}]},
 bell:{ic:'bell',nm:'Bell',pair:'armor',b:{d:14,cd:160,n:1,a:1},up:[{d:6},{a:.15},{cd:-20},{d:6},{n:1},{a:.15},{d:8}]},
 bees:{ic:'bee',nm:'Bees',pair:'growth',b:{d:5,cd:170,n:3,a:1},up:[{n:1},{d:2},{n:2},{cd:-25},{d:3},{n:2},{d:3}]},
 torch:{ic:'torch',nm:'Torch',pair:'boots',b:{d:6,cd:130,n:1,a:1,dur:150},up:[{n:1},{d:3},{a:.2},{dur:60},{n:1},{d:3},{a:.2}]},
 sickle:{ic:'sickle',nm:'Sickle',pair:'haste',b:{d:15,cd:85,n:1,a:1},up:[{d:6},{n:1},{a:.15},{d:6},{n:1},{cd:-15},{d:8}]},
 owl:{ic:'owl',nm:'Owl',pair:'magnet',b:{d:32,cd:95,n:1,a:1},up:[{d:12},{cd:-12},{n:1},{d:12},{a:.3},{cd:-12},{n:1}]}};
var EVN={darts:'Comet Darts',scythe:"Reaper's Wheel",lantern:'Hearth Lantern',axe:"Woodsman's Fury",thunder:'Storm Crown',bell:'Cathedral',bees:'Hive Queen',torch:'Wildfire',sickle:'Moon Sickle',owl:'Parliament'};
var CH={might:{ic:'sword',nm:'Might',max:5},haste:{ic:'clock',nm:'Haste',max:5},reach:{ic:'reach',nm:'Reach',max:5},boots:{ic:'boot',nm:'Boots',max:5},
 heart:{ic:'heart',nm:'Heart',max:5},mend:{ic:'plus',nm:'Mend',max:5},magnet:{ic:'magnet',nm:'Magnet',max:5},luck:{ic:'clover',nm:'Luck',max:5},
 echo:{ic:'echo',nm:'Echo',max:2},growth:{ic:'leaf',nm:'Growth',max:5},armor:{ic:'shield',nm:'Armor',max:5},greed:{ic:'coin',nm:'Greed',max:5}};
var HEROES=[
 {id:'wood',nm:'Woodcutter',w:'axe',hat:0,bon:{heart:1},cost:0},
 {id:'tink',nm:'Tinker',w:'darts',hat:8,bon:{haste:1},cost:0},
 {id:'lamp',nm:'Lamplighter',w:'lantern',hat:1,bon:{reach:1},cost:150},
 {id:'bee',nm:'Beekeeper',w:'bees',hat:2,bon:{growth:1},cost:300},
 {id:'shep',nm:'Shepherd',w:'sickle',hat:3,bon:{boots:1},cost:500},
 {id:'witch',nm:'Hedge Witch',w:'thunder',hat:4,bon:{luck:1},cost:800},
 {id:'falc',nm:'Falconer',w:'owl',hat:5,bon:{magnet:1},cost:1100},
 {id:'ring',nm:'Bellringer',w:'bell',hat:6,bon:{armor:1},cost:1500},
 {id:'fire',nm:'Firekeeper',w:'torch',hat:7,bon:{might:1},cost:2000},
 {id:'reap',nm:'Reaper',w:'scythe',hat:9,bon:{might:1},cost:0,win:1}];
var STAGES=[{id:'pine',nm:'Pinewood',ic:'tree',bg:'#10140f',lr:200},{id:'marsh',nm:'Marsh',ic:'drop',bg:'#0d1311',lr:165,need:'pine'},{id:'barrow',nm:'Barrow',ic:'grave',bg:'#14110e',lr:185,need:'marsh'}];
var MODES=[{id:'run',ic:'flag',nm:'Night'},{id:'hurry',ic:'clock',nm:'Hurry'},{id:'endless',ic:'infinity',nm:'Endless'},{id:'daily',ic:'sun',nm:'Daily'}];
var MU={might:{max:5,c:80,ic:'sword',nm:'Might'},haste:{max:5,c:90,ic:'clock',nm:'Haste'},reach:{max:5,c:70,ic:'reach',nm:'Reach'},boots:{max:5,c:60,ic:'boot',nm:'Boots'},heart:{max:5,c:70,ic:'heart',nm:'Heart'},mend:{max:5,c:80,ic:'plus',nm:'Mend'},
 magnet:{max:5,c:50,ic:'magnet',nm:'Magnet'},luck:{max:5,c:90,ic:'clover',nm:'Luck'},growth:{max:5,c:100,ic:'leaf',nm:'Growth'},armor:{max:3,c:120,ic:'shield',nm:'Armor'},greed:{max:5,c:100,ic:'coin',nm:'Greed'},
 reroll:{max:5,c:120,ic:'dice',nm:'Reroll'},banish:{max:5,c:120,ic:'x',nm:'Banish'},revive:{max:2,c:600,ic:'egg',nm:'Revive'}};
function mcost(k){var l=META.up[k]||0;return l>=MU[k].max?0:Math.round(MU[k].c*[1,2.2,4.5,8,14][l])}
var ET={
 bat:{r:7,hp:4,sp:1.3,dm:5,xp:1,kb:1},hob:{r:9,hp:10,sp:.8,dm:6,xp:1,kb:1},wolf:{r:11,hp:20,sp:1,dm:8,xp:2,kb:.8},ghoul:{r:12,hp:42,sp:.6,dm:10,xp:2,kb:.6},
 wisp:{r:8,hp:16,sp:.75,dm:6,xp:2,kb:1},shroom:{r:10,hp:24,sp:.62,dm:7,xp:1,kb:.9},spore:{r:6,hp:6,sp:1,dm:4,xp:1,kb:1},crow:{r:7,hp:8,sp:2.4,dm:6,xp:1,kb:0},
 treant:{r:20,hp:170,sp:.42,dm:18,xp:8,kb:.15},witch:{r:11,hp:70,sp:.65,dm:10,xp:5,kb:.5},frog:{r:10,hp:22,sp:.9,dm:7,xp:1,kb:.8},ghost:{r:10,hp:16,sp:.85,dm:7,xp:1,kb:1},
 skel:{r:10,hp:30,sp:.72,dm:8,xp:2,kb:.7},stag:{r:34,hp:3000,sp:.9,dm:26,xp:60,kb:0,boss:1},hag:{r:28,hp:7000,sp:.8,dm:22,xp:120,kb:0,boss:1},erl:{r:46,hp:20000,sp:.7,dm:34,xp:300,kb:0,boss:1}};
var ROSTER={
 pine:[[0,{bat:6,hob:3}],[1,{bat:4,hob:5,wolf:1}],[3,{hob:4,wolf:3,shroom:2,bat:2}],[5,{wolf:3,ghoul:3,shroom:2,wisp:1}],[7,{ghoul:4,wisp:2,treant:1,wolf:2}],[10,{ghoul:3,treant:2,witch:1,wisp:2,wolf:2}],[12,{treant:3,witch:2,ghoul:3,wisp:2}]],
 marsh:[[0,{frog:5,bat:3}],[1,{frog:4,wisp:2,hob:2}],[3,{frog:3,wisp:3,shroom:3}],[5,{ghoul:3,wisp:3,frog:3,witch:1}],[8,{treant:2,witch:2,wisp:3,ghoul:2}],[11,{treant:3,witch:2,ghoul:3,frog:2}]],
 barrow:[[0,{skel:4,bat:4}],[1,{skel:4,ghost:3}],[3,{skel:3,ghost:3,ghoul:2}],[5,{ghost:3,ghoul:3,witch:1,skel:3}],[8,{treant:1,witch:2,ghost:3,skel:3}],[11,{treant:2,witch:3,ghoul:3,ghost:3}]]};
var RINGT={pine:'ghoul',marsh:'frog',barrow:'skel'},LINET={pine:'crow',marsh:'crow',barrow:'ghost'};

/* ---------- save ---------- */
var META=GK.ls.get('meta',null)||{gold:0,up:{},heroes:['wood','tink'],stages:['pine'],best:{},hero:'wood',stage:'pine',mode:'run',seen:{}};
META.up=META.up||{};META.best=META.best||{};META.seen=META.seen||{};
var ST=GK.ls.get('st',{kills:0,lvl:0,mins:0,wins:0,evos:0,bosses:0,gold:0,runs:0,heroes:2,stages:1,daily:0,endless:0,maxk:0});
function save(){GK.ls.set('meta',META);ST.heroes=META.heroes.length;ST.stages=META.stages.length;GK.ls.set('st',ST)}

/* ---------- run state ---------- */
var G=null,S={},EN=[],SH=[],EO=[],GEM=[],DR=[],PT=[],FXB=[],HERO=HEROES[0],STG=STAGES[0],eid=0;
function need(l){return Math.floor(5+l*10+l*l*.9)}
function newRun(o){o=o||{};var m=o.mode||META.mode,daily=m==='daily',ds=GK.daily.seed();
  HERO=daily?HEROES[ds%HEROES.length]:HEROES.filter(function(h){return h.id===META.hero})[0]||HEROES[0];
  STG=daily?STAGES[(ds>>3)%3]:STAGES.filter(function(s){return s.id===META.stage})[0]||STAGES[0];
  G={t:0,mode:m,rng:GK.rng(daily?ds*31+7:(Math.random()*1e9)|0),h:{x:0,y:40,hp:100,max:100,inv:0,fx:1,fy:0,walk:0,dead:0},lvl:1,xp:0,next:need(1),pending:0,
    w:[],ch:{},kills:0,gold:0,spAcc:0,ev:{},boss:null,cycle:0,ban:{},rer:META.up.reroll||0,banN:META.up.banish||0,rev:META.up.revive||0,won:0,deadT:0,eliteT:0,picks:0,tut:!!o.tut,cam:{x:0,y:40},flash:0};
  EN=[];SH=[];EO=[];GEM=[];DR=[];PT=[];FXB=[];GK.fx.clear();
  addWeapon(HERO.w);calcStats();G.h.hp=G.h.max;mode='play';modeT=0;hideAll()}
function calcStats(){var c=G.ch,m=META.up,hb=HERO.bon,lv=function(k){return(c[k]||0)+(hb[k]||0)};var old=G.h.max;
  S={might:1+lv('might')*.1+(m.might||0)*.05,haste:Math.max(.4,1-lv('haste')*.07-(m.haste||0)*.03),area:1+lv('reach')*.1+(m.reach||0)*.05,speed:1+lv('boots')*.1+(m.boots||0)*.05,
    maxhp:100*(1+lv('heart')*.2+(m.heart||0)*.1),regen:(lv('mend')*.25+(m.mend||0)*.1)/60,magnet:42*(1+lv('magnet')*.35+(m.magnet||0)*.15),luck:1+lv('luck')*.1+(m.luck||0)*.05,
    amount:lv('echo'),growth:1+lv('growth')*.1+(m.growth||0)*.05,armor:lv('armor')+(m.armor||0),greed:1+lv('greed')*.15+(m.greed||0)*.1};
  G.h.max=S.maxhp;G.h.hp=Math.min(G.h.max,G.h.hp+Math.max(0,G.h.max-old));G.w.forEach(wstat)}
function wstat(w){var d=WD[w.id],s=Object.assign({},d.b);for(var i=0;i<w.lv-1;i++){var u=d.up[i];for(var k in u)s[k]=(s[k]||0)+u[k]}
  if(w.evo){s.d*=1.5;s.n+=2;s.a*=1.2;if(w.id==='scythe')s.dur=1e9;if(w.id==='sickle')s.cd*=.7}w.s=s;return s}
function addWeapon(id){var w={id:id,lv:1,c:30,dealt:0,on:0,evo:0,owls:[]};G.w.push(w);wstat(w);return w}
function hasW(id){for(var i=0;i<G.w.length;i++)if(G.w[i].id===id)return G.w[i];return null}
function dmin(){return G.t/3600*(G.mode==='hurry'?2:1)}

/* ---------- spatial grid ---------- */
var CELL=48,grid=new Map();
function gk(cx,cy){return(cx+20000)*40000+(cy+20000)}
function gridBuild(){grid.clear();for(var i=0;i<EN.length;i++){var e=EN[i];if(e.dead)continue;var k=gk(Math.floor(e.x/CELL),Math.floor(e.y/CELL)),a=grid.get(k);if(!a){a=[];grid.set(k,a)}a.push(e)}}
function query(x,y,r,fn){var x0=Math.floor((x-r)/CELL),x1=Math.floor((x+r)/CELL),y0=Math.floor((y-r)/CELL),y1=Math.floor((y+r)/CELL);
  for(var cx=x0;cx<=x1;cx++)for(var cy=y0;cy<=y1;cy++){var a=grid.get(gk(cx,cy));if(a)for(var i=0;i<a.length;i++)if(!a[i].dead)fn(a[i])}}

/* ---------- enemies ---------- */
function hpMul(){var m=dmin()%15;return(1+m*.24+Math.max(0,m-6)*.45)*(1+G.cycle*1.6)}
function spawn(t,x,y,el){var d=ET[t],h=G.h;if(x==null){var a=G.rng()*TAU,r=Math.sqrt(VW*VW+VH*VH)/2/1+30;x=h.x+Math.cos(a)*r;y=h.y+Math.sin(a)*r}
  var mul=d.boss?(1+G.cycle):hpMul(),e={id:++eid,t:t,d:d,x:x,y:y,hp:d.hp*mul*(el?12:1),max:0,r:d.r*(el?1.5:1),sp:d.sp*(el?.9:1)*(d.boss?1:1+Math.min(14,dmin()%15)*.025),dm:d.dm*(el?1.5:1)*(1+G.cycle*.5)*(d.boss?1:1+Math.min(14,dmin()%15)*.06),el:el?1:0,fl:0,kx:0,ky:0,slow:0,frz:0,s:0,cd:60+rint(120),ph:Math.random()*TAU,vx:0,vy:0,face:1};
  e.max=e.hp;if(t==='crow'||t==='ghost'&&LINET[STG.id]==='ghost'){e.vx=(h.x-x);e.vy=(h.y-y)}EN.push(e);if(d.boss){G.boss=e;sfx('boss')}return e}
function pickType(m){var ro=ROSTER[STG.id],row=ro[0][1];for(var i=0;i<ro.length;i++)if(m>=ro[i][0])row=ro[i][1];var tot=0,k;for(k in row)tot+=row[k];var r=G.rng()*tot;for(k in row){r-=row[k];if(r<=0)return k}return'bat'}
function director(){if(G.tut)return;var m=dmin(),mm=m%15,cyc=Math.floor(m/15);
  if(G.mode!=='endless'&&m>=15){if(!G.ev.erl){G.ev.erl=1;spawn('erl')}}
  else{G.spAcc+=(2+mm*1.6+mm*mm*.08+cyc*6)*(G.mode==='hurry'?1.25:1)/60;var cap=Math.min(400,30+mm*28+cyc*60)|0;while(G.spAcc>=1){G.spAcc--;if(EN.length<cap)spawn(pickType(mm))}}
  function once(key,at,fn){var k=key+cyc;if(mm>=at&&!G.ev[k]){G.ev[k]=1;fn()}}
  [2,6,9,13].forEach(function(at){once('l'+at,at,lineEvent)});[4,8,12].forEach(function(at){once('r'+at,at,ringEvent)});
  once('b5',5,function(){spawn('stag')});once('b10',10,function(){spawn('hag')});if(G.mode==='endless')once('b15',14.99,function(){spawn('erl')});
  G.eliteT++;if(G.eliteT>(G.mode==='hurry'?2100:4200)){G.eliteT=0;spawn(pickType(mm),null,null,1)}
  if(G.t%7200===3600)drop('flask',G.h.x+(Math.random()-.5)*300,G.h.y+(Math.random()-.5)*300)}
function lineEvent(){var t=LINET[STG.id],h=G.h,a=G.rng()*TAU,r=Math.max(VW,VH)*.7,cx=h.x+Math.cos(a)*r,cy=h.y+Math.sin(a)*r,px=-Math.sin(a),py=Math.cos(a);
  for(var i=-9;i<=9;i++){var e=spawn(t,cx+px*i*22,cy+py*i*22);e.vx=-Math.cos(a);e.vy=-Math.sin(a);e.line=1}}
function ringEvent(){var t=RINGT[STG.id],h=G.h,R=Math.max(VW,VH)*.62;for(var i=0;i<36;i++){var a=i/36*TAU;spawn(t,h.x+Math.cos(a)*R,h.y+Math.sin(a)*R)}}
function moveEnemies(){var h=G.h,lim=Math.sqrt(VW*VW+VH*VH)*.75+80;
  for(var i=0;i<EN.length;i++){var e=EN[i];if(e.dead)continue;var dx=h.x-e.x,dy=h.y-e.y,d=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/d,uy=dy/d,sp=e.sp*(e.slow>0?.5:1)*(e.frz>0?0:1),mx=ux*sp,my=uy*sp;
    e.ph+=.15;if(e.fl>0)e.fl--;if(e.slow>0)e.slow--;if(e.frz>0)e.frz--;e.cd--;
    switch(e.t){
     case'bat':mx+=-uy*Math.sin(e.ph*.6)*.9;my+=ux*Math.sin(e.ph*.6)*.9;break;
     case'wolf':if(e.s>0){e.s--;mx=e.vx*2.8;my=e.vy*2.8}else if(d<150&&e.cd<=0){e.s=36;e.vx=ux;e.vy=uy;e.cd=200}break;
     case'wisp':if(d<130){mx=-ux*sp;my=-uy*sp}else if(d<175){mx=-uy*sp*.6;my=ux*sp*.6}if(e.cd<=0&&d<320){e.cd=160;eshot(e.x,e.y,ux*1.8,uy*1.8)}break;
     case'crow':case'ghost':if(e.line){var l=Math.sqrt(e.vx*e.vx+e.vy*e.vy)||1;mx=e.vx/l*e.sp;my=e.vy/l*e.sp}break;
     case'frog':var hp2=(e.ph*6.6|0)%50;if(hp2<16){mx=ux*2.4;my=uy*2.4}else{mx=0;my=0}break;
     case'witch':if(e.cd<=0&&d<320){e.cd=260;for(var k=0;k<3;k++)spawn('bat',e.x+(Math.random()-.5)*40,e.y+(Math.random()-.5)*40)}break;
     case'stag':bossStag(e,ux,uy,d);mx=e.mx;my=e.my;break;
     case'hag':bossHag(e,ux,uy,d);mx=e.mx;my=e.my;break;
     case'erl':bossErl(e,ux,uy,d);mx=e.mx;my=e.my;break}
    if(e.frz>0){mx=0;my=0}
    e.x+=mx+e.kx;e.y+=my+e.ky;e.kx*=.82;e.ky*=.82;if(Math.abs(mx)>.05)e.face=mx>0?1:-1;
    /* fell too far behind: step back in ahead of the walker */
    if(d>lim&&!e.d.boss){if(e.line){e.dead=1;e.gone=1}else{var a=Math.atan2(h.fy||0,h.fx||1)+(Math.random()-.5)*1.6,r=lim*.8;e.x=h.x+Math.cos(a)*r;e.y=h.y+Math.sin(a)*r}}}}
function bossStag(e,ux,uy,d){e.s++;if(e.st==='aim'){e.mx=0;e.my=0;if(e.s>40){e.st='ch';e.s=0}}else if(e.st==='ch'){e.mx=e.vx*5.2;e.my=e.vy*5.2;if(e.s>50){e.st='';e.s=0}}
  else{e.mx=ux*e.sp;e.my=uy*e.sp;if(e.s>170&&d<460){e.st='aim';e.s=0;e.vx=ux;e.vy=uy;sfx('horn')}}}
function bossHag(e,ux,uy,d){e.s++;var sp=e.sp;e.mx=d>260?ux*sp:d<180?-ux*sp:-uy*sp*.7;e.my=d>260?uy*sp:d<180?-uy*sp:ux*sp*.7;
  if(e.s%170===0)for(var k=0;k<14;k++){var a=k/14*TAU+e.s*.01;eshot(e.x,e.y,Math.cos(a)*1.9,Math.sin(a)*1.9)}
  if(e.s%320===0)for(var j=0;j<5;j++)spawn('bat',e.x+(Math.random()-.5)*60,e.y+(Math.random()-.5)*60);
  if(d<90&&e.cd<=0){e.cd=120;GK.fx.burst(e.x,e.y,24,{col:BONE,speed:4,life:24});var a2=Math.random()*TAU;e.x=G.h.x+Math.cos(a2)*240;e.y=G.h.y+Math.sin(a2)*240;GK.fx.burst(e.x,e.y,24,{col:BONE,speed:4,life:24})}}
function bossErl(e,ux,uy,d){e.s++;var c=e.s%600;e.mx=ux*e.sp;e.my=uy*e.sp;
  if(c<180){if(c%5===0){var a=e.s*.5;eshot(e.x,e.y,Math.cos(a)*2,Math.sin(a)*2)}}
  else if(c===200)for(var k=0;k<6;k++)spawn('wolf',e.x+Math.cos(k)*60,e.y+Math.sin(k)*60);
  else if(c>=300&&c<420){var q=(c-300)%40;if(q<12){e.mx=0;e.my=0;if(q===0){e.vx=ux;e.vy=uy}}else{e.mx=e.vx*5;e.my=e.vy*5}}
  else if(c>=420&&c%40===0)for(var f=-2;f<=2;f++){var b=Math.atan2(uy,ux)+f*.22;eshot(e.x,e.y,Math.cos(b)*2.4,Math.sin(b)*2.4)}}
function separate(){grid.forEach(function(a){for(var i=0;i<a.length;i++){var e=a[i];for(var j=i+1;j<a.length;j++){var f=a[j],dx=f.x-e.x,dy=f.y-e.y,rr=e.r+f.r,d2=dx*dx+dy*dy;
  if(d2<rr*rr&&d2>.01){var d=Math.sqrt(d2),o=(rr-d)/d*.25,we=e.d.boss?0:1,wf=f.d.boss?0:1;e.x-=dx*o*we;e.y-=dy*o*we;f.x+=dx*o*wf;f.y+=dy*o*wf}}}})}
function eshot(x,y,vx,vy){if(EO.length<260)EO.push({x:x,y:y,vx:vx,vy:vy,r:6,life:420})}

/* ---------- damage ---------- */
var hitSnd=0;
function hit(e,n,w,kx,ky,slow,frz){if(e.dead)return;var crit=G.rng()<(S.luck-1)*.5+.05;if(crit)n*=2;n=Math.max(1,Math.round(n));e.hp-=n;e.fl=5;if(w)w.dealt+=n;
  if(kx||ky){var k=e.d.kb*(e.el?.3:1);e.kx+=kx*k;e.ky+=ky*k}if(slow)e.slow=Math.max(e.slow,slow);if(frz&&!e.d.boss)e.frz=Math.max(e.frz,frz);
  if(crit||n>=40)GK.fx.text(e.x,e.y-e.r-4,n,crit?EMB:BONE,crit?17:13);
  if(hitSnd<=0){hitSnd=4;GK.audio.noise(.03,.025,0,2400)}
  if(e.hp<=0)kill(e,w)}
function kill(e,w){e.dead=1;G.kills++;var d=e.d;
  GK.fx.burst(e.x,e.y,d.boss?60:e.el?20:5,{col:e.el||d.boss?EMB:BONE,speed:d.boss?5:2.2,life:d.boss?50:18,size:d.boss?5:3});
  var xv=d.xp*(e.el?10:1);gem(e.x,e.y,xv);
  if(e.t==='shroom'&&!e.el)for(var k=0;k<2;k++)spawn('spore',e.x+(k?6:-6),e.y);
  var lk=S.luck;if(G.rng()<.004*lk)drop('bread',e.x,e.y);else if(G.rng()<.0015*lk)drop('magnet',e.x,e.y);else if(G.rng()<.001*lk)drop('flask',e.x,e.y);else if(G.rng()<.015*lk)drop('coin',e.x,e.y,1+rint(4));
  if(e.el)drop('chest',e.x,e.y);
  if(w&&w.evo&&w.id==='lantern'&&G.rng()<.12)G.h.hp=Math.min(G.h.max,G.h.hp+1);
  if(w&&w.evo&&w.id==='bees'&&SH.filter(function(s){return s.k==='bee'}).length<50)SH.push(bee(e.x,e.y,w));
  if(d.boss){G.boss=null;ST.bosses++;drop('chest',e.x,e.y);for(var c=0;c<12;c++)drop('coin',e.x+(Math.random()-.5)*80,e.y+(Math.random()-.5)*80,4);GK.fx.shake(10,24);GK.fx.hitstop(10);sfx('bossdie');
    if(e.t==='erl'){if(G.mode==='endless'){G.cycle++}else{G.won=1;mode='dawn';modeT=0}}}}
function gem(x,y,v){var k=v>=20?2:v>=5?1:0;if(GEM.length>520){var far=0,fd=0;for(var i=0;i<GEM.length;i++){var dd=sq(GEM[i].x-G.h.x)+sq(GEM[i].y-G.h.y);if(dd>fd){fd=dd;far=i}}GEM[far].v+=v;GEM[far].k=2;return}
  GEM.push({x:x,y:y,v:v,k:k,pull:0,sp:0})}
function drop(k,x,y,v){DR.push({k:k,x:x,y:y,v:v||0,t:0})}
function hurt(n){var h=G.h;if(h.inv>0||h.dead||G.tut&&h.hp<30)return;n=Math.max(1,n-S.armor);h.hp-=n;h.inv=24;GK.fx.shake(4,8);sfx('hurt');if(h.hp<=0){h.hp=0;die()}}
function die(){var h=G.h;if(G.rev>0){G.rev--;h.hp=h.max;h.inv=120;bomb();GK.fx.text(h.x,h.y-30,'+',EMB,40);return}h.dead=1;mode='dying';modeT=0;sfx('die')}
function bomb(){GK.fx.shake(8,18);G.flash=10;sfx('bomb');EN.forEach(function(e){if(e.dead)return;if(Math.abs(e.x-G.h.x)<VW/2+20&&Math.abs(e.y-G.h.y)<VH/2+20){if(e.d.boss)hit(e,e.max*.06,null);else kill(e,null)}})}

/* ---------- weapons ---------- */
function nearest(n,R){var h=G.h,a=[];query(h.x,h.y,R||420,function(e){a.push([sq(e.x-h.x)+sq(e.y-h.y),e])});a.sort(function(p,q){return p[0]-q[0]});return a.slice(0,n).map(function(p){return p[1]})}
function bee(x,y,w){return{k:'bee',x:x,y:y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:320,cd:0,tg:null,w:w,r:3}}
function fire(w){var s=w.s,h=G.h,n=s.n+S.amount,A=s.a*S.area,D=s.d*S.might;
  switch(w.id){
  case'darts':var ts=nearest(n);for(var i=0;i<n;i++){var t=ts[i%Math.max(1,ts.length)],an=t?Math.atan2(t.y-h.y,t.x-h.x):Math.atan2(h.fy,h.fx)+(i-n/2)*.3;
      SH.push({k:'dart',x:h.x,y:h.y,vx:Math.cos(an)*6,vy:Math.sin(an)*6,r:5*Math.sqrt(A),d:D,p:s.p,life:80,w:w,hits:{}})}sfx('dart');break;
  case'axe':for(var j=0;j<n;j++)SH.push({k:'axe',x:h.x,y:h.y-8,vx:(j-(n-1)/2)*1.4+h.fx*.8+(Math.random()-.5)*.4,vy:-7.2,r:11*A,d:D,p:s.p,life:110,w:w,hits:{},rot:0});sfx('axe');break;
  case'thunder':var vis=[];EN.forEach(function(e){if(!e.dead&&Math.abs(e.x-h.x)<VW/2&&Math.abs(e.y-h.y)<VH/2)vis.push(e)});
    for(var k=0;k<n&&vis.length;k++){var tg=vis.splice(rint(vis.length),1)[0];strike(tg.x,tg.y,34*A,D,w);if(w.evo){var ch=nearestTo(tg,2,160);ch.forEach(function(c){strike(c.x,c.y,26*A,D*.7,w)})}}if(n)sfx('thunder');break;
  case'bell':SH.push({k:'ring',x:h.x,y:h.y,r:0,R:150*A,d:D,hits:{},w:w,life:400});sfx('bell');break;
  case'bees':for(var b=0;b<n;b++)SH.push(bee(h.x,h.y,w));break;
  case'torch':var cand=nearest(12,240);for(var p=0;p<n;p++){var c2=cand.length?cand[rint(cand.length)]:null,px=c2?c2.x:h.x+(Math.random()-.5)*240,py=c2?c2.y:h.y+(Math.random()-.5)*240;PT.push({x:px,y:py,R:32*A*(w.evo?1.3:1),life:s.dur,tk:0,d:D,w:w})}sfx('torch');break;
  case'sickle':var base=Math.atan2(h.fy,h.fx);for(var q=0;q<n;q++){var an2=base+(q-(n-1)/2)*.35;SH.push({k:'sick',x:h.x,y:h.y,vx:Math.cos(an2)*7,vy:Math.sin(an2)*7,r:12*A,d:D,life:220,w:w,hm:{},back:0,rot:0})}sfx('axe');break}}
function nearestTo(e0,n,R){var a=[];query(e0.x,e0.y,R,function(e){if(e!==e0)a.push([sq(e.x-e0.x)+sq(e.y-e0.y),e])});a.sort(function(p,q){return p[0]-q[0]});return a.slice(0,n).map(function(p){return p[1]})}
function strike(x,y,R,D,w){FXB.push({x:x,y:y,life:12,seed:Math.random()});query(x,y,R+20,function(e){if(sq(e.x-x)+sq(e.y-y)<sq(R+e.r))hit(e,D,w)})}
function weapons(){var h=G.h;G.w.forEach(function(w){var s=w.s,A=s.a*S.area,D=s.d*S.might,n=s.n+S.amount;
  if(w.id==='scythe'){if(w.on>0||w.evo){w.on--;var R=(w.evo?80:64)*A,ang=G.t*.075;w.bl=[];for(var i=0;i<n;i++){var a=ang+i*TAU/n,bx=h.x+Math.cos(a)*R,by=h.y+Math.sin(a)*R,br=12*A;w.bl.push([bx,by,a]);
        query(bx,by,br+20,function(e){if(sq(e.x-bx)+sq(e.y-by)<sq(br+e.r)){var hk='s'+w.id;if(!e[hk]||e[hk]<G.t){e[hk]=G.t+18;hit(e,D,w,Math.cos(a)*3,Math.sin(a)*3)}}})}}
      else{w.bl=null;if(--w.c<=0){w.on=s.dur;w.c=s.cd*S.haste}}return}
  if(w.id==='lantern'){var LR=48*A*(w.evo?1.35:1);w.R=LR;if(--w.c<=0){w.c=s.cd*S.haste;query(h.x,h.y,LR+20,function(e){var dx=e.x-h.x,dy=e.y-h.y,dd=Math.sqrt(dx*dx+dy*dy)||1;if(dd<LR+e.r)hit(e,D,w,dx/dd*.6,dy/dd*.6)})}return}
  if(w.id==='owl'){while(w.owls.length<n)w.owls.push({st:0,x:h.x,y:h.y,a:Math.random()*TAU,tg:null});w.owls.length=n;
    var cdn=--w.c<=0;if(cdn)w.c=s.cd*S.haste;
    w.owls.forEach(function(o,i){if(o.st===0){o.a+=.03;var ox=h.x+Math.cos(o.a+i*TAU/n)*70,oy=h.y+Math.sin(o.a+i*TAU/n)*50-20;o.x+=(ox-o.x)*.15;o.y+=(oy-o.y)*.15;
        if(cdn){var best=null,bh=-1;query(h.x,h.y,280,function(e){if(e.hp>bh&&!e.owlT){bh=e.hp;best=e}});if(best){o.tg=best;best.owlT=1;o.st=1}}}
      else if(o.st===1){var t=o.tg;if(!t||t.dead){o.st=2;if(t)t.owlT=0;return}var dx=t.x-o.x,dy=t.y-o.y,dd=Math.sqrt(dx*dx+dy*dy);if(dd<8){var R2=28*A;query(t.x,t.y,R2+20,function(e){if(sq(e.x-t.x)+sq(e.y-t.y)<sq(R2+e.r))hit(e,D,w)});t.owlT=0;o.st=2;GK.fx.burst(o.x,o.y,8,{col:BONE,speed:2.5,life:16})}else{o.x+=dx/dd*6.5;o.y+=dy/dd*6.5}}
      else{var bx2=h.x-o.x,by2=h.y-20-o.y,bd=Math.sqrt(bx2*bx2+by2*by2);if(bd<20)o.st=0;else{o.x+=bx2/bd*5;o.y+=by2/bd*5}}});return}
  if(--w.c<=0){w.c=s.cd*S.haste;fire(w)}})}
function moveShots(){var h=G.h;for(var i=SH.length-1;i>=0;i--){var s=SH[i];s.life--;var gone=s.life<=0;
  if(s.k==='dart'||s.k==='axe'){if(s.k==='axe'){s.vy+=.24;s.rot+=.3}s.x+=s.vx;s.y+=s.vy;
    query(s.x,s.y,s.r+30,function(e){if(gone||s.hits[e.id])return;if(sq(e.x-s.x)+sq(e.y-s.y)<sq(s.r+e.r)){s.hits[e.id]=1;hit(e,s.d,s.w,s.vx*.4,s.vy*.4);
      if(s.w.evo&&s.k==='dart'){var R=40*S.area;query(s.x,s.y,R+20,function(f){if(f!==e&&sq(f.x-s.x)+sq(f.y-s.y)<sq(R+f.r))hit(f,s.d*.6,s.w)});GK.fx.burst(s.x,s.y,10,{col:EMB,speed:3,life:14})}
      if(--s.p<0)gone=true}})}
  else if(s.k==='sick'){s.rot+=.4;if(!s.back){s.vx*=.955;s.vy*=.955;if(s.vx*s.vx+s.vy*s.vy<.5)s.back=1}else{var dx=h.x-s.x,dy=h.y-s.y,dd=Math.sqrt(dx*dx+dy*dy)||1;s.vx+=dx/dd*.45;s.vy+=dy/dd*.45;var v=Math.sqrt(s.vx*s.vx+s.vy*s.vy);if(v>8){s.vx*=8/v;s.vy*=8/v}if(dd<14)gone=true}
    s.x+=s.vx;s.y+=s.vy;query(s.x,s.y,s.r+30,function(e){if(sq(e.x-s.x)+sq(e.y-s.y)<sq(s.r+e.r)&&(s.hm[e.id]||0)<G.t){s.hm[e.id]=G.t+14;hit(e,s.d,s.w,s.vx*.3,s.vy*.3)}})}
  else if(s.k==='ring'){s.r+=3.5;if(s.r>s.R)gone=true;query(s.x,s.y,s.r+30,function(e){if(s.hits[e.id])return;var dd=Math.sqrt(sq(e.x-s.x)+sq(e.y-s.y));if(Math.abs(dd-s.r)<e.r+8){s.hits[e.id]=1;var dx=(e.x-s.x)/(dd||1),dy=(e.y-s.y)/(dd||1);hit(e,s.d,s.w,dx*5,dy*5,s.w.evo?0:60,s.w.evo?70:0)}})}
  else if(s.k==='bee'){if(s.cd>0)s.cd--;if(!s.tg||s.tg.dead||G.t%12===0){var best=null,bd=1e9;query(s.x,s.y,240,function(e){var dd=sq(e.x-s.x)+sq(e.y-s.y);if(dd<bd){bd=dd;best=e}});s.tg=best}
    var tx=s.tg?s.tg.x:h.x+Math.cos(G.t*.05+i)*40,ty=s.tg?s.tg.y:h.y+Math.sin(G.t*.05+i)*40,dx2=tx-s.x,dy2=ty-s.y,d2=Math.sqrt(dx2*dx2+dy2*dy2)||1;
    s.vx+=dx2/d2*.5+(Math.random()-.5)*.6;s.vy+=dy2/d2*.5+(Math.random()-.5)*.6;var v2=Math.sqrt(s.vx*s.vx+s.vy*s.vy);if(v2>3.6){s.vx*=3.6/v2;s.vy*=3.6/v2}s.x+=s.vx;s.y+=s.vy;
    if(s.tg&&s.cd<=0&&d2<s.tg.r+6){s.cd=22;hit(s.tg,s.w.s.d*S.might,s.w)}}
  if(gone)SH.splice(i,1)}
  for(var j=PT.length-1;j>=0;j--){var p=PT[j];p.life--;if(p.w.evo&&G.t%3===0){var nt=null,nd=1e9;query(p.x,p.y,200,function(e){var dd=sq(e.x-p.x)+sq(e.y-p.y);if(dd<nd){nd=dd;nt=e}});if(nt){var dd3=Math.sqrt(nd)||1;p.x+=(nt.x-p.x)/dd3*1.8;p.y+=(nt.y-p.y)/dd3*1.8}}
    if(++p.tk%18===0)query(p.x,p.y,p.R+20,function(e){if(sq(e.x-p.x)+sq(e.y-p.y)<sq(p.R+e.r))hit(e,p.d,p.w)});if(p.life<=0)PT.splice(j,1)}
  for(var k=EO.length-1;k>=0;k--){var o=EO[k];o.x+=o.vx;o.y+=o.vy;if(--o.life<=0){EO.splice(k,1);continue}if(sq(o.x-h.x)+sq(o.y-h.y)<sq(o.r+8)){hurt(12*(1+G.cycle*.5));EO.splice(k,1)}}
  for(var f=FXB.length-1;f>=0;f--)if(--FXB[f].life<=0)FXB.splice(f,1)}

/* ---------- pickups ---------- */
var gemSnd=0,gemCombo=0;
function pickups(){var h=G.h,M2=S.magnet*S.magnet;
  for(var i=GEM.length-1;i>=0;i--){var g=GEM[i],dx=h.x-g.x,dy=h.y-g.y,d2=dx*dx+dy*dy;if(d2<M2)g.pull=1;
    if(g.pull){g.sp=Math.min(9,g.sp+.35);var d=Math.sqrt(d2)||1;g.x+=dx/d*g.sp;g.y+=dy/d*g.sp;if(d<12){GEM.splice(i,1);gain(g.v)}}}
  for(var j=DR.length-1;j>=0;j--){var p=DR[j];p.t++;var dd=sq(h.x-p.x)+sq(h.y-p.y),rr=p.k==='coin'?M2:sq(18);
    if(p.k==='coin'&&dd<M2){var d3=Math.sqrt(dd)||1;p.x+=(h.x-p.x)/d3*5;p.y+=(h.y-p.y)/d3*5}
    if(dd<(p.k==='coin'?144:sq(20))){DR.splice(j,1);take(p)}}
  if(gemSnd>0)gemSnd--;if(G.t%30===0)gemCombo=Math.max(0,gemCombo-2)}
function gain(v){G.xp+=v*S.growth;if(gemSnd<=0){gemSnd=3;gemCombo=Math.min(14,gemCombo+1);var P=[0,2,4,7,9];GK.audio.tone(523*Math.pow(2,(P[gemCombo%5]+12*Math.floor(gemCombo/5))/12),.06,'triangle',.022)}
  while(G.xp>=G.next){G.xp-=G.next;G.lvl++;G.next=G.tut?6:need(G.lvl);G.pending++}}
function take(p){var h=G.h;sfx('pick');if(p.k==='bread'){h.hp=Math.min(h.max,h.hp+30);GK.fx.text(h.x,h.y-26,'+30',EMB,18)}else if(p.k==='magnet'){GEM.forEach(function(g){g.pull=1})}
  else if(p.k==='flask')bomb();else if(p.k==='coin'){G.gold+=Math.round(p.v*S.greed)}else if(p.k==='chest'){openChest()}}

/* ---------- level up ---------- */
var pickEl=null,banishing=false;
function options(){var pool=[];G.w.forEach(function(w){if(w.lv<8)pool.push({k:'w',id:w.id,lv:w.lv+1,wt:10})});
  if(G.w.length<6)Object.keys(WD).forEach(function(id){if(!hasW(id)&&!G.ban[id])pool.push({k:'w',id:id,lv:1,wt:6})});
  var nch=Object.keys(G.ch).length;Object.keys(CH).forEach(function(id){var l=G.ch[id]||0;if(G.ban[id])return;if(l>0&&l<CH[id].max)pool.push({k:'c',id:id,lv:l+1,wt:8});else if(!l&&nch<6)pool.push({k:'c',id:id,lv:1,wt:5})});
  var n=S.luck>=1.3?4:3,out=[];while(out.length<n&&pool.length){var tot=0;pool.forEach(function(p){tot+=p.wt});var r=G.rng()*tot;for(var i=0;i<pool.length;i++){r-=pool[i].wt;if(r<=0){out.push(pool.splice(i,1)[0]);break}}}
  if(!out.length)out=[{k:'gold',id:'coin',lv:0},{k:'heal',id:'bread',lv:0}];return out}
function apply(o){if(o.k==='w'){var w=hasW(o.id);if(w){w.lv++;wstat(w)}else addWeapon(o.id)}else if(o.k==='c'){G.ch[o.id]=(G.ch[o.id]||0)+1;calcStats()}else if(o.k==='gold')G.gold+=25;else if(o.k==='heal')G.h.hp=Math.min(G.h.max,G.h.hp+40);G.picks++}
function icOf(o){return o.k==='w'?WD[o.id].ic:o.k==='c'?CH[o.id].ic:o.k==='gold'?'coin':'bread'}
function nmOf(o){return o.k==='w'?WD[o.id].nm:o.k==='c'?CH[o.id].nm:o.k==='gold'?'Gold':'Bread'}
function openPick(){mode='pick';modeT=0;banishing=false;sfx('lvl');var opts=options();G.opts=opts;
  if(!pickEl){pickEl=document.createElement('div');pickEl.id='pick';pickEl.className='ov';stage.appendChild(pickEl)}pickEl.hidden=false;pickEl.classList.remove('banish');
  pickEl.innerHTML='<div class="cards"></div><div class="tools"></div>';var cs=pickEl.querySelector('.cards');
  opts.forEach(function(o,i){var b=document.createElement('button');b.className='card tl';b.title=nmOf(o);var max=o.k==='w'?8:o.k==='c'?CH[o.id].max:0,pips='';for(var j=1;j<=max;j++)pips+='<i class="'+(j<o.lv?'on':j===o.lv?'nw':'')+'"></i>';
    var evoNext=o.k==='w'&&o.lv===8&&G.ch[WD[o.id].pair];b.innerHTML='<div class="tag">'+GK.icoSvg(icOf(o))+(max?'<div class="pips">'+pips+'</div>':'')+(o.lv===1?'<span class="bd">'+GK.icoSvg('star')+'</span>':evoNext?'<span class="bd">'+GK.icoSvg('crown')+'</span>':'')+'</div>';
    b.onclick=function(){choose(i)};cs.appendChild(b)});
  var tl=pickEl.querySelector('.tools');function tb(ic,n,ttl,fn){var b=document.createElement('button');b.className='tg tl';b.title=ttl;b.innerHTML=GK.icoSvg(ic)+(n!=null?'<span>'+n+'</span>':'');b.onclick=fn;tl.appendChild(b);return b}
  if(G.rer>0)tb('dice',G.rer,'Reroll',function(){G.rer--;openPick()});
  if(G.banN>0)tb('x',G.banN,'Banish',function(){banishing=!banishing;pickEl.classList.toggle('banish',banishing)});
  tb('skip',null,'Skip',function(){G.pending--;closePick()});
  if(G.tut){var c0=cs.firstChild;if(c0)c0.classList.add('hint')}}
function choose(i){var o=G.opts[i];if(!o)return;if(banishing&&G.banN>0){G.banN--;G.ban[o.id]=1;openPick();return}apply(o);G.pending--;closePick()}
function closePick(){if(pickEl)pickEl.hidden=true;mode='play';if(G.pending>0)openPick()}
/* chest: evolve if a pair is ready, else upgrade owned things */
var chestEl=null;
function openChest(){var got=[],ev=G.w.filter(function(w){return w.lv>=8&&!w.evo&&G.ch[WD[w.id].pair]})[0];
  if(ev){ev.evo=1;wstat(ev);ST.evos++;got.push({ic:WD[ev.id].ic,evo:1,nm:EVN[ev.id]})}
  else{var n=G.rng()<(S.luck-1)*1.5+.15?3:1;for(var i=0;i<n;i++){var c=[];G.w.forEach(function(w){if(w.lv<8)c.push({k:'w',id:w.id})});Object.keys(G.ch).forEach(function(id){if(G.ch[id]<CH[id].max)c.push({k:'c',id:id})});
      if(!c.length){G.gold+=25;got.push({ic:'coin',nm:'Gold'});continue}var o=c[Math.floor(G.rng()*c.length)];if(o.k==='w'){var w=hasW(o.id);w.lv++;wstat(w)}else{G.ch[o.id]++;calcStats()}got.push({ic:o.k==='w'?WD[o.id].ic:CH[o.id].ic,nm:o.k==='w'?WD[o.id].nm:CH[o.id].nm})}}
  mode='chest';modeT=0;sfx('chest');if(!chestEl){chestEl=document.createElement('div');chestEl.id='chest';chestEl.className='ov';stage.appendChild(chestEl);chestEl.onclick=function(){if(modeT>20)closeChest()}}
  chestEl.hidden=false;chestEl.innerHTML='<div class="got">'+got.map(function(g,i){return'<span class="'+(g.evo?'evo':'')+'" title="'+g.nm+'" style="animation-delay:'+(i*.18)+'s">'+GK.icoSvg(g.ic)+'</span>'}).join('')+'</div>'}
function closeChest(){chestEl.hidden=true;mode='play'}

/* ---------- input ---------- */
var stick=GK.stick(52),mouse=null;
GK.pointer(cv,{down:function(x,y,e){if(mode!=='play')return;if(e.pointerType==='mouse')mouse={x:x,y:y};else stick.down(x,y)},move:function(x,y,e,dn){if(!dn)return;if(mouse)mouse={x:x,y:y};else stick.move(x,y)},up:function(){mouse=null;stick.up()}});
function inputVec(){var K=GK.keys,x=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),y=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0);
  if(x||y){var l=Math.sqrt(x*x+y*y);return{x:x/l,y:y/l}}
  if(mouse){var v=GK.view,dx=mouse.x-v.w/2,dy=mouse.y-v.h/2,d=Math.sqrt(dx*dx+dy*dy);if(d<10)return{x:0,y:0};var m=Math.min(1,d/50);return{x:dx/d*m,y:dy/d*m}}
  var s=stick.vec();return{x:s.x,y:s.y}}

/* ---------- AUTO: a cautious walker ---------- */
var bot={px:0,py:0};
function botVec(){var h=G.h,sp=1.7*S.speed,th=[];query(h.x,h.y,280,function(e){th.push(e)});
  var tg=null,tv=-1;if(h.hp<h.max*.55)DR.forEach(function(p){if(p.k==='bread'){var v=1e6/(sq(p.x-h.x)+sq(p.y-h.y)+1);if(v>tv){tv=v;tg=p}}});
  if(!tg)DR.forEach(function(p){if(p.k==='chest'||p.k==='flask'&&th.length>40||p.k==='magnet'){var v=5e5/(sq(p.x-h.x)+sq(p.y-h.y)+1);if(v>tv){tv=v;tg=p}}});
  if(!tg){GEM.forEach(function(g){var d2=sq(g.x-h.x)+sq(g.y-h.y);if(d2<sq(380)){var v=(g.v+1)/(d2+400);if(v>tv){tv=v;tg=g}}})}
  var best=null,bs=-1e18;for(var k=0;k<=16;k++){var dx=k<16?Math.cos(k/16*TAU):0,dy=k<16?Math.sin(k/16*TAU):0,sc=0;
    for(var q=0;q<3;q++){var st=[8,20,34][q],wq=[1.6,1,.6][q],px=h.x+dx*sp*st,py=h.y+dy*sp*st;
      for(var i=0;i<th.length;i++){var e=th[i],ex=e.x,ey=e.y,ddx=px-ex,ddy=py-ey,dd=Math.sqrt(ddx*ddx+ddy*ddy)||1,mv=Math.min(dd,(e.s>0&&e.t==='wolf'?2.8:e.d.boss&&e.st==='ch'?5:e.sp)*st);
        if(e.d.boss&&e.st==='ch'){ex+=e.vx*5*st;ey+=e.vy*5*st}else{ex+=ddx/dd*mv;ey+=ddy/dd*mv}var dist=Math.sqrt(sq(px-ex)+sq(py-ey))-e.r-10;sc-=wq*(e.d.boss?4:1)*(e.dm+4)*60/sq(Math.max(3,dist))}
      for(var j=0;j<EO.length;j++){var o=EO[j],ox=o.x+o.vx*st,oy=o.y+o.vy*st,od=Math.sqrt(sq(px-ox)+sq(py-oy))-o.r-9;if(od<60)sc-=wq*900/sq(Math.max(2,od))}}
    if(tg){var d0=Math.sqrt(sq(tg.x-h.x)+sq(tg.y-h.y)),d1=Math.sqrt(sq(tg.x-h.x-dx*sp*20)+sq(tg.y-h.y-dy*sp*20));sc+=(d0-d1)*(tg.k==='bread'||tg.k==='chest'?1.2:.5)}
    if(k===16)sc-=2;sc+=(dx*bot.px+dy*bot.py)*.8;
    if(sc>bs){bs=sc;best=[dx,dy]}}
  bot.px=best[0];bot.py=best[1];return{x:best[0],y:best[1]}}
function botPick(){var best=0,bs=-1e9;G.opts.forEach(function(o,i){var s=0;
    if(o.k==='w'){var w=hasW(o.id);if(w){s=30+(8-w.lv)+(w.lv>=6&&G.ch[WD[o.id].pair]?20:0)}else s=G.w.length<4?26:9;if(['darts','lantern','scythe','axe','thunder','sickle'].indexOf(o.id)>=0)s+=4}
    else if(o.k==='c'){s={might:28,haste:26,echo:27,heart:20,armor:19,magnet:21,reach:18,growth:15,luck:11,boots:13,mend:12,greed:4}[o.id]||5;if(G.w.some(function(w){return WD[w.id].pair===o.id}))s+=14;if(G.ch[o.id])s+=4}else s=1;
    if(s>bs){bs=s;best=i}});return best}
function botShop(){var order=['might','heart','haste','armor','magnet','reach','growth','luck','boots','mend','greed','revive','reroll','banish'],bought=true;
  while(bought){bought=false;for(var i=0;i<order.length;i++){var k=order[i],c=mcost(k);if(c&&META.gold>=c){META.gold-=c;META.up[k]=(META.up[k]||0)+1;bought=true;break}}}
  HEROES.forEach(function(h){if(!h.win&&META.heroes.indexOf(h.id)<0&&h.cost&&META.gold>=h.cost){META.gold-=h.cost;META.heroes.push(h.id)}});save()}

/* ---------- tick ---------- */
function step(){T++;modeT++;GK.goals.tick();tut.tick();if(hitSnd>0)hitSnd--;
  if(mode==='camp'){if(Auto.on&&modeT>70&&!tut.active){botShop();newRun()}return}
  if(mode==='pick'){if(Auto.on&&modeT>18)choose(botPick());return}
  if(mode==='chest'){if(modeT>(Auto.on?50:240))closeChest();return}
  if(mode==='over'){if(Auto.on&&modeT>200){toCamp()}return}
  if(mode==='dying'){if(modeT>70)endRun();return}
  if(mode==='dawn'){if(modeT>200)endRun();return}
  if(mode!=='play')return;
  G.t++;var h=G.h,iv=Auto.on&&!G.tut?botVec():inputVec(),sp=1.7*S.speed;
  if(iv.x||iv.y){h.x+=iv.x*sp;h.y+=iv.y*sp;h.fx=iv.x;h.fy=iv.y;h.walk+=.25}
  if(h.inv>0)h.inv--;h.hp=Math.min(h.max,h.hp+S.regen);if(G.flash>0)G.flash--;
  director();gridBuild();if(G.t%2===0)separate();moveEnemies();weapons();moveShots();pickups();
  query(h.x,h.y,60,function(e){if(sq(e.x-h.x)+sq(e.y-h.y)<sq(e.r+9))hurt(e.dm)});
  if(G.t%30===0)EN=EN.filter(function(e){return!e.dead});else if(EN.length>420)EN=EN.filter(function(e){return!e.dead});
  G.cam.x+=(h.x-G.cam.x)*.2;G.cam.y+=(h.y-G.cam.y)*.2;
  if(G.pending>0&&mode==='play')openPick()}
function endRun(){var sec=Math.floor(G.t/60),mins=sec/60;mode='over';modeT=0;
  if(G.tut){toCamp();return}
  var earned=G.gold+Math.floor(G.kills/25)+Math.floor(mins*4);if(G.won)earned=Math.round(earned*1.5);earned=Math.round(earned*S.greed);META.gold+=earned;G.earned=earned;
  ST.kills+=G.kills;ST.lvl=Math.max(ST.lvl,G.lvl);ST.runs++;ST.gold+=earned;ST.maxk=Math.max(ST.maxk,G.kills);if(G.mode!=='endless'&&G.mode!=='hurry')ST.mins=Math.max(ST.mins,Math.min(15,Math.floor(mins)));
  if(G.mode==='endless')ST.endless=Math.max(ST.endless,Math.floor(mins));
  if(G.won){ST.wins++;if(META.heroes.indexOf('reap')<0)META.heroes.push('reap')}
  if(G.mode==='run'||G.mode==='hurry'){var eff=sec*(G.mode==='hurry'?2:1);META.best[STG.id]=Math.max(META.best[STG.id]||0,eff);STAGES.forEach(function(s){if(s.need&&(META.best[s.need]||0)>=600&&META.stages.indexOf(s.id)<0)META.stages.push(s.id)})}
  if(G.mode==='daily')ST.daily=GK.daily.claim(G.kills+sec).n;
  save();showOver()}

/* ---------- overlays ---------- */
var campEl=null,overEl=null;
function hideAll(){[campEl,overEl,pickEl,chestEl].forEach(function(e){if(e)e.hidden=true})}
function tag(ic,cls,title,fn,inner){var b=document.createElement('button');b.className='tg tl '+(cls||'');b.title=title;b.innerHTML=(ic?GK.icoSvg(ic):'')+(inner||'');b.onclick=fn;return b}
function toCamp(){hideAll();mode='camp';modeT=0;G=null;EN=[];SH=[];EO=[];GEM=[];DR=[];PT=[];GK.fx.clear();if(!campEl){campEl=document.createElement('div');campEl.id='camp';campEl.className='ov';stage.appendChild(campEl)}campEl.hidden=false;paintCamp()}
function paintCamp(){var c=campEl;c.innerHTML='';var gold=document.createElement('div');gold.className='gold';gold.innerHTML=GK.icoSvg('coin')+'<span>'+META.gold+'</span>';
  var hs=tag('house','','Hearth',openHearth);hs.style.marginLeft='auto';gold.appendChild(hs);c.appendChild(gold);
  var ro=document.createElement('div');ro.className='roster';HEROES.forEach(function(h){var own=META.heroes.indexOf(h.id)>=0;
    var b=tag(null,(META.hero===h.id?'on ':'')+(own?'':'lock'),h.nm,function(){if(own){META.hero=h.id;save();paintCamp()}else if(!h.win&&META.gold>=h.cost){META.gold-=h.cost;META.heroes.push(h.id);META.hero=h.id;save();sfx('chest');paintCamp()}});
    var pc=document.createElement('canvas');pc.width=80;pc.height=80;b.appendChild(pc);var x=pc.getContext('2d');x.scale(2,2);x.translate(20,24);drawHero(x,h.hat,1,0,1.25,own?NIGHT:'#17150f','cut');
    if(!own){var s=document.createElement('span');s.style.cssText='display:flex;align-items:center;gap:4px';s.innerHTML=GK.icoSvg(h.win?'sun':'coin')+(h.win?'':h.cost);b.appendChild(s)}else{var s2=document.createElement('span');s2.innerHTML=GK.icoSvg(WD[h.w].ic);b.appendChild(s2)}ro.appendChild(b)});c.appendChild(ro);
  var side=document.createElement('div');side.className='side';var r1=document.createElement('div');r1.className='row';STAGES.forEach(function(s){var own=META.stages.indexOf(s.id)>=0;r1.appendChild(tag(own?s.ic:'lock',(META.stage===s.id?'on ':'')+(own?'':'lock'),s.nm,function(){if(own){META.stage=s.id;save();paintCamp()}},own?'':'<span>10</span>'))});
  var r2=document.createElement('div');r2.className='row';MODES.forEach(function(m){r2.appendChild(tag(m.ic,META.mode===m.id?'on':'',m.nm,function(){META.mode=m.id;save();paintCamp()}))});
  var go=tag('fire','go','Light',function(){newRun()});side.append(r1,r2,go);c.appendChild(side)}
function openHearth(){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';
  function paint(){sh.innerHTML='';var hd=document.createElement('div');hd.className='gk-mh';hd.innerHTML='<span style="display:flex;gap:8px;align-items:center">'+GK.icoSvg('coin')+META.gold+'</span>';var x=document.createElement('button');x.className='gk-b';x.textContent='×';x.onclick=function(){m.remove();paintCamp()};hd.appendChild(x);sh.appendChild(hd);
    var g=document.createElement('div');g.className='hearth';Object.keys(MU).forEach(function(k){var l=META.up[k]||0,c=mcost(k),b=document.createElement('button');b.title=MU[k].nm;b.className=c?'':'max';b.disabled=!c||META.gold<c;
      var pp='';for(var i=0;i<MU[k].max;i++)pp+='<i class="'+(i<l?'on':'')+'"></i>';b.innerHTML=GK.icoSvg(MU[k].ic)+'<div class="pp">'+pp+'</div><div class="c">'+GK.icoSvg('coin')+c+'</div>';
      b.onclick=function(){if(c&&META.gold>=c){META.gold-=c;META.up[k]=l+1;save();sfx('chest');paint()}};g.appendChild(b)});sh.appendChild(g)}
  paint();m.appendChild(sh);m.onpointerdown=function(e){if(e.target===m){m.remove();paintCamp()}};document.body.appendChild(m)}
function showOver(){if(!overEl){overEl=document.createElement('div');overEl.id='over';overEl.className='ov';stage.appendChild(overEl)}overEl.hidden=false;overEl.classList.toggle('dawn',!!G.won);
  var sec=Math.floor(G.t/60),mx=Math.max.apply(null,G.w.map(function(w){return w.dealt}).concat([1]));
  var html='<div class="sheet"><div class="big">'+GK.icoSvg(G.won?'sun':'moon')+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')+'</div>'+
    '<span title="Level">'+GK.icoSvg('up')+'</span><span class="v">'+G.lvl+'</span><span title="Kills">'+GK.icoSvg('skull')+'</span><span class="v">'+G.kills+'</span><span title="Gold">'+GK.icoSvg('coin')+'</span><span class="v">+'+G.earned+'</span>';
  G.w.forEach(function(w){html+='<span title="'+(w.evo?EVN[w.id]:WD[w.id].nm)+'" style="color:'+(w.evo?'var(--ember)':'inherit')+'">'+GK.icoSvg(WD[w.id].ic)+'</span><div class="bar"><i style="width:'+Math.round(w.dealt/mx*100)+'%"></i></div>'});
  html+='<div class="acts"></div></div>';overEl.innerHTML=html;var a=overEl.querySelector('.acts');a.appendChild(tag('restart','','Again',function(){newRun({mode:G.mode})}));a.appendChild(tag('tent','','Camp',toCamp));
  a.firstChild.innerHTML='<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+'<path d="M4.5 11a6.5 6.5 0 1 0 2.2-4.9"/><path d="M4 3.5v4.2h4.2"/>'+'</svg>'}

/* ---------- drawing ---------- */
function hash(x,y){var v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v)}
function poly(c,a,r,sx){sx=sx||1;c.moveTo(a[0]*r*sx,a[1]*r);for(var i=2;i<a.length;i+=2)c.lineTo(a[i]*r*sx,a[i+1]*r);c.closePath()}
function holes(c,pts,r,rr,sx){sx=sx||1;pts.forEach(function(p){c.moveTo(p[0]*r*sx+rr*r,p[1]*r);c.arc(p[0]*r*sx,p[1]*r,rr*r,0,TAU)})}
var HOLE='#10140f',FLIP={wolf:1,ghoul:1,crow:1,stag:1,hag:1};
function drawHero(c,hat,face,walk,sc,col,hole){c.save();c.scale(sc*face,sc);var bob=Math.abs(Math.sin(walk))*1.5,r=12;c.translate(0,-bob);c.fillStyle=col||BONE;c.strokeStyle=col||BONE;c.lineCap='round';c.lineJoin='round';
  function F(){c.fill();c.beginPath()}
  c.beginPath();poly(c,[-.7,1,-.45,-.1,.45,-.1,.7,1],r);F();
  if(hat===6||hat===9){c.arc(0,-.38*r,.52*r,0,TAU);F()}
  c.arc(0,-.42*r,.34*r,0,TAU);F();
  switch(hat){
   case 0:c.arc(0,-.5*r,.36*r,Math.PI,0);F();c.arc(0,-.95*r,.12*r,0,TAU);F();break;
   case 1:c.rect(-.28*r,-1.3*r,.56*r,.55*r);F();c.rect(-.48*r,-.8*r,.96*r,.09*r);F();break;
   case 2:c.ellipse(0,-.72*r,.7*r,.12*r,0,0,TAU);F();c.arc(0,-.72*r,.3*r,Math.PI,0);F();break;
   case 3:poly(c,[-.4,-.38,0,-1.1,.4,-.38],r);F();break;
   case 4:poly(c,[-.7,-.6,.7,-.6,.18,-.72,.4,-1.7,-.16,-.72],r);F();break;
   case 5:c.arc(0,-.55*r,.34*r,Math.PI,0);F();break;
   case 7:c.arc(0,-.5*r,.35*r,Math.PI,0);F();poly(c,[-.3,-.7,-.7,-1.2,-.2,-.85],r);F();poly(c,[.3,-.7,.7,-1.2,.2,-.85],r);F();break;
   case 9:poly(c,[-.52,-.38,0,-1.15,.52,-.38],r);F();break}
  if(hat===5){c.lineWidth=1.4;c.moveTo(.2*r,-.8*r);c.quadraticCurveTo(.7*r,-1.3*r,.9*r,-1.1*r);c.stroke();c.beginPath()}
  if(hat===3){c.lineWidth=1.6;c.moveTo(-.85*r,1*r);c.lineTo(-.85*r,-.9*r);c.arc(-.65*r,-.9*r,.2*r,Math.PI,0);c.stroke();c.beginPath()}
  if(hat===2){c.globalAlpha=.5;c.lineWidth=.8;for(var k=-3;k<=3;k++){c.moveTo(k*.1*r,-.6*r);c.lineTo(k*.11*r,-.1*r)}c.stroke();c.beginPath();c.globalAlpha=1}
  /* face cut through to the ground: eyes, the tinker's goggle band, the reaper's empty hood */
  if(hole==='cut')c.globalCompositeOperation='destination-out';c.fillStyle=hole==='cut'?'#000':(hole||HOLE);
  if(hat===9){c.ellipse(.04*r,-.36*r,.22*r,.26*r,0,0,TAU);F()}else{c.arc(.1*r,-.44*r,.055*r,0,TAU);F();c.arc(.26*r,-.44*r,.055*r,0,TAU);F()}
  if(hat===8){c.rect(-.34*r,-.53*r,.7*r,.1*r);F()}
  c.globalCompositeOperation='source-over';
  /* lantern on a short pole, the hero's one ember */ c.lineWidth=1.3;c.strokeStyle=col||BONE;c.moveTo(.4*r,.05*r);c.lineTo(.95*r,-.15*r);c.stroke();c.beginPath();var sw=Math.sin(walk*.8)*.12*r;c.fillStyle=col&&col!==NIGHT?'#3a2a1c':EMB;c.fillRect(.83*r+sw,-.1*r,.26*r,.32*r);c.restore()}
function drawEnemy(e){var c=ctx,r=e.r,t=e.t,ph=e.ph,sx=e.face||1,col=e.fl>0?EMB:BONE,boss=e.d.boss,eyes=null,er=.1,cuts=[];c.save();c.translate(e.x,e.y);c.fillStyle=col;
  if(t==='ghost'||t==='wisp')c.globalAlpha=.62+.25*Math.sin(ph*.4);
  function F(){c.fill();c.beginPath()}
  c.beginPath();
  switch(t){
   case'bat':var f=Math.sin(ph*1.6);c.ellipse(0,0,.45*r,.6*r,0,0,TAU);F();poly(c,[-.3,0,-1.6,-.5-.6*f,-1.15,.15,-.85,-.05,-.55,.35],r);F();poly(c,[.3,0,1.6,-.5-.6*f,1.15,.15,.85,-.05,.55,.35],r);F();poly(c,[-.35,-.4,-.3,-.95,-.05,-.5],r);F();poly(c,[.35,-.4,.3,-.95,.05,-.5],r);F();eyes=[[-.17,-.1],[.17,-.1]];er=.12;break;
   case'hob':var st=Math.sin(ph)*.15;c.arc(0,0,.8*r,0,TAU);F();poly(c,[-.6,-.3,-1.2,-.95,-.3,-.62],r);F();poly(c,[.6,-.3,1.2,-.95,.3,-.62],r);F();c.rect((-.45+st)*r,.6*r,.3*r,.5*r);F();c.rect((.15-st)*r,.6*r,.3*r,.5*r);F();eyes=[[-.25,-.1],[.25,-.1]];er=.15;break;
   case'wolf':poly(c,[-1,-.1,-.6,-.45,.3,-.45,.55,-.8,.68,-.45,1.15,-.3,1.15,-.1,.6,-.05,.55+Math.sin(ph)*.1,.5,.38,.5,.3,.1,-.5,.1,-.6-Math.sin(ph)*.1,.5,-.78,.5,-.8,.05,-1.35,-.35],r,sx);F();eyes=[[.64,-.33]];er=.09;break;
   case'stag':c.ellipse(0,.1*r,.9*r,.48*r,0,0,TAU);F();poly(c,[.5,-.1,.78,-.62,1.12,-.58,1.2,-.42,.92,-.32,.72,.1],r,sx);F();for(var lg=0;lg<4;lg++){var lx=[-.65,-.4,.35,.6][lg]+Math.sin(ph+lg*1.7)*.06;c.rect(lx*r*sx-.06*r,.4*r,.12*r,.75*r);F()}eyes=[[.96,-.5]];er=.07;break;
   case'ghoul':poly(c,[-.7,1,-.8,.1,-.5,-.6,-.1,-.95,.35,-.8,.6,-.4,1.1+Math.sin(ph*.5)*.08,-.1,1.15,.1,.6,0,.7,1],r,sx);F();eyes=[[.15,-.55],[.42,-.5]];break;
   case'wisp':var fl=Math.sin(ph*.9)*.25;c.moveTo(fl*r,-1.35*r);c.quadraticCurveTo(.95*r,-.2*r,.7*r,.4*r);c.arc(0,.35*r,.7*r,0,Math.PI);c.quadraticCurveTo(-.95*r,-.2*r,fl*r,-1.35*r);F();eyes=[[-.25,.2],[.25,.2]];er=.13;break;
   case'shroom':case'spore':c.moveTo(-r,0);c.quadraticCurveTo(-r,-1.1*r,0,-1.1*r);c.quadraticCurveTo(r,-1.1*r,r,0);c.closePath();F();c.rect(-.4*r,-.05*r,.8*r,.95*r);F();cuts=[[-.45,-.5,.15],[.3,-.72,.15]];eyes=[[-.15,.35],[.15,.35]];er=.09;break;
   case'crow':var cf=Math.sin(ph*1.8);poly(c,[-1,0,-.4,-.25,.2,-.3,.6,-.5,.9,-.45,1.35,-.35,.9,-.25,.5,0,-.2,.12,-1.1,.38],r,sx);F();poly(c,[-.35,-.2,.15,-.2,-.25,-.4-.9*cf],r,sx);F();eyes=[[.75,-.4]];er=.07;break;
   case'treant':poly(c,[-.8,1,-.7,-.4,-1.2,-.9,-.9,-1,-.55,-.65,-.3,-1.1,0,-.75,.3,-1.15,.5,-.6,1,-1,1.15,-.85,.75,-.35,.8,1],r);F();eyes=[[-.3,-.25],[.3,-.25]];er=.14;cuts=[[0,.25,.3,.12]];break;
   case'witch':poly(c,[-.75,1,-.45,-.15,.45,-.15,.75,1],r);F();c.arc(0,-.35*r,.32*r,0,TAU);F();poly(c,[-.75,-.5,.75,-.5,.15,-.65,.35+Math.sin(ph*.3)*.1,-1.5,-.15,-.65],r);F();eyes=[[-.12,-.32],[.12,-.32]];er=.07;break;
   case'frog':c.ellipse(0,.1*r,r,.7*r,0,0,TAU);F();c.arc(-.45*r,-.55*r,.3*r,0,TAU);F();c.arc(.45*r,-.55*r,.3*r,0,TAU);F();eyes=[[-.45,-.55],[.45,-.55]];er=.14;cuts=[[0,.28,.5,.06]];break;
   case'ghost':c.moveTo(-.8*r,.9*r);c.lineTo(-.8*r,-.1*r);c.arc(0,-.1*r,.8*r,Math.PI,0);c.lineTo(.8*r,.9*r);for(var k=0;k<4;k++){var x0=.8-k*.4;c.quadraticCurveTo((x0-.1)*r,(.6+Math.sin(ph+k)*.15)*r,(x0-.4)*r,.9*r)}F();eyes=[[-.28,-.2],[.28,-.2]];er=.16;break;
   case'skel':c.arc(0,-.45*r,.45*r,0,TAU);F();c.rect(-.4*r,0,.8*r,.75*r);F();c.rect(-.3*r,.75*r,.15*r,.4*r);F();c.rect(.15*r,.75*r,.15*r,.4*r);F();cuts=[[-.15,.18,.15,.04],[.15,.18,.15,.04],[-.15,.4,.15,.04],[.15,.4,.15,.04],[-.15,.6,.15,.04],[.15,.6,.15,.04]];eyes=[[-.17,-.48],[.17,-.48]];er=.12;break;
   case'hag':poly(c,[-1,1,-.9,0,-.5,-.7,0,-1,.4,-.85,.65,-.5,.75,-.35,.6,-.3,.7,0,.9,1],r,sx);F();eyes=[[.25,-.62]];er=.07;break;
   case'erl':var fl2=Math.sin(ph*.5)*.08;poly(c,[-1,1.1,-.8,-.2,-.45,-.55,.45,-.55,.8,-.2,1,1.1,.5,.95+fl2,0,1.15,-.5,.95-fl2],r);F();c.arc(0,-.78*r,.3*r,0,TAU);F();eyes=[[-.1,-.78],[.1,-.78]];er=.06;break}
  var esx=FLIP[t]?sx:1,lit=e.el||boss;
  if(cuts.length){c.fillStyle=HOLE;cuts.forEach(function(q){c.beginPath();c.ellipse(q[0]*r*esx,q[1]*r,q[2]*r,(q[3]||q[2])*r,0,0,TAU);c.fill()})}
  if(eyes){c.fillStyle=lit?EMB:HOLE;eyes.forEach(function(p){c.beginPath();c.arc(p[0]*r*esx,p[1]*r,er*r*(lit?1.2:1),0,TAU);c.fill()})}
  c.globalAlpha=1;
  if(t==='stag'){c.strokeStyle=col;c.lineWidth=.07*r;c.beginPath();var ax=.85*r*sx,ay=-.6*r,low=e.st==='aim'?.5:0;for(var s2=-1;s2<=1;s2+=2){c.moveTo(ax,ay);c.lineTo(ax+(.2+low)*r*sx,ay-(.7-low)*r);c.lineTo(ax+(.1+low)*r*sx+s2*.3*r,ay-(1.1-low*1.4)*r);c.moveTo(ax+(.14+low*.6)*r*sx,ay-(.4-low*.5)*r);c.lineTo(ax+(.5+low)*r*sx,ay-(.6-low*.6)*r)}c.stroke();
    if(e.st==='aim'){c.strokeStyle=EMB;c.lineWidth=2;c.setLineDash([6,6]);c.beginPath();c.moveTo(0,0);c.lineTo(e.vx*240,e.vy*240);c.stroke();c.setLineDash([])}}
  if(t==='hag'){c.strokeStyle=col;c.lineWidth=.07*r;c.beginPath();c.moveTo(.95*r*sx,1*r);c.lineTo(1.05*r*sx,-1.15*r);c.stroke();c.fillStyle=EMB;c.fillRect(1.05*r*sx-.12*r,-1.3*r,.24*r,.24*r)}
  if(t==='erl'){c.strokeStyle=col;c.lineWidth=.05*r;c.beginPath();for(var a2=-1;a2<=1;a2+=2){c.moveTo(a2*.15*r,-1*r);c.lineTo(a2*.35*r,-1.5*r);c.lineTo(a2*.6*r,-1.6*r);c.moveTo(a2*.3*r,-1.35*r);c.lineTo(a2*.12*r,-1.6*r)}c.stroke()}
  if(e.el&&!boss){c.strokeStyle=EMB;c.lineWidth=2;c.beginPath();c.arc(0,0,r*1.25,0,TAU);c.setLineDash([4,5]);c.stroke();c.setLineDash([])}
  if(e.frz>0){c.strokeStyle=BONE;c.lineWidth=1.5;c.strokeRect(-r,-r,2*r,2*r)}
  c.restore()}
function drawDecor(x0,y0,x1,y1){var TS=80,c=ctx,sid=STG.id;for(var ty=Math.floor(y0/TS);ty<=Math.floor(y1/TS);ty++)for(var tx=Math.floor(x0/TS);tx<=Math.floor(x1/TS);tx++){var h=hash(tx,ty),X=tx*TS+hash(ty,tx)*TS*.7,Y=ty*TS+hash(tx+9,ty-3)*TS*.7;
  if(Math.abs(X)<90&&Math.abs(Y)<90)continue;
  if(sid==='marsh'&&h>.72&&h<.84){c.fillStyle='#070c0a';c.beginPath();c.ellipse(X,Y,34+h*30,16+h*10,0,0,TAU);c.fill();c.strokeStyle='rgba(231,220,196,.18)';c.lineWidth=1;c.beginPath();var rw=(T*.3+h*40)%30;c.ellipse(X,Y,10+rw,5+rw*.45,0,0,TAU);c.stroke();continue}
  if(h<.2){c.strokeStyle='rgba(231,220,196,.22)';c.lineWidth=1.2;c.beginPath();for(var k=-1;k<=1;k++){c.moveTo(X+k*4,Y);c.lineTo(X+k*6+Math.sin(T*.02+h*9)*1.5,Y-7-h*10)}c.stroke()}
  else if(h<.26){c.fillStyle=MID2;c.beginPath();c.ellipse(X,Y,6+h*10,4+h*6,0,0,TAU);c.fill()}
  else if(h<.29){c.fillStyle='rgba(231,220,196,.3)';for(var p=0;p<5;p++){c.beginPath();c.arc(X+Math.cos(p*1.26)*3,Y+Math.sin(p*1.26)*3,2,0,TAU);c.fill()}}
  else if(h<.36){c.fillStyle=MID;c.beginPath();if(sid==='barrow'){c.moveTo(X-10,Y);c.lineTo(X-10,Y-16);c.arc(X,Y-16,10,Math.PI,0);c.lineTo(X+10,Y);c.closePath();c.fill();c.strokeStyle='rgba(231,220,196,.2)';c.lineWidth=1;c.stroke()}
    else if(sid==='marsh'){c.strokeStyle='rgba(231,220,196,.25)';c.lineWidth=1.3;c.beginPath();for(var q=0;q<4;q++){c.moveTo(X+q*4-6,Y);c.lineTo(X+q*5-8+Math.sin(T*.03+q)*2,Y-22-q*3)}c.stroke()}
    else{for(var tr=0;tr<3;tr++){var w=26-tr*7;c.moveTo(X-w,Y-tr*16);c.lineTo(X,Y-tr*16-26);c.lineTo(X+w,Y-tr*16)}c.rect(X-3,Y,6,8);c.fill()}}}}
function drawBonfire(x,y,s){var c=ctx;c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=MID2;for(var i=0;i<9;i++){var a=i/9*TAU;c.beginPath();c.arc(Math.cos(a)*26,Math.sin(a)*13+6,5,0,TAU);c.fill()}
  c.strokeStyle=BONE;c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(-18,10);c.lineTo(16,0);c.moveTo(18,10);c.lineTo(-16,0);c.stroke();
  var fk=(T>>2)%3;c.fillStyle=EMB;c.beginPath();c.moveTo(-14,4);c.lineTo(-8-fk,-22);c.lineTo(-2,-6);c.lineTo(2+fk,-34);c.lineTo(7,-6);c.lineTo(11,-20+fk*2);c.lineTo(15,4);c.closePath();c.fill();
  c.fillStyle=BONE;c.beginPath();c.moveTo(-6,4);c.lineTo(-1,-12+fk*2);c.lineTo(5,4);c.closePath();c.fill();
  for(var k=0;k<4;k++){var sy=((T*.6+k*25)%60),sxp=Math.sin(T*.05+k*2)*8;c.fillStyle=EMB;c.fillRect(sxp-1+(k-2)*4,-30-sy,2,2)}c.restore()}
function drawWorld(){var v=GK.view,c=ctx,h=G?G.h:{x:0,y:40},cam=G?G.cam:{x:0,y:-10},so=GK.fx.offset();
  c.setTransform(v.dpr*Z,0,0,v.dpr*Z,v.dpr*(v.w/2-(cam.x+so.x)*Z),v.dpr*(v.h/2-(cam.y+so.y)*Z));
  var x0=cam.x-VW/2-60,x1=cam.x+VW/2+60,y0=cam.y-VH/2-60,y1=cam.y+VH/2+60;drawDecor(x0,y0,x1,y1);if(Math.abs(cam.x)<VW&&Math.abs(cam.y)<VH)drawBonfire(0,0,1);
  if(!G){c.save();c.translate(-44,16);drawHero(c,(HEROES.filter(function(q){return q.id===META.hero})[0]||HEROES[0]).hat,1,0,1.4);c.restore();return}
  PT.forEach(function(p){c.strokeStyle=BONE;c.globalAlpha=.5;c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.arc(p.x,p.y,p.R,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=1;c.fillStyle=EMB;var n=6;for(var i=0;i<n;i++){var a=i/n*TAU+p.tk*.02,rr=p.R*.55,fx=p.x+Math.cos(a)*rr,fy=p.y+Math.sin(a)*rr*.6,fh=6+((p.tk+i*5)%10);c.beginPath();c.moveTo(fx-4,fy);c.lineTo(fx,fy-fh);c.lineTo(fx+4,fy);c.fill()}});
  GEM.forEach(function(g){if(g.x<x0||g.x>x1||g.y<y0||g.y>y1)return;var s=g.k===2?7:g.k===1?5:3.4;c.fillStyle=g.k===2?BONE:EMB;c.beginPath();c.moveTo(g.x,g.y-s);c.lineTo(g.x+s*.7,g.y);c.lineTo(g.x,g.y+s);c.lineTo(g.x-s*.7,g.y);c.fill();if(g.k===2){c.fillStyle=EMB;c.fillRect(g.x-1.5,g.y-1.5,3,3)}});
  DR.forEach(function(p){var bob=Math.sin(p.t*.08)*2;if(p.k==='coin'){c.fillStyle=BONE;c.beginPath();c.arc(p.x,p.y+bob,5,0,TAU);c.fill();c.fillStyle=EMB;c.fillRect(p.x-1,p.y-3+bob,2,6)}else GK.icoDraw(c,p.k==='bread'?'bread':p.k==='magnet'?'magnet':p.k==='flask'?'flask':'chest',p.x,p.y+bob,p.k==='chest'?26:20,p.k==='chest'?EMB:BONE,2)});
  EN.forEach(function(e){if(!e.dead&&e.x>x0-60&&e.x<x1+60&&e.y>y0-60&&e.y<y1+60)drawEnemy(e)});
  c.lineCap='round';SH.forEach(function(s){c.save();c.translate(s.x,s.y);
    if(s.k==='dart'){var a=Math.atan2(s.vy,s.vx);c.rotate(a);c.fillStyle=EMB;c.beginPath();c.moveTo(s.r+3,0);c.lineTo(-s.r,-s.r*.5);c.lineTo(-s.r*.4,0);c.lineTo(-s.r,s.r*.5);c.fill();c.strokeStyle=EMB;c.globalAlpha=.5;c.lineWidth=1.5;c.beginPath();c.moveTo(-s.r,0);c.lineTo(-s.r*3,0);c.stroke()}
    else if(s.k==='axe'){c.rotate(s.rot);var r=s.r;c.fillStyle=BONE;c.fillRect(-r*.1,-r,r*.2,r*2);c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r,-r*1.1,r*.9,-r*.1);c.lineTo(0,-r*.35);c.fill()}
    else if(s.k==='sick'){c.rotate(s.rot);c.fillStyle=BONE;c.beginPath();c.arc(0,0,s.r,0,Math.PI*1.4);c.arc(s.r*.25,-s.r*.15,s.r*.75,Math.PI*1.4,0,true);c.fill()}
    else if(s.k==='ring'){c.strokeStyle=BONE;c.lineWidth=3;c.globalAlpha=Math.max(0,1-s.r/s.R);c.beginPath();c.arc(0,0,s.r,0,TAU);c.stroke();c.lineWidth=1;c.beginPath();c.arc(0,0,Math.max(0,s.r-8),0,TAU);c.stroke()}
    else if(s.k==='bee'){c.fillStyle=EMB;c.fillRect(-2,-2,4,4);c.fillStyle=BONE;var wf=(T>>1)%2;c.fillRect(-3,-4-wf,2,2);c.fillRect(1,-4-wf,2,2)}c.restore()});
  G.w.forEach(function(w){if(w.id==='scythe'&&w.bl){w.bl.forEach(function(b){c.save();c.translate(b[0],b[1]);c.rotate(b[2]+1.2);var r=12*w.s.a*S.area;c.fillStyle=w.evo?EMB:BONE;c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(0,-r*1.2,r,0);c.quadraticCurveTo(0,-r*.5,-r,0);c.fill();c.restore()})}
    if(w.id==='lantern'&&w.R){c.strokeStyle=w.evo?EMB:BONE;c.globalAlpha=.55;c.lineWidth=1.5;c.setLineDash([2,6]);c.lineDashOffset=-T*.4;c.beginPath();c.arc(h.x,h.y,w.R,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=1}
    if(w.id==='owl')w.owls.forEach(function(o){c.save();c.translate(o.x,o.y);c.fillStyle=w.evo?EMB:BONE;c.beginPath();var f=o.st===1?.3:Math.sin(T*.3)*.5;c.ellipse(0,0,4,6,0,0,TAU);poly(c,[-3,-1,-12,-3-6*f,-4,4],1);poly(c,[3,-1,12,-3-6*f,4,4],1);c.fill();c.restore()})});
  EO.forEach(function(o){c.strokeStyle=BONE;c.lineWidth=2;c.beginPath();c.arc(o.x,o.y,o.r,0,TAU);c.stroke();c.fillStyle=EMB;c.fillRect(o.x-2,o.y-2,4,4)});
  FXB.forEach(function(b){c.strokeStyle=BONE;c.lineWidth=2.5;c.beginPath();var y=b.y-VH,xx=b.x;c.moveTo(xx,y);var r=GK.rng((b.seed*1e6)|0);while(y<b.y){y+=20+r()*20;xx=b.x+(r()-.5)*26*(1-(y-(b.y-VH))/VH);c.lineTo(Math.min(y,b.y)===b.y?b.x:xx,Math.min(y,b.y))}c.stroke();c.fillStyle=EMB;c.globalAlpha=b.life/12;c.beginPath();c.arc(b.x,b.y,14,0,TAU);c.fill();c.globalAlpha=1});
  var hv=h.dead?Math.min(1,modeT/30):0;c.save();c.translate(h.x,h.y);c.rotate(hv*1.4*(h.fx<0?-1:1));if(h.inv%6<3)drawHero(c,HERO.hat,h.fx<0?-1:1,h.walk,1.3);c.restore();
  if(h.hp<h.max){c.strokeStyle=BONE;c.lineWidth=1;c.strokeRect(h.x-14,h.y+18,28,4);c.fillStyle=EMB;c.fillRect(h.x-13.5,h.y+18.5,27*h.hp/h.max,3)}
  GK.fx.draw(c)}
function drawDark(){var v=GK.view,c=ctx;c.setTransform(v.dpr,0,0,v.dpr,0,0);var cx=v.w/2,cy=v.h/2;if(G){cx+=(G.h.x-G.cam.x)*Z;cy+=(G.h.y-G.cam.y)*Z}else{cx+=0;cy+=10*Z}
  var LR=(G?STG.lr:230)*Z+((T>>3)%2)*2;[[1,.26],[1.4,.24],[1.9,.22]].forEach(function(q){c.fillStyle='rgba(5,7,5,'+q[1]+')';c.beginPath();c.rect(0,0,v.w,v.h);c.moveTo(cx+LR*q[0],cy);c.arc(cx,cy,LR*q[0],0,TAU,true);c.fill('evenodd')});
  if(G&&G.flash>0){c.fillStyle='rgba(231,220,196,'+(G.flash/14)+')';c.fillRect(0,0,v.w,v.h)}
  if(mode==='dawn'){c.fillStyle='rgba(231,220,196,'+Math.min(.92,modeT/160)+')';c.fillRect(0,0,v.w,v.h);var sy=v.h*.75-Math.min(1,modeT/180)*v.h*.35;c.fillStyle=EMB;c.beginPath();c.arc(v.w/2,sy,60,Math.PI,0);c.fill()}}
function edgeArrow(x,y,col){var v=GK.view,sx=v.w/2+(x-G.cam.x)*Z,sy=v.h/2+(y-G.cam.y)*Z;if(sx>0&&sx<v.w&&sy>0&&sy<v.h)return;var cx=v.w/2,cy=v.h/2,a=Math.atan2(sy-cy,sx-cx),m=26,ex=GK.clamp(sx,m,v.w-m),ey=GK.clamp(sy,m+40,v.h-m);
  ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-8);ctx.lineTo(-4,0);ctx.lineTo(-8,8);ctx.fill();ctx.restore()}
function drawHud(){if(!G||G.tut&&tut.active&&tut.i<1)return;var v=GK.view,c=ctx,W=v.w;c.setTransform(v.dpr,0,0,v.dpr,0,0);
  c.strokeStyle=BONE;c.lineWidth=1.5;c.strokeRect(8,8,W-16,8);c.fillStyle=EMB;c.fillRect(10,10,(W-20)*Math.min(1,G.xp/G.next),4);
  c.fillStyle=BONE;c.textBaseline='alphabetic';c.font='30px "Pirata One",Georgia,serif';c.textAlign='center';var sec=Math.floor(G.t/60);c.fillText(Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'),W/2,48);
  c.textAlign='left';c.font='24px "Pirata One",Georgia,serif';c.fillText(String(G.lvl),14,44);
  c.textAlign='right';c.fillText(String(G.kills),W-14,44);GK.icoDraw(c,'skull',W-24-c.measureText(String(G.kills)).width,36,18,BONE,1.6);
  c.fillText(String(G.gold),W-14,70);GK.icoDraw(c,'coin',W-24-c.measureText(String(G.gold)).width,62,18,EMB,1.6);
  G.w.forEach(function(w,i){var x=16+i*26;GK.icoDraw(c,WD[w.id].ic,x,62,18,w.evo?EMB:BONE,1.6);for(var k=0;k<w.lv;k++){c.fillStyle=w.evo?EMB:BONE;c.fillRect(x-9+k*2.4,74,1.6,3)}});
  var ci=0;for(var id in G.ch){var x2=16+ci*26;GK.icoDraw(c,CH[id].ic,x2,90,16,'rgba(231,220,196,.75)',1.6);for(var k2=0;k2<G.ch[id];k2++){c.fillStyle=BONE;c.fillRect(x2-7+k2*3,100,2,3)}ci++}
  if(G.boss&&!G.boss.dead){var bw=Math.min(360,W-60);c.strokeStyle=BONE;c.strokeRect(W/2-bw/2,58,bw,8);c.fillStyle=EMB;c.fillRect(W/2-bw/2+2,60,(bw-4)*Math.max(0,G.boss.hp/G.boss.max),4);edgeArrow(G.boss.x,G.boss.y,EMB)}
  DR.forEach(function(p){if(p.k==='chest')edgeArrow(p.x,p.y,BONE)});
  if(G.mode==='hurry'||G.mode==='daily'||G.mode==='endless'){GK.icoDraw(c,MODES.filter(function(m){return m.id===G.mode})[0].ic,W/2+(c.measureText('00:00').width/2)+30,40,16,EMB,1.6)}}
function render(){var v=GK.view,c=ctx;HOLE=G?STG.bg:'#10140f';c.setTransform(v.dpr,0,0,v.dpr,0,0);c.fillStyle=HOLE;c.fillRect(0,0,v.w,v.h);drawWorld();drawDark();drawHud();
  c.setTransform(v.dpr,0,0,v.dpr,0,0);if(mode==='play'&&!Auto.on)stick.draw(c,BONE);if(tut.active)tutDraw()}

/* ---------- sound ---------- */
function sfx(k){var A=GK.audio,t=A.ctx&&A.ctx.currentTime;if(!A.ctx)return;switch(k){
  case'dart':A.tone(1300,.03,'square',.008,.7);break;case'axe':A.noise(.08,.03,0,900);break;case'thunder':A.noise(.35,.07,0,200);A.tone(80,.3,'sawtooth',.03,.5);break;
  case'bell':A.tone(392,.9,'sine',.04);A.tone(784,.6,'sine',.015);break;case'torch':A.noise(.2,.03,0,400);break;
  case'hurt':A.tone(150,.15,'sawtooth',.05,.6);break;case'pick':A.tone(660,.08,'triangle',.04,1.5);break;
  case'lvl':[523,659,784,1047].forEach(function(f,i){A.tone(f,.25,'triangle',.04,1,t+i*.06)});break;
  case'chest':[784,988,1175,1568].forEach(function(f,i){A.tone(f,.2,'triangle',.04,1,t+i*.08)});break;
  case'boss':case'horn':A.tone(98,1.1,'sawtooth',.045,1.02);A.tone(147,1.1,'sawtooth',.03,1.02);break;
  case'bossdie':A.noise(1,.12,0,0);[392,494,587,784].forEach(function(f,i){A.tone(f,.6,'triangle',.05,1,t+.2+i*.12)});break;
  case'bomb':A.noise(.8,.15,0,0);break;case'die':A.tone(220,1.2,'sawtooth',.05,.3);break}}

/* ---------- tutorial: walk, gather, choose, fight ---------- */
var tutS={x:0,y:0};
var tut=GK.tutorial({parent:stage,onStart:function(){newRun({tut:true,mode:'run'});G.next=6;tutS={x:G.h.x,y:G.h.y}},onEnd:function(){toCamp()},steps:[
  {done:function(){return G&&Math.sqrt(sq(G.h.x-tutS.x)+sq(G.h.y-tutS.y))>140}},
  {init:function(){var h=G.h,a=Math.atan2(h.fy,h.fx);for(var i=0;i<8;i++)gem(h.x+Math.cos(a)*(90+i*14),h.y+Math.sin(a)*(90+i*14),1)},done:function(){return G&&G.lvl>=2&&mode==='pick'}},
  {done:function(){return G&&G.picks>=1&&mode==='play'}},
  {init:function(){for(var i=0;i<6;i++){var a=i/6*TAU;spawn('bat',G.h.x+Math.cos(a)*230,G.h.y+Math.sin(a)*230)}tutS.k=G.kills},done:function(){return G&&G.kills-tutS.k>=6}}]});
function tutDraw(){var v=GK.view,c=ctx,t=tut.t;c.setTransform(v.dpr,0,0,v.dpr,0,0);var hx=v.w/2,hy=v.h/2;
  if(tut.i===0){GK.swipe(c,hx,hy+70,hx+80,hy+70,t,EMB);GK.swipe(c,hx,hy-70,hx-80,hy-70,t+55,EMB)}
  else if(tut.i===1&&G){var g=GEM[0];if(g)GK.pulse(c,v.w/2+(g.x-G.cam.x)*Z,v.h/2+(g.y-G.cam.y)*Z,t,EMB,8)}
  else if(tut.i===3&&G){var e=null;EN.forEach(function(q){if(!q.dead&&!e)e=q});if(e)GK.pulse(c,v.w/2+(e.x-G.cam.x)*Z,v.h/2+(e.y-G.cam.y)*Z,t,EMB,12)}}

/* ---------- boot ---------- */
var B=GK.controls(document.getElementById('bar'),{bar:'left',onHelp:function(){hideAll();tut.start()},extra:[
  {id:'camp',html:GK.icoSvg('tent'),title:'Camp',fn:function(){if(tut.active)tut.end();else if(G&&!G.tut&&mode!=='over'){endRun()}else toCamp()}},
  {id:'rs',html:GK.icon('restart'),title:'Restart',fn:function(){if(!tut.active&&G)newRun({mode:G.mode})}}]});
GK.goals.setup({metrics:function(){return ST},defs:{kills:{ic:'skull',t:[100,1000,5000,20000,100000]},lvl:{ic:'up',t:[10,20,30,40,50]},mins:{ic:'clock',t:[1,3,5,10,15]},wins:{ic:'flag',t:[1,3,10]},
  evos:{ic:'crown',t:[1,3,10,25]},bosses:{ic:'sword',t:[1,5,15,40]},gold:{ic:'coin',t:[100,1000,5000,20000]},heroes:{ic:'heart',t:[3,5,7,10]},stages:{ic:'tree',t:[2,3]},daily:{ic:'sun',t:[1,3,7,14,30]},endless:{ic:'infinity',t:[10,20,30]},maxk:{ic:'fire',t:[500,1500,3000,6000]}}});
GK.goals.mount(B);
function fit(){var v=GK.fit(cv,stage);Z=GK.clamp(Math.sqrt(v.w*v.h/(620*620)),.62,1.9);VW=v.w/Z;VH=v.h/Z}
addEventListener('resize',fit);addEventListener('orientationchange',fit);fit();
toCamp();GK.loop(step,render);tut.maybe();if(document.fonts)document.fonts.ready.then(function(){if(mode==='camp')paintCamp()});
window.__g={tut:tut,chest:function(){openChest()},G:function(){return G},S:function(){return S},meta:META,st:ST,start:function(o){newRun(o)},toCamp:toCamp,
  stats:function(){if(!G)return{mode:mode,gold:META.gold,wins:ST.wins,runs:ST.runs};return{mode:mode,t:Math.floor(G.t/60),lvl:G.lvl,kills:G.kills,hp:Math.round(G.h.hp)+'/'+Math.round(G.h.max),en:EN.length,gems:GEM.length,w:G.w.map(function(w){return w.id+w.lv+(w.evo?'*':'')}).join(','),ch:JSON.stringify(G.ch),gold:G.gold,won:G.won,rev:G.rev,wins:ST.wins,runs:ST.runs,boss:G.boss?G.boss.t+':'+Math.round(G.boss.hp):''}}};
})();
