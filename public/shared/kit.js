/* Galaxica game kit: shared scaffolding for NEW games (device-aware canvas fit, grouped button bar with icons,
   AUTO + universal speed, sound toggle, tutorial buttons, pointer/keys helpers, speed-aware main loop).
   Requires device.js, auto.js, speed.js first. Usage: var K=Kit.mount({id,W,H,pad:true,nav:[...],tutStart,tutSkip}); Kit.run(tick,draw). */
(function(){
  var SND='<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z"/><path class="w" d="M11 5h1v6h-1zM13 3h1v10h-1z"/><path class="x" d="M11 6h1v1h-1zM15 6h1v1h-1zM12 7h1v1h-1zM14 7h1v1h-1zM13 8h1v1h-1zM12 9h1v1h-1zM14 9h1v1h-1zM11 10h1v1h-1zM15 10h1v1h-1z"/></svg>';
  var CSS='html,body{height:100%;overflow:hidden;overscroll-behavior:none;user-select:none;-webkit-user-select:none}'
  +'body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}'
  +'#wrap{border:2px solid var(--paper);box-shadow:6px 6px 0 var(--amber);background:var(--ink)}'
  +'canvas#c{display:block;touch-action:none;image-rendering:pixelated}'
  +'.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;padding:0 10px}'
  +'.btn{min-height:40px;padding:0 12px}'
  +'#pad{display:none;justify-content:space-between;align-items:center;min-height:56px}'
  +'html[data-device=mobile] #pad{display:flex}'
  +'html[data-device=mobile] .bar .btn{min-height:34px;padding:0 9px;font-size:10px;box-shadow:3px 3px 0 var(--paper)}'
  +'html[data-device=mobile] .bar{gap:8px}html[data-device=mobile] .cl{padding:4px 6px;gap:6px}'
  +'html[data-device=mobile] .spd .btn{padding:0 6px}html[data-device=mobile] .spd input{width:48px}'
  +'.grp{display:flex;gap:10px}'
  +'.pb{min-width:62px;height:50px;border:2px solid var(--paper);background:var(--ink);color:var(--paper);font:700 10px var(--px);box-shadow:4px 4px 0 var(--paper);touch-action:none;display:flex;align-items:center;justify-content:center;padding:0 10px}'
  +'.pb.on{transform:translate(4px,4px);box-shadow:none;background:var(--amber);color:var(--ink)}'
  +'.pb.pulse{animation:pk .5s steps(1) infinite}@keyframes pk{50%{background:var(--amber);color:var(--ink)}}'
  +'.tri{width:0;height:0;border:9px solid transparent}.tl{border-right:13px solid currentColor;border-left:0}.tr{border-left:13px solid currentColor;border-right:0}'
  +'#rot{display:none;position:fixed;inset:0;z-index:5;background:var(--ink);align-items:center;justify-content:center;text-align:center;padding:30px;font:700 14px var(--px);text-transform:uppercase}';
  function lsGet(k,d){try{var v=localStorage[k];return v?JSON.parse(v):d}catch(e){return d}}
  function lsSet(k,v){try{localStorage[k]=JSON.stringify(v)}catch(e){}}
  var AC=null,mute=lsGet('galaxicaMute',false),sndB;
  var Kit=window.Kit={lsGet:lsGet,lsSet:lsSet,keys:{},scale:1,
    get mute(){return mute},
    ac:function(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC},
    tone:function(f,d,type,vol,slide,when){if(mute||!AC||Speed.v>2.5)return;var t=when||AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);
      if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)},
    noise:function(d,vol){if(mute||!AC||Speed.v>2.5)return;var n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),x=b.getChannelData(0);for(var i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);
      var s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=vol||.1;s.connect(g);g.connect(AC.destination);s.start()},
    txt:function(ctx,s,x,y,size,col,al){ctx.font='700 '+size+'px Silkscreen,ui-monospace,monospace';ctx.fillStyle=col;ctx.textAlign=al||'left';ctx.fillText(s,x,y)},
    pt:function(e){var r=Kit.cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*Kit.W,y:(e.clientY-r.top)/r.height*Kit.H,touch:e.pointerType==='touch'}},
    showSkip:function(v){var b=document.getElementById('skip');if(b)b.hidden=!v},
    mount:function(o){
      var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
      var nav=(o.nav||[]).map(function(n,i){return'<button class="btn ghost" id="nav'+i+'" title="'+(n.title||'')+'">'+n.label+'</button>'}).join('');
      document.body.insertAdjacentHTML('afterbegin','<canvas id="stars"></canvas><div id="wrap"><canvas id="c"></canvas></div><div id="pad"></div>'
        +'<div class="bar"><div class="cl"><a class="btn ghost" href="../../">← Arcade</a>'+nav+'</div>'
        +'<div class="cl"><button class="btn ghost" id="bot" title="Auto-play: the game plays itself">AUTO</button><span data-speed></span></div>'
        +'<div class="cl"><button class="btn ghost ic" id="snd" title="Sound on/off" aria-label="Sound">'+SND+'</button><button class="btn ghost ic" id="tutb" title="Replay tutorial" aria-label="Tutorial">?</button><button class="btn" id="skip" hidden>Skip</button></div></div>'
        +'<div id="rot">Rotate your phone</div>');
      var cv=Kit.cv=document.getElementById('c'),ctx=Kit.ctx=cv.getContext('2d'),W=Kit.W=o.W,H=Kit.H=o.H,pad=Kit.pad=document.getElementById('pad'),dpr=Math.min(devicePixelRatio||1,2);
      Speed.mountAll();Auto.bind(document.getElementById('bot'));
      (o.nav||[]).forEach(function(n,i){document.getElementById('nav'+i).onclick=n.fn});
      sndB=document.getElementById('snd');function paint(){sndB.style.opacity=mute?.45:1;sndB.classList.toggle('off',mute)}paint();
      Kit.toggleSnd=sndB.onclick=function(){Kit.ac();mute=!mute;lsSet('galaxicaMute',mute);paint()};
      document.getElementById('tutb').onclick=function(){Kit.ac();o.tutStart&&o.tutStart()};
      document.getElementById('skip').onclick=function(){o.tutSkip&&o.tutSkip()};
      function fit(){var bar=document.querySelector('.bar').offsetHeight+30+(Device.mobile?pad.offsetHeight+28:0);
        var sc=Math.min(innerWidth*.98/W,(innerHeight-bar)/H);sc=Kit.scale=Math.max(.3,Math.min(sc,Device.mobile?3:(o.maxScale||2)));
        pad.style.width=W*sc+'px';cv.style.width=W*sc+'px';cv.style.height=H*sc+'px';cv.width=W*sc*dpr;cv.height=H*sc*dpr;Kit.dpr=dpr;
        document.getElementById('rot').style.display=(Device.mobile&&!Device.portrait()&&innerHeight<(o.minH||320))?'flex':'none'}
      fit();Device.onChange(fit);addEventListener('load',fit);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
      addEventListener('keydown',function(e){Kit.ac();var c=e.code;if(!e.repeat&&Kit.onPress)Kit.onPress(c);Kit.keys[c]=true;
        if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(c)>-1)e.preventDefault();if(c==='KeyM')Kit.toggleSnd()});
      addEventListener('keyup',function(e){Kit.keys[e.code]=false});
      return Kit},
    /* press-and-hold DOM button -> sets Kit.keys[name] */
    holdBtn:function(el,name,onDown){el.addEventListener('pointerdown',function(e){e.preventDefault();Kit.ac();Kit.keys[name]=true;el.classList.add('on');if(onDown)onDown()});
      ['pointerup','pointercancel','pointerleave'].forEach(function(n){el.addEventListener(n,function(){Kit.keys[name]=false;el.classList.remove('on')})})},
    /* speed-aware loop: tick() runs Speed.steps() times per animation frame (12ms budget guard), draw() once; pre(): per-frame housekeeping */
    run:function(tick,draw,pre){(function loop(){if(pre)pre();var n=Speed.steps(),t0=performance.now();
      for(var i=0;i<n;i++){tick();if(i>0&&performance.now()-t0>12){Speed.acc=0;break}}
      Kit.ctx.setTransform(Kit.scale*Kit.dpr,0,0,Kit.scale*Kit.dpr,0,0);Kit.ctx.imageSmoothingEnabled=false;draw();requestAnimationFrame(loop)})()}
  };
})();
