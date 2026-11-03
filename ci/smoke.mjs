import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('test-results', { recursive: true });
const external = process.env.PLAYTEST_URL;
const server = external ? null : spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1', '--directory', 'web'], { stdio: 'ignore' });
const base = external || 'http://127.0.0.1:8765/';
const logs = [];
let browser, page;
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', message => logs.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', error => logs.push(`PAGEERROR: ${error.message}`));
  await page.goto(`${base}?qa=1`);
  await page.waitForFunction(() => window.__mossbound?.ready && window.__mossboundUI, { }, { timeout: 120000 });
  const state = () => page.evaluate(() => ({ game: window.__mossboundGame, ui: window.__mossboundUI }));
  const wait = (fn, timeout = 30000) => page.waitForFunction(fn, {}, { timeout });
  const canvasPoint = async ([x, y]) => {
    const box = await page.locator('#canvas').boundingBox();
    return { x: box.x + x * box.width / 1280, y: box.y + y * box.height / 900 };
  };
  const drag = async (from, to, shift = false) => {
    const a = await canvasPoint(from), b = await canvasPoint(to);
    if (shift) await page.keyboard.down('Shift');
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 15 }); await page.mouse.up();
    if (shift) await page.keyboard.up('Shift');
  };
  const click = async p => { const a = await canvasPoint(p); await page.mouse.click(a.x, a.y); };
  let s = await state();
  assert.equal(s.ui.font_has_chinese, true);
  assert.equal(s.game.entities.filter(e=>e.type==='pack').length,1);
  await page.screenshot({path:'test-results/01-start.png'});
  for(let i=0;i<6;i++){
    s=await state(); await click(s.ui.points['1'].center);
    await page.waitForTimeout(1100);
  }
  await wait(()=>window.__mossboundGame.stats.opened===1);
  s=await state();
  const tree=s.game.entities.find(e=>e.type==='tree');
  await drag(s.ui.points['6'].center,s.ui.points[String(tree.id)].center);
  await wait(()=>window.__mossboundGame.entities.filter(e=>e.type==='wood').reduce((n,e)=>n+e.n,0)>=3);
  s=await state();
  await drag(s.ui.points['6'].center,[30+485*1220/900,286+475*574/650]);
  await wait(()=>window.__mossboundGame.entities.find(e=>e.id===6).target===0);
  await wait(()=>Object.values(window.__mossboundUI.incoming).every(n=>n===0));
  s=await state();
  const stone=s.game.entities.find(e=>e.type==='stone');
  const wood=s.game.entities.find(e=>e.type==='wood');
  await drag(s.ui.points[String(wood.id)].top,s.ui.points[String(stone.id)].top,true);
  await wait(()=>Object.keys(window.__mossboundGame.entities.find(e=>e.id===3).project).length>0);
  s=await state();
  for(const pile of s.game.entities.filter(e=>e.type==='wood')){
    s=await state();await drag(s.ui.points[String(pile.id)].top,s.ui.points['3'].center,true);
  }
  await wait(()=>window.__mossboundGame.entities.find(e=>e.id===3).project.ready);
  s=await state();
  assert.equal(s.game.entities.some(e=>e.type==='mill'),false);
  await page.screenshot({path:'test-results/02-matched-materials.png'});
  await drag(s.ui.points['6'].center,s.ui.points['3'].center);
  await wait(()=>window.__mossboundGame.entities.find(e=>e.id===6).target===3);
  await page.waitForTimeout(2200);
  await page.screenshot({path:'test-results/03-manufacturing.png'});
  await wait(()=>window.__mossboundGame.entities.some(e=>e.type==='mill'));
  await page.waitForTimeout(1000);
  await page.screenshot({path:'test-results/04-expanded-dock.png'});
  s=await state();assert.equal(s.game.done,0);
  assert.deepEqual(await page.evaluate(()=>window.__mossbound.errors.filter(e=>/SCRIPT ERROR|Parse Error|ERROR:/.test(e))),[]);
  console.log('PASS: starter reveals, finite harvesting, direct material combination, automatic recipe matching, required villager manufacture, technology progression without orders');
  // A separate ordinary-input economy/food scenario starts without save data.
  await page.goto(`${base}?qa=1`);
  await wait(()=>window.__mossbound?.ready && window.__mossboundUI);
  s=await state();
  const coins=s.game.entities.find(e=>e.type==='gold');
  await drag(s.ui.points[String(coins.id)].top,s.ui.offers.forage);
  await wait(()=>window.__mossboundGame.entities.filter(e=>e.type==='gold').reduce((n,e)=>n+e.n,0)===4);
  assert.equal((await state()).game.coins,0);
  await page.screenshot({path:'test-results/06-physical-payment.png'});
  for(let i=0;i<6;i++){
    s=await state();await click(s.ui.points['1'].center);await page.waitForTimeout(1100);
  }
  await wait(()=>Object.values(window.__mossboundUI.incoming).every(n=>n===0));
  s=await state();
  const food=s.game.entities.find(e=>e.type==='berries');
  await drag(s.ui.points[String(food.id)].top,s.ui.points['6'].center);
  await wait(()=>window.__mossboundGame.satiety===3);
  await page.screenshot({path:'test-results/07-feeding.png'});
  assert.equal((await state()).game.entities.filter(e=>e.type==='berries').length,0);
  assert.deepEqual(await page.evaluate(()=>window.__mossbound.errors.filter(e=>/SCRIPT ERROR|Parse Error|ERROR:/.test(e))),[]);
  console.log('PASS: physical coin payment with exact change, starter food, real drag feeding');
  await page.close();
  page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
  await page.goto(base);
  await page.waitForFunction(() => window.__mossbound?.ready, {}, { timeout: 120000 });
  assert.equal(await page.evaluate(() => window.__mossboundGame), undefined);
  const box = await page.locator('#canvas').boundingBox();
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 845 && box.y + box.height <= 391);
  await page.screenshot({ path: 'test-results/05-small-landscape.png' });
  console.log('PASS: normal no-login startup, test state disabled, small landscape viewport fits');
} catch (error) {
  if (page) {
    await page.screenshot({ path: 'test-results/failure.png' }).catch(() => {});
    await writeFile('test-results/failure-state.json', JSON.stringify(await page.evaluate(() => ({ boot: window.__mossbound, game: window.__mossboundGame, ui: window.__mossboundUI })).catch(() => ({})), null, 2));
  }
  console.error(error); process.exitCode = 1;
} finally {
  await writeFile('test-results/browser.log', logs.join('\n'));
  await browser?.close(); server?.kill();
}

