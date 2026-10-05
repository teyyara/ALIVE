import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'lab-output';
await mkdir(output, { recursive: true });

const vite = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
  shell: process.platform === 'win32',
  stdio: ['ignore', 'pipe', 'pipe']
});

let logs = '';
vite.stdout.on('data', b => { logs += b.toString(); });
vite.stderr.on('data', b => { logs += b.toString(); });

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('ALIVE preview server did not start.');
}

try {
  await waitForServer('http://127.0.0.1:4173/');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));

  const states = ['idle', 'attentive', 'listening', 'thinking', 'speaking', 'warm', 'curious', 'playful'];
  const specialStates = ['blink'];

  for (const state of states) {
    await page.goto(`http://127.0.0.1:4173/?lab=${state}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${output}/${state}.png`, fullPage: true });
  }

  for (const state of specialStates) {
    await page.goto(`http://127.0.0.1:4173/?lab=${state}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(330);
    await page.screenshot({ path: `${output}/${state}.png`, fullPage: true });
  }

  await page.goto('http://127.0.0.1:4173/?inspect=1', { waitUntil: 'networkidle' });
  await page.mouse.move(720, 420);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${output}/interaction-center.png`, fullPage: true });

  await page.mouse.move(1050, 330, { steps: 12 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${output}/interaction-right.png`, fullPage: true });

  await page.goto('http://127.0.0.1:4173/?inspect=1', { waitUntil: 'networkidle' });
  await page.locator('#message').fill('Hello ALIVE');
  await page.locator('#composer button').click();
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `${output}/conversation.png`, fullPage: true });
  const conversationText = await page.locator('#messages').innerText();

  const testState = await page.evaluate(() => window.__ALIVE_TEST__?.getCharacter?.() ?? null);
  await writeFile(`${output}/diagnostics.json`, JSON.stringify({
    consoleErrors,
    pageErrors,
    character: testState,
    conversationText,
    serverLogs: logs
  }, null, 2));

  if (pageErrors.length || consoleErrors.length) {
    throw new Error(`Browser errors detected. pageErrors=${pageErrors.length}, consoleErrors=${consoleErrors.length}`);
  }

  await browser.close();
} finally {
  vite.kill();
}
