/* Galaxica device detector. Sets <html data-device="mobile|desktop" data-touch="1|0">,
   exposes window.Device, and swaps [data-show="mobile|desktop"] content. */
(function(){
  var ua=navigator.userAgent||'';
  var touch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
  var coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
  var uaMobile=/Android|iPhone|iPad|iPod|Mobile|Silk|Opera Mini/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  var mobile=uaMobile||(coarse&&touch);
  var D=window.Device={mobile:mobile,desktop:!mobile,touch:touch,
    onChange:function(f){addEventListener('resize',f);addEventListener('orientationchange',f)},
    portrait:function(){return innerHeight>=innerWidth}};
  var r=document.documentElement;
  r.dataset.device=mobile?'mobile':'desktop';
  r.dataset.touch=touch?'1':'0';
  /* app mode: no text-selection bubble, no callout, no double-tap or pinch zoom, no long-press menu (inputs still work) */
  var st=document.createElement('style');st.textContent='html,body{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;text-size-adjust:100%}html{touch-action:manipulation}body,button,a,label,canvas,img{-webkit-touch-callout:none;touch-action:manipulation}img{-webkit-user-drag:none;user-drag:none}input,textarea{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}';
  (document.head||r).appendChild(st);
  function editable(t){return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)}
  ['gesturestart','gesturechange','gestureend'].forEach(function(n){document.addEventListener(n,function(e){e.preventDefault()},{passive:false})});
  document.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false});
  document.addEventListener('dblclick',function(e){if(!editable(e.target))e.preventDefault()},{passive:false});
  document.addEventListener('contextmenu',function(e){if(!editable(e.target))e.preventDefault()});
  document.addEventListener('selectstart',function(e){if(!editable(e.target))e.preventDefault()});
  var lastT=0;document.addEventListener('touchend',function(e){var now=Date.now();if(now-lastT<320&&!editable(e.target)&&!(e.target.closest&&e.target.closest('button,a,input,[role=button]'))){e.preventDefault()}lastT=now},{passive:false});
  if(!document.querySelector('link[rel=manifest]')){var depth=(location.pathname.match(/\/games\/[^/]+\//)?'../../':'');var mf=document.createElement('link');mf.rel='manifest';mf.href=depth+'manifest.webmanifest';(document.head||r).appendChild(mf);
    [['apple-mobile-web-app-capable','yes'],['mobile-web-app-capable','yes'],['apple-mobile-web-app-status-bar-style','black-translucent']].forEach(function(m){var t=document.createElement('meta');t.name=m[0];t.content=m[1];(document.head||r).appendChild(t)});
    var ai=document.createElement('link');ai.rel='apple-touch-icon';ai.href=depth+'icon-192.png';(document.head||r).appendChild(ai)}
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-show]').forEach(function(el){
      el.hidden=el.dataset.show!==r.dataset.device;
    });
  });
})();
