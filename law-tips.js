/* ===================================================================
   law-tips.js · 漫畫風「遊戲讀取小提醒」（10 種隨機風格）
   用法：頁面底部 <script src="law-tips.js" defer></script>
   行為：每瀏覽階段只跳一次，隨機風格＋隨機法律小知識，約 4.4 秒自動淡出，點任意處跳過。
   Demo 覆寫：?ltstyle=a..j  ?lttip=0..  ?ltkeep=1(不自動關)  ?ltforce=1(忽略session)
=================================================================== */
(function(){
  "use strict";
  var SESSION_KEY="lawtip_seen_v1";
  var STYLES=["a","b","c","d","e","f","g","h","i","j"];
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
   // ===== 勞工保險條例 =====
   {emo:"👶",q:'生小孩，勞保有<br><i>生育給付</i>！',law:"勞工保險條例 §31"},
   {emo:"🛌",q:'住院沒薪水？<br>勞保<i>傷病給付</i>補！',law:"勞工保險條例 §33"},
   {emo:"🦽",q:'治療後永久失能，<br>可領<i>失能給付</i>！',law:"勞工保險條例 §53"},
   {emo:"👵",q:'年滿 60、有年資，<br>可領<i>老年給付</i>！',law:"勞工保險條例 §58"},
   {emo:"🕯️",q:'被保險人身故，<br>遺屬可領<i>遺屬年金</i>！',law:"勞工保險條例 §63"},
   {emo:"⚱️",q:'父母配偶子女過世，<br>勞保有<i>喪葬津貼</i>！',law:"勞工保險條例 §62"},
   // ===== 勞工職業災害保險及保護法 =====
   {emo:"🦺",q:'有 1 名員工就要保<br><i>職災保險</i>！',law:"勞工職業災害保險及保護法 §6"},
   {emo:"🩹",q:'職災不能工作，<br>第 4 天起領<i>傷病給付</i>！',law:"勞工職業災害保險及保護法 §42"},
   {emo:"♿",q:'職災永久失能<br>可領<i>失能給付</i>！',law:"勞工職業災害保險及保護法 §43"},
   {emo:"🔒",q:'職災治療中，雇主<br><i>不得隨意終止</i>契約！',law:"勞工職業災害保險及保護法 §84"},
   {emo:"🔄",q:'職災沒認定前先請病假，<br>認定後<i>改算公傷</i>！',law:"勞工職業災害保險及保護法 §88"},
   // ===== 勞資爭議處理法 =====
   {emo:"🤝",q:'勞資爭議有<i>調解、仲裁、裁決</i><br>三條路！',law:"勞資爭議處理法 §6"},
   {emo:"🛡️",q:'調解／仲裁期間，資方<br><i>不得終止你契約</i>！',law:"勞資爭議處理法 §8"},
   {emo:"⚖️",q:'被打壓工會活動？可申請<br><i>不當勞動行為裁決</i>！',law:"勞資爭議處理法 · 裁決"},
   // ===== 就業保險法 =====
   {emo:"💼",q:'非自願離職，可領<br><i>失業給付</i>（6成·6月）！',law:"就業保險法 §16"},
   {emo:"🍼",q:'育嬰留停期間，<br>可領<i>6 成薪津貼</i>！',law:"就業保險法 §19-2"},
   // ===== 勞工退休金條例 =====
   {emo:"🏦",q:'雇主每月要提<br><i>不低於工資 6%</i>退休金！',law:"勞工退休金條例 §14"},
   {emo:"🎒",q:'退休金存<i>你的專戶</i>，<br>換工作帶著走！',law:"勞工退休金條例 §6"},
   // ===== 工會法（組織與保護）=====
   {emo:"✊",q:'30 人連署<br>就能<i>組工會</i>！',law:"工會法 §11"},
   {emo:"🚫",q:'不能因你<i>加入工會</i><br>就解僱、調職、扣薪！',law:"工會法 §35"},
   {emo:"🗓️",q:'理監事辦會務，<br>可約定<i>會務公假</i>！',law:"工會法 §36"},
   {emo:"🙌",q:'勞工都有<i>組織、加入工會</i><br>的權利！',law:"工會法 §4"},
   // ===== 團體協約法／大量解僱 =====
   {emo:"📜",q:'工會要求協商，資方<br><i>無正當理由不得拒絕</i>！',law:"團體協約法 §6"},
   {emo:"📢",q:'大量解僱要<br><i>60 天前通知</i>＋協商！',law:"大量解僱勞工保護法 §4"},
   {emo:"☎️",q:'被坑就打 <i>1955</i><br>勞工專線，免費匿名！',law:"勞工申訴 · 24h"},
  ];

  function qp(k){ try{return new URLSearchParams(location.search).get(k);}catch(e){return null;} }
  var pStyle=qp("ltstyle"), pTip=qp("lttip"), pKeep=qp("ltkeep")==="1", pForce=qp("ltforce")==="1";
  if(!pForce){ try{ if(sessionStorage.getItem(SESSION_KEY)) return; sessionStorage.setItem(SESSION_KEY,"1"); }catch(e){} }

  var CSS=`
#lawtip{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;opacity:0;transition:opacity .25s ease;font-family:"Baloo 2","Noto Sans TC",system-ui,sans-serif}
#lawtip.show{opacity:1}
#lawtip .lw{position:relative;z-index:3;width:min(420px,92vw);text-align:center;padding:0 16px}
#lawtip .emo{filter:drop-shadow(3px 4px 0 rgba(0,0,0,.22));animation:ltbob 1.6s ease-in-out infinite}
#lawtip .q i{font-style:normal}
#lawtip .skip{margin-top:16px;color:#fff;font-size:12px;font-weight:700;opacity:.85;text-decoration:underline}
@keyframes ltbob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
@keyframes ltspin{to{transform:rotate(360deg)}}
@keyframes ltblink{50%{opacity:0}}
/* A 漫畫藍 */
#lawtip.s-a{background:radial-gradient(circle at 50% 30%,#4DA3FF,#2E6BE6 55%,#1B3D9E)}
#lawtip.s-a:before{content:"";position:absolute;inset:0;opacity:.18;background-image:radial-gradient(#fff 1.6px,transparent 1.7px);background-size:14px 14px}
#lawtip.s-a .badge{display:inline-block;background:#FFE13D;color:#C0392B;font-weight:800;font-size:18px;padding:8px 22px;border:3px solid #1A1A1A;border-radius:40px;transform:rotate(-3deg);box-shadow:4px 4px 0 #1A1A1A;margin-bottom:6px}
#lawtip.s-a .sub{color:#fff;font-weight:700;font-size:13px;opacity:.9;margin-bottom:16px}
#lawtip.s-a .emo{font-size:74px}
#lawtip.s-a .bubble{position:relative;background:#fff;border:4px solid #1A1A1A;border-radius:22px;padding:22px 20px;box-shadow:7px 7px 0 #1A1A1A;margin-top:14px}
#lawtip.s-a .bubble:before{content:"";position:absolute;top:-22px;left:50%;transform:translateX(-50%);border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:22px solid #1A1A1A}
#lawtip.s-a .q{font-size:25px;font-weight:900;color:#1A2740;line-height:1.45}
#lawtip.s-a .q i{background:linear-gradient(transparent 55%,#FFE13D 55%)}
#lawtip.s-a .law{display:inline-block;margin-top:14px;background:#1A2740;color:#fff;font-size:12.5px;font-weight:700;padding:5px 14px;border-radius:30px}
/* B 圓徽章 */
#lawtip.s-b{background:radial-gradient(circle at 50% 32%,#7C4DFF,#5B27D6 55%,#3A148F)}
#lawtip.s-b:before{content:"";position:absolute;inset:0;opacity:.16;background-image:radial-gradient(#fff 1.6px,transparent 1.7px);background-size:14px 14px}
#lawtip.s-b .badge{display:inline-block;background:#FFE13D;color:#6A2BD6;font-weight:800;font-size:17px;padding:7px 20px;border:3px solid #1A1A1A;border-radius:40px;transform:rotate(-3deg);box-shadow:4px 4px 0 #1A1A1A;margin-bottom:22px}
#lawtip.s-b .coin{position:relative;width:min(320px,82vw);margin:0 auto;aspect-ratio:1/1}
#lawtip.s-b .ring{position:absolute;inset:-10px;border-radius:50%;background:conic-gradient(#FFE13D 0 90deg,transparent 90deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 11px));mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 11px));animation:ltspin 1.4s linear infinite}
#lawtip.s-b .disc{position:absolute;inset:0;border-radius:50%;background:#fff;border:5px solid #1A1A1A;box-shadow:0 10px 0 rgba(0,0,0,.25),inset 0 0 0 7px #fff,inset 0 0 0 10px #F0EBFF;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14%}
#lawtip.s-b .emo{font-size:56px}
#lawtip.s-b .q{font-size:20px;font-weight:900;color:#241A40;line-height:1.4;margin-top:2px}
#lawtip.s-b .q i{background:linear-gradient(transparent 55%,#FFE13D 55%)}
#lawtip.s-b .law{display:inline-block;margin-top:10px;background:#5B27D6;color:#fff;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:30px}
/* C 便利貼手寫 */
#lawtip.s-c{background:#2A2520;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px);background-size:100% 28px}
#lawtip.s-c .note{position:relative;background:#FFE773;border-radius:4px;padding:34px 26px 30px;box-shadow:6px 10px 22px rgba(0,0,0,.45);transform:rotate(-2.5deg);border:1px solid #E7C94B}
#lawtip.s-c .tape{position:absolute;top:-14px;left:50%;transform:translateX(-50%) rotate(2deg);width:120px;height:28px;background:rgba(255,255,255,.5);border:1px dashed rgba(0,0,0,.25)}
#lawtip.s-c .badge{font-family:'Ma Shan Zheng','Noto Sans TC',cursive;color:#B5432B;font-size:22px;margin-bottom:6px}
#lawtip.s-c .emo{font-size:60px}
#lawtip.s-c .q{font-family:'Ma Shan Zheng','Noto Sans TC',cursive;font-size:30px;color:#2A2418;line-height:1.5;margin-top:4px}
#lawtip.s-c .q i{background:linear-gradient(transparent 60%,#FF8FA3 60%);border-radius:2px}
#lawtip.s-c .law{display:inline-block;margin-top:14px;color:#7A5600;font-size:14px;font-weight:700;border-bottom:2px dashed #B5432B}
/* D 像素電玩 */
#lawtip.s-d{background:#0d0f17;background-image:linear-gradient(#1a1f2e 1px,transparent 1px),linear-gradient(90deg,#1a1f2e 1px,transparent 1px);background-size:22px 22px}
#lawtip.s-d .frame{background:#11151f;border:4px solid #38E1B0;padding:26px 20px;box-shadow:0 0 0 4px #0d0f17,0 0 0 8px #2A6CF0,0 0 26px rgba(56,225,176,.4)}
#lawtip.s-d .badge{font-family:'Press Start 2P',monospace;color:#FFE13D;font-size:13px;letter-spacing:1px;margin-bottom:18px;text-shadow:2px 2px 0 #C0392B}
#lawtip.s-d .emo{font-size:54px;margin-bottom:8px}
#lawtip.s-d .q{font-family:'Press Start 2P','Noto Sans TC',monospace;font-size:15px;color:#EAF6FF;line-height:1.9}
#lawtip.s-d .q i{color:#38E1B0}
#lawtip.s-d .law{display:inline-block;margin-top:18px;font-family:'Press Start 2P',monospace;font-size:9px;color:#0d0f17;background:#38E1B0;padding:7px 10px}
#lawtip.s-d .blink{font-family:'Press Start 2P',monospace;font-size:9px;color:#FFE13D;margin-top:16px;animation:ltblink 1s steps(1) infinite}
/* E 扁平可愛 */
#lawtip.s-e{background:#58CC02}
#lawtip.s-e .badge{display:inline-block;background:#fff;color:#58A700;font-weight:800;font-size:16px;padding:7px 20px;border-radius:30px;box-shadow:0 4px 0 #46A302;margin-bottom:20px}
#lawtip.s-e .card{background:#fff;border-radius:24px;padding:26px 22px 24px;box-shadow:0 8px 0 rgba(0,0,0,.12)}
#lawtip.s-e .av{width:96px;height:96px;border-radius:50%;background:#E8F8D8;display:flex;align-items:center;justify-content:center;font-size:52px;margin:0 auto 12px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.06)}
#lawtip.s-e .q{font-size:23px;font-weight:900;color:#3C3C3C;line-height:1.5}
#lawtip.s-e .q i{background:linear-gradient(transparent 58%,#FFD900 58%)}
#lawtip.s-e .law{display:inline-block;margin-top:14px;background:#DDF4FF;color:#1899D6;font-size:12.5px;font-weight:800;padding:5px 14px;border-radius:20px}
#lawtip.s-e .prog{margin-top:20px;height:14px;background:rgba(255,255,255,.45);border-radius:20px;overflow:hidden}
#lawtip.s-e .prog i{display:block;height:100%;width:62%;background:#FFD900;border-radius:20px}
#lawtip.s-e .skip{color:#2b6b00;opacity:.7}
/* F 普普POW */
#lawtip.s-f{background:#FFCE2E;background-image:radial-gradient(#E84B2A 14%,transparent 15%);background-size:26px 26px}
#lawtip.s-f .pow{display:inline-block;background:#E8362D;color:#fff;font-weight:900;font-size:22px;padding:16px 26px;margin-bottom:14px;clip-path:polygon(50% 0,61% 12%,78% 5%,80% 24%,98% 28%,86% 43%,100% 55%,84% 64%,92% 84%,72% 80%,64% 99%,50% 86%,36% 99%,28% 80%,8% 84%,16% 64%,0 55%,14% 43%,2% 28%,20% 24%,22% 5%,39% 12%);transform:rotate(-4deg)}
#lawtip.s-f .emo{font-size:70px}
#lawtip.s-f .bubble{position:relative;background:#fff;border:4px solid #1A1A1A;border-radius:14px 14px 14px 4px;padding:20px 18px;box-shadow:8px 8px 0 #1A1A1A;margin-top:12px}
#lawtip.s-f .q{font-size:25px;font-weight:900;color:#1A1A1A;line-height:1.45}
#lawtip.s-f .q i{background:linear-gradient(transparent 55%,#FFCE2E 55%)}
#lawtip.s-f .law{display:inline-block;margin-top:12px;background:#1A1A1A;color:#FFCE2E;font-size:12.5px;font-weight:800;padding:5px 14px;border-radius:4px}
#lawtip.s-f .sub{margin-top:14px;color:#7A1B12;font-weight:800;font-size:13px}
/* G 霓虹 */
#lawtip.s-g{background:#0a0a12;background-image:radial-gradient(circle at 50% 40%,rgba(0,255,200,.12),transparent 60%)}
#lawtip.s-g .badge{display:inline-block;color:#00E5FF;font-weight:800;font-size:15px;letter-spacing:3px;margin-bottom:18px;text-shadow:0 0 8px rgba(0,229,255,.8)}
#lawtip.s-g .panel{background:rgba(20,20,35,.7);border:2px solid #00E5FF;border-radius:16px;padding:26px 22px;box-shadow:0 0 18px rgba(0,229,255,.5),inset 0 0 18px rgba(0,229,255,.12)}
#lawtip.s-g .emo{font-size:64px;filter:drop-shadow(0 0 12px rgba(255,60,200,.6))}
#lawtip.s-g .q{font-size:23px;font-weight:800;color:#fff;line-height:1.5;text-shadow:0 0 6px rgba(255,255,255,.25)}
#lawtip.s-g .q i{color:#FF3CC8;text-shadow:0 0 10px rgba(255,60,200,.9)}
#lawtip.s-g .law{display:inline-block;margin-top:14px;color:#00E5FF;border:1px solid #00E5FF;border-radius:30px;font-size:12px;font-weight:700;padding:4px 14px;box-shadow:0 0 10px rgba(0,229,255,.4)}
/* H 黑板粉筆 */
#lawtip.s-h{background:#2C3A33;background-image:radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px);background-size:6px 6px}
#lawtip.s-h .lw{border:8px solid #6b4f2a;border-radius:6px;padding:24px 18px;background:rgba(0,0,0,.12)}
#lawtip.s-h .badge{color:#FFE9A8;font-size:18px;font-weight:700;letter-spacing:2px;margin-bottom:12px;font-family:'Ma Shan Zheng','Noto Sans TC',cursive}
#lawtip.s-h .emo{font-size:60px}
#lawtip.s-h .q{font-family:'Ma Shan Zheng','Noto Sans TC',cursive;font-size:30px;color:#fff;line-height:1.55;margin-top:6px;text-shadow:0 1px 0 rgba(0,0,0,.3)}
#lawtip.s-h .q i{color:#9BE6B0;border-bottom:3px solid #9BE6B0}
#lawtip.s-h .law{display:inline-block;margin-top:14px;color:#FFE9A8;font-size:14px;font-weight:700}
/* I 報紙快報 */
#lawtip.s-i{background:#3a3631}
#lawtip.s-i .masthead{font-family:'Noto Serif TC',serif;color:#fff;font-weight:700;font-size:14px;letter-spacing:4px;border-top:2px solid #fff;border-bottom:2px solid #fff;padding:6px 0;margin-bottom:14px}
#lawtip.s-i .paper{background:#F5F0E6;border:1px solid #d8cfbb;padding:26px 22px;box-shadow:6px 8px 18px rgba(0,0,0,.4)}
#lawtip.s-i .emo{font-size:56px}
#lawtip.s-i .q{font-family:'Noto Serif TC',serif;font-size:26px;font-weight:700;color:#1a1a1a;line-height:1.5;margin-top:8px}
#lawtip.s-i .q i{border-bottom:3px double #C0392B}
#lawtip.s-i .stamp{display:inline-block;margin-top:14px;color:#C0392B;border:2px solid #C0392B;border-radius:4px;font-size:13px;font-weight:700;padding:3px 12px;transform:rotate(-6deg);font-family:'Noto Serif TC',serif}
/* J 手機通知 */
#lawtip.s-j{background:rgba(10,15,30,.55);justify-content:flex-start;padding-top:54px}
#lawtip.s-j .notif{background:rgba(250,250,252,.97);border-radius:20px;padding:14px 16px;box-shadow:0 12px 30px rgba(0,0,0,.4);text-align:left}
#lawtip.s-j .nhead{display:flex;align-items:center;gap:8px;margin-bottom:8px}
#lawtip.s-j .nhead .ico{width:30px;height:30px;border-radius:8px;background:#2E6BE6;display:inline-flex;align-items:center;justify-content:center;font-size:18px}
#lawtip.s-j .nhead .app{font-weight:800;font-size:13px;color:#333;flex:1}
#lawtip.s-j .nhead .time{font-size:11px;color:#999}
#lawtip.s-j .q{font-size:19px;font-weight:800;color:#1a1a1a;line-height:1.5}
#lawtip.s-j .q i{background:linear-gradient(transparent 58%,#FFE13D 58%)}
#lawtip.s-j .law{display:inline-block;margin-top:8px;color:#2E6BE6;font-size:12.5px;font-weight:700}
`;

  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var style=(pStyle && STYLES.indexOf(pStyle)>=0)?pStyle:pick(STYLES);
  var t=(pTip!==null && TIPS[+pTip])?TIPS[+pTip]:pick(TIPS);
  var E=t.emo, Q=t.q, L=t.law, SK='<div class="skip">點任意處跳過 ▶</div>';
  var M={
   a:'<div class="badge">⚡ 法律小知識 ⚡</div><div class="sub">載入中…順便長知識！</div><div class="emo">'+E+'</div><div class="bubble"><div class="q">'+Q+'</div><div class="law">📖 '+L+'</div></div>'+SK,
   b:'<div class="badge">⚡ 法律小知識 ⚡</div><div class="coin"><div class="ring"></div><div class="disc"><div class="emo">'+E+'</div><div class="q">'+Q+'</div><div class="law">📖 '+L+'</div></div></div>'+SK,
   c:'<div class="note"><div class="tape"></div><div class="badge">✦ 法律小抄 ✦</div><div class="emo">'+E+'</div><div class="q">'+Q+'</div><div class="law">'+L+'</div></div>'+SK,
   d:'<div class="frame"><div class="badge">★ LAW TIP ★</div><div class="emo">'+E+'</div><div class="q">'+Q+'</div><div class="law">'+L+'</div><div class="blink">▶ PRESS TO SKIP</div></div>',
   e:'<div class="badge">💡 你知道嗎？</div><div class="card"><div class="av">'+E+'</div><div class="q">'+Q+'</div><div class="law">📖 '+L+'</div><div class="prog"><i></i></div></div>'+SK,
   f:'<div class="pow">知道嗎?!</div><div class="emo">'+E+'</div><div class="bubble"><div class="q">'+Q+'</div><div class="law">📖 '+L+'</div></div><div class="sub">點任意處跳過 ▶</div>',
   g:'<div class="badge">◢ 法律小知識 ◣</div><div class="panel"><div class="emo">'+E+'</div><div class="q">'+Q+'</div><div class="law">📖 '+L+'</div></div>'+SK,
   h:'<div class="badge">✎ 今日小提醒</div><div class="emo">'+E+'</div><div class="q">'+Q+'</div><div class="law">— '+L+'</div>'+SK,
   i:'<div class="masthead">法律快報　勞權版</div><div class="paper"><div class="emo">'+E+'</div><div class="q">'+Q+'</div><div class="stamp">'+L+'</div></div>'+SK,
   j:'<div class="notif"><div class="nhead"><span class="ico">'+E+'</span><span class="app">法律小知識</span><span class="time">現在</span></div><div class="q">'+Q+'</div><div class="law">📖 '+L+'</div></div>'+SK
  };

  function boot(){
    if(!document.getElementById("lawtip-fonts")){
      var lk=document.createElement("link"); lk.id="lawtip-fonts"; lk.rel="stylesheet";
      lk.href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Press+Start+2P&family=Ma+Shan+Zheng&display=swap";
      document.head.appendChild(lk);
    }
    var st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
    var ov=document.createElement("div"); ov.id="lawtip"; ov.className="s-"+style;
    ov.innerHTML='<div class="lw">'+M[style]+'</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ ov.classList.add("show"); });
    var done=false;
    function close(){ if(done)return; done=true; ov.classList.remove("show"); setTimeout(function(){ ov.remove(); },300); }
    ov.addEventListener("click",close);
    if(!pKeep) setTimeout(close,4400);
  }
  if(document.body) boot(); else document.addEventListener("DOMContentLoaded",boot);
})();
