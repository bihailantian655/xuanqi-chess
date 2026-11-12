// 本地验证：静态服务 + 真浏览器检查 PWA 壳是否正常（推送前自检，非发布脚本）
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PORT = 8123;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.md': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    '--remote-debugging-port=9335',
    '--user-data-dir=' + path.join(ROOT, '..', 'chrome-verify'), 'about:blank'
  ], { detached: true, stdio: 'ignore' });
  child.unref();

  let list = [];
  for (let i = 0; i < 60; i++) {
    try { list = await (await fetch('http://127.0.0.1:9335/json')).json(); if (list.length) break; } catch (e) {}
    await sleep(250);
  }
  const ws = new WebSocket(list.find(x => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (expression, awaitPromise = false) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise })).result.result.value;

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await sleep(2200);

  console.log('TITLE      ', await ev('document.title'));
  console.log('BOARD      ', await ev('!!document.querySelector("canvas#board")'));
  console.log('MANIFEST   ', await ev('document.querySelector("link[rel=manifest]")?.href || "MISSING"'));
  console.log('MANIFEST_OK', await ev('fetch("./manifest.webmanifest").then(r=>r.json()).then(j=>j.name)', true));
  console.log('SW_STATE   ', await ev('navigator.serviceWorker.ready.then(r=>r.active?r.active.state:"none")', true));
  console.log('SW_SCOPE   ', await ev('navigator.serviceWorker.ready.then(r=>r.scope)', true));
  console.log('SETUP_ON   ', await ev('document.getElementById("setupModal").classList.contains("on")'));
  console.log('OVERFLOW   ', await ev('document.documentElement.scrollWidth + "/" + innerWidth'));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, '..', 'pwa-check.png'), Buffer.from(shot.result.data, 'base64'));

  ws.close();
  try { process.kill(child.pid); } catch (e) {}
  server.close();
}
main().catch(e => { console.error('FAIL', e.message); try { server.close(); } catch (x) {} process.exit(1); });
