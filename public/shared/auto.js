/* Bot race lane: a game opened with ?bot=<profile json>&lane=<n>&x=<speed> runs that bot on its own: auto on, muted, and with
   throwaway storage so lanes never touch each other's saves or the player's (the player's id, name and tutorial flags are copied in).
   It reports its scores and progress to the page around it (the Workshop's race view). */
(function(){
  var q;try{q=new URLSearchParams(location.search)}catch(e){return}var raw=q.get('bot');if(!raw)return;try{JSON.parse(raw)}catch(e){return}
  var mem={},lane=q.get('lane');
  try{var real=window.localStorage;for(var i=0;i<real.length;i++){var k=real.key(i);if(/^galaxica(Pid|Name|Names)$|tut|guideSeen/i.test(k))mem[k]=real.getItem(k)}}catch(e){}
  mem.galaxicaAuto='1';mem.galaxicaMute='true';mem.galaxicaBot=raw;mem.galaxicaSpeed=q.get('x')||'1';
  var api={getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null},setItem:function(k,v){mem[String(k)]=String(v)},
    removeItem:function(k){delete mem[String(k)]},clear:function(){for(var k in mem)delete mem[k]},key:function(i){return Object.keys(mem)[i]||null}};
  var fake=new Proxy(api,{get:function(t,k){if(k==='length')return Object.keys(mem).length;if(k in api)return api[k];return typeof k==='string'&&Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:undefined},
    set:function(t,k,v){mem[k]=String(v);return true},deleteProperty:function(t,k){delete mem[k];return true},has:function(t,k){return k in mem||k in api},
    ownKeys:function(){return Object.keys(mem)},getOwnPropertyDescriptor:function(t,k){if(Object.prototype.hasOwnProperty.call(mem,k))return{value:mem[k],enumerable:true,configurable:true,writable:true}}});
  try{Object.defineProperty(window,'localStorage',{value:fake,configurable:true})}catch(e){}
  var AC=window.AudioContext||window.webkitAudioContext;
  if(AC){var Q=function(o){var c=new AC(o),g=c.createGain();g.gain.value=0;g.connect(c.destination);Object.defineProperty(c,'destination',{value:g});return c};Q.prototype=AC.prototype;window.AudioContext=window.webkitAudioContext=Q}
  if(window.HTMLMediaElement){var pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){this.muted=true;return pl.apply(this,arguments)}}
  /* the lane is small and the race view has the controls, so the game's own button bar goes */
  var hs=document.createElement('style');hs.textContent='.gk-bar,body>.bar,#pad{display:none!important}body{gap:0!important}';(document.head||document.documentElement).appendChild(hs);
  addEventListener('load',function(){setTimeout(function(){dispatchEvent(new Event('resize'))},50)});
  window.__lane=lane;var send=function(m){m.lane=lane;try{parent.postMessage(m,'*')}catch(e){}};
  setInterval(function(){var O=window.Online;if(O&&O.post&&!O.post._lane){var p=O.post;O.post=function(g,b,v,o){var bs=window.GK&&GK.online&&GK.online.boards||[],f=null,lb=b;
      var ic=null;bs.forEach(function(x){if(b===x.key||(x.daily&&/^daily:/.test(b))){f=x.fmt;lb=x.daily?'daily':(x.m||x.key);ic=x.daily?'sun':x.ic}});send({t:'score',board:lb,ic:ic,score:v,fmt:f,low:!!(o&&o.low)});return p.apply(this,arguments)};O.post._lane=1}
    send({t:'tick',ticks:window.Speed?Speed.ticks:0,auto:!!(window.Auto&&Auto.on)})},1000);
  addEventListener('message',function(e){var d=e.data;if(!d||e.source!==parent)return;if(d.pin==='speed'&&window.Speed)Speed.set(d.v)});
})();
/* Launcher-level AUTO mode flag shared by every game. Games read Auto.on and run their own bot/replay.
   Toggle from the hub or from any game; stored in localStorage and synced across tabs. */
(function(){
  var cbs=[];
  function read(){try{return localStorage.galaxicaAuto==='1'}catch(e){return false}}
  var A=window.Auto={on:read(),
    set:function(v){A.on=!!v;try{localStorage.galaxicaAuto=A.on?'1':'0'}catch(e){}cbs.forEach(function(f){f(A.on)})},
    toggle:function(){A.set(!A.on)},
    watch:function(f){cbs.push(f);f(A.on)},
    bind:function(btn){if(!btn)return;btn.addEventListener('click',A.toggle);A.watch(function(on){btn.classList.toggle('ghost',!on);btn.setAttribute('aria-pressed',on)})}};
  addEventListener('storage',function(e){if(e.key==='galaxicaAuto'){A.on=e.newValue==='1';cbs.forEach(function(f){f(A.on)})}});
})();
/* ---------- bot personalities (the Bot Workshop) ----------
   A profile is {n name, p preset id, i icon, c colour, s stats}. Stats run 0-100.
   rea reaction delay, acc accuracy, cau caution, gre greed, agg aggression, pat patience, mis mistakes, foc focus, tem tempo.
   The default "Ace" is the perfect bot every game shipped with. Games can read the helpers below; games that do not
   still feel tempo, focus and reaction through Speed.run, which skips the bot's turn on ticks it is not "thinking". */
(function(){
  var A=window.Auto,ACE={rea:0,acc:100,cau:50,gre:50,agg:50,pat:50,mis:0,foc:100,tem:100};
  var PRESETS=[
    ['ace','Ace','crown',{}],['rookie','Rookie','egg',{rea:45,acc:60,agg:45,pat:40,mis:12,foc:80,tem:70}],['grandma','Grandma','heart',{rea:80,acc:85,cau:85,gre:30,agg:10,pat:90,mis:5,foc:70,tem:35}],
    ['toddler','Toddler','ball',{rea:60,acc:20,cau:10,gre:90,agg:70,pat:5,mis:40,foc:40,tem:90}],['speedrunner','Speedrunner','bolt',{rea:5,acc:80,cau:25,gre:20,agg:85,pat:5,mis:6,tem:100}],
    ['coward','Coward','shield',{rea:20,acc:70,cau:100,gre:20,agg:0,pat:70,mis:5,foc:90,tem:80}],['daredevil','Daredevil','flame',{rea:10,acc:75,cau:0,gre:80,agg:100,pat:10,mis:10,foc:95}],
    ['hoarder','Hoarder','coin',{rea:25,acc:75,cau:40,gre:100,agg:40,mis:6,foc:90,tem:85}],['sloth','Sloth','leaf',{rea:95,acc:70,cau:60,gre:40,agg:20,pat:100,mis:8,foc:50,tem:15}],
    ['sniper','Sniper','target',{rea:30,acc:100,cau:70,gre:30,agg:60,pat:90,mis:1,tem:60}],['butterfingers','Butterfingers','hand',{rea:30,acc:40,mis:45,foc:75,tem:80}],
    ['robot','Robot','gear',{acc:95}],['gambler','Gambler','dice',{rea:20,acc:65,cau:15,gre:85,agg:80,pat:20,mis:20,foc:85,tem:95}],
    ['perfectionist','Perfectionist','star',{rea:40,cau:80,gre:60,agg:30,pat:100,tem:50}],['chaos','Chaos','spiral',{rea:50,acc:30,cau:20,gre:60,agg:90,pat:10,mis:70,foc:50}],
    ['zen','Zen','sun',{rea:50,acc:90,cau:60,gre:40,agg:20,pat:85,mis:3,tem:55}],['caffeinated','Caffeinated','drop',{acc:55,cau:30,gre:60,agg:75,pat:0,mis:20,foc:60}],
    ['sleepy','Sleepy','moon',{rea:85,acc:70,agg:30,pat:60,mis:15,foc:30,tem:40}],['showoff','Showoff','trophy',{rea:15,acc:80,cau:10,gre:70,agg:95,pat:15,mis:12,foc:85}],
    ['nervous','Nervous','eye',{rea:25,acc:55,cau:95,gre:30,agg:15,pat:20,mis:25,foc:70,tem:90}],['tank','Tank','cube',{rea:40,acc:70,cau:20,gre:40,agg:70,pat:60,mis:5,foc:95,tem:70}],
    ['pirate','Pirate','anchor',{rea:30,acc:65,cau:30,gre:95,agg:85,pat:30,mis:15,foc:80,tem:85}],['monk','Monk','candle',{rea:60,acc:85,cau:75,gre:10,agg:5,pat:100,mis:2,tem:40}],
    ['glass','Glass Cannon','gem',{rea:10,acc:85,cau:5,agg:100,pat:30,mis:8,foc:90}],['detective','Detective','key',{rea:35,acc:90,cau:65,gre:55,agg:40,pat:80,mis:3,foc:95,tem:60}],
    ['party','Party Animal','note',{rea:30,acc:50,cau:25,gre:75,agg:70,pat:15,mis:30,foc:40,tem:95}],['explorer','Explorer','flag',{rea:25,acc:75,cau:45,gre:80,agg:45,pat:60,mis:8,foc:85,tem:80}],
    ['copycat','Copycat','cat',{rea:35,acc:70,cau:55,gre:55,pat:50,mis:10,foc:80,tem:75}],['ghost','Ghost','skull',{cau:100,gre:0,agg:0,pat:100}],['wildcard','Wildcard','dice',{wild:1}]];
  var COLORS=['#ffb000','#ff5a36','#efe6d2','#7fb069','#5fa8d3','#c77dff','#ff4f9a','#00835f'];
  function stats(o){var s={};for(var k in ACE)s[k]=o&&o[k]!=null?o[k]:ACE[k];return s}
  A.ACE=ACE;A.PRESETS=PRESETS.map(function(p){return{id:p[0],n:p[1],i:p[2],s:stats(p[3]),wild:!!p[3].wild}});A.COLORS=COLORS;
  function ls(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
  function lss(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  A.bots=function(){return ls('galaxicaBots',[])};
  A.saveBots=function(list){lss('galaxicaBots',list)};
  A.profile=ls('galaxicaBot',null)||{n:'Ace',p:'ace',i:'crown',c:'#ffb000',s:stats({})};
  A.setProfile=function(p){A.profile=p;lss('galaxicaBot',p);A.reset()};
  A.isAce=function(){var s=A.profile.s;for(var k in ACE)if(s[k]!==ACE[k])return false;return true};
  A.st=function(k){var v=A.profile.s[k];return v==null?ACE[k]:v};
  A.w=function(k){return A.st(k)/50};
  /* per-tick gate: zoning out, then tempo */ var zone=0,wild=null;
  A.reset=function(){zone=0;if(A.profile.p==='wildcard'){var s={};for(var k in ACE)s[k]=Math.round(Math.random()*100);s.mis=Math.round(s.mis*.5);A.profile.s=s}};
  A.think=function(){if(zone>0){zone--;return false}if(Math.random()<(100-A.st('foc'))/100*.0025){zone=40+Math.random()*140;return false}var tem=A.st('tem');return tem>=100||Math.random()<.12+.88*tem/100};
  A.react=function(){return Math.round(A.st('rea')/100*66*(.6+Math.random()*.8))};
  A.slip=function(){return Math.random()<A.st('mis')/100*.25};
  A.noise=function(scale){var a=1-A.st('acc')/100;if(a<=0)return 0;var g=(Math.random()+Math.random()+Math.random()-1.5)/1.5;return g*a*scale};
  A.card=function(){var p=A.profile;return{n:p.n,p:p.p,i:p.i,c:p.c,s:p.s}};
  addEventListener('storage',function(e){if(e.key==='galaxicaBot'){A.profile=ls('galaxicaBot',A.profile)}});
})();
