/* 高榮企業工會網站 — 自動化端對端測試（功能／流程／導覽／錯誤邊界）
   用法：bash tests/run.sh   （會自動開本機伺服器、跑測試、收尾）
   單獨跑：BASE=http://localhost:8099/ node tests/e2e.cjs
   可用環境變數覆寫：
     BASE         測試網址（預設 http://localhost:8099/）
     PW_CORE      playwright-core 路徑（預設 /opt/node22/.../playwright-core）
     CHROME       Chromium 執行檔（預設 /opt/pw-browsers/chromium-1194/chrome-linux/chrome）
   全部通過 exit 0；有失敗 exit 1（方便 CI／改完一鍵重跑）。 */
const PW_CORE = process.env.PW_CORE || '/opt/node22/lib/node_modules/playwright/node_modules/playwright-core';
// CHROME 留空＝用 Playwright 自帶的瀏覽器（GitHub Actions 用）；沙箱預設指到本機 Chromium。
const CHROME  = process.env.CHROME != null ? process.env.CHROME
              : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE    = process.env.BASE    || 'http://localhost:8099/';
const { chromium } = require(PW_CORE);

let pass = 0, fail = 0; const fails = [];
const ok  = n => { pass++; console.log('  ✅ ' + n); };
const bad = (n, d) => { fail++; fails.push(n + ' — ' + d); console.log('  ❌ ' + n + ' — ' + d); };

(async () => {
  const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  // 全站服務對象是台灣用戶，測試固定用台灣時區，才驗證得出 UTC-vs-本地時間 的日期 bug。
  const ctx = await b.newContext({ timezoneId: 'Asia/Taipei' });
  // 把頁面的系統時間鎖在指定的 UTC 瞬間（用來測「台灣時間 00:00~08:00 換算本地日期」的邊界）。
  // 順便在頁面自己的程式碼跑之前先解鎖幹部密碼鎖（addInitScript 早於頁面內嵌script執行）——
  // 這裡用到的頁面全是已上鎖的幹部工具頁，不解鎖的話 #gate 蓋住內容，摸不到元素。
  const fixClock = async (p, isoUTC) => { const FIXED = new Date(isoUTC).getTime();
    await p.addInitScript(FIXED => { var OD = Date; function FD(...a){ return a.length ? new OD(...a) : new OD(FIXED); } FD.prototype = OD.prototype; FD.now = () => FIXED; window.Date = FD; }, FIXED);
    await p.addInitScript(() => { try { localStorage.setItem('union_panel_unlocked', '1'); } catch (e) {} }); };
  const page = async () => { const p = await ctx.newPage(); p.__err = []; p.on('pageerror', e => p.__err.push(e.message)); return p; };
  // 清完 localStorage 順手補上幹部密碼鎖的解鎖旗標——測試不是在測密碼鎖本身，
  // 不解鎖的話這幾頁的內容會被 #gate 蓋住，摸不到裡面的元素。
  const go = async (p, u) => { await p.goto(BASE + u, { waitUntil: 'domcontentloaded' }); await p.evaluate(() => { try { localStorage.clear(); localStorage.setItem('union_panel_unlocked', '1'); } catch (e) {} }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200); };
  const T = async (name, fn) => { const p = await page(); try { await fn(p); if (p.__err.length) bad(name, 'JS error: ' + p.__err.join('|')); } catch (e) { bad(name, e.message.split('\n')[0]); } await p.close(); };

  console.log('\n========== A. 功能測試（計算機） ==========');
  await T('leavepay 月薪基準計算', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '42000'); await p.fill('#dv', '30'); await p.waitForTimeout(150);
    const t = await p.textContent('#base'); (t.includes('1,400') && t.includes('175')) ? ok('一日1400/時薪175') : bad('leavepay base', 'got ' + t.replace(/\s+/g, ' ')); });
  await T('leavepay 平日加班逐日', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '42000'); await p.fill('#wkDays .wkrow:nth-child(1) .wk-h', '3'); await p.waitForTimeout(150);
    const t = await p.textContent('#outWk'); t.includes('758') ? ok('3小時=758') : bad('outWk', 'got ' + t.replace(/\s+/g, ' ')); });
  await T('leavepay 國定假日加倍', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '42000'); await p.fill('#holi', '1'); await p.waitForTimeout(150);
    const t = await p.textContent('#outHoli'); t.includes('1,400') ? ok('1天=1400') : bad('outHoli', 'got ' + t.replace(/\s+/g, ' ')); });
  await T('leavepay 特休折算', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '42000'); await p.fill('#unused', '3'); await p.waitForTimeout(150);
    const t = await p.textContent('#outLeave'); t.includes('4,200') ? ok('3天=4200') : bad('outLeave', 'got ' + t.replace(/\s+/g, ' ')); });
  await T('leavepay 薪資明細加總+套用', async p => { await go(p, 'leavepay.html'); await p.click('#salWrap summary');
    await p.fill('#salRows .salrow:nth-child(1) .sal-amt', '30000'); await p.fill('#salRows .salrow:nth-child(2) .sal-amt', '8000'); await p.waitForTimeout(120);
    await p.click('#salApply'); await p.waitForTimeout(120);
    const v = await p.inputValue('#salary'); v === '38000' ? ok('套用後月薪=38000') : bad('salApply', 'salary=' + v); });
  await T('joinroi 入會ROI試算', async p => { await go(p, 'joinroi.html'); await p.fill('#salary', '40000'); await p.fill('#otHr', '20'); await p.waitForTimeout(150);
    const t = await p.textContent('#out'); (t && t.length > 5) ? ok('有輸出結果') : bad('joinroi', 'out empty'); });

  console.log('\n========== B. 功能測試（互動流程） ==========');
  await T('index 連署前彈窗→連署選項', async p => { await go(p, 'index.html'); await p.click('#cta-join'); await p.waitForTimeout(150);
    if (!await p.$('#pledge-intro')) return bad('pledge', 'popup not shown');
    if (await p.$('#join-sheet')) return bad('pledge', 'join sheet opened too early');
    await p.click('#pledge-go'); await p.waitForTimeout(200);
    (await p.$('#join-sheet') && !await p.$('#pledge-intro')) ? ok('彈窗→確認→連署選項') : bad('pledge', 'flow broke'); });
  await T('index FAQ 小幫手回答', async p => { await go(p, 'index.html'); await p.fill('#bot-in', '約用可以加入嗎'); await p.click('#bot-send'); await p.waitForTimeout(400);
    const n = await p.$$eval('#bot-log .bubble.bot', e => e.length); n >= 2 ? ok('機器人有回覆(' + n + '泡泡)') : bad('faqbot', 'no answer bubble'); });
  await T('index 連署進度條渲染', async p => { await go(p, 'index.html'); await p.waitForTimeout(300);
    const w = await p.$eval('#sign-fill', e => e.style.width); (w && w !== '0px' && w !== '') ? ok('進度條寬度=' + w) : bad('signbar', 'width ' + w); });
  await T('meet 連結未設定狀態正確', async p => { await go(p, 'meet.html');
    const t = await p.textContent('#join-prep'); (t.includes('LINE') || t.includes('尚未') || t.includes('開會議')) ? ok('按鈕顯示待設定提示') : bad('meet', 'btn=' + t); });
  await T('charter 快查卡填寫無錯', async p => { await go(p, 'charter.html'); await p.fill('#ch-year', '115').catch(() => {}); await p.fill('#ch-month', '7').catch(() => {}); await p.fill('#ch-day', '1').catch(() => {}); await p.waitForTimeout(150); ok('填寫不報錯'); });
  await T('zhizai 職災就醫小幫手互動', async p => { await go(p, 'zhizai.html'); await p.waitForTimeout(300);
    const init = await p.$$eval('#jbot-log .b.bot', e => e.length); if (init < 1) return bad('jbot', 'no greeting');
    await p.click('#jbot-chips button'); await p.waitForTimeout(200);
    const me = await p.$$eval('#jbot-log .b.me', e => e.length);
    const bot = await p.$$eval('#jbot-log .b.bot', e => e.length);
    (me >= 1 && bot > init) ? ok('小幫手問答前進(' + bot + 'bot/' + me + 'me)') : bad('jbot', 'no advance'); });

  console.log('\n========== C. 功能測試（幹部後台：名冊/案件） ==========');
  const gateShown = p => p.evaluate(() => { const g = document.getElementById('gate'); return !!(g && getComputedStyle(g).display !== 'none'); });
  await T('roster 新增會員→出現在名單', async p => { await go(p, 'roster.html');
    if (await p.$('#gate') && await gateShown(p)) return bad('roster', '被密碼鎖擋住（草創期應開放）');
    await p.click('#add-btn').catch(() => {}); await p.waitForTimeout(150);
    await p.fill('#f-name', '測試員A').catch(() => {});
    await p.click('#f-save').catch(() => {}); await p.waitForTimeout(200);
    const list = await p.textContent('#list').catch(() => ''); list.includes('測試員A') ? ok('會員加入名單') : bad('roster', '名單沒出現新會員'); });
  await T('cases 新增案件→出現在列表', async p => { await go(p, 'cases.html'); await p.waitForTimeout(200);
    if (await p.$('#gate') && await gateShown(p)) return bad('cases', '被密碼鎖擋住');
    await p.click('#newBtn').catch(() => {}); await p.waitForTimeout(150);
    await p.fill('#c-name', '測試案件X').catch(() => {});
    await p.click('#saveBtn').catch(() => {}); await p.waitForTimeout(200);
    const list = await p.textContent('#list').catch(() => ''); list.includes('測試案件X') ? ok('案件加入列表') : bad('cases', '列表沒出現新案件'); });

  console.log('\n========== D. 流暢/導覽測試 ==========');
  await T('返回鈕 index→leavepay→返回', async p => { await go(p, 'index.html'); await p.goto(BASE + 'leavepay.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200);
    await p.click('#ebnBack'); await p.waitForTimeout(400);
    const u = p.url(); (u.endsWith('index.html') || u.endsWith('/')) ? ok('返回到首頁/上一頁') : bad('back', 'landed ' + u); });
  await T('leavepay 重開保留輸入(本機暫存)', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '55555'); await p.waitForTimeout(300);
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
    const v = await p.inputValue('#salary'); v === '55555' ? ok('重開後月薪保留') : bad('persist', 'salary=' + v); });
  await T('頁面載入速度(leavepay)', async p => { const t0 = Date.now(); await p.goto(BASE + 'leavepay.html', { waitUntil: 'domcontentloaded' }); const dt = Date.now() - t0;
    dt < 3000 ? ok('domcontentloaded ' + dt + 'ms') : bad('perf', '慢 ' + dt + 'ms'); });

  console.log('\n========== E. 錯誤/邊界測試 ==========');
  await T('leavepay 月薪空白不崩潰', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', ''); await p.waitForTimeout(150);
    p.__err.length === 0 ? ok('空白安全(顯示0)') : bad('empty', 'err'); });
  await T('leavepay 除數=0 不除以零', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '40000'); await p.fill('#dv', '0'); await p.waitForTimeout(150);
    const t = await p.textContent('#base'); t.includes('1,333') ? ok('÷0 自動退回÷30') : bad('divzero', 'got ' + t.replace(/\s+/g, ' ')); });
  await T('leavepay 超大數字不崩潰', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '999999999'); await p.fill('#wkDays .wkrow:nth-child(1) .wk-h', '999'); await p.waitForTimeout(150);
    p.__err.length === 0 ? ok('超大值安全') : bad('big', 'err'); });
  await T('leavepay 文字輸入(非數字)安全', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', 'abc'); await p.waitForTimeout(150);
    p.__err.length === 0 ? ok('非數字不崩潰') : bad('nan', 'err'); });
  await T('joinroi 空白輸入安全', async p => { await go(p, 'joinroi.html'); await p.fill('#salary', '').catch(() => {}); await p.fill('#otHr', '').catch(() => {}); await p.waitForTimeout(150);
    p.__err.length === 0 ? ok('空白安全') : bad('joinroi-empty', 'err'); });

  console.log('\n========== F. 幹部文書工具（帶入／批次） ==========');
  await T('基本資料中心 儲存持久化', async p => { await p.goto(BASE + 'org.html', { waitUntil: 'domcontentloaded' }); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('union_panel_unlocked', '1'); }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200);
    await p.fill('#org-fullName', '測試工會'); await p.fill('#org-chair', '測試長'); await p.click('#saveBtn'); await p.waitForTimeout(150);
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200);
    (await p.inputValue('#org-chair')) === '測試長' ? ok('基本資料重開保留') : bad('org', 'not persisted'); });
  await T('org.js cadres() 草稿優先於已發布(改名不被蓋回)', async p => { await p.goto(BASE + 'org.html', { waitUntil: 'domcontentloaded' }); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('union_panel_unlocked', '1'); }); await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.EBNOrg && window.EBNOrg.publicLoaded()); await p.waitForTimeout(150);
    await p.fill('#cadre-fin', '測試總務新名字'); await p.click('#pubBtn'); await p.waitForTimeout(150);
    const txt = await p.inputValue('#pubOut'); const j = JSON.parse(txt);
    j.cadres && j.cadres.fin === '測試總務新名字' ? ok('改名存檔沒被舊 public.json 蓋回') : bad('cadres-order', 'fin=' + (j.cadres && j.cadres.fin)); });
  await T('合併列印 批次產生N份+帶入抬頭', async p => { await p.goto(BASE + 'mailmerge.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { localStorage.setItem('union_panel_unlocked', '1'); localStorage.setItem('ebn_org_v1', JSON.stringify({ fullName: '測試工會', chair: '測試長', docWord: '測', docYear: '115', docSeq: '1' })); localStorage.setItem('roster_members_v1', JSON.stringify([{ id: 'a', name: '甲' }, { id: 'b', name: '乙' }])); });
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.evaluate(() => { window.print = () => {}; }); await p.waitForTimeout(200);
    await p.click('#gen'); await p.waitForTimeout(300);
    const n = await p.$$eval('#sheets .sheet', e => e.length); const t = await p.textContent('#sheets');
    (n === 2 && t.includes('測試工會') && t.includes('甲') && t.includes('乙')) ? ok('2份+抬頭+姓名') : bad('mailmerge', 'n=' + n); });
  await T('文號流水簿 取號+1並留底', async p => { await p.goto(BASE + 'wenhao.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { localStorage.setItem('union_panel_unlocked', '1'); localStorage.setItem('ebn_org_v1', JSON.stringify({ docWord: '測', docYear: '115', docSeq: '7' })); });
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200);
    await p.click('#issue'); await p.waitForTimeout(150);
    const next = (await p.textContent('#nextNo')).trim();
    (next.includes('008')) ? ok('取號後+1=008並留底') : bad('wenhao', 'next=' + next); });
  await T('批次收據 多筆+彙總+合計', async p => { await p.goto(BASE + 'receipt-batch.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(150);
    await p.evaluate(() => { window.print = () => {}; });
    await p.fill('#year', '115'); await p.fill('#defAmt', '200'); await p.fill('#startNo', '1');
    await p.fill('#lines', '甲 200\n乙\n丙 500'); await p.waitForTimeout(120);
    await p.click('#gen'); await p.waitForTimeout(300);
    const rc = await p.$$eval('#sheets .rcpt', e => e.length); const t = await p.textContent('#sheets');
    (rc === 3 && t.includes('900') && t.includes('115-003')) ? ok('3收據+合計900') : bad('receipt-batch', 'rc=' + rc); });

  await T('自動導覽 可開啟並前進', async p => { await p.goto(BASE + 'leavepay.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
    if (!await p.$('#ebntour-launch')) return bad('tour', '沒有導覽啟動鈕');
    await p.click('#ebntour-launch'); await p.waitForTimeout(120);
    await p.click('#ebntour-menu button[data-m="text"]'); await p.waitForTimeout(400);
    const on = await p.$eval('#ebntour-ov', e => e.classList.contains('on'));
    await p.click('#ebntour-tip .ebnt-next', { force: true }); await p.waitForTimeout(220);
    const pg = await p.textContent('#ebntour-tip .pg');
    (on && /2 \/ 7/.test(pg)) ? ok('導覽開啟並前進到 2/7') : bad('tour', 'on=' + on + ' pg=' + pg); });

  await T('導覽「下一步」有會動引導圖示（全站共用）', async p => { await p.goto(BASE + 'qingjia.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
    await p.click('#ebntour-launch'); await p.waitForTimeout(120); await p.click('#ebntour-menu button[data-m="text"]'); await p.waitForTimeout(400);
    const hand = await p.$('#ebntour-tip .ebnt-next .ebnt-hand');
    hand ? ok('下一步鈕有會動手指') : bad('tourcue', '導覽下一步無引導圖示'); });

  await T('導覽 spotlight 聚焦實際元素', async p => { await p.goto(BASE + 'zhizai.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
    if (!await p.$('#ebntour-launch')) return bad('spot', '沒有導覽啟動鈕');
    await p.click('#ebntour-launch'); await p.waitForTimeout(120);
    await p.click('#ebntour-menu button[data-m="text"]'); await p.waitForTimeout(600);
    const w = await p.$eval('#ebntour-spot', e => parseFloat(e.style.width) || 0);
    (w > 0) ? ok('spotlight 有框住元素(' + Math.round(w) + 'px)') : bad('spot', '聚焦框寬度=' + w); });
  await T('help 自助問答即時回答', async p => { await go(p, 'help.html'); await p.waitForTimeout(300);
    const init = await p.$$eval('#jbot-log .b.bot', e => e.length); if (init < 1) return bad('help', 'no greeting');
    await p.fill('#jbot-in', '特休沒休完有錢嗎'); await p.click('#jbot-send'); await p.waitForTimeout(250);
    const me = await p.$$eval('#jbot-log .b.me', e => e.length);
    const ans = await p.$$eval('#jbot-log .b.bot .ans', e => e.length);
    const txt = await p.textContent('#jbot-log');
    (me >= 1 && ans >= 1 && txt.includes('38')) ? ok('打字即答(' + ans + '答案段)') : bad('help', 'me=' + me + ' ans=' + ans); });
  await T('help 熱門問題按鈕可答', async p => { await go(p, 'help.html'); await p.waitForTimeout(300);
    await p.click('#jbot-chips button'); await p.waitForTimeout(200);
    const ans = await p.$$eval('#jbot-log .b.bot .ans', e => e.length);
    (ans >= 1) ? ok('熱門問題給答案') : bad('help', 'hot no answer'); });
  await T('從小幫手來的頁面顯示回小幫手鈕', async p => { await p.goto(BASE + 'leavepay.html?from=help#sec-holi', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400);
    const t = await p.textContent('#ebnHelp').catch(() => '');
    (t && t.includes('回小幫手')) ? ok('回小幫手鈕出現') : bad('backbtn', 'ebnHelp=' + t); });
  await T('小幫手深連直達計算器區塊', async p => { await go(p, 'help.html'); await p.waitForTimeout(300);
    await p.fill('#jbot-in', '國定假日上班的薪水'); await p.click('#jbot-send'); await p.waitForTimeout(300);
    const href = await p.$eval('#jbot-chips a', e => e.getAttribute('href')).catch(() => '');
    if (!/leavepay\.html\?from=help#sec-holi/.test(href)) return bad('deeplink', 'href=' + href);
    await Promise.all([p.waitForNavigation({ waitUntil: 'domcontentloaded' }), p.click('#jbot-chips a')]); await p.waitForTimeout(400);
    const inView = await p.$eval('#sec-holi', e => { const r = e.getBoundingClientRect(); return r.top >= -5 && r.top < 700; }).catch(() => false);
    inView ? ok('深連落在國定假日區塊') : bad('deeplink', '#sec-holi 不在視窗'); });
  await T('送出鈕在手機畫面內可見', async p => { await p.setViewportSize({ width: 390, height: 844 }); await go(p, 'help.html'); await p.waitForTimeout(300);
    const v = await p.$eval('#jbot-send', e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= 844; }).catch(() => false);
    v ? ok('送出鈕在視窗內') : bad('sendbtn', '送出鈕不在視窗內'); });
  await T('到職日自動算特休天數', async p => { await go(p, 'leavepay.html'); await p.waitForTimeout(300);
    await p.fill('#hireDate', '2024-01-01'); await p.waitForTimeout(200);
    const t = await p.textContent('#hireOut');
    /特休 10 天/.test(t) ? ok('到職日→10天') : bad('hiredate', t.slice(0, 40)); });
  await T('行動鈕有會動的引導圖示', async p => { await go(p, 'help.html'); await p.waitForTimeout(300);
    await p.fill('#jbot-in', '我有幾天特休'); await p.click('#jbot-send'); await p.waitForTimeout(250);
    const cue = await p.$('#jbot-chips a.cue .cuehand');
    cue ? ok('行動鈕有會動手指') : bad('cue', '沒有引導圖示'); });
  await T('小幫手能接資方刁難（接招話術）', async p => { await go(p, 'help.html'); await p.waitForTimeout(300);
    await p.fill('#jbot-in', '叫我簽自願離職書'); await p.click('#jbot-send'); await p.waitForTimeout(250);
    const t = await p.textContent('#jbot-log');
    (/當場.*不簽|簽名前先問工會/.test(t) && !/一時對不到/.test(t)) ? ok('資方話術有接招') : bad('counter', t.slice(-60)); });
  await T('被醫院刁難常見問題不落空', async p => { await go(p, 'help.html'); await p.waitForTimeout(300);
    const qs = ['主管說加班是我自願的不給錢', '威脅把我調到最遠的單位', '站太久得靜脈曲張算職業病嗎', '我好怕不敢跟主管講話', '他們不發離職證明'];
    let missed = [];
    for (const q of qs) { await p.evaluate(() => { document.getElementById('jbot-log').innerHTML = ''; }); await p.fill('#jbot-in', q); await p.click('#jbot-send'); await p.waitForTimeout(160);
      const t = await p.textContent('#jbot-log'); if (/一時對不到/.test(t)) missed.push(q); }
    missed.length === 0 ? ok('5 題刁難全有回應') : bad('counter', '落空:' + missed.join('|')); });
  await T('小幫手可整理案件單交工會', async p => { await go(p, 'help.html'); await p.waitForTimeout(300);
    await p.fill('#jbot-in', '我被資遣了'); await p.click('#jbot-send'); await p.waitForTimeout(250);
    const btns = await p.$$('#jbot-chips button'); let done = false;
    for (const b of btns) { const t = await b.textContent(); if (/交給工會/.test(t)) { await b.click(); done = true; break; } }
    await p.waitForTimeout(200);
    (done && await p.isVisible('#casebox')) ? ok('案件單表單可開') : bad('casebox', '未開啟'); });
  await T('案件台 貼上會員案件自動分類帶入', async p => { await go(p, 'cases.html'); await p.waitForTimeout(400);
    await p.click('#importBtn'); await p.waitForTimeout(150);
    await p.fill('#imp-text', '【工會案件單】\n分類：加班費／工時\n姓名：陳大文\n聯絡：0912\n問題：國定假日上班只給調休未給加班費');
    await p.click('#impParse'); await p.waitForTimeout(250);
    const cat = await p.$eval('#c-cat', e => e.value).catch(() => ''); const nm = await p.$eval('#c-name', e => e.value).catch(() => '');
    (cat === 'ot' && nm === '陳大文') ? ok('案件自動分類+帶入') : bad('caseimport', 'cat=' + cat + ' nm=' + nm); });

  await T('加班情境回報 情境可勾選並更新摘要', async p => { await go(p, 'jb-menu.html'); await p.waitForTimeout(300);
    const items = await p.$$('.sc-item');
    if (items.length < 33) { bad('jb-sc-count', '情境數 ' + items.length + ' < 33'); return; }
    ok('33 個情境（含洗腎／ICU／急診／安寧）全部渲染');
    await items[0].click(); await p.waitForTimeout(120);
    const sel = await items[0].evaluate(el => el.classList.contains('sel'));
    const summary = await p.textContent('#summary-tags');
    (sel && !/還沒勾選/.test(summary)) ? ok('勾選情境摘要即時更新') : bad('jb-summary', summary.slice(0, 40)); });

  console.log('\n========== G. 時區正確性（UTC vs 台灣本地日期） ==========');
  // 固定時鐘在 UTC 2026-06-20T20:00:00Z＝台灣本地 2026-06-21 04:00。
  // 用 toISOString().slice(0,10) 算「今天」的舊寫法會誤判成 06-20（UTC 那天），
  // 應該要是台灣當地的 06-21。
  await T('org.js localDateStr() 用台灣本地日期，不是 UTC', async p => {
    await fixClock(p, '2026-06-20T20:00:00Z');
    await p.goto(BASE + 'org.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { try { localStorage.setItem('union_panel_unlocked', '1'); } catch (e) {} });
    await p.waitForFunction(() => window.EBNOrg);
    const d = await p.evaluate(() => EBNOrg.localDateStr());
    d === '2026-06-21' ? ok('UTC 20:00 → 台灣日期 06-21（正確，非 06-20）') : bad('localDateStr', 'got ' + d); });
  await T('jianshi.html today()/addDays() 用台灣本地日期', async p => {
    await fixClock(p, '2026-06-20T20:00:00Z');
    await p.goto(BASE + 'jianshi.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { try { localStorage.setItem('union_panel_unlocked', '1'); } catch (e) {} });
    const d = await p.evaluate(() => window.today());
    const d7 = await p.evaluate(() => window.addDays(0));
    (d === '2026-06-21' && d7 === '2026-06-21') ? ok('today()/addDays(0)=06-21（正確，非 06-20）') : bad('jianshi-today', 'today=' + d + ' addDays=' + d7); });
  await T('gongwen.html today() 用台灣本地日期', async p => {
    await fixClock(p, '2026-06-20T20:00:00Z');
    await p.goto(BASE + 'gongwen.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { try { localStorage.setItem('union_panel_unlocked', '1'); } catch (e) {} });
    const d = await p.evaluate(() => window.today());
    d === '2026-06-21' ? ok('公文日期=06-21（正確，非 06-20）') : bad('gongwen-today', 'got ' + d); });
  await T('roster.html curMonth() 跨月邊界用台灣本地時間', async p => {
    // UTC 2026-06-30T20:00:00Z＝台灣本地 2026-07-01 04:00：已經跨進 7 月，
    // 舊寫法(toISOString)還停在 UTC 的 6/30，會讓 7 月才欠費的人晚一天才被標欠費。
    await fixClock(p, '2026-06-30T20:00:00Z');
    await p.goto(BASE + 'roster.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { try { localStorage.setItem('union_panel_unlocked', '1'); } catch (e) {} });
    const m = await p.evaluate(() => window.curMonth());
    m === '2026-07' ? ok('curMonth()=2026-07（正確，非 2026-06）') : bad('roster-curmonth', 'got ' + m); });
  await T('checklist.html 30日登記死線不因時區多算一天', async p => {
    // 固定「現在」= 台灣本地 2026-07-01 00:00 整；大會日填 2026-06-01（剛好 30 天前）。
    // 應顯示「還有 0 天」；舊寫法會把大會日解析成 UTC 午夜(=台灣早上8點)，
    // 跟本地午夜的 today 相減多出 8 小時，Math.ceil 後誤報「還有 1 天」。
    await fixClock(p, '2026-06-30T16:00:00Z');
    await p.goto(BASE + 'checklist.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { try { localStorage.setItem('union_panel_unlocked', '1'); } catch (e) {} });
    await p.fill('#dday', '2026-06-01'); await p.waitForTimeout(150);
    const t = await p.textContent('#ddOut');
    /還有\s*0\s*天/.test(t) ? ok('30日死線剛好到期顯示「還有0天」（不多算一天）') : bad('checklist-ddl', t.replace(/\s+/g, ' ')); });

  console.log('\n========== H. 幹部卡片自動同步 ==========');
  await T('union.html 理事長/文宣/監事卡片會隨改名同步（原本只有總務/法規/組訓會動）', async p => {
    await p.goto(BASE + 'union.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('union_panel_unlocked', '1');
      localStorage.setItem('ebn_cadres_v1', JSON.stringify({ chair: '測試理事長', wel: '測試文宣', sup: '測試監事' })); });
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
    const chair = await p.textContent('#name-chair').catch(() => null);
    const wel = await p.textContent('#name-wel').catch(() => null);
    const sup = await p.textContent('#name-sup').catch(() => null);
    (chair === '測試理事長' && wel === '測試文宣' && sup === '測試監事') ? ok('三張卡片改名後同步(chair/wel/sup)') : bad('union-sync', 'chair=' + chair + ' wel=' + wel + ' sup=' + sup); });

  await T('petition.html 招募分工含組訓角色（不是只有5個舊角色）', async p => { await go(p, 'petition.html'); await p.waitForTimeout(200);
    const t = await p.textContent('#recruiterList').catch(() => ''); t.includes('組訓') ? ok('組訓角色有出現在招募分工列表') : bad('petition-org', t.slice(0, 80)); });

  console.log('\n========== I. 計算機負數防呆 ==========');
  await T('leavepay 月薪填負數不算出負的工資', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '-40000'); await p.waitForTimeout(150);
    const t = await p.textContent('#base'); !/-/.test(t) ? ok('負數月薪被擋下，不出現負號') : bad('leavepay-neg', t.replace(/\s+/g, ' ')); });
  await T('leavepay 除數填負數不把金額變號', async p => { await go(p, 'leavepay.html'); await p.fill('#salary', '30000'); await p.fill('#dv', '-30'); await p.waitForTimeout(150);
    const t = await p.textContent('#base'); !/-/.test(t) ? ok('負除數被擋下，退回正常算法') : bad('leavepay-negdv', t.replace(/\s+/g, ' ')); });
  await T('joinroi 月薪填負數不算出負的會費/回收', async p => { await go(p, 'joinroi.html'); await p.fill('#salary', '-40000'); await p.fill('#otHr', '3'); await p.waitForTimeout(150);
    const t = await p.textContent('#out'); !/-/.test(t) ? ok('負數月薪被擋下') : bad('joinroi-neg', t.replace(/\s+/g, ' ')); });
  await T('receipt-batch 預設金額填負數不產生負數收據', async p => { await p.goto(BASE + 'receipt-batch.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(150);
    await p.evaluate(() => { window.print = () => {}; });
    await p.fill('#year', '115'); await p.fill('#defAmt', '-200'); await p.fill('#startNo', '1');
    await p.fill('#lines', '甲\n乙 500'); await p.waitForTimeout(120);
    await p.click('#gen'); await p.waitForTimeout(300);
    const t = await p.textContent('#sheets'); !/NT\$ -/.test(t) ? ok('負數預設金額被擋下，未出現負數收據') : bad('receipt-neg', t.slice(0, 80)); });

  console.log('\n================= 總結 =================');
  console.log('PASS: ' + pass + '   FAIL: ' + fail);
  if (fails.length) { console.log('--- 失敗項目 ---'); fails.forEach(f => console.log(' • ' + f)); }
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('測試執行失敗：', e.message); process.exit(2); });
