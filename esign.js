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
    var lastPoint = null;

    function resize(){
      var w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = w * ratio; canvas.height = h * ratio;
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 2.2;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    resize();
    canvas.style.touchAction = 'none';   // 觸控時不讓瀏覽器搶去捲動/縮放，簽名才不會斷斷續續

    function pos(e){
      var r = canvas.getBoundingClientRect();
      var src = (e.touches && e.touches[0]) || e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    }
    function beginStroke(p){ lastPoint=p; empty=false; ctx.beginPath(); ctx.moveTo(p.x,p.y); }
    // 用二次貝茲曲線描過中點，筆畫看起來連續平滑，不會一段段生硬的直線
    function extendStroke(p){
      if(!lastPoint){ beginStroke(p); return; }
      var mid = { x:(lastPoint.x+p.x)/2, y:(lastPoint.y+p.y)/2 };
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, mid.x, mid.y);
      ctx.stroke();
      lastPoint = p;
    }
    // 快速滑動時，瀏覽器每個 frame 只會給最後一個座標，中間的取樣點會被「合併」掉，
    // 造成筆畫看起來斷斷續續、有漏掉的感覺。用 getCoalescedEvents() 把中間被吃掉的
    // 取樣點也補回來描繪，是解決這個問題最直接的辦法（Pointer Events 才有此 API）。
    function coalesced(e){
      if(typeof e.getCoalescedEvents==='function'){
        var list=e.getCoalescedEvents();
        if(list && list.length) return list;
      }
      return [e];
    }

    function start(e){ e.preventDefault(); drawing=true; beginStroke(pos(e)); }
    function move(e){ e.preventDefault(); if(!drawing) return; var p=pos(e); extendStroke(p); }
    function end(e){ e.preventDefault(); drawing=false; lastPoint=null; }

    if(window.PointerEvent){
      canvas.addEventListener('pointerdown', function(e){
        e.preventDefault(); drawing=true;
        try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
        beginStroke(pos(e));
      });
      canvas.addEventListener('pointermove', function(e){
        e.preventDefault(); if(!drawing) return;
        coalesced(e).forEach(function(ev){ extendStroke(pos(ev)); });
      }, {passive:false});
      canvas.addEventListener('pointerup', function(e){ e.preventDefault(); drawing=false; lastPoint=null; try{ canvas.releasePointerCapture(e.pointerId); }catch(_){} });
      canvas.addEventListener('pointercancel', function(){ drawing=false; lastPoint=null; });
    } else {
      // 沒有 Pointer Events 支援的舊瀏覽器：退回滑鼠／觸控事件
      canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); canvas.addEventListener('mouseup',end); canvas.addEventListener('mouseleave',end);
      canvas.addEventListener('touchstart',start,{passive:false});
      canvas.addEventListener('touchmove',function(e){
        e.preventDefault(); if(!drawing) return;
        coalesced(e).forEach(function(ev){ extendStroke(pos(ev)); });
      },{passive:false});
      canvas.addEventListener('touchend',end); canvas.addEventListener('touchcancel',end);
    }

    return {
      isEmpty: function(){ return empty; },
      toDataURL: function(){ return canvas.toDataURL('image/png'); },
      clear: function(){ ctx.clearRect(0,0,canvas.width,canvas.height); empty=true; lastPoint=null; resize(); }
    };
  }

  // 統一處理 navigator.share 的錯誤：使用者主動取消(AbortError)靜默略過；
  // 真正失敗（檔案太大、沒有可分享的App等）才通知呼叫端顯示提示／退回下載，避免兩邊分開寫、又各自漏掉這個分辨。
  function smartShare(shareData, onSent, onFail){
    navigator.share(shareData).then(onSent).catch(function(err){
      if(err && err.name==='AbortError') return; // 使用者取消分享，不視為失敗
      if(onFail) onFail(err);
    });
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

  window.EBNSign = { create:create, timestamp:timestamp, saveLog:saveLog, getLog:getLog, smartShare:smartShare };
})();
