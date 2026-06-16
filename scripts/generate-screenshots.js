const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const screenshotDir = path.join(__dirname, '..', 'docs', 'assets', 'screenshots');
const workflowDir = path.join(__dirname, '..', 'docs', 'assets', 'workflow');
const coverDir = path.join(__dirname, '..', 'docs', 'assets', 'cover');

const N8N_BASE = process.env.N8N_BASE || 'http://localhost:5678';
const PANEL_URL = process.env.PANEL_URL || `${N8N_BASE}/webhook/mala-direta`;
const WORKFLOW_ID = process.env.N8N_WORKFLOW_ID || 'D0Mpf2r4KXD2IEbK';
const WORKFLOW_URL = `${N8N_BASE}/workflow/${WORKFLOW_ID}`;
const LOGIN_EMAIL = process.env.N8N_LOGIN_EMAIL || '';
const LOGIN_PASSWORD = process.env.N8N_LOGIN_PASSWORD || '';

[screenshotDir, workflowDir, coverDir].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env.screenshots');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function dismissOverlays(page) {
  await page.keyboard.press('Escape');
  await sleep(300);
  await page.evaluate(() => {
    document.querySelectorAll('button, [role="button"]').forEach((btn) => {
      const text = (btn.textContent || '').toLowerCase();
      if (text.includes('close') || text.includes('fechar') || text === '×' || text === 'x') {
        try { btn.click(); } catch { /* ignore */ }
      }
    });
  });
  await sleep(400);
}

async function loginToN8n(page) {
  const email = process.env.N8N_LOGIN_EMAIL || LOGIN_EMAIL;
  const password = process.env.N8N_LOGIN_PASSWORD || LOGIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Defina N8N_LOGIN_EMAIL e N8N_LOGIN_PASSWORD em .env.screenshots');
  }

  await page.goto(`${N8N_BASE}/signin`, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);

  const emailSel = 'input[type="email"], input[name="email"], input[autocomplete="email"]';
  const passSel = 'input[type="password"], input[name="password"]';
  await page.waitForSelector(emailSel, { timeout: 15000 });
  await page.click(emailSel, { clickCount: 3 });
  await page.type(emailSel, email, { delay: 20 });
  await page.type(passSel, password, { delay: 20 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await sleep(2000);
  await dismissOverlays(page);
}

async function openWorkflow(page) {
  await page.goto(WORKFLOW_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(4000);
  await dismissOverlays(page);
  await page.waitForSelector('.vue-flow, [data-test-id="canvas"], .ndv-wrapper', { timeout: 20000 }).catch(() => {});
  await sleep(1500);
}

async function fitWorkflowView(page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const fitBtn = buttons.find((b) => /fit|ajustar|zoom/i.test(b.getAttribute('title') || b.getAttribute('aria-label') || b.textContent || ''));
    if (fitBtn) fitBtn.click();
  });
  await sleep(800);
  await page.keyboard.down('Control');
  await page.keyboard.press('0');
  await page.keyboard.up('Control');
  await sleep(600);
}

async function panCanvas(page, dx, dy) {
  const box = await page.evaluate(() => {
    const canvas = document.querySelector('.vue-flow__pane, .vue-flow');
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  });
  if (!box) return;
  const startX = box.x;
  const startY = box.y;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx, startY + dy, { steps: 12 });
  await page.mouse.up();
  await sleep(700);
}

async function zoomCanvas(page, delta) {
  const box = await page.evaluate(() => {
    const canvas = document.querySelector('.vue-flow__pane, .vue-flow');
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (!box) return;
  await page.mouse.move(box.x, box.y);
  await page.mouse.wheel({ deltaY: delta });
  await sleep(500);
}

async function capturePanelScreenshots(page) {
  console.log(`Painel: ${PANEL_URL}`);
  await page.goto(PANEL_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  const contentLen = (await page.content()).length;
  if (contentLen < 5000) {
    throw new Error(`Painel retornou pouco conteúdo (${contentLen} bytes)`);
  }

  await page.screenshot({ path: path.join(screenshotDir, '01-dashboard.png') });
  console.log('✓ 01-dashboard.png');

  const openModal = async (hash, file) => {
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await sleep(700);
    await page.screenshot({ path: path.join(screenshotDir, file) });
    console.log(`✓ ${file}`);
  };

  const shots = [
    ['#modal_mensagem', '02-mensagem-e-previa.png'],
    ['#modal_mensagem', '03-anexos-ctrl-v.png'],
    ['#modal_teste', '04-envio-teste.png'],
    ['#modal_enviar', '05-selecao-destinatarios.png'],
    ['#modal_enviar', '06-filtro-por-grupo.png'],
    ['#modal_contatos', '07-gerenciamento-contatos.png'],
    ['#modal_importar', '08-importacao-contatos.png'],
    ['#modal_grupo', '09-grupos-inteligentes.png'],
    ['#modal_config', '10-configuracao-minutos-horas.png'],
    ['#modal_config', '11-protecao-antiduplicidade.png'],
    ['#', '12-historico-e-fila.png']
  ];

  for (const [hash, file] of shots) {
    await openModal(hash, file);
  }
}

async function captureWorkflowScreenshots(page) {
  await openWorkflow(page);
  await fitWorkflowView(page);
  await sleep(800);
  await page.screenshot({ path: path.join(workflowDir, '01-workflow-completo.png') });
  console.log('✓ workflow/01-workflow-completo.png');
}

async function generateCover(browser) {
  const dash = path.join(screenshotDir, '01-dashboard.png');
  const wf = path.join(workflowDir, '01-workflow-completo.png');
  if (!fs.existsSync(dash)) return;

  const coverPage = await browser.newPage();
  await coverPage.setViewport({ width: 1600, height: 700 });
  const dashB64 = fs.readFileSync(dash).toString('base64');
  const hasWf = fs.existsSync(wf);
  const wfB64 = hasWf ? fs.readFileSync(wf).toString('base64') : '';

  await coverPage.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#0f172a;font-family:Inter,Arial,sans-serif">
    <div style="display:grid;grid-template-columns:1.1fr .9fr;height:700px">
      <div style="position:relative;overflow:hidden">
        <img src="data:image/png;base64,${dashB64}" style="width:100%;height:100%;object-fit:cover;object-position:top" />
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,23,42,.15),rgba(15,23,42,.75))"></div>
      </div>
      <div style="display:flex;flex-direction:column;justify-content:center;padding:48px;color:#fff">
        <div style="font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#93c5fd;margin-bottom:12px">Automação n8n</div>
        <h1 style="margin:0 0 12px;font-size:52px;line-height:1">Mala Direta</h1>
        <p style="margin:0;font-size:22px;color:#cbd5e1;max-width:520px">Gerenciador de campanhas de e-mail em lote</p>
        ${hasWf ? `<img src="data:image/png;base64,${wfB64}" style="margin-top:28px;width:100%;border-radius:16px;border:1px solid rgba(255,255,255,.15);max-height:220px;object-fit:cover;object-position:center" />` : ''}
      </div>
    </div></body></html>`);
  await coverPage.screenshot({ path: path.join(coverDir, 'cover.png') });
  console.log('✓ cover/cover.png');
  await coverPage.close();
}

(async () => {
  loadLocalEnv();
  console.log('=== Mala Direta: captura de screenshots ===');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await capturePanelScreenshots(page);
  } catch (err) {
    console.error('Erro no painel:', err.message);
    throw err;
  }

  const n8nPage = await browser.newPage();
  await n8nPage.setViewport({ width: 1440, height: 900 });
  try {
    await loginToN8n(n8nPage);
    await captureWorkflowScreenshots(n8nPage);
  } catch (err) {
    console.error('Erro no workflow n8n:', err.message);
    throw err;
  }

  await generateCover(browser);
  await browser.close();
  console.log('=== Capturas finalizadas ===');
})();
