/* 高榮企業工會 · 會員申訴表 —— 一鍵自動建立 Google 表單（Google Apps Script）

   用法（約 3 分鐘，建議用「工會的 Gmail」操作，電腦比手機好操作）：
   1. 開 script.google.com →「新專案」。
   2. 把預設程式碼全部刪掉，貼上這支檔案全部內容。
   3. 上方函式選單選「建立申訴表」→ 按「執行」。
   4. 第一次會跳授權：選你的帳號 →「進階」→「前往…（不安全）」→「允許」（Google 尚未驗證是正常的）。
   5. 按「執行記錄」（下方），會印出兩個網址：
        ‧ 給會員填的連結（formUrl）
        ‧ 給你編輯／看回覆的連結（editUrl）
   6. 到表單的「回覆」分頁 →「連結到試算表」，回覆就會自動整理成表格。

   ⚠️ 這張表單會收集會員個資與申訴內容（敏感）：
      ‧ 回覆試算表只分享給負責幹部（用「共用」加帳號，不要開「知道連結的人」）。
      ‧ 腳本已關閉「自動收集 Email」，只收會員自願填寫的聯絡方式。
      ‧ 腳本沒辦法建立「上傳檔案」題（Google 限制）；證據請會員填文字說明，
        或在表單建好後，你到編輯畫面手動新增「檔案上傳」題（需要會員登入 Google 帳號才能上傳）。
*/
function 建立申訴表() {
  var form = FormApp.create('高榮企業工會｜會員申訴表');
  form.setDescription(
    '本表單供本會會員反映工作上遇到的問題或權益受損情形。\n\n' +
    '【處理方式】工會收到後會由負責幹部評估，依你的意願協助溝通、向院方反映或提供法規建議。\n' +
    '【保密】你填寫的資料僅供負責幹部處理本案使用，未經你同意，不會公開，也不會向院方揭露你的身分。\n' +
    '【提醒】本表單不是法律意見；如有時效問題（例如職災、資遣、工資請求），請盡快填寫。\n' +
    '緊急情況請直接聯繫工會幹部。');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setConfirmationMessage('已收到你的申訴，工會幹部會盡快與你聯絡。若 3 個工作天內沒有收到回覆，請主動聯繫工會。');

  form.addSectionHeaderItem().setTitle('一、基本資料');
  form.addTextItem().setTitle('姓名').setRequired(true);
  form.addTextItem().setTitle('服務單位／部門（例：9A 病房）').setRequired(true);
  form.addTextItem().setTitle('職稱（例：護理師、專科護理師）');
  form.addMultipleChoiceItem().setTitle('是否為本會會員').setChoiceValues(['已是會員', '已送出入會申請，尚在審核', '尚未入會']).setRequired(true);
  form.addTextItem().setTitle('聯絡方式（手機、LINE ID 或 Email，至少一種）').setRequired(true)
      .setHelpText('工會只會用這個方式回覆你這件事。');
  form.addMultipleChoiceItem().setTitle('方便聯絡的時段').setChoiceValues(['上班日白天', '下班後／晚上', '假日', '都可以']);

  form.addSectionHeaderItem().setTitle('二、申訴內容');
  form.addCheckboxItem().setTitle('申訴類別（可複選）').setChoiceValues([
    '工時／加班／加班費', '排班／調班／休假', '請假（特休、病假、婚喪假、育嬰等）', '薪資／津貼／獎金',
    '職災／公傷／職業安全衛生', '職場霸凌／騷擾／不當對待', '考核／升遷／調動／解僱／資遣',
    '契約／續約問題', '福利／制度不公', '其他']).setRequired(true).showOtherOption(true);
  form.addDateItem().setTitle('事件發生日期（或開始日期）').setRequired(true);
  form.addParagraphTextItem().setTitle('事情經過').setRequired(true)
      .setHelpText('請盡量寫清楚：時間、地點、發生什麼事、誰說了／做了什麼。依時間順序寫最清楚。');
  form.addTextItem().setTitle('涉及的人員或單位（可寫職稱，不一定要寫姓名）');
  form.addParagraphTextItem().setTitle('目前是否有相關證據或紀錄')
      .setHelpText('例如：排班表、薪資單、對話截圖、公文、診斷證明、同事證詞。先寫有什麼即可，不用現在附上；幹部會再跟你索取。');
  form.addMultipleChoiceItem().setTitle('是否已向院內單位反映過').setChoiceValues(['尚未', '已向單位主管反映', '已向護理部／人事室反映', '已向其他單位反映（請寫在事情經過）']);
  form.addParagraphTextItem().setTitle('希望工會協助的事項／期待的結果').setRequired(true);

  form.addSectionHeaderItem().setTitle('三、處理意願與同意事項');
  form.addMultipleChoiceItem().setTitle('希望工會如何處理').setChoiceValues([
    '先聊聊、了解我有什麼權利', '協助我與單位溝通', '以工會名義向院方反映（不透露我的身分）',
    '以工會名義向院方反映（可以透露我的身分）', '協助申請勞資爭議調解／向主管機關申訴']).setRequired(true);
  form.addCheckboxItem().setTitle('個資與保密同意').setChoiceValues([
    '我了解並同意：工會因處理本案而蒐集、處理、利用我填寫的個人資料；資料僅限負責幹部使用，處理完畢後依規定保存或刪除。'
  ]).setRequired(true);

  Logger.log('給會員填的連結（formUrl）：' + form.getPublishedUrl());
  Logger.log('給你編輯／看回覆的連結（editUrl）：' + form.getEditUrl());
}
