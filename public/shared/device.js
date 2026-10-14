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
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-show]').forEach(function(el){
      el.hidden=el.dataset.show!==r.dataset.device;
    });
  });
})();
