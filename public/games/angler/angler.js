/* Angler: cast, hold the depth, strike on the bite, fight the line. Every catch is pressed into the journal as an ink print.
   Look: gyotaku. Rice paper water in stepped depth bands, sumi-ink fish, a crimson seal. Night inverts the print. */
(function(){
GK.id('angler');Auto.deep=true;
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
var PAPER='#f1ebdd',INK='#1d1b19',RED='#b3202a',TAU=Math.PI*2;
var Z=1,VW=600,VH=600,T=0;
function sq(x){return x*x}
function rnd(a,b){return a+Math.random()*(b-a)}

Object.assign(GK.ico,{
 rod:'<path d="M3 19L18 3"/><path d="M18 3c1 6 0 11-2 15"/><circle cx="7" cy="15" r="2"/>',
 reel:'<circle cx="11" cy="11" r="7"/><circle cx="11" cy="11" r="2"/><path d="M11 4v5M18 11h2M17 17l2 2"/>',
 spool:'<path d="M5 4h12M5 18h12M7 4v14M15 4v14M7 8h8M7 11h8M7 14h8"/>',
 hook:'<path d="M14 3v11a4 4 0 0 1-8 0v-2l3 2"/><circle cx="14" cy="3" r="1.2"/>',
 worm:'<path d="M3 14c2-4 4-4 6 0s4 4 6 0 4-4 5-1"/>',
 corn:'<path d="M11 3c3 0 4 4 4 8s-1 8-4 8-4-4-4-8 1-8 4-8zM8 9h6M8 13h6M11 3v16"/>',
 fly:'<path d="M5 17l12-12M10 12c-4-1-6-4-6-8 4 0 7 2 8 6M12 10c1 4-1 7-5 9"/>',
 minnow:'<path d="M3 11c3-4 9-4 12 0-3 4-9 4-12 0zM15 11l4-3v6z"/>',
 shrimp:'<path d="M17 6c-6-2-12 2-12 7 0 3 2 5 5 5M10 18l-2 2M12 17l-1 3M5 12l-2-1M17 6l3-2M17 6l2 2"/>',
 squid:'<path d="M11 2l5 8v4H6v-4zM7 14v6M10 14v6M13 14v6M16 14v5"/>',
 glow:'<circle cx="11" cy="9" r="5"/><path d="M11 14v6M8 20h6M11 1v2M3 9h2M17 9h2"/>',
 wave:'<path d="M2 9c3-3 6 3 9 0s6 3 9 0M2 15c3-3 6 3 9 0s6 3 9 0"/>',
 mountain:'<path d="M2 18l6-10 4 6 3-4 5 8z"/>',
 trench:'<path d="M2 5h6l3 14 3-14h6"/>',
 map:'<path d="M3 5l5-2 6 2 5-2v14l-5 2-6-2-5 2zM8 3v14M14 5v14"/>',
 weight:'<path d="M6 8h10l3 11H3zM9 8a2 2 0 0 1 4 0"/>',
 snap:'<path d="M3 12l5-1M14 10l5-1M9 7l1 3-2 2 3 1M13 15l-1-2"/>'});

/* ---------- waters ---------- */
var LOCS=[
 {id:'pond',nm:'Pond',ic:'flower',w:760,deep:160,cost:0},
 {id:'river',nm:'River',ic:'wave',w:940,deep:240,cost:300,cur:.35},
 {id:'lake',nm:'Lake',ic:'mountain',w:1150,deep:430,cost:1200},
 {id:'coast',nm:'Coast',ic:'anchor',w:1350,deep:540,cost:4000},
 {id:'trench',nm:'Trench',ic:'trench',w:1450,deep:930,cost:12000,dark:1}];
function bottom(x){var L=LOCS[G.loc],t=GK.clamp((x-110)/(L.w*.5),0,1),ss=t*t*(3-2*t),b;
  if(L.id==='trench'){b=40+(t<.3?ss*400:200+ss*(L.deep-240))}else b=18+(L.deep-30)*ss;
  b+=Math.sin(x*.013)*10+Math.sin(x*.041)*4;if(x>L.w*.86)b-=(x-L.w*.86)/(L.w*.14)*b*.85;return Math.max(10,Math.min(L.deep,b))}
/* ---------- species: name, water, depth min/max, kg min/max, rarity, baits, fight style, shape, time (0 any 1 day 2 night), price per kg ---------- */
var SP=[
 ['Minnow',0,0,60,.02,.1,10,'wcf','d','slim',0,40],['Bluegill',0,0,80,.1,.6,9,'wf','d','round',1,14],['Perch',0,20,120,.2,1.2,7,'wm','s','perch',0,10],['Carp',0,40,150,2,12,5,'cw','s','carp',0,3],
 ['Koi',0,20,100,1,8,1.2,'c','s','koi',1,16],['Bullhead',0,80,155,.5,3,4,'w','v','cat',0,6],['Pumpkinseed',0,0,60,.1,.4,6,'wf','d','round',0,18],['Tench',0,60,155,1,5,4,'wc','s','carp',0,6],
 ['Crucian',0,30,120,.3,2,5,'c','s','round',0,8],['Loach',0,100,158,.05,.2,4,'w','d','eel',0,40],['Pond Eel',0,80,155,.5,3,3,'wm','d','eel',2,10],['Old Whisker',0,120,158,30,45,.25,'c','v','carp',0,6],
 ['Dace',1,0,80,.1,.4,9,'fw','d','slim',0,16],['Chub',1,20,120,.5,4,7,'wcf','s','perch',0,6],['Brown Trout',1,20,140,.5,6,5,'fm','j','trout',0,10],['Rainbow Trout',1,0,120,.5,5,5,'fw','j','trout',1,10],
 ['Grayling',1,20,100,.3,2,4,'f','d','perch',0,16],['Barbel',1,120,235,1,8,4,'wc','v','cat',0,6],['Pike',1,40,180,2,15,3,'m','d','pike',0,5],['Zander',1,100,235,1,10,3,'m','v','pike',2,6],
 ['Salmon',1,40,200,3,20,1.2,'mf','j','trout',0,8],['Sturgeon',1,180,238,10,60,.6,'ws','v','stur',0,4],['Lamprey',1,60,200,.3,1.5,3,'w','d','eel',2,12],['River King',1,150,238,40,80,.2,'m','j','trout',0,6],
 ['Bass',2,20,140,.5,5,8,'wmf','j','perch',0,9],['Walleye',2,140,300,1,8,5,'mw','v','pike',2,7],['Lake Trout',2,160,380,2,20,4,'m','v','trout',0,5],['Whitefish',2,100,260,.5,4,6,'ws','s','slim',0,8],
 ['Muskie',2,40,200,5,25,1,'m','d','pike',0,6],['Gar',2,20,100,2,20,2,'m','d','gar',1,5],['Burbot',2,260,425,.5,6,3,'wm','v','cat',2,8],['Arctic Char',2,200,380,1,8,3,'ms','s','trout',0,9],
 ['Cisco',2,60,200,.2,1,7,'fs','d','slim',0,18],['Lake Sturgeon',2,300,425,10,90,.6,'ws','v','stur',0,3],['Bowfin',2,20,120,1,6,3,'wm','j','gar',0,7],['The Deep One',2,340,428,60,120,.2,'m','v','coel',2,5],
 ['Mackerel',3,0,120,.3,2,9,'msq','d','tuna',0,10],['Sea Bass',3,40,200,1,10,6,'sm','s','perch',0,7],['Flounder',3,150,520,.5,5,5,'sw','v','flat',0,9],['Cod',3,150,450,2,30,5,'sq','s','carp',0,4],
 ['Pollock',3,80,300,1,10,6,'mq','d','slim',0,5],['Squid',3,60,300,.3,4,4,'gs','d','squid',2,12],['Ray',3,300,535,5,40,2,'sq','v','ray',0,3],['Pufferfish',3,20,150,.2,2,4,'s','s','puff',1,20],
 ['Tuna',3,40,300,20,200,1,'mq','d','tuna',0,3],['Swordfish',3,100,400,40,300,.6,'q','j','sword',0,3],['Conger',3,250,535,2,30,3,'qs','v','eel',2,5],['Old Grey',3,300,538,200,500,.15,'q','d','shark',0,2],
 ['Lanternfish',4,100,400,.05,.2,9,'g','d','lantern',0,60],['Hatchetfish',4,200,500,.05,.3,7,'g','d','hatchet',0,50],['Viperfish',4,300,700,.1,.5,5,'gq','d','viper',0,40],['Anglerfish',4,500,860,1,20,3,'g','v','angler',0,10],
 ['Gulper Eel',4,500,860,.5,3,3,'gq','d','gulper',0,20],['Oarfish',4,300,800,10,150,1,'q','s','oar',0,4],['Coelacanth',4,400,750,20,90,.6,'sq','v','coel',0,6],['Dragonfish',4,400,800,.2,1,4,'g','d','viper',0,35],
 ['Barreleye',4,300,700,.1,.5,3,'g','s','hatchet',0,45],['Fangtooth',4,500,860,.1,.6,4,'gq','d','angler',0,35],['Sixgill',4,600,925,50,300,.7,'q','v','shark',0,3],['Leviathan',4,750,928,500,1000,.12,'qg','v','oar',0,2]];
var LEG={11:1,23:1,35:1,47:1,59:1};
var SHP={slim:{h:.26,tail:'f',dor:1},round:{h:.58,tail:'r',dor:1},perch:{h:.36,tail:'f',dor:2,str:5},carp:{h:.4,tail:'f',dor:1,wh:1},koi:{h:.38,tail:'f',wh:1,spot:1},
 trout:{h:.3,tail:'r',dor:1,spot:1},pike:{h:.22,tail:'f',dor:1,snout:.12},eel:{eel:1,h:.13},cat:{h:.3,tail:'r',wh:2,dor:1},flat:{flat:1},puff:{h:.7,tail:'r',spk:1},
 tuna:{h:.34,tail:'l',dor:1,str:3},sword:{h:.26,tail:'l',bill:.45,dor:1},ray:{ray:1},squid:{squid:1},shark:{h:.28,tail:'s',dor:3},angler:{h:.62,tail:'r',lamp:1,teeth:1},
 viper:{h:.18,tail:'f',teeth:1,lamp:.6},hatchet:{h:.85,tail:'f'},lantern:{h:.3,tail:'f',dots:1},oar:{eel:1,h:.1,red:1},coel:{h:.38,tail:'r',lobe:1,dor:1},gulper:{eel:1,h:.14,mouth:1},
 stur:{h:.22,tail:'s',scute:1,wh:1,snout:.1},gar:{h:.16,tail:'r',snout:.35}};
function fishLen(kg){return 12+26*Math.log(1+kg*2)}
var BAITS=[{id:'w',nm:'Worm',ic:'worm',cost:0},{id:'c',nm:'Corn',ic:'corn',cost:60},{id:'f',nm:'Fly',ic:'fly',cost:180},{id:'m',nm:'Minnow',ic:'minnow',cost:450},{id:'s',nm:'Shrimp',ic:'shrimp',cost:1000},{id:'q',nm:'Squid',ic:'squid',cost:2400},{id:'g',nm:'Glow jig',ic:'glow',cost:6000}];
var UP={rod:{ic:'rod',nm:'Rod',v:[8,16,32,70,150,320],cost:[120,500,2000,7000,25000]},reel:{ic:'reel',nm:'Reel',v:[1.2,1.6,2.1,2.7,3.4,4.2],cost:[100,400,1500,5000,18000]},
 line:{ic:'spool',nm:'Line',v:[230,320,460,620,820,1080],cost:[80,350,1400,5000,16000]},hook:{ic:'hook',nm:'Hook',v:[0,1,2,3,4,5],cost:[90,380,1500,5200,17000]}};

/* ---------- save ---------- */
var CAR=GK.ls.get('car',null)||{money:0,up:{rod:0,reel:0,line:0,hook:0},baits:['w'],locs:['pond'],loc:0,bait:'w',jr:{},earned:0};
var ST=GK.ls.get('st',{species:0,kg:0,big:0,legends:0,earned:0,catches:0,locs:1,derby:0,daily:0,snaps:0});
var MODE=GK.ls.get('mode','career');
function save(){if(G&&G.mode==='career'){GK.ls.set('car',CAR)}else GK.ls.set('car',CAR);ST.species=Object.keys(CAR.jr).length;ST.locs=CAR.locs.length;GK.ls.set('st',ST)}

/* ---------- state ---------- */
var G=null,F=[],TIP={x:100,y:-78},DAY=14400;
function gear(k){return UP[k].v[G.up[k]]}
function castMax(){return 200+G.up.rod*120}
function newGame(m){m=m||MODE;var timed=m!=='career',ds=GK.daily.seed();
  G={mode:m,loc:m==='career'?CAR.loc:m==='derby'?2:ds%5,bait:m==='career'?CAR.bait:'w',up:m==='career'?CAR.up:{rod:3,reel:3,line:m==='daily'?5:3,hook:2},baits:m==='career'?CAR.baits:['w','c','f','m','s','q','g'],
    st:'idle',t:0,time:DAY*.12,lure:{x:0,y:0,vx:0,vy:0},charge:0,cdir:1,fish:null,tens:0,slack:0,over:0,score:0,timer:timed?10800:0,idleT:0,msg:null,print:null,splash:[],cam:{x:260,y:40},rng:GK.rng(m==='daily'?ds*7+3:(Math.random()*1e9)|0),hold:false,press:false,jig:0,tut:false};
  if(m==='daily')G.bait=['w','c','f','m','s','q','g'][(ds>>2)%7];F=[];for(var i=0;i<18;i++)spawnFish(true);GK.fx.clear()}
function isNight(){return LOCS[G.loc].dark||((G.time%DAY)/DAY>.62&&(G.time%DAY)/DAY<.95)}
function spawnFish(any){var L=LOCS[G.loc],night=isNight(),pool=[],tot=0;SP.forEach(function(s,i){if(s[1]!==G.loc)return;if(s[10]===1&&night||s[10]===2&&!night)return;pool.push(i);tot+=s[6]});if(!pool.length)return;
  var r=G.rng()*tot,id=pool[0];for(var j=0;j<pool.length;j++){r-=SP[pool[j]][6];if(r<=0){id=pool[j];break}}var s=SP[id];
  for(var k=0;k<20;k++){var x=rnd(150,L.w-40),bt=bottom(x);if(bt<s[2]+8)continue;var y=rnd(Math.max(6,s[2]),Math.min(s[3],bt-8));var kg=s[4]+(s[5]-s[4])*Math.pow(G.rng(),2.2);
    F.push({sp:id,kg:kg,L:fishLen(kg),x:x,y:y,tx:x,ty:y,face:Math.random()<.5?-1:1,t:Math.random()*99,st:'swim',cd:0,sp2:.25+Math.random()*.25});return}}

/* ---------- input: hold anywhere, Space ---------- */
var pHold=false;
GK.pointer(cv,{down:function(){pHold=true;G&&(G.press=true)},up:function(){pHold=false},key:function(code,dn,e){if(code==='Space'){if(dn&&!e.repeat&&G)G.press=true}}});
function holding(){return pHold||GK.keys.Space}

/* ---------- AUTO ---------- */
var bot={tg:null,wait:0,rel:-1};
function botPlan(){var best=null,bv=0,RS=gear('rod'),cm=castMax(),lm=gear('line');
  F.forEach(function(f){if(f.st!=='swim')return;var s=SP[f.sp],like=s[7].indexOf(G.bait)>=0?1:.15,peak=fishF(f,1.9);if(peak>RS*1.75)return;if(f.x-90>cm)return;if(Math.sqrt(sq(f.x-TIP.x)+sq(f.y-TIP.y))>lm*.92)return;
    var v=f.kg*s[11]*like*(CAR.jr[f.sp]?1:3)/(1+Math.abs(f.x-200)*.002);if(v>bv){bv=v;best=f}});return best}
function botCmd(){/* returns {hold:bool, press:bool} */
  var st=G.st,o={hold:false,press:false};
  if(st==='idle'){bot.wait++;if(bot.wait<25)return o;bot.tg=botPlan();bot.c=GK.clamp((bot.tg?(bot.tg.x-90)/castMax():.45)+Auto.noise(.25),.05,1);o.hold=true;bot.wait=0;return o}
  if(st==='charge'){o.hold=Math.abs(G.charge-bot.c)>.02;if(G.charge>.99&&bot.c>.97)o.hold=false;return o}
  if(st==='sink'){var f=G.eng;if(f&&f.st==='bite'){if(bot.bl==null)bot.bl=Auto.react();if(bot.bl-->0)return o;bot.bl=null;o.press=!Auto.slip();return o}bot.bl=null;if(f&&f.st==='nibble'&&Auto.slip()&&Math.random()<.05){o.press=true;return o}if(f&&f.st==='nibble')return o;
    var tg=bot.tg&&bot.tg.st==='swim'?bot.tg:null,ty=tg?tg.y:Math.min(bottom(G.lure.x)-20,gear('line')*.5);
    bot.jt=(bot.jt||0)+1;o.hold=G.lure.y>ty+6||(bot.jt%60<6);if(G.idleT>1500||G.lure.x<130&&G.lure.y<40){o.hold=true;bot.reelAll=1}if(bot.reelAll)o.hold=true;return o}
  if(st==='fight'){var fi=G.fish,RS2=gear('rod'),Fp=G.F;if(fi.jump>0){o.hold=true;return o}var lim=.93-(Auto.st('cau')-50)/250;o.hold=Fp/RS2+.3<lim&&G.tens<lim-.05;if(G.slack>25)o.hold=true;if(G.tens>.95)o.hold=false;if(G.L>gear('line')*.92&&G.tens<.97)o.hold=true;return o}
  return o}
function botShop(){if(G.mode!=='career')return;var order=['rod','line','reel','hook'],k;for(var n=0;n<8;n++){var did=false;
    for(var i=0;i<order.length;i++){k=order[i];var l=CAR.up[k];if(l<5&&CAR.money>=UP[k].cost[l]*1.1){CAR.money-=UP[k].cost[l];CAR.up[k]++;did=true;break}}
    BAITS.forEach(function(b){if(CAR.baits.indexOf(b.id)<0&&CAR.money>=b.cost*1.3){CAR.money-=b.cost;CAR.baits.push(b.id)}});
    LOCS.forEach(function(L,i){if(CAR.locs.indexOf(L.id)<0&&CAR.money>=L.cost*1.2&&caughtIn(i-1)>=7){CAR.money-=L.cost;CAR.locs.push(L.id)}});if(!did)break}
  /* fish the newest water whose fish the gear can hold; prefer the bait most of its species like */
  var li=CAR.locs.length-1;if(li!==CAR.loc&&(caughtIn(CAR.loc)>=7||Math.random()<.3)){CAR.loc=li;G.loc=li;F=[];for(var j=0;j<18;j++)spawnFish(true)}
  var cnt={};SP.forEach(function(s,i){if(s[1]!==G.loc)return;s[7].split('').forEach(function(b){if(CAR.baits.indexOf(b)>=0)cnt[b]=(cnt[b]||0)+(CAR.jr[i]?1:4)*s[6]})});var bb=G.bait,bc=-1;for(var b in cnt)if(cnt[b]>bc){bc=cnt[b];bb=b}G.bait=CAR.bait=bb;save()}
function caughtIn(li){if(li<0)return 99;var n=0;SP.forEach(function(s,i){if(s[1]===li&&CAR.jr[i])n++});return n}

/* ---------- fight model ---------- */
function fishF(f,mod){return(1.2+Math.pow(f.kg,.8)*1.6)*(mod==null?1:mod)}
function startFight(f){var s=SP[f.sp];G.st='fight';G.fish=f;f.st='hooked';G.L=Math.sqrt(sq(f.x-TIP.x)+sq(f.y-TIP.y));G.ang=Math.atan2(f.y-TIP.y,f.x-TIP.x);
  f.stam=f.maxStam=Math.min(4000,100+f.kg*8);f.ph=0;f.burst=0;f.jump=0;f.nx=120+Math.random()*120;G.tens=.3;G.slack=0;G.over=0;sfx('hook');GK.fx.shake(3,8)}
function fight(h){var f=G.fish,s=SP[f.sp],RS=gear('rod'),st=s[8];f.t+=.3;f.ph++;
  var mod=1;if(st==='s')mod=1+.2*Math.sin(f.ph*.03);else if(st==='v')mod=1.15;
  if(st==='d'){if(f.burst>0){f.burst--;mod=1.9}else{mod=.8;if(--f.nx<=0){f.burst=30;f.nx=120+Math.random()*120}}}
  if(st==='j'){if(f.jump>0){f.jump--;mod=0;if(f.jump===0){f.burst=40;splash(f.x,0,1)}}else if(f.burst>0){f.burst--;mod=2}else if(--f.nx<=0){f.jump=40;f.nx=250+Math.random()*150;splash(f.x,0,1)}}
  var Fp=fishF(f,mod)*(.35+.65*f.stam/f.maxStam);G.F=Fp;var reel=gear('reel'),target;
  if(h){G.L-=reel*(1-Math.min(.9,Fp/RS));target=Fp/RS+.3}else{G.L+=Fp/RS*1.2;target=Fp/RS*.55}
  G.tens+=(target-G.tens)*.25;
  f.stam=Math.max(0,f.stam-G.tens*(h?1.2:.6));if(G.tens<.2)f.stam=Math.min(f.maxStam,f.stam+.3);
  var want=st==='v'?1.25:st==='j'?.45:.7;G.ang+=(want-G.ang)*.01+(Math.sin(f.ph*.05)*.004);G.ang=GK.clamp(G.ang,.12,1.45);
  f.x=TIP.x+Math.cos(G.ang)*G.L;f.y=TIP.y+Math.sin(G.ang)*G.L;var bt=bottom(f.x);if(f.y>bt-6){f.y=bt-6}
  if(f.jump>0){f.y=-Math.sin((40-f.jump)/40*Math.PI)*Math.min(70,f.L*.9)}else if(f.y<4&&G.L>110)f.y=4;f.face=f.x<TIP.x+60?1:-1;
  if(G.tens<.14&&f.jump<=0)G.slack++;else G.slack=Math.max(0,G.slack-2);
  if(G.tens>1)G.over++;else G.over=Math.max(0,G.over-1);
  if(G.over>14||G.L>gear('line')){lose('snap');return}
  if(G.slack>50+G.up.hook*25){lose('slack');return}
  if(G.L<88){land(f)}
  G.reelSnd=(G.reelSnd||0)+(h?1:0);if(h&&G.reelSnd%6===0)GK.audio.tone(1800+Math.random()*200,.012,'square',.006);if(G.tens>.82&&T%9===0)GK.audio.tone(140+G.tens*120,.12,'sawtooth',.02)}
function lose(why){var f=G.fish;G.fish=null;f.st='flee';f.cd=600;G.st='reelin';G.msg={k:why,t:0};if(why==='snap'){ST.snaps++;sfx('snap');GK.fx.shake(6,12)}else sfx('slip');if(G.tut)tutF.lost=1}
function land(f){var s=SP[f.sp],kg=Math.round(f.kg*100)/100,val=Math.max(1,Math.round(kg*s[11]*2*(LEG[f.sp]?4:1)));
  F.splice(F.indexOf(f),1);G.fish=null;var nw=!CAR.jr[f.sp],rec=!nw&&kg>CAR.jr[f.sp].b;if(!CAR.jr[f.sp])CAR.jr[f.sp]={n:0,b:0};CAR.jr[f.sp].n++;CAR.jr[f.sp].b=Math.max(CAR.jr[f.sp].b,kg);
  ST.catches++;ST.kg=Math.round((ST.kg+kg)*10)/10;ST.big=Math.max(ST.big,kg);if(LEG[f.sp]&&nw)ST.legends++;
  if(G.mode==='career'){CAR.money+=val;CAR.earned+=val;ST.earned+=val}else G.score=Math.round((G.score+kg)*100)/100;
  save();G.print={sp:f.sp,kg:kg,val:val,nw:nw,rec:rec,t:0,L:f.L};G.st='print';G.lure.x=TIP.x;G.lure.y=TIP.y;sfx('land');if(G.tut)tutF.caught=1}
function splash(x,y,big){G.splash.push({x:x,y:y,t:0,big:big?1:0});GK.audio.noise(big?.3:.12,big?.06:.03,0,800)}

/* ---------- tick ---------- */
function step(){T++;GK.goals.tick();tut.tick();if(!G)return;var auto=Auto.on&&!G.tut,cmd=auto?botCmd():null,h=auto?cmd.hold:holding(),press=auto?cmd.press:G.press;G.press=false;
  G.t++;if(!LOCS[G.loc].dark)G.time++;
  if(G.st==='over'){G.overT=(G.overT||0)+1;if(auto&&G.overT>150)newGame(G.mode);return}
  if(G.timer>0){G.timer--;if(G.timer<=0){endTimed();return}}
  if(G.msg&&++G.msg.t>90)G.msg=null;
  for(var i=G.splash.length-1;i>=0;i--)if(++G.splash[i].t>40)G.splash.splice(i,1);
  fishAI();
  var L=G.lure,st=G.st;
  if(st==='idle'){bot.reelAll=0;L.x=TIP.x;L.y=TIP.y;if(h){G.st='charge';G.charge=0;G.cdir=1}}
  else if(st==='charge'){G.charge+=G.cdir*.016;if(G.charge>=1){G.charge=1;G.cdir=-1}if(G.charge<=0){G.charge=0;G.cdir=1}if(!h){G.st='fly';var tx=90+Math.max(.05,G.charge)*castMax();G.fly={x0:TIP.x,y0:TIP.y,x1:Math.min(tx,LOCS[G.loc].w-30),t:0};sfx('cast')}}
  else if(st==='fly'){var fl=G.fly;fl.t+=.022;var p=Math.min(1,fl.t);L.x=fl.x0+(fl.x1-fl.x0)*p;L.y=fl.y0+(0-fl.y0)*p-Math.sin(p*Math.PI)*120;if(p>=1){G.st='sink';L.y=0;splash(L.x,0);G.idleT=0;G.eng=null}}
  else if(st==='sink'){G.idleT++;var lm=gear('line'),moving=false;
    if(press&&G.eng&&G.eng.st==='bite'){startFight(G.eng);G.eng=null;return}
    if(press&&G.eng&&G.eng.st==='nibble'){G.eng.st='flee';G.eng.cd=400;G.eng=null;sfx('slip')}
    if(h){var dx=TIP.x-L.x,dy=-L.y,d=Math.sqrt(dx*dx+dy*dy)||1;L.x+=dx/d*gear('reel')*.55;L.y=Math.max(0,L.y+dy/d*gear('reel')*.9);moving=true;if(T%5===0)GK.audio.tone(1700,.01,'square',.004)}
    else{var bt=bottom(L.x);if(L.y<bt-4)L.y+=.7}
    if(LOCS[G.loc].cur&&!h)L.x+=LOCS[G.loc].cur*.3;
    var dd=Math.sqrt(sq(L.x-TIP.x)+sq(L.y-TIP.y));if(dd>lm){var k=lm/dd;L.x=TIP.x+(L.x-TIP.x)*k;L.y=TIP.y+(L.y-TIP.y)*k}
    G.jig=moving?Math.min(60,G.jig+2):Math.max(0,G.jig-1);
    if(L.x<TIP.x+30&&L.y<12){G.st='idle';if(G.eng){G.eng.st='swim';G.eng=null}}}
  else if(st==='fight'){fight(h)}
  else if(st==='reelin'){var dx2=TIP.x-L.x,dy2=TIP.y-L.y,d2=Math.sqrt(dx2*dx2+dy2*dy2);if(d2<8)G.st='idle';else{L.x+=dx2/d2*6;L.y+=dy2/d2*6}}
  else if(st==='print'){G.print.t++;if(G.print.t>40&&(press||auto&&G.print.t>70)){G.print=null;G.st='idle';if(auto)botShop()}}
  /* camera */ var fx=st==='fight'&&G.fish?G.fish.x:st==='sink'||st==='fly'||st==='reelin'?L.x:240,fy=st==='fight'&&G.fish?G.fish.y:st==='sink'||st==='fly'?L.y:20;
  var Lw=LOCS[G.loc].w,xlo=VW/2-30,xhi=Lw-VW/2+30,ylo=VH/2-230,yhi=LOCS[G.loc].deep+30-VH/2,cx=xhi<xlo?(xlo+xhi)/2:GK.clamp(fx,xlo,xhi),cy=yhi<ylo?(ylo+yhi)/2:GK.clamp(fy,ylo,yhi);G.cam.x+=(cx-G.cam.x)*.08;G.cam.y+=(cy-G.cam.y)*.08}
function fishAI(){var L=G.lure,night=isNight(),inWater=G.st==='sink';
  if(F.length<18&&G.t%40===0)spawnFish();
  for(var i=F.length-1;i>=0;i--){var f=F[i],s=SP[f.sp];f.t+=.12;if(f.cd>0)f.cd--;
    if(f.st==='hooked')continue;
    if((s[10]===1&&night||s[10]===2&&!night)&&f.st==='swim'&&Math.random()<.002){F.splice(i,1);continue}
    if(f.st==='swim'){if(Math.abs(f.x-f.tx)<4&&Math.abs(f.y-f.ty)<4||Math.random()<.003){var nx=GK.clamp(f.x+rnd(-160,160),140,LOCS[G.loc].w-40),bt=bottom(nx);if(bt>s[2]+6){f.tx=nx;f.ty=rnd(Math.max(6,s[2]),Math.min(s[3],bt-8))}}
      mv(f,f.tx,f.ty,f.sp2);
      if(inWater&&!G.eng&&f.cd<=0&&G.t%10===(i%10)){var d=Math.sqrt(sq(f.x-L.x)+sq(f.y-L.y)),notice=60+G.jig*.8+f.L*.3;
        if(d<notice){var like=s[7].indexOf(G.bait)>=0?1:.12;if(G.rng()<like*(.12+G.jig*.004)){f.st='come';G.eng=f}else f.cd=120}}}
    else if(f.st==='come'){if(!inWater||G.eng!==f){f.st='swim';continue}mv(f,L.x-f.face*f.L*.45,L.y,f.sp2*1.6);if(Math.sqrt(sq(f.x+f.face*f.L*.45-L.x)+sq(f.y-L.y))<10){f.st='nibble';f.nb=40+Math.random()*80}}
    else if(f.st==='nibble'){if(G.eng!==f){f.st='swim';continue}f.x=L.x-f.face*f.L*.45;f.y=L.y;if(--f.nb<=0){f.st='bite';f.bw=40+G.up.hook*8;sfx('bite');splash(L.x,Math.max(0,L.y),0);GK.fx.shake(2,6)}}
    else if(f.st==='bite'){if(G.eng!==f){f.st='swim';continue}f.x=L.x-f.face*f.L*.45;f.y=L.y;if(--f.bw<=0){f.st='flee';f.cd=500;G.eng=null}}
    else if(f.st==='flee'){mv(f,f.x+f.face*-200,f.y+30,1.4);if(f.cd<350)f.st='swim'}}}
function mv(f,tx,ty,sp){var dx=tx-f.x,dy=ty-f.y,d=Math.sqrt(dx*dx+dy*dy);if(d<.5)return;var k=Math.min(d,sp)/d;f.x+=dx*k;f.y+=dy*k;if(Math.abs(dx)>.5)f.face=dx>0?1:-1;var bt=bottom(f.x);if(f.y>bt-5)f.y=bt-5;if(f.y<3)f.y=3}
function endTimed(){var sc=G.score;if(G.mode==='derby')ST.derby=Math.max(ST.derby,sc);if(G.mode==='daily')ST.daily=GK.daily.claim(Math.round(sc*100)).n;save();G.st='over';G.overT=0}

/* ---------- fish drawing (shared by water, journal and print) ---------- */
function fishPath(c,sh,L,t){var H=L*(sh.h||.3)/2,w=Math.sin(t)*H*.35,n=L/2+(sh.snout||0)*L;c.beginPath();
  if(sh.eel){var amp=L*.05;c.moveTo(n,0);for(var i=0;i<=20;i++){var x=L/2-i/20*L,y=Math.sin(i*.5+t)*amp*(i/20)-H*(1-i/20*.7);c.lineTo(x,y)}for(var j=20;j>=0;j--){var x2=L/2-j/20*L,y2=Math.sin(j*.5+t)*amp*(j/20)+H*(1-j/20*.7);c.lineTo(x2,y2)}c.closePath();return}
  if(sh.flat){c.ellipse(0,0,L*.42,L*.2,0,0,TAU);c.moveTo(-L*.4,0);c.lineTo(-L*.55,-L*.08+w*.3);c.lineTo(-L*.55,L*.08+w*.3);c.closePath();return}
  if(sh.ray){var fl=Math.sin(t)*L*.08;c.moveTo(L*.3,0);c.quadraticCurveTo(0,-L*.5-fl,-L*.15,-L*.05);c.lineTo(-L*.15,L*.05);c.quadraticCurveTo(0,L*.5+fl,L*.3,0);c.closePath();return}
  if(sh.squid){c.moveTo(L*.5,0);c.lineTo(L*.05,-L*.11);c.lineTo(-L*.05,-L*.08);c.lineTo(-L*.05,L*.08);c.lineTo(L*.05,L*.11);c.closePath();for(var k=-3;k<=3;k++){c.moveTo(-L*.05,k*L*.02);c.lineTo(-L*.5,k*L*.035+Math.sin(t+k)*L*.03);c.lineTo(-L*.05,k*L*.02+1)}return}
  c.moveTo(n,0);c.bezierCurveTo(L*.3,-H*1.05,-L*.2,-H*.95,-L*.35,-H*.25);var tt=sh.tail||'f';
  if(tt==='f'){c.lineTo(-L*.5,-H*1.05+w);c.lineTo(-L*.42,w*.5);c.lineTo(-L*.5,H*1.05+w)}
  else if(tt==='r'){c.quadraticCurveTo(-L*.62,-H*.9+w,-L*.55,w);c.quadraticCurveTo(-L*.62,H*.9+w,-L*.35,H*.25)}
  else if(tt==='l'){c.lineTo(-L*.54,-H*1.5+w);c.quadraticCurveTo(-L*.44,w,-L*.54,H*1.5+w)}
  else{c.lineTo(-L*.56,-H*1.4+w);c.lineTo(-L*.46,w*.4);c.lineTo(-L*.5,H*.7+w)}
  c.lineTo(-L*.35,H*.25);c.bezierCurveTo(-L*.2,H*.9,L*.3,H*.95,n,0);c.closePath();
  if(sh.dor){var dh=H*(sh.dor===3?1.1:.6);c.moveTo(L*.08,-H*.92);if(sh.dor===2){for(var z=0;z<5;z++){c.lineTo(L*.06-z*L*.05,-H*.92-dh*(z%2?.4:1));}c.lineTo(-L*.2,-H*.8)}else{c.lineTo(-L*.02,-H*.92-dh);c.lineTo(-L*.16,-H*.78)}c.closePath()}
  if(sh.lobe){c.moveTo(-L*.05,H*.8);c.lineTo(-L*.12,H*1.35);c.lineTo(-L*.2,H*.75);c.closePath()}
  c.moveTo(L*.12,H*.6);c.lineTo(L*.02,H*1.15);c.lineTo(-L*.04,H*.7);c.closePath()}
function drawFish(c,i,L,t,col,bg,face,print){var s=SP[i],sh=SHP[s[9]],H=L*(sh.h||.3)/2;c.save();c.scale(face||1,1);c.fillStyle=col;c.strokeStyle=col;fishPath(c,sh,L,t);c.fill();
  if(sh.squid){c.lineWidth=Math.max(1,L*.02);c.stroke()}
  if(sh.ray){c.lineWidth=Math.max(1,L*.015);c.beginPath();c.moveTo(-L*.15,0);c.lineTo(-L*.75,Math.sin(t)*L*.05);c.stroke()}
  if(sh.bill){c.lineWidth=Math.max(1.2,L*.025);c.beginPath();c.moveTo(L*.45,-H*.1);c.lineTo(L*(.5+sh.bill),-H*.15);c.stroke()}
  if(sh.wh){c.lineWidth=Math.max(.8,L*.012);c.beginPath();for(var k=0;k<sh.wh;k++){c.moveTo(L*.46,H*.15);c.quadraticCurveTo(L*.5,H*(.6+k*.2),L*(.38-k*.06),H*(.9+k*.3))}c.stroke()}
  if(sh.lamp){c.lineWidth=Math.max(.8,L*.015);c.beginPath();c.moveTo(L*.3,-H*.8);c.quadraticCurveTo(L*.55,-H*1.9,L*(.5+sh.lamp*.25),-H*1.2);c.stroke();c.fillStyle=RED;c.beginPath();c.arc(L*(.5+sh.lamp*.25),-H*1.2,Math.max(1.5,L*.04),0,TAU);c.fill();c.fillStyle=col}
  if(sh.red){c.strokeStyle=RED;c.lineWidth=Math.max(1.5,L*.02);c.beginPath();for(var r=0;r<=12;r++){var x=L/2-r/12*L*.9,y=Math.sin(r*.5*1+t)*L*.05*(r/12)-H*(1-r/12*.7)-2;r?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}
  /* cut-throughs in the background colour: eye, spots, stripes, teeth, scute row */
  c.fillStyle=bg;var ex=sh.eel?L*.4:sh.flat?L*.25:sh.ray?L*.15:sh.squid?L*.15:L*.32,ey=sh.eel?-H*.25:sh.flat?-L*.06:sh.ray?0:-H*.25,er=Math.max(1.1,L*.03);
  c.beginPath();c.arc(ex,ey,er,0,TAU);if(sh.flat){c.moveTo(ex+er+L*.07,ey-L*.03);c.arc(ex+L*.07,ey-L*.03,er,0,TAU)}c.fill();if(L>40){c.fillStyle=col;c.beginPath();c.arc(ex+er*.3,ey,er*.45,0,TAU);c.fill();c.fillStyle=bg}
  if(sh.spot){c.globalAlpha=.55;for(var p=0;p<6;p++){c.beginPath();c.arc(L*(.15-p*.08),H*(p%2?.3:-.35),Math.max(.8,L*.018),0,TAU);c.fill()}c.globalAlpha=1}
  if(sh.str){c.globalAlpha=.4;for(var q=0;q<sh.str;q++){c.fillRect(L*(.18-q*.1),-H*.8,Math.max(.8,L*.018),H*1.4)}c.globalAlpha=1}
  if(sh.dots){for(var d=0;d<5;d++){c.fillStyle=d%2?RED:bg;c.beginPath();c.arc(L*(.25-d*.12),H*.55,Math.max(.8,L*.025),0,TAU);c.fill()}}
  if(sh.teeth){c.fillStyle=bg;c.beginPath();for(var tt=0;tt<4;tt++){c.moveTo(L*(.46-tt*.04),0);c.lineTo(L*(.44-tt*.04),H*.25);c.lineTo(L*(.42-tt*.04),0)}c.fill()}
  if(sh.scute){c.fillStyle=bg;for(var u=0;u<6;u++){c.beginPath();var ux=L*(.25-u*.1);c.moveTo(ux,-H*.8);c.lineTo(ux+L*.02,-H*.65);c.lineTo(ux,-H*.5);c.lineTo(ux-L*.02,-H*.65);c.fill()}}
  if(sh.spk){c.strokeStyle=col;c.lineWidth=Math.max(.8,L*.015);c.beginPath();for(var a=0;a<14;a++){var an=a/14*TAU,rx=Math.cos(an)*L*.36,ry=Math.sin(an)*H*.95;c.moveTo(rx,ry);c.lineTo(rx*1.18,ry*1.25)}c.stroke()}
  if(sh.mouth){c.fillStyle=bg;c.beginPath();c.moveTo(L*.5,0);c.lineTo(L*.2,-H*.6);c.lineTo(L*.2,H*.6);c.fill()}
  if(print){/* the rubbing: rows of scale arcs pressed into the ink */ c.save();fishPath(c,sh,L,t);c.clip();c.strokeStyle=bg;c.globalAlpha=.35;c.lineWidth=1;var sz=Math.max(4,L*.05);for(var yy=-H*1.2;yy<H*1.2;yy+=sz*.8)for(var xx=-L*.35;xx<L*.3;xx+=sz){c.beginPath();c.arc(xx+((yy/sz|0)%2)*sz*.5,yy,sz*.55,-1.2,1.2);c.stroke()}c.restore()}
  c.restore()}

/* ---------- world drawing ---------- */
var DAYW=['#e9e2d2','#ded6c5','#d1c9b8','#c4bcab','#b6ae9e','#a8a090','#9b9384'],NITW=['#2a2723','#25221f','#211e1b','#1c1a18','#181614','#141311','#100f0e'];
function P(){var n=G&&isNight();return{n:n,sky:n?INK:PAPER,ink:n?PAPER:INK,bg:n?INK:PAPER,water:n?NITW:DAYW,ground:n?'#3a352f':'#8f877a'}}
function render(){var v=GK.view,c=ctx,pal=P();c.setTransform(v.dpr,0,0,v.dpr,0,0);c.fillStyle=pal.sky;c.fillRect(0,0,v.w,v.h);if(!G)return;
  var so=GK.fx.offset();c.setTransform(v.dpr*Z,0,0,v.dpr*Z,v.dpr*(v.w/2-(G.cam.x+so.x)*Z),v.dpr*(v.h/2-(G.cam.y+so.y)*Z));
  var x0=G.cam.x-VW/2-20,x1=G.cam.x+VW/2+20,y0=G.cam.y-VH/2-20,y1=G.cam.y+VH/2+20,Lc=LOCS[G.loc];
  drawSky(c,pal,x0,x1,y0);
  /* water in stepped depth bands, each edge an inked line */ for(var b=0;b<7;b++){var ya=b*140,yb=(b+1)*140;if(yb<y0||ya>y1)continue;c.fillStyle=pal.water[b];c.fillRect(Math.max(x0,0),Math.max(ya,0),x1-Math.max(x0,0),yb-Math.max(ya,0));
    if(b>0){c.strokeStyle=pal.ink;c.globalAlpha=.25;c.lineWidth=1;c.beginPath();for(var bx=Math.floor(x0/14)*14;bx<x1;bx+=14)c.lineTo(bx,ya+Math.sin(bx*.04+b)*1.5);c.stroke();c.globalAlpha=1}}
  /* surface */ c.strokeStyle=pal.ink;c.lineWidth=2;c.beginPath();for(var sx=Math.floor(x0/8)*8;sx<x1;sx+=8)c.lineTo(sx,Math.sin(sx*.05+T*.05)*1.6);c.stroke();
  c.lineWidth=1;c.globalAlpha=.5;for(var wx=Math.floor(x0/90)*90;wx<x1;wx+=90){var ww=(wx*7919)%60;c.beginPath();c.moveTo(wx+ww,6+(wx%3)*3);c.quadraticCurveTo(wx+ww+10,3+(wx%3)*3,wx+ww+22,6+(wx%3)*3);c.stroke()}c.globalAlpha=1;
  drawPlants(c,pal,x0,x1);
  F.forEach(function(f){if(f.x<x0-80||f.x>x1+80||f.y<y0-60||f.y>y1+60||f===G.fish)return;c.save();c.translate(f.x,f.y);c.globalAlpha=pal.n?.85:.9;drawFish(c,f.sp,f.L,f.t,pal.ink,pal.water[Math.min(6,Math.floor(f.y/140))],f.face);c.restore()});
  /* ground */ c.fillStyle=pal.ground;c.beginPath();c.moveTo(Math.max(0,x0),y1+40);for(var gx=Math.max(0,Math.floor(x0/10)*10);gx<=Math.min(Lc.w,x1+10);gx+=10)c.lineTo(gx,bottom(gx));c.lineTo(Math.min(Lc.w,x1+10),y1+40);c.fill();
  c.strokeStyle=pal.ink;c.lineWidth=2;c.beginPath();for(var gx2=Math.max(0,Math.floor(x0/10)*10);gx2<=Math.min(Lc.w,x1+10);gx2+=10)c.lineTo(gx2,bottom(gx2));c.stroke();
  c.globalAlpha=.3;c.lineWidth=1;c.beginPath();for(var hx=Math.max(0,Math.floor(x0/16)*16);hx<Math.min(Lc.w,x1);hx+=16){var by=bottom(hx);c.moveTo(hx,by+6);c.lineTo(hx-6,by+16)}c.stroke();c.globalAlpha=1;
  drawPier(c,pal);
  var L=G.lure,f=G.fish,lx=f?f.x:L.x,ly=f?f.y:L.y;
  /* rod bends with tension */ var bend=G.st==='fight'?G.tens:0,hx2=72,hy2=-36;c.strokeStyle=pal.ink;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(hx2,hy2);c.quadraticCurveTo(88,-70+bend*10,TIP.x+bend*6,TIP.y+bend*22);c.stroke();
  var tx=TIP.x+bend*6,ty=TIP.y+bend*22;
  if(G.st!=='idle'&&G.st!=='charge'&&G.st!=='print'&&G.st!=='over'){c.lineWidth=1;c.strokeStyle=G.st==='fight'&&G.tens>.85?RED:pal.ink;c.beginPath();c.moveTo(tx,ty);var sag=G.st==='fight'?Math.max(0,.4-G.tens)*120:G.st==='sink'?40:10;c.quadraticCurveTo((tx+lx)/2,(ty+ly)/2+sag,lx,ly);c.stroke()}
  if(f){c.save();c.translate(f.x,f.y);if(f.jump>0)c.rotate(-f.face*.5);drawFish(c,f.sp,f.L,f.t*2,pal.ink,pal.water[Math.max(0,Math.min(6,Math.floor(f.y/140)))],f.face);c.restore()}
  if(G.st!=='idle'&&G.st!=='charge'&&G.st!=='print'&&!f){var jx=0,jy=0;if(G.eng&&G.eng.st==='nibble'){jx=Math.sin(T*1.3)*1.5;jy=Math.cos(T*1.7)*1.5}if(G.eng&&G.eng.st==='bite')jy=4;c.fillStyle=RED;c.beginPath();c.arc(L.x+jx,L.y+jy,3.6,0,TAU);c.fill();
    if(G.eng&&G.eng.st==='bite'){c.strokeStyle=RED;c.lineWidth=2;var rr=(T%20)*1.4+8;c.beginPath();c.arc(L.x,L.y,rr,0,TAU);c.stroke()}}
  G.splash.forEach(function(s){c.strokeStyle=pal.ink;c.lineWidth=1.5;var r=s.t*(s.big?1.4:.8);c.globalAlpha=1-s.t/40;c.beginPath();c.ellipse(s.x,s.y,r,r*.3,0,0,TAU);c.stroke();c.beginPath();for(var k=-2;k<=2;k++){c.moveTo(s.x+k*5,s.y);c.lineTo(s.x+k*8,s.y-(12-Math.abs(k)*3)*(1-s.t/40)*(s.big?2:1))}c.stroke();c.globalAlpha=1});
  GK.fx.draw(c);
  c.setTransform(v.dpr,0,0,v.dpr,0,0);drawHud(c,pal);if(G.print)drawPrint(c,pal);if(G.st==='over')drawOver(c,pal);if(tut.active)tutDraw(c)}
function drawSky(c,pal,x0,x1,y0){var Lc=LOCS[G.loc];if(y0>0)return;var ph=(G.time%DAY)/DAY;
  if(!Lc.dark){var sunA=ph<.62?ph/.62:(ph-.62)/.33,sx=120+sunA*(Lc.w-240),sy=-60-Math.sin(sunA*Math.PI)*120;if(!isNight()){c.fillStyle=RED;c.beginPath();c.arc(sx,sy,26,0,TAU);c.fill()}else{c.fillStyle=pal.ink;c.beginPath();c.arc(sx,sy,18,0,TAU);c.fill();c.fillStyle=pal.sky;c.beginPath();c.arc(sx+7,sy-4,15,0,TAU);c.fill()}}
  c.fillStyle=pal.ink;c.strokeStyle=pal.ink;var id=Lc.id;c.globalAlpha=.85;
  if(id==='lake'||id==='trench'&&false){c.beginPath();c.moveTo(Lc.w*.4,0);[[.5,-120],[.58,-70],[.66,-160],[.78,-60],[.86,-110],[.95,0]].forEach(function(p){c.lineTo(Lc.w*p[0],p[1])});c.closePath();c.globalAlpha=.18;c.fill();c.globalAlpha=.85}
  if(id==='river'){var bx=Lc.w*.62;c.lineWidth=4;c.beginPath();c.moveTo(bx-120,-30);c.quadraticCurveTo(bx,-120,bx+120,-30);c.stroke();c.lineWidth=2;for(var k=-4;k<=4;k++){var px=bx+k*25,py=-30-(1-sq(k/4.8))*88;c.beginPath();c.moveTo(px,py);c.lineTo(px,-2);c.stroke()}}
  if(id==='coast'){var lh=Lc.w-90;c.beginPath();c.moveTo(lh-16,0);c.lineTo(lh-10,-130);c.lineTo(lh+10,-130);c.lineTo(lh+16,0);c.fill();c.fillStyle=RED;c.fillRect(lh-12,-148,24,18);c.fillStyle=pal.ink;c.globalAlpha=.6;c.fillRect(lh-12,-100,22,10);c.fillRect(lh-14,-60,28,10)}
  if(id==='pond'){var wx=Lc.w-120;c.lineWidth=3;c.beginPath();c.moveTo(wx,0);c.lineTo(wx-4,-140);c.stroke();c.lineWidth=1.2;for(var b=0;b<14;b++){var ang=b/14*Math.PI;c.beginPath();c.moveTo(wx-4,-140);c.quadraticCurveTo(wx-4+Math.cos(ang)*60,-150,wx-4+Math.cos(ang)*80+Math.sin(T*.02+b)*3,-30-b%3*12);c.stroke()}}
  c.globalAlpha=1}
function drawPlants(c,pal,x0,x1){var Lc=LOCS[G.loc];c.strokeStyle=pal.ink;c.lineWidth=1.3;c.globalAlpha=.5;
  for(var x=Math.max(130,Math.floor(x0/37)*37);x<Math.min(Lc.w,x1);x+=37){var h=(x*13)%7,by=bottom(x);if(Lc.id==='trench'){if(h<1){c.beginPath();c.moveTo(x-6,by);c.lineTo(x-3,by-24);c.lineTo(x+3,by-24);c.lineTo(x+6,by);c.stroke();for(var b=0;b<3;b++){var bb=((T*.5+b*20+x)%60);c.beginPath();c.arc(x+Math.sin(bb*.2)*3,by-26-bb,1.5+b*.4,0,TAU);c.stroke()}}continue}
    if(h<3&&by<Lc.deep*.9){var tall=Lc.id==='coast'?60+h*20:24+h*10;c.beginPath();c.moveTo(x,by);for(var k=1;k<=6;k++)c.lineTo(x+Math.sin(T*.03+k+x)*4*k/6,by-tall*k/6);c.stroke()}}
  if(Lc.id==='pond'||Lc.id==='river'){c.globalAlpha=.8;c.lineWidth=2;for(var r=0;r<9;r++){var rx=112+r*7;c.beginPath();c.moveTo(rx,bottom(rx));c.lineTo(rx+Math.sin(T*.02+r)*2,-26-r%3*10);c.stroke()}}
  c.globalAlpha=1}
function drawPier(c,pal){var Lc=LOCS[G.loc];c.fillStyle=pal.ink;c.strokeStyle=pal.ink;
  if(Lc.id==='trench'||Lc.id==='coast'){c.beginPath();c.moveTo(0,-10);c.lineTo(130,-10);c.lineTo(112,8);c.lineTo(18,8);c.closePath();c.fill();c.lineWidth=2;c.beginPath();c.moveTo(30,-10);c.lineTo(30,-50);c.stroke()}
  else{c.fillRect(-200,-12,315,6);for(var p=0;p<4;p++)c.fillRect(p*32,-12,5,Math.max(20,bottom(p*32+2)+10));}
  /* the angler: straw hat, coat, sitting on the end */ c.beginPath();c.moveTo(50,-12);c.lineTo(56,-44);c.lineTo(74,-44);c.lineTo(76,-12);c.closePath();c.fill();c.beginPath();c.arc(64,-50,7,0,TAU);c.fill();
  c.beginPath();c.moveTo(46,-54);c.lineTo(64,-66);c.lineTo(82,-54);c.closePath();c.fill();c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(66,-38);c.lineTo(72,-36);c.stroke()}
function drawHud(c,pal){var v=GK.view,W=v.w;c.textBaseline='middle';
  /* seal with the purse */ c.fillStyle=RED;c.fillRect(12,12,34,34);GK.icoDraw(c,G.mode==='career'?'coin':'weight',29,29,22,PAPER,1.8);c.fillStyle=pal.ink;c.font='800 24px "Shippori Mincho B1",serif';c.textAlign='left';c.fillText(G.mode==='career'?String(CAR.money):String(G.score),54,30);
  GK.icoDraw(c,BAITS.filter(function(b){return b.id===G.bait})[0].ic,29,64,20,pal.ink,1.7);
  if(G.timer>0){var s=Math.ceil(G.timer/60);c.textAlign='right';c.fillText(Math.floor(s/60)+':'+String(s%60).padStart(2,'0'),W-14,30)}
  else{GK.icoDraw(c,isNight()?'moon':'sun',W-28,29,24,isNight()?pal.ink:RED,1.8);GK.icoDraw(c,LOCS[G.loc].ic,W-60,29,22,pal.ink,1.7)}
  /* depth scale down the left edge when the lure is under */ if(G.st==='sink'||G.st==='fight'){var yy=G.st==='fight'&&G.fish?G.fish.y:G.lure.y;c.font='500 12px "Shippori Mincho B1",serif';c.textAlign='left';var top=v.h/2+(0-G.cam.y)*Z;
    for(var d=50;d<LOCS[G.loc].deep;d+=50){var sy=v.h/2+(d-G.cam.y)*Z;if(sy<80||sy>v.h-10)continue;c.fillStyle=pal.ink;c.fillRect(0,sy,d%100?5:9,1.2);if(d%100===0)c.fillText(String(d/10),11,sy)}
    var ly=v.h/2+(yy-G.cam.y)*Z;if(ly>top){c.fillStyle=RED;c.beginPath();c.moveTo(0,ly-5);c.lineTo(7,ly);c.lineTo(0,ly+5);c.fill()}}
  /* cast power: an inked arc beside the angler */ if(G.st==='charge'){var ax=v.w/2+(70-G.cam.x)*Z,ay=v.h/2+(-60-G.cam.y)*Z,R=46;c.strokeStyle=pal.ink;c.lineWidth=2;c.beginPath();c.arc(ax,ay,R,-Math.PI*.95,-Math.PI*.05);c.stroke();c.strokeStyle=RED;c.lineWidth=7;c.beginPath();c.arc(ax,ay,R,-Math.PI*.95,-Math.PI*.95+G.charge*Math.PI*.9);c.stroke()}
  /* tension gauge: a half dial, crimson at the top end */ if(G.st==='fight'){var gx=W/2,gy=v.h-34,GR=Math.min(120,W*.3);c.lineWidth=10;c.strokeStyle=pal.ink;c.globalAlpha=.2;c.beginPath();c.arc(gx,gy,GR,Math.PI,0);c.stroke();c.globalAlpha=1;
    c.strokeStyle=RED;c.beginPath();c.arc(gx,gy,GR,-Math.PI*.15,0);c.stroke();c.strokeStyle=pal.ink;c.lineWidth=2;c.beginPath();c.arc(gx,gy,GR-9,Math.PI,Math.PI*1.14);c.stroke();
    var a=Math.PI+Math.min(1.08,G.tens)*Math.PI;c.lineWidth=3;c.strokeStyle=G.tens>.85?RED:pal.ink;c.beginPath();c.moveTo(gx,gy);c.lineTo(gx+Math.cos(a)*(GR+6),gy+Math.sin(a)*(GR+6));c.stroke();c.fillStyle=pal.ink;c.beginPath();c.arc(gx,gy,5,0,TAU);c.fill();
    var f=G.fish;c.fillStyle=pal.ink;c.globalAlpha=.25;c.fillRect(gx-GR*.6,gy+12,GR*1.2,5);c.globalAlpha=1;c.fillRect(gx-GR*.6,gy+12,GR*1.2*f.stam/f.maxStam,5);
    if(G.slack>10){c.fillStyle=RED;c.globalAlpha=Math.min(1,G.slack/40);c.beginPath();c.arc(gx-GR-14,gy,6,0,TAU);c.fill();c.globalAlpha=1}}
  if(G.msg){GK.icoDraw(c,G.msg.k==='snap'?'snap':'hook',W/2,v.h*.35,46,RED,2)}}
function drawPrint(c,pal){var v=GK.view,p=G.print,t=p.t,W=Math.min(v.w-24,560),H=Math.min(v.h-40,W*.62),x=(v.w-W)/2,drop=Math.min(1,t/16),y=(v.h-H)/2-(1-drop)*v.h*.6;
  c.fillStyle='rgba(29,27,25,.35)';c.fillRect(0,0,v.w,v.h);c.fillStyle=PAPER;c.fillRect(x,y,W,H);c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(x+6,y+6,W-12,H-12);
  if(t>18){var a=Math.min(1,Math.floor((t-18)/5)/3);c.save();c.globalAlpha=a;c.translate(x+W*.46,y+H*.5);var L=Math.min(W*.68,Math.max(W*.4,p.L*3));drawFish(c,p.sp,L,0,INK,PAPER,1,true);c.restore()}
  if(t>34){var sc=Math.max(1,1.8-(t-34)*.1);c.save();c.translate(x+W-62,y+H-58);c.scale(sc,sc);c.rotate(-.08);c.fillStyle=RED;c.fillRect(-38,-30,76,60);c.fillStyle=PAPER;c.font='800 22px "Shippori Mincho B1",serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText(p.kg>=10?String(Math.round(p.kg)):p.kg.toFixed(p.kg<1?2:1),0,-6);GK.icoDraw(c,'weight',0,16,16,PAPER,1.6);c.restore();
    if(p.nw||p.rec){c.strokeStyle=RED;c.lineWidth=3;c.beginPath();c.arc(x+44,y+44,22,0,TAU);c.stroke();GK.icoDraw(c,p.nw?'star':'up',x+44,y+44,24,RED,2)}
    if(G.mode==='career'){c.fillStyle=INK;c.font='800 20px "Shippori Mincho B1",serif';c.textAlign='left';c.textBaseline='middle';GK.icoDraw(c,'coin',x+28,y+H-30,18,INK,1.7);c.fillText('+'+p.val,x+42,y+H-29)}}}
function drawOver(c,pal){var v=GK.view;c.fillStyle='rgba(241,235,221,.92)';c.fillRect(0,0,v.w,v.h);c.fillStyle=RED;c.fillRect(v.w/2-60,v.h/2-110,120,120);GK.icoDraw(c,'weight',v.w/2,v.h/2-50,60,PAPER,2);
  c.fillStyle=INK;c.font='800 54px "Shippori Mincho B1",serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(G.score),v.w/2,v.h/2+50);if(G.overT>40)GK.pulse(c,v.w/2,v.h/2+110,G.overT,RED,10)}

/* ---------- menus ---------- */
function modal(fill){var m=document.createElement('div');m.className='gk-modal';var sh=document.createElement('div');sh.className='gk-sheet';m.appendChild(sh);m.onpointerdown=function(e){if(e.target===m)m.remove()};document.body.appendChild(m);
  function head(html){var hd=document.createElement('div');hd.className='gk-mh';hd.innerHTML='<span style="display:flex;gap:10px;align-items:center">'+html+'</span>';var x=document.createElement('button');x.className='gk-b';x.textContent='×';x.onclick=function(){m.remove()};hd.appendChild(x);sh.appendChild(hd)}
  fill(sh,head,function(){sh.innerHTML='';fill(sh,head,arguments.callee)});return m}
function money(){return'<span class="seal">'+GK.icoSvg('coin')+'</span>'+CAR.money}
function openShop(){if(G.mode!=='career'||G.st!=='idle')return;if(tut.active)tutF.sh=1;modal(function draw(sh,head){sh.innerHTML='';head(money());var rows=document.createElement('div');rows.className='rows';
    Object.keys(UP).forEach(function(k){var l=CAR.up[k],c=l<5?UP[k].cost[l]:0,r=document.createElement('div');r.className='row';r.title=UP[k].nm;var pp='';for(var i=0;i<5;i++)pp+='<i class="'+(i<l?'on':'')+'"></i>';
      r.innerHTML=GK.icoSvg(UP[k].ic)+'<div class="pp">'+pp+'</div>';var b=document.createElement('button');b.className='buy'+(c?'':' max');b.innerHTML=GK.icoSvg('coin')+c;b.disabled=!c||CAR.money<c;b.onclick=function(){if(c&&CAR.money>=c){CAR.money-=c;CAR.up[k]++;save();sfx('buy');draw(sh,head)}};r.appendChild(b);rows.appendChild(r)});sh.appendChild(rows);
    var lab=document.createElement('div');lab.className='lab';lab.innerHTML=GK.icoSvg('worm');sh.appendChild(lab);var ch=document.createElement('div');ch.className='chips';
    BAITS.forEach(function(bt){var own=CAR.baits.indexOf(bt.id)>=0;if(own)return;var b=document.createElement('button');b.className='chip lock';b.title=bt.nm;b.innerHTML=GK.icoSvg(bt.ic)+GK.icoSvg('coin')+bt.cost;b.disabled=CAR.money<bt.cost;b.onclick=function(){if(CAR.money>=bt.cost){CAR.money-=bt.cost;CAR.baits.push(bt.id);save();sfx('buy');draw(sh,head)}};ch.appendChild(b)});sh.appendChild(ch)})}
function openBait(){if(G.st!=='idle'&&G.st!=='charge')return;if(tut.active)tutF.bt=1;modal(function(sh,head){head(GK.icoSvg('worm'));var ch=document.createElement('div');ch.className='chips';
    BAITS.forEach(function(bt){if(G.baits.indexOf(bt.id)<0)return;var b=document.createElement('button');b.className='chip'+(G.bait===bt.id?' on':'');b.title=bt.nm;b.innerHTML=GK.icoSvg(bt.ic);b.onclick=function(){G.bait=bt.id;if(G.mode==='career'){CAR.bait=bt.id;save()}document.querySelector('.gk-modal').remove()};ch.appendChild(b)});sh.appendChild(ch)})}
function openMap(){if(G.mode!=='career'||G.st!=='idle')return;if(tut.active)tutF.mp=1;modal(function draw(sh,head){sh.innerHTML='';head(money());var rows=document.createElement('div');rows.className='chips';
    LOCS.forEach(function(L,i){var own=CAR.locs.indexOf(L.id)>=0,b=document.createElement('button');b.className='chip'+(G.loc===i?' on':'')+(own?'':' lock');b.title=L.nm;b.innerHTML=GK.icoSvg(L.ic)+(own?'<span>'+caughtIn(i)+'/12</span>':GK.icoSvg('coin')+L.cost);b.disabled=!own&&CAR.money<L.cost;
      b.onclick=function(){if(!own){if(CAR.money<L.cost)return;CAR.money-=L.cost;CAR.locs.push(L.id);sfx('buy')}CAR.loc=i;G.loc=i;F=[];for(var j=0;j<18;j++)spawnFish(true);save();document.querySelector('.gk-modal').remove()};rows.appendChild(b)});sh.appendChild(rows)})}
function openJournal(){if(tut.active)tutF.jr=1;var tab=G.loc;modal(function draw(sh,head){sh.innerHTML='';head(GK.icoSvg('book')+'<span>'+Object.keys(CAR.jr).length+' / 60</span>');var tabs=document.createElement('div');tabs.className='tabs';
    LOCS.forEach(function(L,i){var b=document.createElement('button');b.className='tab'+(tab===i?' on':'');b.title=L.nm;b.innerHTML=GK.icoSvg(L.ic)+'<span>'+caughtIn(i)+'</span>';b.onclick=function(){tab=i;draw(sh,head)};tabs.appendChild(b)});sh.appendChild(tabs);
    var g=document.createElement('div');g.className='jgrid';SP.forEach(function(s,i){if(s[1]!==tab)return;var jr=CAR.jr[i],d=document.createElement('div');d.className='jc'+(jr?' got':'')+(LEG[i]?' leg':'');d.title=jr?s[0]:'?';
      var c2=document.createElement('canvas');c2.width=192;c2.height=104;var x=c2.getContext('2d');x.scale(2,2);x.translate(48,26);var L=Math.min(80,36+Math.log(1+s[5])*9);
      if(jr)drawFish(x,i,L,0,INK,PAPER,1,true);else{x.setLineDash([3,3]);x.strokeStyle='rgba(29,27,25,.45)';x.lineWidth=1.2;fishPath(x,SHP[s[9]],L,0);x.stroke()}
      d.appendChild(c2);var t=document.createElement('span');t.innerHTML=jr?(jr.b>=10?Math.round(jr.b):jr.b.toFixed(jr.b<1?2:1))+' <small>×'+jr.n+'</small>':'&nbsp;';d.appendChild(t);g.appendChild(d)});sh.appendChild(g)})}

/* ---------- sound: hirajoshi scale for the good moments ---------- */
var HJ=[293.7,311.1,392,440,466.2,587.3,622.3,784];
function sfx(k){var A=GK.audio,t=A.ctx&&A.ctx.currentTime;if(!A.ctx)return;switch(k){
  case'cast':A.noise(.25,.03,0,1500);break;case'bite':A.tone(220,.12,'triangle',.05,1.6);A.noise(.1,.05,0,600);break;case'hook':A.tone(330,.15,'square',.03,.5);break;
  case'snap':A.tone(900,.25,'sawtooth',.05,.2);break;case'slip':A.tone(300,.3,'sine',.04,.5);break;case'buy':A.tone(784,.12,'triangle',.04);A.tone(1047,.2,'triangle',.04,1,t+.08);break;
  case'land':[0,2,3,5,7].forEach(function(n,i){A.tone(HJ[n],.5,'triangle',.05,1,t+i*.09)});break}}

/* ---------- tutorial: cast, strike, fight, admire ---------- */
var tutF={};
var tut=GK.tutorial({parent:stage,onStart:function(){newGame('career');G.tut=true;G.loc=0;G.bait='w';G.up={rod:0,reel:0,line:0,hook:2};F=[];tutF={}},onEnd:function(){['jr','bt','sh','mp'].forEach(function(k){if(B[k])B[k].classList.remove('pulse')});newGame()},steps:[
  {done:function(){return G&&G.st==='sink'}},
  {init:function(){var L=G.lure;F.push({sp:1,kg:.3,L:fishLen(.3),x:L.x+50,y:Math.min(40,bottom(L.x)-10),tx:L.x,ty:20,face:-1,t:0,st:'swim',cd:0,sp2:.4})},update:function(){var L=G.lure;if(G.st==='sink'&&!G.eng&&F[0]&&F[0].st==='swim'){F[0].st='come';G.eng=F[0]}if(G.st==='idle'&&F.length)G.st='idle'},done:function(){return G&&G.st==='fight'}},
  {done:function(){return G&&tutF.caught||tutF.lost}},
  {done:function(){return G&&G.st==='idle'}},
  {init:function(){tutF.jr=0;tutBtn('jr')},done:function(){return tutF.jr&&!document.querySelector('.gk-modal')}},
  {init:function(){tutF.bt=0;tutBtn('bt')},done:function(){return tutF.bt&&!document.querySelector('.gk-modal')}},
  {init:function(){tutF.sh=0;tutBtn('sh')},done:function(){return tutF.sh&&!document.querySelector('.gk-modal')}},
  {init:function(){tutF.mp=0;tutBtn('mp')},done:function(){return tutF.mp&&!document.querySelector('.gk-modal')}}]});
function tutBtn(id){['jr','bt','sh','mp'].forEach(function(k){if(B[k])B[k].classList.remove('pulse')});if(B[id])B[id].classList.add('pulse')}
(function(){var st=document.createElement('style');st.textContent='.gk-b.pulse{outline:3px solid #b3202a;outline-offset:2px;animation:anp .8s steps(1) infinite}@keyframes anp{50%{outline-color:transparent}}';document.head.appendChild(st)})();
function tutDraw(c){var v=GK.view,t=tut.t;if(!G)return;var sx=function(x){return v.w/2+(x-G.cam.x)*Z},sy=function(y){return v.h/2+(y-G.cam.y)*Z};
  if(tut.i===0&&(G.st==='idle'||G.st==='charge'))GK.pulse(c,v.w/2,v.h*.62,t,RED,16);
  if(tut.i===1&&G.eng&&G.eng.st==='bite')GK.pulse(c,sx(G.lure.x),sy(G.lure.y),t*2,RED,12);
  if(tut.i===1&&G.st==='idle')GK.pulse(c,v.w/2,v.h*.62,t,RED,16);
  if(tut.i===2&&G.st==='fight'&&(t%120)<60)GK.pulse(c,v.w/2,v.h-34,t,RED,14);
  if(tut.i===3&&G.print&&G.print.t>40)GK.pulse(c,v.w/2,v.h*.78,t,RED,12)}

/* ---------- bar ---------- */
var B=GK.controls(document.getElementById('bar'),{bar:'right',onHelp:function(){tut.start()},extra:[
  {id:'jr',html:GK.icoSvg('book'),title:'Journal',fn:function(){openJournal()}},
  {id:'bt',html:GK.icoSvg('worm'),title:'Bait',fn:function(){openBait()}},
  {id:'sh',html:GK.icoSvg('rod'),title:'Tackle shop',fn:function(){openShop()}},
  {id:'mp',html:GK.icoSvg('map'),title:'Waters',fn:function(){openMap()}},
  {id:'m_career',cls:'md',html:GK.icoSvg('hook'),title:'Career',fn:function(){setMode('career')}},
  {id:'m_derby',cls:'md',html:GK.icoSvg('clock'),title:'Derby',fn:function(){setMode('derby')}},
  {id:'m_daily',cls:'md',html:GK.icoSvg('sun'),title:'Daily',fn:function(){setMode('daily')}}]});
['m_career','m_derby','m_daily'].forEach(function(id){B.panel.insertBefore(B[id],B.panel.firstChild)});
function setMode(m){if(tut.active)return;MODE=m;GK.ls.set('mode',m);paint();newGame(m)}
function paint(){['career','derby','daily'].forEach(function(k){B['m_'+k].classList.toggle('on',MODE===k)});var car=MODE==='career';B.sh.hidden=!car;B.mp.hidden=!car}
setInterval(function(){if(G&&B.bt){var ic=BAITS.filter(function(b){return b.id===G.bait})[0].ic;if(B.bt.dataset.ic!==ic){B.bt.dataset.ic=ic;B.bt.innerHTML=GK.icoSvg(ic)}}},400);
cv.addEventListener('pointerdown',function(){if(G&&G.st==='over'&&G.overT>40)newGame(G.mode)});
GK.goals.setup({metrics:function(){return ST},defs:{species:{ic:'book',t:[5,15,30,45,60]},kg:{ic:'weight',t:[10,100,1000,10000]},big:{ic:'fish',t:[1,10,50,200,500]},legends:{ic:'crown',t:[1,3,5]},
  earned:{ic:'coin',t:[500,5000,50000,200000]},catches:{ic:'hook',t:[10,100,500,2000]},locs:{ic:'map',t:[2,3,4,5]},derby:{ic:'clock',t:[20,80,200]},daily:{ic:'sun',t:[1,3,7,14,30]},snaps:{ic:'snap',t:[1,10]}}});
GK.goals.mount(B);
GK.guide({title:'Angler',goal:'Catch all 60 fish across five waters and press each into your journal.',
 how:['Hold to swing the power arc, release to cast.','Hold to reel the lure up and in, release to let it sink. A moving lure gets noticed.','When the lure trembles a fish is nibbling: wait. When it jerks and a red ring flashes, tap to strike.','Fighting: hold to reel, release to give line. The needle in the dial must stay out of the red, or the line snaps. Too slack for too long and the fish slips off.','Fish sell as you land them. Spend money in the tackle shop and unlock new waters on the map. Each bait attracts different fish, and some only come out at night.'],
 keys:[['Space / hold mouse','cast, reel, fight'],['Space / click','strike on the bite']],touch:[['Hold anywhere','cast, reel, fight'],['Tap','strike on the bite']],
 legend:[{pic:function(c,s){c.fillStyle=RED;c.beginPath();c.arc(s/2,s/2,6,0,TAU);c.fill();c.strokeStyle=RED;c.lineWidth=2;c.beginPath();c.arc(s/2,s/2,14,0,TAU);c.stroke()},name:'Bite',note:'red ring: strike now'},
  {pic:function(c,s){c.strokeStyle=INK;c.lineWidth=4;c.globalAlpha=.25;c.beginPath();c.arc(s/2,s-8,18,Math.PI,0);c.stroke();c.globalAlpha=1;c.strokeStyle=RED;c.beginPath();c.arc(s/2,s-8,18,-Math.PI*.15,0);c.stroke();c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(s/2,s-8);c.lineTo(s/2-10,s-22);c.stroke()},name:'Tension dial',note:'keep the needle out of the red'},
  {pic:function(c,s){c.translate(s/2,s/2);drawFish(c,2,34,0,INK,PAPER,1)},name:'Fish',note:'bigger ones fight harder'},{pic:function(c,s){c.translate(s/2,s/2);drawFish(c,11,40,0,INK,PAPER,1);c.strokeStyle=RED;c.lineWidth=2;c.strokeRect(-22,-18,44,36)},name:'Legends',note:'one per water, needs top gear'},
  {ic:'rod',name:'Rod',note:'strength and casting distance'},{ic:'reel',name:'Reel',note:'reels in faster'},{ic:'spool',name:'Line',note:'longer line, deeper water'},{ic:'hook',name:'Hook',note:'longer bite window, more slack allowed'}]
  .concat(BAITS.map(function(b){var who=SP.filter(function(s){return s[7].indexOf(b.id)>=0}).length;return{ic:b.ic,name:b.nm,note:'liked by '+who+' kinds'}}))
  .concat(LOCS.map(function(L){return{ic:L.ic,name:L.nm,note:'up to '+Math.round(L.deep/10)+' m deep'}})),
 tips:['Look at the journal: grey outlines are fish you have not caught yet.','Derby and Daily give you three minutes and fixed gear; heaviest bag wins.']});GK.online.mount(B,{game:'angler',boards:[{key:'big',m:'big',ic:'fish',fmt:'kg'},{key:'derby',m:'derby',ic:'clock',fmt:'kg'},{daily:{scale:.01},fmt:'kg'}]});
function fit(){var v=GK.fit(cv,stage);Z=GK.clamp(Math.min(v.w/380,v.h/500),.62,2.1);VW=v.w/Z;VH=v.h/Z}
addEventListener('resize',fit);addEventListener('orientationchange',fit);fit();
paint();newGame();GK.loop(step,render);tut.maybe();
window.__g={tut:tut,G:function(){return G},car:CAR,st:ST,F:function(){return F},newGame:newGame,openJournal:openJournal,openShop:openShop,
  stats:function(){return{mode:G.mode,st:G.st,loc:LOCS[G.loc].id,bait:G.bait,money:CAR.money,species:Object.keys(CAR.jr).length,catches:ST.catches,big:ST.big,up:JSON.stringify(CAR.up),locs:CAR.locs.length,score:G.score,snaps:ST.snaps,night:isNight(),fish:F.length,tens:Math.round((G.tens||0)*100)/100}}};
})();
