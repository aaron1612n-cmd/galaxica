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
