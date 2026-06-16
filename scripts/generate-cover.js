const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const coverDir = path.join(__dirname, '..', 'docs', 'assets', 'cover');
const dash = path.join(__dirname, '..', 'docs', 'assets', 'screenshots', '01-dashboard.png');
const wf = path.join(__dirname, '..', 'docs', 'assets', 'workflow', '01-workflow-completo.png');

(async () => {
  fs.mkdirSync(coverDir, { recursive: true });
  const dashB64 = fs.readFileSync(dash).toString('base64');
  const wfB64 = fs.readFileSync(wf).toString('base64');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 700 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#0f172a;font-family:Inter,Arial,sans-serif">
    <div style="display:grid;grid-template-columns:1.1fr .9fr;height:700px">
      <div style="position:relative;overflow:hidden">
        <img src="data:image/png;base64,${dashB64}" style="width:100%;height:100%;object-fit:cover;object-position:top" />
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,23,42,.15),rgba(15,23,42,.75))"></div>
      </div>
      <div style="display:flex;flex-direction:column;justify-content:center;padding:48px;color:#fff">
        <div style="font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#93c5fd;margin-bottom:12px">Automação n8n</div>
        <h1 style="margin:0 0 12px;font-size:52px;line-height:1">Mala Direta</h1>
        <p style="margin:0;font-size:22px;color:#cbd5e1;max-width:520px">Gerenciador de campanhas de e-mail em lote</p>
        <img src="data:image/png;base64,${wfB64}" style="margin-top:28px;width:100%;border-radius:16px;border:1px solid rgba(255,255,255,.15);max-height:220px;object-fit:cover;object-position:center" />
      </div>
    </div></body></html>`);
  await page.screenshot({ path: path.join(coverDir, 'cover.png') });
  await browser.close();
  console.log('✓ cover/cover.png');
})();
