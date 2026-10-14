/* Flat pixel starfield. Square stars, stepped twinkle, slow parallax, rare shooting star. No blur/glow. */
(function(){
  var c=document.getElementById('stars');if(!c)return;
  var x=c.getContext('2d'),w,h,S=[],P=3,shoot=null,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var cols=['#efe6d2','#efe6d2','#8d9aa5','#ffb000'];
  function size(){w=Math.ceil(innerWidth/P);h=Math.ceil(innerHeight/P);c.width=w;c.height=h;
    var n=Math.round(w*h/(window.Device&&Device.mobile?420:300));S=[];
    for(var i=0;i<n;i++){var z=Math.random();S.push({x:Math.random()*w|0,y:Math.random()*h|0,z:z,
      c:cols[Math.random()<.07?3:(z>.7?0:(z>.3?1:2))],big:z>.93})}}
  function draw(t){
    x.clearRect(0,0,w,h);var step=(t/600|0);
    S.forEach(function(s,i){
      if(!reduce&&t%3<1)s.y=(s.y+(s.z>.6?0:0))%h;
      if(!reduce&&(step+i)%11===0&&s.z<.5)return; /* stepped twinkle */
      x.fillStyle=s.c;x.fillRect(s.x,(s.y+(reduce?0:(t/(900-s.z*600)|0)))%h|0,1,1);
      if(s.big){var yy=(s.y+(reduce?0:(t/300|0)))%h|0;x.fillRect(s.x-1,yy,3,1);x.fillRect(s.x,yy-1,1,3)}});
    if(!reduce){if(!shoot&&Math.random()<.002)shoot={x:Math.random()*w,y:0,l:0};
      if(shoot){x.fillStyle='#ffb000';for(var k=0;k<6;k++)x.fillRect(shoot.x-k|0,shoot.y+k|0,1,1);
        shoot.x+=2;shoot.y+=2;if(shoot.y>h)shoot=null}}
    if(!reduce)requestAnimationFrame(draw)}
  size();addEventListener('resize',size);requestAnimationFrame(draw);
})();
