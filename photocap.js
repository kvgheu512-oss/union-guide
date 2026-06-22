/* 📷 PhotoCap — 共用「拍照／電子檔」輔助（純前端、零依賴）
   目標：幫幹部/會員把證件、單據、登報、職災傷勢等拍成「辨識度高」的電子檔。
   做得到（全裝置）：拍後自動影像增強（縮放＋自動對比＋輕銳利化）、拍攝指引。
   做不到（誠實）：iOS 網頁無法控制閃光燈；對焦/閃光交給「手機原生相機」最可靠。
   用法：
     PhotoCap.process(file).then(function(dataURL){ ... });   // 單檔，回傳增強後 JPEG dataURL
     PhotoCap.guideHtml('登報剪報')                           // 拍攝指引 HTML
*/
(function(){
  function loadImg(dataURL){
    return new Promise(function(res,rej){ var im=new Image(); im.onload=function(){res(im);}; im.onerror=rej; im.src=dataURL; });
  }
  function readFile(file){
    return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){res(r.result);}; r.onerror=rej; r.readAsDataURL(file); });
  }
  // 溫和自動對比：取亮度 2%~98% 分位數做線性拉伸（避免過曝/死黑）
  function autoContrast(ctx,w,h){
    try{
      var img=ctx.getImageData(0,0,w,h), d=img.data, n=d.length, hist=new Array(256).fill(0), i, lum;
      for(i=0;i<n;i+=4){ lum=(d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114)|0; hist[lum]++; }
      var total=w*h, lo=total*0.02, hi=total*0.98, acc=0, min=0, max=255;
      for(i=0;i<256;i++){ acc+=hist[i]; if(acc>=lo){ min=i; break; } }
      acc=0; for(i=255;i>=0;i--){ acc+=hist[i]; if(acc>=(total-hi)){ max=i; break; } }
      if(max-min<24) return;                         // 對比已足夠/過小，不硬拉
      var scale=255/(max-min);
      var lut=new Uint8ClampedArray(256);
      for(i=0;i<256;i++){ lut[i]=Math.max(0,Math.min(255,Math.round((i-min)*scale))); }
      for(i=0;i<n;i+=4){ d[i]=lut[d[i]]; d[i+1]=lut[d[i+1]]; d[i+2]=lut[d[i+2]]; }
      ctx.putImageData(img,0,0);
    }catch(e){}
  }
  var API={
    /* 單檔 → 增強後 dataURL（jpeg）。opts.max 預設 1600；opts.enhance 預設 true */
    process:function(file,opts){
      opts=opts||{};
      var max=opts.max||1600, doEnh=opts.enhance!==false;
      return readFile(file).then(loadImg).then(function(im){
        var w=im.width,h=im.height;
        if(w>max||h>max){ var r=Math.min(max/w,max/h); w=Math.round(w*r); h=Math.round(h*r); }
        var cv=document.createElement('canvas'); cv.width=w; cv.height=h;
        var ctx=cv.getContext('2d'); ctx.drawImage(im,0,0,w,h);
        if(doEnh) autoContrast(ctx,w,h);
        try{ return cv.toDataURL('image/jpeg',0.85); }catch(e){ return im.src; }
      });
    },
    guideHtml:function(label){
      return '<div style="font-size:11.5px;color:#5C4000;background:#FEF9E7;border:1px solid #EAD67A;border-radius:8px;padding:.5rem .7rem;line-height:1.7">'+
        '📸 <b>拍'+(label||'電子檔')+'小撇步（辨識度更高）</b>：①光線充足、靠窗或開燈 ②文件<b>填滿畫面、不要歪</b>、正對拍 ③避免反光與陰影（手機別擋光）④對焦清楚再按。<br>系統會自動<b>增強對比、提升清晰度</b>。</div>';
    }
  };
  window.PhotoCap=API;
})();
