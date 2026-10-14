/* Animated galaxy starfield + nebula drift for any page with <canvas id="stars">. */
(function(){
  var c=document.getElementById('stars');if(!c)return;
  var x=c.getContext('2d'),w,h,S=[],dpr=Math.min(devicePixelRatio||1,2);
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function size(){w=c.width=innerWidth*dpr;h=c.height=innerHeight*dpr;
    var n=Math.round(innerWidth*innerHeight/(window.Device&&Device.mobile?9000:5500));
    S=[];for(var i=0;i<n;i++)S.push({x:Math.random()*w,y:Math.random()*h,z:Math.random()*.9+.1,
      p:Math.random()*6.28,hue:[190,265,320,210][i%4]})}
  function draw(t){
    x.clearRect(0,0,w,h);
    for(var i=0;i<S.length;i++){var s=S[i];
      if(!reduce){s.y+=s.z*.25*dpr;if(s.y>h){s.y=0;s.x=Math.random()*w}}
      var a=.4+.6*Math.abs(Math.sin(t/900*s.z+s.p)),r=s.z*1.6*dpr;
      x.fillStyle='hsla('+s.hue+',90%,80%,'+a+')';
      x.shadowColor='hsl('+s.hue+',100%,70%)';x.shadowBlur=s.z*8*dpr;
      x.beginPath();x.arc(s.x,s.y,r,0,6.283);x.fill()}
    if(!reduce)requestAnimationFrame(draw)}
  size();addEventListener('resize',size);requestAnimationFrame(draw);
})();
