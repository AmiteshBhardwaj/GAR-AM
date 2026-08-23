const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const outPath = path.resolve(__dirname, 'gameplay_scene.png');
const port = 9228;
const tempUserData = path.join(os.tmpdir(), 'chrome_debug_profile_' + Date.now());

async function run() {
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempUserData}`,
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu=false',
    '--use-gl=angle',
    '--enable-webgl',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const list = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json/list`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = list.find(p => p.type === 'page' && (p.url.includes('localhost') || p.url.includes('5173'))) || list[0];

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[Browser Console ${msg.params.type}]:`, args);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[Browser Exception]:', JSON.stringify(msg.params.exceptionDetails));
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Selecting SPARTAN character...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const spartanBtn = buttons.find(b => b.innerText.includes('SPARTAN'));
        if (spartanBtn) spartanBtn.click();
        const testBtn = buttons.find(b => b.innerText.includes('Test Deck'));
        if (testBtn) testBtn.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 800));

  console.log('Clicking START PROTOCOL...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(b => b.innerText.includes('START PROTOCOL') || b.innerText.includes('START'));
        if (startBtn) startBtn.click();
      })()
    `
  });

  console.log('Waiting 6s for GLB 3D model to load in Suspense...');
  await new Promise(r => setTimeout(r, 6000));

  console.log('Triggering answer to raise blackboard screen...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.__triggerAnswer) {
          window.__triggerAnswer('201 Created');
        }
      })()
    `
  });

  console.log('Waiting 4s for blackboard to winch up and reveal Spartan with hands on table...');
  await new Promise(r => setTimeout(r, 4000));

  const screenshotResult = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotResult.result.data, 'base64');
  fs.writeFileSync(outPath, buffer);
  console.log('Screenshot written to:', outPath);

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(tempUserData, { recursive: true, force: true });
  } catch (e) {}
  process.exit(0);
}

run().catch(console.error);
