/* How-to-play card shared by every game. A game calls Guide.set({goal,how,keys,touch,legend,tips}) once.
   legend items: {pic:function(ctx,size){...} | ic:'gk icon name' | sw:'#colour', name:'Bat', note:'fast, weak'}.
   The ? button opens it (with a button to replay the wordless tutorial); it also opens once after the first tutorial. */
(function(){
  if(window.Guide)return;
  var key='guideSeen:'+location.pathname.replace(/index\.html$/,'');
  function seen(){try{return localStorage.getItem(key)==='1'}catch(e){return true}}
  function mark(){try{localStorage.setItem(key,'1')}catch(e){}document.querySelectorAll('.gd-hint').forEach(function(b){b.classList.remove('gd-hint')})}
  var css='.gd-m{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:12px}'+
    '.gd-s{position:relative;background:var(--gk-bg,var(--ink,#111));color:var(--gk-ink,var(--paper,#eee));border:var(--gk-bw,2px) solid currentColor;border-radius:var(--gk-pr,0);width:min(640px,100%);max-height:100%;overflow:auto;padding:18px 18px 14px;font:15px/1.45 var(--gk-font,var(--mono,sans-serif))}'+
    '.gd-s h2{margin:0 44px 6px 0;font-size:24px;line-height:1.1}.gd-goal{margin:0 0 12px;padding:8px 10px;background:var(--gk-acc,var(--amber,#fb0));color:var(--gd-on,var(--gk-bg,var(--ink,#111)));font-weight:700;border-radius:var(--gk-pr,0)}'+
    '.gd-s ol{margin:0 0 12px;padding-left:1.3em}.gd-s li{margin:3px 0}.gd-s h3{margin:14px 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}'+
    '.gd-k{display:grid;grid-template-columns:auto 1fr;gap:5px 12px;align-items:center}.gd-k kbd{display:inline-block;min-width:26px;padding:2px 7px;border:1.5px solid currentColor;border-bottom-width:3px;border-radius:4px;font:700 12px/1.4 var(--gk-font,monospace);text-align:center;white-space:nowrap}'+
    '.gd-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}.gd-i{display:grid;grid-template-columns:48px 1fr;gap:8px;align-items:center;padding:6px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);border-radius:var(--gk-pr,0)}'+
    '.gd-i canvas,.gd-i .gd-p{width:48px;height:48px;display:grid;place-items:center}.gd-i .gd-p svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.gd-i .gd-p i{width:30px;height:30px;border:1.5px solid currentColor}'+
    '.gd-i b{display:block;font-size:13px;line-height:1.15}.gd-i small{display:block;font-size:12px;opacity:.8;line-height:1.25}'+
    '.gd-x{position:absolute;right:10px;top:10px;width:36px;height:36px;background:transparent;color:inherit;border:var(--gk-bw,2px) solid currentColor;border-radius:var(--gk-pr,0);font:20px/1 sans-serif;cursor:pointer}'+
    '.gd-f{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}.gd-f button{height:42px;padding:0 16px;display:inline-flex;align-items:center;gap:8px;background:transparent;color:inherit;border:var(--gk-bw,2px) solid currentColor;border-radius:var(--gk-pr,0);font:700 14px var(--gk-font,sans-serif);cursor:pointer}'+
    '.gd-f button.pr{background:var(--gk-acc,var(--amber,#fb0));border-color:var(--gk-acc,var(--amber,#fb0));color:var(--gd-on,var(--gk-bg,var(--ink,#111)))}.gd-f svg{width:18px;height:18px;fill:currentColor}'+
    '@keyframes gd-b{50%{outline-color:transparent}}.gd-hint{outline:3px solid var(--gk-acc,var(--amber,#fb0))!important;outline-offset:2px;animation:gd-b .9s steps(1) infinite}';
  var st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
  var G=window.Guide={cfg:null,onTut:null,
    set:function(c){G.cfg=c;setTimeout(G.hint,1500)},has:function(){return!!G.cfg},seen:seen,
    hint:function(){if(seen())return;var b=document.querySelector('.gk-b.help,[data-guide]');if(b)b.classList.add('gd-hint')},
    open:function(onTut){var c=G.cfg;if(!c)return;onTut=onTut||G.onTut;mark();var old=document.querySelector('.gd-m');if(old)old.remove();
      var m=document.createElement('div');m.className='gd-m';var s=document.createElement('div');s.className='gd-s';m.appendChild(s);var mob=window.Device&&Device.mobile;
      var h='<h2>'+esc(c.title||document.title)+'</h2>';if(c.goal)h+='<p class="gd-goal">'+esc(c.goal)+'</p>';
      if(c.how&&c.how.length)h+='<ol>'+c.how.map(function(t){return'<li>'+esc(t)+'</li>'}).join('')+'</ol>';
      var ctl=mob?(c.touch||c.keys):(c.keys||c.touch);if(ctl&&ctl.length)h+='<h3>'+(mob&&c.touch?'Touch':'Controls')+'</h3><div class="gd-k">'+ctl.map(function(k){return'<span>'+k[0].split(' / ').map(function(x){return'<kbd>'+esc(x)+'</kbd>'}).join(' ')+'</span><span>'+esc(k[1])+'</span>'}).join('')+'</div>';
      if(c.legend&&c.legend.length)h+='<h3>'+(c.legendTitle||'What you will meet')+'</h3><div class="gd-l"></div>';
      if(c.tips&&c.tips.length)h+='<h3>Tips</h3><ol>'+c.tips.map(function(t){return'<li>'+esc(t)+'</li>'}).join('')+'</ol>';
      s.innerHTML=h;var L=s.querySelector('.gd-l');if(L)c.legend.forEach(function(it){var d=document.createElement('div');d.className='gd-i';var p;
        if(it.pic){p=document.createElement('canvas');var dpr=Math.min(2,devicePixelRatio||1);p.width=p.height=48*dpr;var x=p.getContext('2d');x.scale(dpr,dpr);try{it.pic(x,48)}catch(e){}}
        else{p=document.createElement('span');p.className='gd-p';if(it.ic&&window.GK&&GK.icoSvg)p.innerHTML=GK.icoSvg(it.ic);else if(it.sw)p.innerHTML='<i style="background:'+it.sw+'"></i>'}
        d.appendChild(p);var t=document.createElement('span');t.innerHTML='<b>'+esc(it.name)+'</b>'+(it.note?'<small>'+esc(it.note)+'</small>':'');d.appendChild(t);L.appendChild(d)});
      var x=document.createElement('button');x.className='gd-x';x.textContent='×';x.title='Close';x.onclick=function(){m.remove()};s.appendChild(x);
      var f=document.createElement('div');f.className='gd-f';if(onTut){var tb=document.createElement('button');tb.className='pr';tb.innerHTML='<svg viewBox="0 0 20 20"><path d="M5 3l12 7-12 7z"/></svg>Tutorial';tb.onclick=function(){m.remove();onTut()};f.appendChild(tb)}
      var cb=document.createElement('button');cb.textContent='OK';cb.onclick=function(){m.remove()};f.appendChild(cb);s.appendChild(f);
      m.addEventListener('pointerdown',function(e){if(e.target===m)m.remove()});['keydown','keyup'].forEach(function(n){m.addEventListener(n,function(e){if(e.key==='Escape')m.remove();e.stopPropagation()})});
      document.body.appendChild(m);s.scrollTop=0;try{cb.focus({preventScroll:true})}catch(e){}},
    afterTutorial:function(){if(G.cfg&&!seen()&&!(window.Auto&&Auto.on))setTimeout(function(){G.open()},400)}};
  function esc(t){var d=document.createElement('span');d.textContent=String(t);return d.innerHTML}
})();
