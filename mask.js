/* 理監事姓名顯示打碼（只改畫面上的文字，資料與輸入欄的值都不動）
   例：楊淯涵→楊○涵、黃敏→黃○、單獨出現的名字（淯涵）→○涵。
   例外：輸入框／文字區／<pre>範本（要複製或產文件用）、列印時自動還原真名。
   要看真名：網址後加 ?names=show（會記住）；改回打碼：?names=hide */
(function(){
  try{
    var KEY="ebn_mask_names", mode="hide";
    var q=location.search.match(/[?&]names=(show|hide)/);
    try{ if(q){ localStorage.setItem(KEY,q[1]); mode=q[1]; } else mode=localStorage.getItem(KEY)||"hide"; }catch(e){ if(q) mode=q[1]; }
    if(mode==="show") return;

    var FULL=["楊淯涵","巫佳容","黃淑姸","陳依婷","黃敏","蔣雅竹","莊瑋聆","葉柏宏"];
    var GIVEN=["淯涵","佳容","淑姸","依婷","雅竹","瑋聆","柏宏"];
    function maskFull(n){ return n.length<=2 ? n.charAt(0)+"○" : n.charAt(0)+new Array(n.length-1).join("○")+n.charAt(n.length-1); }
    var MAP={}; FULL.forEach(function(n){ MAP[n]=maskFull(n); }); GIVEN.forEach(function(n){ MAP[n]="○"+n.charAt(n.length-1); });
    var RE=new RegExp(FULL.concat(GIVEN).join("|"),"g");
    function mask(s){ return s.replace(RE,function(m){ return MAP[m]; }); }

    var SKIP="script,style,textarea,input,pre,code,[data-nomask],[contenteditable=true]";
    var orig=new WeakMap(), refs=[], hasWR=typeof WeakRef==="function";
    function doText(n){
      var v=n.nodeValue; if(!v||!RE.test(v)){ RE.lastIndex=0; return; } RE.lastIndex=0;
      var p=n.parentElement; if(!p||p.closest(SKIP)) return;
      if(p.tagName==="OPTION" && !p.hasAttribute("value")) p.setAttribute("value",v);   // 保留 option 的真實值
      orig.set(n,v); if(hasWR) refs.push(new WeakRef(n));
      n.nodeValue=mask(v);
    }
    function doAttrs(root){
      if(!root.querySelectorAll) return;
      root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(function(el){
        ["placeholder","title","aria-label"].forEach(function(a){ var v=el.getAttribute(a); if(v&&RE.test(v)) el.setAttribute(a,mask(v)); RE.lastIndex=0; });
      });
    }
    function scan(root){
      if(!root) return;
      if(root.nodeType===3){ doText(root); return; }
      if(root.nodeType!==1 && root.nodeType!==9) return;
      var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null), n, list=[];
      while((n=w.nextNode())) list.push(n);
      list.forEach(doText); doAttrs(root);
    }
    function unmaskAll(){
      refs.forEach(function(r){ var n=r.deref(); if(n&&orig.has(n)) n.nodeValue=orig.get(n); });
    }
    var mo=new MutationObserver(function(ms){
      ms.forEach(function(m){
        if(m.type==="characterData") doText(m.target);
        else m.addedNodes.forEach(function(a){ scan(a); });
      });
    });
    function start(){
      document.title=mask(document.title);
      scan(document.body);
      mo.observe(document.body,{childList:true,subtree:true,characterData:true});
    }
    if(document.body) start(); else document.addEventListener("DOMContentLoaded",start);
    window.addEventListener("beforeprint",function(){ mo.disconnect(); unmaskAll(); });
    window.addEventListener("afterprint",function(){ scan(document.body); mo.observe(document.body,{childList:true,subtree:true,characterData:true}); });
    window.EBNMask={mask:mask};
  }catch(e){}
})();
