/* Names mode for the older static-bar games (galaxica, squeeze): adds an (i) button that shows each button's name under it. */
(function(){
function init(){var bar=document.querySelector('.bar'),tut=document.getElementById('tutb');if(!bar||!tut||document.getElementById('nmb'))return;
  var on=false;try{on=localStorage.galaxicaNames==='1'}catch(e){}
  var b=document.createElement('button');b.className='btn ghost ic';b.id='nmb';b.title='Names';b.setAttribute('aria-label','Names');b.innerHTML='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 7v5"/><circle cx="8" cy="4.6" r=".6" fill="currentColor"/></svg>';tut.parentNode.insertBefore(b,tut);
  var st=document.createElement('style');st.textContent='.kn .bar .btn[data-cap]{height:auto;min-height:40px;flex-direction:column;gap:2px;padding:4px 8px}.kn .bar .btn[data-cap]::after{content:attr(data-cap);font:700 8px/1.1 var(--px);letter-spacing:.04em;white-space:nowrap}#nmb.on{background:var(--amber);color:var(--ink)}';document.head.appendChild(st);
  function cap(){[].forEach.call(document.querySelectorAll('.bar .btn'),function(x){var t=x.title||x.getAttribute('aria-label');if(t&&x.id!=='skip')x.dataset.cap=t.replace(/ \(.*\)$/,'').slice(0,14)})}
  function apply(){document.documentElement.classList.toggle('kn',on);b.classList.toggle('on',on);cap()}
  b.onclick=function(){on=!on;try{localStorage.galaxicaNames=on?'1':'0'}catch(e){}apply()};apply();new MutationObserver(cap).observe(bar,{childList:true,subtree:true,attributes:true,attributeFilter:['title']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,50)});else setTimeout(init,50)})();
