/* esign.js — 電子簽名板（共用模組）
   用法：
     var pad = EBNSign.create(canvasEl);
     pad.isEmpty()      → boolean
     pad.toDataURL()    → 'data:image/png;base64,...'
     pad.clear()
   另：EBNSign.timestamp() → '民國114年7月1日 14:30'
        EBNSign.saveLog(record) → 存 IndexedDB
        EBNSign.getLog(cb)      → cb(records[])
*/
(function(){
  function create(canvas){
    var ctx = canvas.getContext('2d');
    var drawing = false, empty = true;
    var ratio = Math.max(window.devicePixelRatio||1, 1);

    function resize(){
      var w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = w * ratio; canvas.height = h * ratio;
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 2.2;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    resize();

    function pos(e){
      var r = canvas.getBoundingClientRect();
      var src = e.touches ? e.touches[0] : e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    }
    function start(e){ e.preventDefault(); drawing=true; var p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
    function move(e){ e.preventDefault(); if(!drawing) return; empty=false; var p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); }
    function end(e){ e.preventDefault(); drawing=false; }

    canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); canvas.addEventListener('mouseup',end); canvas.addEventListener('mouseleave',end);
    canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',end);

    return {
      isEmpty: function(){ return empty; },
      toDataURL: function(){ return canvas.toDataURL('image/png'); },
      clear: function(){ ctx.clearRect(0,0,canvas.width,canvas.height); empty=true; resize(); }
    };
  }

  function timestamp(){
    var d = new Date();
    var y = d.getFullYear()-1911;
    var m = d.getMonth()+1, day = d.getDate();
    var hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
    return '民國'+y+'年'+m+'月'+day+'日 '+hh+':'+mm;
  }

  // IndexedDB 簡易存取（存簽署記錄備查）
  var DB_NAME='ebn_esign', DB_VER=1, STORE='logs';
  function openDB(cb){
    var req=indexedDB.open(DB_NAME,DB_VER);
    req.onupgradeneeded=function(e){ e.target.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true}); };
    req.onsuccess=function(e){ cb(null,e.target.result); };
    req.onerror=function(){ cb(new Error('DB error')); };
  }
  function saveLog(record, cb){
    openDB(function(err,db){
      if(err){ if(cb) cb(err); return; }
      var tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).add(Object.assign({ts:Date.now()},record));
      tx.oncomplete=function(){ if(cb) cb(null); };
    });
  }
  function getLog(cb){
    openDB(function(err,db){
      if(err){ cb([]); return; }
      var req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
      req.onsuccess=function(){ cb(req.result||[]); };
      req.onerror=function(){ cb([]); };
    });
  }

  window.EBNSign = { create:create, timestamp:timestamp, saveLog:saveLog, getLog:getLog };
})();
