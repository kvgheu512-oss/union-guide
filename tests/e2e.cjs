/* 高榮企業工會網站 — 自動化端對端測試（功能／流程／導覽／錯誤邊界）
   用法：bash tests/run.sh   （會自動開本機伺服器、跑測試、收尾）
   單獨跑：BASE=http://localhost:8099/ node tests/e2e.cjs
   可用環境變數覆寫：
     BASE         測試網址（預設 http://localhost:8099/）
     PW_CORE      playwright-core 路徑（預設 /opt/node22/.../playwright-core）
     CHROME       Chromium 執行檔（預設 /opt/pw-browsers/chromium-1194/chrome-linux/chrome）
   全部通過 exit 0；有失敗 exit 1（方便 CI／改完一鍵重跑）。 */
const PW_CORE = process.env.PW_CORE || '/opt/node22/lib/node_modules/playwright/node_modules/playwright-core';
const CHROME  = process.env.CHROME  || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE    = process.env.BASE    || 'http://localhost:8099/';
const { chromium } = require(PW_CORE);

let pass = 0, fail = 0; const fails = [];
const ok  = n => { pass++; console.log('  ✅ ' + n); };
const bad = (n, d) => { fail++; fails.push(n + ' — ' + d); console.log('  ❌ ' + n + ' — ' + d); };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  const ctx = await b.newContext();
  const page = async () => { const p = await ctx.newPage(); p.__err = []; p.on('pageerror', e => p.__err.push(e.message)); return p; };
  const go = async (p, u) => { await p.goto(BASE + u, { waitUntil: 'domcontentloaded' }); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200); };
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
  await T('頁面載入速度(leavepay)', async p => { const t0 = Date.now(); await p.goto(BASE + 'leavepay.html', { waitUntil: 'load' }); const dt = Date.now() - t0;
    dt < 3000 ? ok('load ' + dt + 'ms') : bad('perf', '慢 ' + dt + 'ms'); });

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

  console.log('\n================= 總結 =================');
  console.log('PASS: ' + pass + '   FAIL: ' + fail);
  if (fails.length) { console.log('--- 失敗項目 ---'); fails.forEach(f => console.log(' • ' + f)); }
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('測試執行失敗：', e.message); process.exit(2); });
