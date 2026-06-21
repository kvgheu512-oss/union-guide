/* ===================================================================
   law-tips.js · 漫畫風「遊戲讀取小提醒」
   用法：頁面底部加一行 <script src="law-tips.js" defer></script>
   行為：每個瀏覽工作階段(session)只跳一次，隨機風格(A/B/E)＋隨機法律小知識，
        約 2.4 秒自動淡出，點任意處可跳過。國小三年級看得懂的白話。
   Demo 覆寫：?ltstyle=a|b|e  ?lttip=0..  ?ltkeep=1(不自動關)  ?ltforce=1(忽略session)
=================================================================== */
(function(){
  "use strict";
  var SESSION_KEY="lawtip_seen_v1";
  var STYLES=["a","b","e"];
  var TIPS=[
   {emo:"💪",q:'老闆說你沒加班？<br>出勤紀錄就<i>算上班</i>！',law:"勞動事件法 §38"},
   {emo:"⚖️",q:'薪水有爭議？<br>法律<i>推定</i>對你有利！',law:"勞動事件法 §37"},
   {emo:"📑",q:'你要的資料，<br>老闆<i>有義務</i>交出來！',law:"勞動事件法 §35"},
   {emo:"🙅",q:'老闆不交資料？<br>法院可<i>認你說的為真</i>！',law:"勞動事件法 §36"},
   {emo:"🏠",q:'告老闆可選<br><i>你上班地</i>的法院！',law:"勞動事件法 §6"},
   {emo:"🧭",q:'不公平的管轄約定，<br>勞工可<i>聲請移送</i>！',law:"勞動事件法 §7"},
   {emo:"🤝",q:'開庭不孤單～<br>工會可<i>派人陪你</i>！',law:"勞動事件法 §9"},
   {emo:"💸",q:'討薪、資遣官司，<br>裁判費<i>暫免徵收</i>！',law:"勞動事件法 §12"},
   {emo:"🆘",q:'低收入等<br>可聲請<i>訴訟救助</i>！',law:"勞動事件法 §14"},
   {emo:"🕊️",q:'告之前先<i>免費調解</i>，<br>又快又省！',law:"勞動事件法 §16"},
   {emo:"⏩",q:'勞動調解<br><i>3 個月 3 次</i>內結束！',law:"勞動事件法 §24"},
   {emo:"🔒",q:'勞動調解<br><i>不公開</i>，保護你！',law:"勞動事件法 §25"},
   {emo:"🤐",q:'調解破局，剛剛的<br>讓步<i>不能拿來對付你</i>！',law:"勞動事件法 §30"},
   {emo:"🏃",q:'勞動官司盡量<br><i>6 個月</i>內審完！',law:"勞動事件法 §32"},
   {emo:"💴",q:'勝訴，法院會<br><i>主動讓你先拿錢</i>！',law:"勞動事件法 §44"},
   {emo:"🔙",q:'被違法開除？<br>可聲請<i>復職領薪</i>！',law:"勞動事件法 §49"},
   {emo:"🔄",q:'被違法調動？<br>可聲請<i>回原職</i>！',law:"勞動事件法 §50"},
   {emo:"👥",q:'侵害多數會員，<br>工會可<i>提告</i>！',law:"勞動事件法 §40"},
   {emo:"🧊",q:'怕老闆脫產？保全<br><i>擔保只要 1/10</i>！',law:"勞動事件法 §47"},
   {emo:"⏰",q:'正常上班<br>一天<i>8 小時</i>為限！',law:"勞基法 §30"},
   {emo:"🕐",q:'出勤紀錄要<br><i>記到分、存 5 年</i>！',law:"勞基法 §30"},
   {emo:"📅",q:'加班連同正常<br>一天<i>不超過 12 時</i>！',law:"勞基法 §32"},
   {emo:"🗓️",q:'加班一個月<br><i>最多 46 小時</i>！',law:"勞基法 §32"},
   {emo:"💵",q:'平日加班<br>前 2 時<i>加給 1/3</i>！',law:"勞基法 §24"},
   {emo:"☕",q:'連續工作 4 時，<br>至少休<i>30 分鐘</i>！',law:"勞基法 §35"},
   {emo:"😴",q:'換班中間<br>至少休<i>11 小時</i>！',law:"勞基法 §34"},
   {emo:"📆",q:'每 7 天<br>至少休<i>1 天例假</i>！',law:"勞基法 §36"},
   {emo:"🎌",q:'國定假日<br><i>要放假</i>！',law:"勞基法 §37"},
   {emo:"🏖️",q:'特休沒放完，<br>老闆要<i>折錢</i>給你！',law:"勞基法 §38"},
   {emo:"✨",q:'假日被叫上班，<br>工資<i>加倍</i>給！',law:"勞基法 §39"},
   {emo:"🌪️",q:'天災被叫上班，<br>工資<i>加倍</i>＋補假！',law:"勞基法 §40"},
   {emo:"🙅",q:'有正當理由，<br>可<i>拒絕加班</i>！',law:"勞基法 §42"},
   {emo:"🤧",q:'婚、喪、病<br>都<i>可以請假</i>！',law:"勞基法 §43"},
   {emo:"💴",q:'薪水不能低於<br><i>基本工資</i>！',law:"勞基法 §21"},
   {emo:"💰",q:'工資要<i>全額</i>給，<br>不能亂扣！',law:"勞基法 §22"},
   {emo:"🧾",q:'薪水<i>每月至少發 2 次</i>，<br>清冊存 5 年！',law:"勞基法 §23"},
   {emo:"🟰",q:'同工<i>同酬</i>，<br>不能因性別差別！',law:"勞基法 §25"},
   {emo:"🚫",q:'不能<i>預扣工資</i><br>當違約金！',law:"勞基法 §26"},
   {emo:"⏳",q:'老闆拖薪，主管機關<br>可<i>限期令給付</i>！',law:"勞基法 §27"},
   {emo:"🧱",q:'老闆倒了欠薪？<br>有<i>墊償基金</i>第一順位！',law:"勞基法 §28"},
   {emo:"🎁",q:'年終有盈餘，<br>應給<i>獎金或紅利</i>！',law:"勞基法 §29"},
   {emo:"📃",q:'臨時/短期才可<br>簽<i>定期契約</i>！',law:"勞基法 §9"},
   {emo:"🚪",q:'競業禁止要<i>合理</i><br>＋給補償才算！',law:"勞基法 §9-1"},
   {emo:"🔀",q:'調動工作<br>要守<i>5 原則</i>！',law:"勞基法 §10-1"},
   {emo:"📋",q:'要資遣你，<br>須有<i>法定理由</i>！',law:"勞基法 §11"},
   {emo:"🆘",q:'老闆違法欠薪？你可<br><i>被迫離職拿資遣費</i>！',law:"勞基法 §14"},
   {emo:"📦",q:'資遣要<i>先預告</i><br>＋給謀職假！',law:"勞基法 §16"},
   {emo:"💶",q:'被資遣<br>老闆要給<i>資遣費</i>！',law:"勞基法 §17"},
   {emo:"📄",q:'離職可要<br><i>服務證明書</i>！',law:"勞基法 §19"},
   {emo:"🔁",q:'公司轉手，留用的<br><i>年資要接續</i>！',law:"勞基法 §20"},
   {emo:"🛡️",q:'產假、醫療期間<br><i>不能開除你</i>！',law:"勞基法 §13"},
   {emo:"🍼",q:'生產前後<br>有<i>8 週產假</i>！',law:"勞基法 §50"},
   {emo:"🤰",q:'懷孕可改做<br><i>較輕鬆</i>的工作！',law:"勞基法 §51"},
   {emo:"🤱",q:'未滿 1 歲，<br>每天有<i>哺乳時間</i>！',law:"勞基法 §52"},
   {emo:"🌙",q:'童工<i>晚 8 點後</i><br>不能工作！',law:"勞基法 §48"},
   {emo:"🚑",q:'職災：醫藥費＋<br><i>原領工資</i>老闆補！',law:"勞基法 §59"},
   {emo:"⌛",q:'職災補償<br><i>2 年</i>內要請求！',law:"勞基法 §61"},
   {emo:"👴",q:'年滿 65，<br>可被<i>強制退休</i>！',law:"勞基法 §54"},
   {emo:"🏦",q:'老闆要<i>按月提撥</i><br>退休準備金！',law:"勞基法 §56"},
   {emo:"✍️",q:'30 人以上，工作規則<br>要訂＋<i>公開揭示</i>！',law:"勞基法 §70"},
   {emo:"📣",q:'向老闆申訴，<br>他<i>不能報復</i>！',law:"勞基法 §74"},
   {emo:"⛓️",q:'老闆<i>不能強迫</i><br>你勞動！',law:"勞基法 §5"},
   {emo:"🪑",q:'事業單位要辦<br><i>勞資會議</i>！',law:"勞基法 §83"},
   {emo:"🧾",q:'薪資單要<i>列清楚</i>，<br>扣什麼都要寫！',law:"勞基法施行細則 §14-1"},
   {emo:"📝",q:'勞動契約該寫：<br>工資工時<i>休假</i>都要！',law:"勞基法施行細則 §7"},
   {emo:"🚪",q:'競業禁止<br>一定要<i>白紙黑字</i>！',law:"勞基法施行細則 §7-1"},
   {emo:"💴",q:'離職時老闆要<br><i>立刻結清工資</i>！',law:"勞基法施行細則 §9"},
   {emo:"📊",q:'加班費、資遣費<br>看<i>平均工資</i>算！',law:"勞基法施行細則 §2"},
   {emo:"🕐",q:'刷卡、簽到、門禁<br>都算<i>出勤紀錄</i>！',law:"勞基法施行細則 §21"},
   {emo:"🧮",q:'特休沒休完，<br>年底要<i>結算給錢</i>！',law:"勞基法施行細則 §24-1"},
   {emo:"📢",q:'老闆有些事<br>要<i>公告周知</i>！',law:"勞基法施行細則 §20"},
   // ===== 護理人員法 =====
   {emo:"🩺",q:'護理師的工作有<i>法定範圍</i>，<br>醫療輔助要醫囑！',law:"護理人員法 §24"},
   {emo:"📋",q:'執行護理<br>要<i>製作紀錄</i>！',law:"護理人員法 §25"},
   {emo:"🚨",q:'病人危急，必要時<br>可<i>先緊急救護</i>！',law:"護理人員法 §26"},
   {emo:"🔐",q:'因業務知道的<i>秘密</i>，<br>不能外洩！',law:"護理人員法 §28"},
   {emo:"🎫",q:'護理師要<i>執業登記</i><br>領執照才能做！',law:"護理人員法 §8"},
   {emo:"🪪",q:'護理證照<br><i>不能借人</i>用！',law:"護理人員法 §30-1"},
   {emo:"⛔",q:'沒牌做護理業務，<br><i>最重關 3 年</i>！',law:"護理人員法 §37"},
   // ===== 醫療法 =====
   {emo:"🛑",q:'打罵醫護、鬧醫院<br>＝<i>違法</i>！',law:"醫療法 §24"},
   {emo:"👮",q:'對醫護施暴妨害醫療，<br><i>最重關 3 年</i>！',law:"醫療法 §106"},
   {emo:"⚖️",q:'醫療有損害，<br><i>有過失才賠</i>！',law:"醫療法 §82"},
   {emo:"🤫",q:'病人病情<br><i>不能無故外洩</i>！',law:"醫療法 §72"},
   {emo:"✍️",q:'病歷要<i>親自寫</i><br>並簽名！',law:"醫療法 §68"},
   {emo:"🗄️",q:'病歷至少<br><i>保存 7 年</i>！',law:"醫療法 §70"},
   {emo:"🆘",q:'遇危急病人<br>要<i>先急救</i>！',law:"醫療法 §60"},
   {emo:"🔪",q:'開刀前要說明<br>＋簽<i>手術同意書</i>！',law:"醫療法 §63"},
   // ===== 職業安全衛生法 =====
   {emo:"⚠️",q:'有立即危險，你可<i>停工退避</i>，<br>老闆不能扣你！',law:"職業安全衛生法 §18"},
   {emo:"🥽",q:'防醫療暴力，老闆要做<br><i>預防＋申訴機制</i>！',law:"職業安全衛生法 §6"},
   {emo:"🥱",q:'輪班、夜班、過長工時，<br>老闆要<i>預防過勞</i>！',law:"職業安全衛生法 §6"},
   {emo:"📣",q:'疑似職業病、身心受害<br>可申訴，報復<i>無效</i>！',law:"職業安全衛生法 §39"},
   {emo:"🚨",q:'出職災，老闆要<br><i>8 小時內通報</i>！',law:"職業安全衛生法 §37"},
   // ===== 職場霸凌新制（2026/7/1 上路）=====
   {emo:"🆕",q:'職場霸凌新制<i>7/1 上路</i>！<br>冷落、孤立、羞辱都算',law:"職業安全衛生法 §22-1"},
   {emo:"📢",q:'公司 10 人以上要設<br><i>霸凌申訴管道</i>！',law:"職業安全衛生法 §22-1"},
   {emo:"⚡",q:'老闆知道你被霸凌，<br><i>要立刻處理</i>！',law:"職業安全衛生法 §22-2"},
   {emo:"🏛️",q:'被最高層霸凌？<br>可<i>直接告到勞工局</i>！',law:"職業安全衛生法 §22-3"},
   {emo:"⏳",q:'霸凌申訴：行為結束起<br><i>3 年內</i>要提！',law:"職業安全衛生法 §22-3"},
   {emo:"💸",q:'最高負責人霸凌人，<br><i>最重罰 100 萬</i>！',law:"職業安全衛生法 §46"},
   // ===== 性別平等工作法 =====
   {emo:"🩺",q:'懷孕有<i>產檢假 7 天</i>，<br>薪水照給！',law:"性別平等工作法 §15"},
   {emo:"👶",q:'另一半生產，<br>有<i>陪產假 7 天</i>！',law:"性別平等工作法 §15"},
   {emo:"🍼",q:'子女 3 歲前可請<br><i>育嬰留停</i>（最長 2 年）！',law:"性別平等工作法 §16"},
   {emo:"🩸",q:'生理痛？每月可請<br><i>生理假 1 天</i>！',law:"性別平等工作法 §14"},
   {emo:"🤱",q:'子女未滿 2 歲，<br>每天<i>哺乳 60 分</i>！',law:"性別平等工作法 §18"},
   {emo:"🕑",q:'養未滿 3 歲小孩，<br>可<i>每天少做 1 小時</i>！',law:"性別平等工作法 §19"},
   {emo:"🏥",q:'家人生病要顧，<br>有<i>家庭照顧假</i>！',law:"性別平等工作法 §20"},
   {emo:"💍",q:'不能因<i>結婚、懷孕</i><br>逼你離職！',law:"性別平等工作法 §11"},
   {emo:"🚺",q:'招募、升遷、考績<br>不能<i>性別歧視</i>！',law:"性別平等工作法 §7"},
   {emo:"✋",q:'公司要<i>防治性騷擾</i><br>＋設申訴管道！',law:"性別平等工作法 §13"},
   {emo:"✅",q:'請這些家庭假，老闆<br><i>不能拒絕或扣考績</i>！',law:"性別平等工作法 §21"},
   // ===== 公務員服務法（具公務員身分者）=====
   {emo:"⚖️",q:'長官命令<i>違反刑法</i>？<br>你沒有服從義務！',law:"公務員服務法 §3"},
   {emo:"🕗",q:'公務員每天<i>辦公 8 小時</i>、<br>每週休 2 天！',law:"公務員服務法 §12"},
   {emo:"📆",q:'公務員有<i>公假、休假</i><br>＋事病婚喪假！',law:"公務員服務法 §13"},
   {emo:"🚫",q:'公務員<i>不得經營商業</i>！',law:"公務員服務法 §14"},
   {emo:"💼",q:'公務員<i>不能隨便</i><br>兼職兼差！',law:"公務員服務法 §15"},
   {emo:"🚪",q:'離職 3 年內不得任相關<br>營利職（<i>旋轉門</i>）！',law:"公務員服務法 §16"},
   {emo:"🔄",q:'遇親屬利害關係，<br>要<i>依法迴避</i>！',law:"公務員服務法 §19"},
   {emo:"☎️",q:'被坑就打 <i>1955</i><br>勞工專線，免費匿名！',law:"勞工申訴 · 24h"},
  ];

  function qp(k){ try{return new URLSearchParams(location.search).get(k);}catch(e){return null;} }
  var pStyle=qp("ltstyle"), pTip=qp("lttip"), pKeep=qp("ltkeep")==="1", pForce=qp("ltforce")==="1";

  if(!pForce){
    try{ if(sessionStorage.getItem(SESSION_KEY)) return; sessionStorage.setItem(SESSION_KEY,"1"); }catch(e){}
  }

  var CSS=''
  +'#lawtip{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;opacity:0;transition:opacity .25s ease;font-family:"Baloo 2","Noto Sans TC",system-ui,sans-serif}'
  +'#lawtip.show{opacity:1}'
  +'#lawtip .lw{position:relative;z-index:3;width:min(420px,92vw);text-align:center;padding:0 16px}'
  +'#lawtip .emo{filter:drop-shadow(3px 4px 0 rgba(0,0,0,.22));animation:ltbob 1.6s ease-in-out infinite}'
  +'#lawtip .q i{font-style:normal}'
  +'@keyframes ltbob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}'
  +'@keyframes ltspin{to{transform:rotate(360deg)}}'
  /* A */
  +'#lawtip.s-a{background:radial-gradient(circle at 50% 30%,#4DA3FF,#2E6BE6 55%,#1B3D9E)}'
  +'#lawtip.s-a:before{content:"";position:absolute;inset:0;opacity:.18;background-image:radial-gradient(#fff 1.6px,transparent 1.7px);background-size:14px 14px}'
  +'#lawtip.s-a .badge{display:inline-block;background:#FFE13D;color:#C0392B;font-weight:800;font-size:18px;padding:8px 22px;border:3px solid #1A1A1A;border-radius:40px;transform:rotate(-3deg);box-shadow:4px 4px 0 #1A1A1A;margin-bottom:6px}'
  +'#lawtip.s-a .sub{color:#fff;font-weight:700;font-size:13px;opacity:.9;margin-bottom:16px}'
  +'#lawtip.s-a .emo{font-size:74px}'
  +'#lawtip.s-a .bubble{position:relative;background:#fff;border:4px solid #1A1A1A;border-radius:22px;padding:22px 20px;box-shadow:7px 7px 0 #1A1A1A;margin-top:14px}'
  +'#lawtip.s-a .bubble:before{content:"";position:absolute;top:-22px;left:50%;transform:translateX(-50%);border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:22px solid #1A1A1A}'
  +'#lawtip.s-a .q{font-size:25px;font-weight:900;color:#1A2740;line-height:1.45}'
  +'#lawtip.s-a .q i{background:linear-gradient(transparent 55%,#FFE13D 55%)}'
  +'#lawtip.s-a .law{display:inline-block;margin-top:14px;background:#1A2740;color:#fff;font-size:12.5px;font-weight:700;padding:5px 14px;border-radius:30px}'
  /* B */
  +'#lawtip.s-b{background:radial-gradient(circle at 50% 32%,#7C4DFF,#5B27D6 55%,#3A148F)}'
  +'#lawtip.s-b:before{content:"";position:absolute;inset:0;opacity:.16;background-image:radial-gradient(#fff 1.6px,transparent 1.7px);background-size:14px 14px}'
  +'#lawtip.s-b .badge{display:inline-block;background:#FFE13D;color:#6A2BD6;font-weight:800;font-size:17px;padding:7px 20px;border:3px solid #1A1A1A;border-radius:40px;transform:rotate(-3deg);box-shadow:4px 4px 0 #1A1A1A;margin-bottom:22px}'
  +'#lawtip.s-b .coin{position:relative;width:min(320px,82vw);margin:0 auto;aspect-ratio:1/1}'
  +'#lawtip.s-b .ring{position:absolute;inset:-10px;border-radius:50%;background:conic-gradient(#FFE13D 0 90deg,transparent 90deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 11px));mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 11px));animation:ltspin 1.4s linear infinite}'
  +'#lawtip.s-b .disc{position:absolute;inset:0;border-radius:50%;background:#fff;border:5px solid #1A1A1A;box-shadow:0 10px 0 rgba(0,0,0,.25),inset 0 0 0 7px #fff,inset 0 0 0 10px #F0EBFF;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14%}'
  +'#lawtip.s-b .emo{font-size:56px}'
  +'#lawtip.s-b .q{font-size:20px;font-weight:900;color:#241A40;line-height:1.4;margin-top:2px}'
  +'#lawtip.s-b .q i{background:linear-gradient(transparent 55%,#FFE13D 55%)}'
  +'#lawtip.s-b .law{display:inline-block;margin-top:10px;background:#5B27D6;color:#fff;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:30px}'
  /* E */
  +'#lawtip.s-e{background:#58CC02}'
  +'#lawtip.s-e .badge{display:inline-block;background:#fff;color:#58A700;font-weight:800;font-size:16px;padding:7px 20px;border-radius:30px;box-shadow:0 4px 0 #46A302;margin-bottom:20px}'
  +'#lawtip.s-e .card{background:#fff;border-radius:24px;padding:26px 22px 24px;box-shadow:0 8px 0 rgba(0,0,0,.12)}'
  +'#lawtip.s-e .av{width:96px;height:96px;border-radius:50%;background:#E8F8D8;display:flex;align-items:center;justify-content:center;font-size:52px;margin:0 auto 12px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.06)}'
  +'#lawtip.s-e .q{font-size:23px;font-weight:900;color:#3C3C3C;line-height:1.5}'
  +'#lawtip.s-e .q i{background:linear-gradient(transparent 58%,#FFD900 58%)}'
  +'#lawtip.s-e .law{display:inline-block;margin-top:14px;background:#DDF4FF;color:#1899D6;font-size:12.5px;font-weight:800;padding:5px 14px;border-radius:20px}'
  +'#lawtip.s-e .prog{margin-top:20px;height:14px;background:rgba(255,255,255,.45);border-radius:20px;overflow:hidden}'
  +'#lawtip.s-e .prog i{display:block;height:100%;width:62%;background:#FFD900;border-radius:20px}'
  +'#lawtip .skip{margin-top:16px;color:#fff;font-size:12px;font-weight:700;opacity:.85;text-decoration:underline}'
  +'#lawtip.s-e .skip{color:#2b6b00;opacity:.7}';

  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var style = (pStyle && STYLES.indexOf(pStyle)>=0) ? pStyle : pick(STYLES);
  var tip   = (pTip!==null && TIPS[+pTip]) ? TIPS[+pTip] : pick(TIPS);

  var inner={
   a:'<div class="badge">⚡ 法律小知識 ⚡</div><div class="sub">載入中…順便長知識！</div>'+
     '<div class="emo">'+tip.emo+'</div><div class="bubble"><div class="q">'+tip.q+'</div>'+
     '<div class="law">📖 '+tip.law+'</div></div><div class="skip">點任意處跳過 ▶</div>',
   b:'<div class="badge">⚡ 法律小知識 ⚡</div><div class="coin"><div class="ring"></div>'+
     '<div class="disc"><div class="emo">'+tip.emo+'</div><div class="q">'+tip.q+'</div>'+
     '<div class="law">📖 '+tip.law+'</div></div></div><div class="skip">點任意處跳過 ▶</div>',
   e:'<div class="badge">💡 你知道嗎？</div><div class="card"><div class="av">'+tip.emo+'</div>'+
     '<div class="q">'+tip.q+'</div><div class="law">📖 '+tip.law+'</div>'+
     '<div class="prog"><i></i></div></div><div class="skip">點任意處跳過 ▶</div>'
  };

  function boot(){
    var st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
    var ov=document.createElement("div"); ov.id="lawtip"; ov.className="s-"+style;
    ov.innerHTML='<div class="lw">'+inner[style]+'</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ ov.classList.add("show"); });
    var done=false;
    function close(){ if(done)return; done=true; ov.classList.remove("show"); setTimeout(function(){ ov.remove(); },300); }
    ov.addEventListener("click",close);
    if(!pKeep) setTimeout(close,2400);
  }
  if(document.body) boot(); else document.addEventListener("DOMContentLoaded",boot);
})();
