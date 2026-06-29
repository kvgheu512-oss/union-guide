/* 🗺 全台縣市→區 + 3碼郵遞區號（單一資料源，供地址選擇器共用）
   資料格式：每個縣市一條字串，"區名郵碼" 以逗號分隔，郵碼為 3 碼。
   用法見 buildAddressPicker()。完全本機，不上傳。 */
(function(){
  var RAW = {
    "臺北市":"中正100,大同103,中山104,松山105,大安106,萬華108,信義110,士林111,北投112,內湖114,南港115,文山116",
    "基隆市":"仁愛200,信義201,中正202,中山203,安樂204,暖暖205,七堵206",
    "新北市":"萬里207,金山208,板橋220,汐止221,深坑222,石碇223,瑞芳224,平溪226,雙溪227,貢寮228,新店231,坪林232,烏來233,永和234,中和235,土城236,三峽237,樹林238,鶯歌239,三重241,新莊242,泰山243,林口244,蘆洲247,五股248,八里249,淡水251,三芝252,石門253",
    "桃園市":"中壢320,平鎮324,龍潭325,楊梅326,新屋327,觀音328,桃園330,龜山333,八德334,大溪335,復興336,大園337,蘆竹338",
    "新竹市":"東區300,北區300,香山300",
    "新竹縣":"竹北302,湖口303,新豐304,新埔305,關西306,芎林307,寶山308,竹東310,五峰311,橫山312,尖石313,北埔314,峨眉315",
    "苗栗縣":"竹南350,頭份351,三灣352,南庄353,獅潭354,後龍356,通霄357,苑裡358,苗栗360,造橋361,頭屋362,公館363,大湖364,泰安365,銅鑼366,三義367,西湖368,卓蘭369",
    "臺中市":"中區400,東區401,南區402,西區403,北區404,北屯406,西屯407,南屯408,太平411,大里412,霧峰413,烏日414,豐原420,后里421,石岡422,東勢423,和平424,新社426,潭子427,大雅428,神岡429,大肚432,沙鹿433,龍井434,梧棲435,清水436,大甲437,外埔438,大安439",
    "彰化縣":"彰化500,芬園502,花壇503,秀水504,鹿港505,福興506,線西507,和美508,伸港509,員林510,社頭511,永靖512,埔心513,溪湖514,大村515,埔鹽516,田中520,北斗521,田尾522,埤頭523,溪州524,竹塘525,二林526,大城527,芳苑528,二水530",
    "南投縣":"南投540,中寮541,草屯542,國姓544,埔里545,仁愛546,名間551,集集552,水里553,魚池555,信義556,竹山557,鹿谷558",
    "雲林縣":"斗南630,大埤631,虎尾632,土庫633,褒忠634,東勢635,臺西636,崙背637,麥寮638,斗六640,林內643,古坑646,莿桐647,西螺648,二崙649,北港651,水林652,口湖653,四湖654,元長655",
    "嘉義市":"東區600,西區600",
    "嘉義縣":"番路602,梅山603,竹崎604,阿里山605,中埔606,大埔607,水上608,鹿草611,太保612,朴子613,東石614,六腳615,新港616,民雄621,大林622,溪口623,義竹624,布袋625",
    "臺南市":"中西區700,東區701,南區702,北區704,安平708,安南709,永康710,歸仁711,新化712,左鎮713,玉井714,楠西715,南化716,仁德717,關廟718,龍崎719,官田720,麻豆721,佳里722,西港723,七股724,將軍725,學甲726,北門727,新營730,後壁731,白河732,東山733,六甲734,下營735,柳營736,鹽水737,善化741,大內742,山上743,新市744,安定745",
    "高雄市":"新興800,前金801,苓雅802,鹽埕803,鼓山804,旗津805,前鎮806,三民807,楠梓811,小港812,左營813,仁武814,大社815,岡山820,路竹821,阿蓮822,田寮823,燕巢824,橋頭825,梓官826,彌陀827,永安828,湖內829,鳳山830,大寮831,林園832,鳥松833,大樹840,旗山842,美濃843,六龜844,內門845,杉林846,甲仙847,桃源848,那瑪夏849,茂林851,茄萣852",
    "屏東縣":"屏東900,三地門901,霧臺902,瑪家903,九如904,里港905,高樹906,鹽埔907,長治908,麟洛909,竹田911,內埔912,萬丹913,潮州920,泰武921,來義922,萬巒923,崁頂924,新埤925,南州926,林邊927,東港928,琉球929,佳冬931,新園932,枋寮940,枋山941,春日942,獅子943,車城944,牡丹945,恆春946,滿州947",
    "宜蘭縣":"宜蘭260,頭城261,礁溪262,壯圍263,員山264,羅東265,三星266,大同267,五結268,冬山269,蘇澳270,南澳272",
    "花蓮縣":"花蓮970,新城971,秀林972,吉安973,壽豐974,鳳林975,光復976,豐濱977,瑞穗978,萬榮979,玉里981,卓溪982,富里983",
    "臺東縣":"臺東950,綠島951,蘭嶼952,延平953,卑南954,鹿野955,關山956,海端957,池上958,東河959,成功961,長濱962,太麻里963,金峰964,大武965,達仁966",
    "澎湖縣":"馬公880,西嶼881,望安882,七美883,白沙884,湖西885",
    "金門縣":"金沙890,金湖891,金寧892,金城893,烈嶼894,烏坵896",
    "連江縣":"南竿209,北竿210,莒光211,東引212"
  };

  // 直轄市＋省轄市：所有下轄一律「區」
  var CITY_ALL_QU = {"臺北市":1,"新北市":1,"桃園市":1,"臺中市":1,"臺南市":1,"高雄市":1,"基隆市":1,"新竹市":1,"嘉義市":1};
  // 縣轄市（後綴「市」）
  var COUNTY_SHI = {"竹北":1,"苗栗":1,"頭份":1,"彰化":1,"員林":1,"南投":1,"斗六":1,"太保":1,"朴子":1,"屏東":1,"宜蘭":1,"花蓮":1,"臺東":1,"馬公":1};
  // 縣轄鎮（後綴「鎮」）；其餘縣轄一律「鄉」
  var COUNTY_ZHEN = {"羅東":1,"蘇澳":1,"頭城":1,"竹東":1,"新埔":1,"關西":1,"竹南":1,"後龍":1,"通霄":1,"苑裡":1,"卓蘭":1,"鹿港":1,"和美":1,"北斗":1,"溪湖":1,"田中":1,"二林":1,"草屯":1,"竹山":1,"集集":1,"埔里":1,"斗南":1,"虎尾":1,"西螺":1,"土庫":1,"北港":1,"大林":1,"布袋":1,"潮州":1,"東港":1,"恆春":1,"成功":1,"關山":1,"鳳林":1,"玉里":1,"金城":1,"金沙":1,"金湖":1};

  // 解析成 { 縣市: [ {name:"仁武區", zip:"814"}, ... ] }，自動補行政區後綴
  var TW = {};
  Object.keys(RAW).forEach(function(city){
    var allQu = !!CITY_ALL_QU[city];
    TW[city] = RAW[city].split(",").map(function(s){
      var zip = s.slice(-3), base = s.slice(0, -3), suffix;
      if(allQu) suffix = "區";
      else if(COUNTY_SHI[base]) suffix = "市";
      else if(COUNTY_ZHEN[base]) suffix = "鎮";
      else suffix = "鄉";
      return { name: base + suffix, zip: zip };
    });
  });

  window.TW_AREA = TW;

  /* 建立地址選擇器
     opts = {
       mount: 容器元素,
       defaultCity: 預設縣市（如 "高雄市"）,
       defaultDist: 預設區（如 "仁武區" 或 "仁武"）,
       onChange: function(value, parts){}  // 任何欄位變動時回呼
     }
     回傳 { get:function(){return 完整地址字串}, getParts:function(), set:function(parts) } */
  window.buildAddressPicker = function(opts){
    opts = opts || {};
    var mount = opts.mount;
    var iStyle = "box-sizing:border-box;border:1.5px solid #EAD67A;border-radius:8px;padding:8px 10px;font-size:15px;background:#FEF9E7;font-family:inherit";

    var dlId = "ap-road-dl-" + Math.random().toString(36).slice(2,7);
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div style="display:flex;gap:6px;margin-bottom:6px">'+
        '<select class="ap-city" style="flex:1;'+iStyle+'"></select>'+
        '<select class="ap-dist" style="flex:1;'+iStyle+'"></select>'+
      '</div>'+
      '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'+
        '<span style="font-size:13px;color:#7A5600;white-space:nowrap">郵遞區號</span>'+
        '<input class="ap-zip3" inputmode="tel" maxlength="3" readonly style="width:62px;text-align:center;'+iStyle+';background:#F0EAD0">'+
        '<span style="color:#7A5600">-</span>'+
        '<input class="ap-zip2" inputmode="tel" maxlength="2" placeholder="00" style="width:52px;text-align:center;'+iStyle+'">'+
        '<span style="font-size:12px;color:#999">後2碼選填</span>'+
      '</div>'+
      '<select class="ap-roadsel" style="width:100%;'+iStyle+';margin-bottom:6px;display:none"></select>'+
      '<select class="ap-seg" style="width:100%;'+iStyle+';margin-bottom:6px;display:none"></select>'+
      '<input class="ap-road" type="text" placeholder="路／街名（輸入一個字即有選項）" autocomplete="new-password" list="'+dlId+'" style="width:100%;'+iStyle+';margin-bottom:6px">'+
      '<datalist id="'+dlId+'"></datalist>'+
      '<div style="font-size:12px;color:#7A5600;margin-bottom:3px">門牌（只填數字，沒有的免填）</div>'+
      '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">'+
        '<input class="ap-sec" type="text" inputmode="tel" style="width:40px;text-align:center;'+iStyle+'"><span style="font-size:13px;color:#7A5600">段</span>'+
        '<input class="ap-lane"  type="text" inputmode="tel" style="width:40px;text-align:center;'+iStyle+'"><span style="font-size:13px;color:#7A5600">巷</span>'+
        '<input class="ap-alley" type="text" inputmode="tel" style="width:40px;text-align:center;'+iStyle+'"><span style="font-size:13px;color:#7A5600">弄</span>'+
        '<input class="ap-no"    type="text" inputmode="tel" style="width:48px;text-align:center;'+iStyle+'"><span style="font-size:13px;color:#7A5600">號</span>'+
        '<input class="ap-floor" type="text" inputmode="tel" style="width:40px;text-align:center;'+iStyle+'"><span style="font-size:13px;color:#7A5600">樓</span>'+
      '</div>';

    var citySel = wrap.querySelector(".ap-city");
    var distSel = wrap.querySelector(".ap-dist");
    var zip3 = wrap.querySelector(".ap-zip3");
    var zip2 = wrap.querySelector(".ap-zip2");
    var roadSel = wrap.querySelector(".ap-roadsel");
    var segSel = wrap.querySelector(".ap-seg");
    var roadIn = wrap.querySelector(".ap-road");
    var secIn = wrap.querySelector(".ap-sec");
    var laneIn = wrap.querySelector(".ap-lane");
    var alleyIn = wrap.querySelector(".ap-alley");
    var noIn = wrap.querySelector(".ap-no");
    var floorIn = wrap.querySelector(".ap-floor");
    function composeRest(){
      var v=secIn.value.trim(), l=laneIn.value.trim(), a=alleyIn.value.trim(), n=noIn.value.trim(), f=floorIn.value.trim();
      return (v?v+'段':'')+(l?l+'巷':'')+(a?a+'弄':'')+(n?n+'號':'')+(f?f+'樓':'');
    }

    // 縣市選項
    citySel.innerHTML = '<option value="">縣市…</option>' +
      Object.keys(TW).map(function(c){ return '<option>'+c+'</option>'; }).join("");

    function fillDist(city, keepDist){
      var list = TW[city] || [];
      distSel.innerHTML = '<option value="">區／鄉鎮市…</option>' +
        list.map(function(d){ return '<option value="'+d.name+'" data-zip="'+d.zip+'">'+d.name+'</option>'; }).join("");
      if(keepDist){ distSel.value = keepDist; syncZip(); }
    }
    function syncZip(){
      var opt = distSel.options[distSel.selectedIndex];
      zip3.value = opt ? (opt.getAttribute("data-zip")||"") : "";
    }
    function fire(){ if(typeof opts.onChange==="function") opts.onChange(api.get(), api.getParts()); }

    // ── 3+2 路名→5碼（若該縣市區有內嵌資料，路名改用下拉、自動帶後2碼）
    function curZip5(){
      var key = (citySel.value||"") + (distSel.value||"");
      return (window.TW_ZIP5 && window.TW_ZIP5[key]) || null;
    }
    function syncRoadMode(keepRoad){
      var z5 = curZip5();
      if(z5){
        var roads = Object.keys(z5).sort();
        roadSel.innerHTML = '<option value="">選路／街名（自動帶郵遞區號）…</option>' +
          roads.map(function(r){ return '<option>'+r+'</option>'; }).join("") +
          '<option value="__other">▸ 找不到？手動輸入</option>';
        roadSel.style.display = "";
        roadIn.style.display = "none";
        segSel.style.display = "none";
        if(keepRoad && z5[keepRoad]){ roadSel.value = keepRoad; onRoadSel(); }
        else if(keepRoad){ roadSel.value="__other"; roadIn.style.display=""; roadIn.value=keepRoad; }
      } else {
        roadSel.style.display = "none";
        segSel.style.display = "none";
        roadIn.style.display = "";
        var key = (citySel.value||"") + (distSel.value||"");
        var streets = (window.TW_STREETS && window.TW_STREETS[key]) || [];
        var dl = wrap.querySelector("datalist");
        if(dl) dl.innerHTML = streets.map(function(s){ return '<option value="'+s+'">'; }).join("");
        if(keepRoad) roadIn.value = keepRoad;
      }
    }
    function onRoadSel(){
      var z5 = curZip5(); if(!z5) return;
      var r = roadSel.value;
      if(r === "__other"){ roadIn.style.display=""; roadIn.value=""; segSel.style.display="none"; zip2.value=""; roadIn.focus(); return; }
      roadIn.style.display = "none";
      roadIn.value = r;
      var segs = z5[r] || [];
      var uniqZ = {}; segs.forEach(function(s){ uniqZ[s.z]=1; });
      if(!r){ segSel.style.display="none"; zip2.value=""; }
      else if(Object.keys(uniqZ).length <= 1){
        segSel.style.display = "none";
        zip2.value = segs.length ? segs[0].z.slice(-2) : "";
      } else {
        // 多個投遞段：列出讓使用者依門牌挑
        segSel.innerHTML = '<option value="">依門牌選段別…</option>' +
          segs.map(function(s){ return '<option value="'+s.z+'">'+s.s+' → '+s.z+'</option>'; }).join("");
        segSel.style.display = "";
        zip2.value = "";
      }
    }

    citySel.addEventListener("change", function(){ fillDist(citySel.value); zip3.value=""; zip2.value=""; syncRoadMode(); fire(); });
    distSel.addEventListener("change", function(){ syncZip(); zip2.value=""; syncRoadMode(); fire(); });
    roadSel.addEventListener("change", function(){ onRoadSel(); fire(); });
    segSel.addEventListener("change", function(){ if(segSel.value) zip2.value = segSel.value.slice(-2); fire(); });
    [zip2, roadIn, secIn, laneIn, alleyIn, noIn, floorIn].forEach(function(el){ el.addEventListener("input", fire); });

    var api = {
      getParts: function(){
        return {
          city: citySel.value, dist: distSel.value,
          zip3: zip3.value, zip2: zip2.value,
          road: roadIn.value.trim(),
          sec: secIn.value.trim(), lane: laneIn.value.trim(), alley: alleyIn.value.trim(), no: noIn.value.trim(), floor: floorIn.value.trim(),
          rest: composeRest()
        };
      },
      get: function(){
        var p = api.getParts();
        var zip = p.zip3 ? (p.zip3 + (p.zip2||"")) : "";
        var addr = (p.city||"") + (p.dist||"") + p.road + p.rest;
        return (zip ? zip + " " : "") + addr;
      },
      set: function(p){
        p = p || {};
        if(p.city){ citySel.value = p.city; fillDist(p.city, p.dist); }
        syncRoadMode(p.road!=null ? p.road : "");
        if(p.road!=null) roadIn.value = p.road;
        if(p.zip2!=null) zip2.value = p.zip2;   // 還原使用者存的後2碼（覆蓋自動值）
        if(p.sec!=null) secIn.value = p.sec;
        if(p.lane!=null) laneIn.value = p.lane;
        if(p.alley!=null) alleyIn.value = p.alley;
        if(p.no!=null) noIn.value = p.no;
        if(p.floor!=null) floorIn.value = p.floor;
      }
    };

    // 預設值
    var dc = opts.defaultCity || "高雄市";
    citySel.value = dc;
    fillDist(dc, opts.defaultDist || "");
    syncRoadMode();

    mount.appendChild(wrap);
    return api;
  };
})();
