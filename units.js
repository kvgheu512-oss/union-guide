/* 護理部單位清單（依「單位表」試算表）＋輸入框「打一個字就能快選」的下拉選單。
   用法：EBNUnits.attach(document.getElementById('f-dept'))
   選到的值存成「護理部／代號」（如 護理部／W55），跟名冊既有格式相同；找不到的單位仍可直接打字。 */
(function(){
  var NURSE=[
    ['W55','55病房'],['W62','62病房'],['W63','63病房'],['W71','71病房'],['W72','72病房'],['W73','73病房'],['W75','75病房'],
    ['W81','81病房'],['W82','82病房'],['W83','83病房'],['W85','85病房'],['W91','91病房'],['W92','92病房'],
    ['GW03','03病房'],['GW05','05病房'],['GW07','07病房'],
    ['W101','101病房'],['W102','102病房'],['W103','103病房'],['W105','105病房'],
    ['HD-血液透析','血液透析室'],['ER','急診'],['EMCU','EMCU'],['BICU','BICU'],['EW01','EW01'],['EW02','EW02'],
    ['AICU01','心臟內科加護病房'],['AICU13','心臟外科加護病房'],['AICU25','內科加護病房'],
    ['AICU31','內外科加護病房'],['AICU50','外科加護病房'],['AICU60','神經外科加護病房'],
    ['W31','31病房'],['W36','36病房'],['W37','37病房'],['W66','66病房'],
    ['產後護理之家','產後護理之家'],['DR','產房'],['W35','35病房'],['SBR','嬰兒病房'],
    ['NBCU','新生兒加護病房'],['PICU','兒科加護病房'],['W32','32病房'],['W51','51病房'],['W52','52病房'],['W53','53病房'],
    ['RICU','呼吸加護中心'],['RCC','呼吸照護中心'],['OPD-一般門診','OPD'],['BR','嬰兒病房']
  ];
  // 單位表以外、原本表單就有的選項（保留，避免舊資料對不上）
  var OTHER=[
    ['長照機構／日照中心','日照中心（長照機構）'],
    ['長照機構',''],
    ['護理部／尊榮病房','尊榮病房（護理部）'],['護理部／癌症中心','癌症中心（護理部）'],
    ['急診部（ER）',''],['骨科部',''],['泌尿外科',''],['放射腫瘤科',''],['健檢中心',''],['門診（OPD）',''],['總務室','']
  ];
  var ITEMS=NURSE.map(function(u){ return {v:'護理部／'+u[0], label:(u[0]===u[1]?u[0]:u[0]+'　'+u[1]), key:('護理部 '+u[0]+' '+u[1]).toLowerCase()}; })
    .concat(OTHER.map(function(u){ return {v:u[0], label:(u[1]||u[0]), key:(u[0]+' '+u[1]).toLowerCase()}; }));

  function attach(input){
    if(!input || input._unitsAttached) return; input._unitsAttached=true;
    var wrap=document.createElement('div'); wrap.style.cssText='position:relative';
    input.parentNode.insertBefore(wrap,input); wrap.appendChild(input);
    var box=document.createElement('div');
    box.style.cssText='display:none;position:absolute;left:0;right:0;top:100%;z-index:50;max-height:240px;overflow-y:auto;background:#fff;border:1.5px solid #C9D3DD;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.18);margin-top:2px;-webkit-overflow-scrolling:touch';
    wrap.appendChild(box);
    input.setAttribute('autocomplete','off');
    var shown=[], hi=-1;
    function render(){
      var q=input.value.trim().toLowerCase().replace(/^護理部[／\/]?/,'');
      shown=ITEMS.filter(function(it){ return !q || it.key.indexOf(q)>=0 || it.v.toLowerCase().indexOf(q)>=0; });
      if(!shown.length){ box.style.display='none'; return; }
      box.innerHTML=''; hi=-1;
      shown.forEach(function(it,i){
        var d=document.createElement('div'); d.textContent=it.label; d.dataset.i=i;
        d.style.cssText='padding:.6rem .8rem;font-size:15px;border-bottom:1px solid #EEF1F4;cursor:pointer';
        box.appendChild(d);
      });
      box.style.display='block';
    }
    function pick(i){
      var it=shown[i]; if(!it) return;
      input.value=it.v; box.style.display='none';
      input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    function mark(){ Array.prototype.forEach.call(box.children,function(c,i){ c.style.background=i===hi?'#E8F1FB':''; if(i===hi) c.scrollIntoView({block:'nearest'}); }); }
    input.addEventListener('focus',render);
    input.addEventListener('input',render);
    input.addEventListener('keydown',function(e){
      if(box.style.display==='none') return;
      if(e.key==='ArrowDown'){ hi=Math.min(shown.length-1,hi+1); mark(); e.preventDefault(); }
      else if(e.key==='ArrowUp'){ hi=Math.max(0,hi-1); mark(); e.preventDefault(); }
      else if(e.key==='Enter' && hi>=0){ pick(hi); e.preventDefault(); }
      else if(e.key==='Escape'){ box.style.display='none'; }
    });
    // 用 pointerdown + preventDefault，避免點選時輸入框先失焦、選單先消失
    box.addEventListener('pointerdown',function(e){ var t=e.target.closest('[data-i]'); if(!t) return; e.preventDefault(); pick(+t.dataset.i); });
    document.addEventListener('pointerdown',function(e){ if(!wrap.contains(e.target)) box.style.display='none'; });
    input.addEventListener('blur',function(){ setTimeout(function(){ box.style.display='none'; },150); });
  }
  window.EBNUnits={attach:attach,items:ITEMS};
})();
