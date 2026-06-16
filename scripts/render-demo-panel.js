// Gera um HTML estático do painel demo para screenshots e testes offline.
// Uso: node scripts/render-demo-panel.js
// Saída: demo-data/panel-preview.html

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const root = path.join(__dirname, '..');
const filesDir = path.join(root, 'files');
const outPath = path.join(root, 'demo-data', 'panel-preview.html');

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch { return fallback; }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Carregar contatos do XLSX
const xlsxPath = path.join(filesDir, 'contacts.xlsx');
const wb = XLSX.readFile(xlsxPath);
const sheet = wb.Sheets['Clientes_Validos'] || wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

const config = readJson(path.join(filesDir, 'message_config.json'), {});
const grupos = readJson(path.join(filesDir, 'groups.json'), {});
const envioConfig = readJson(path.join(filesDir, 'send_config.json'), {});
const extras = readJson(path.join(filesDir, 'contacts_added.json'), []);
const fila = readJson(path.join(filesDir, 'queue.json'), []);
const assinatura = fs.existsSync(path.join(filesDir, 'signature.html'))
  ? fs.readFileSync(path.join(filesDir, 'signature.html'), 'utf8')
  : '<p>SmartMail Corp</p>';

const clientesMap = new Map();
for (const row of rows) {
  const email = String(row.email || row.Email || '').trim().toLowerCase();
  const empresa = String(row.Empresa || row.empresa || '').trim();
  if (email && email.includes('@')) clientesMap.set(email, { empresa, email, origem: 'planilha', grupos: [] });
}
for (const item of extras) {
  const email = String(item.email || '').trim().toLowerCase();
  if (email) clientesMap.set(email, { empresa: item.empresa || email.split('@')[0], email, origem: 'manual', grupos: [] });
}
for (const [grupo, emails] of Object.entries(grupos)) {
  for (const email of emails || []) {
    const e = String(email).toLowerCase();
    if (clientesMap.has(e)) clientesMap.get(e).grupos.push(grupo);
  }
}
const clientes = [...clientesMap.values()].sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR'));
const gruposNomes = Object.keys(grupos);
const totalFilaContatos = fila.reduce((s, c) => s + (c.contatos?.length || 0), 0);

const clienteRows = clientes.map((c, idx) => {
  const gruposTxt = (c.grupos || []).join(', ');
  const gruposData = (c.grupos || []).map(g => g.toLowerCase()).join('|');
  return `<tr class="linha-cliente" data-groups="${escapeHtml(gruposData)}"><td><input type="checkbox"></td><td>${idx + 1}</td><td>${escapeHtml(c.empresa)}</td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(gruposTxt || 'Geral')}</td></tr>`;
}).join('');

const gruposOptions = gruposNomes.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
const gruposCards = gruposNomes.map(g => `<button type="button" class="group-card group-card-btn"><div><b>${escapeHtml(g)}</b><small>${(grupos[g] || []).length} contatos</small></div></button>`).join('');

const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SmartMail Automation</title>
<style>
body{margin:0;font-family:Inter,Arial,sans-serif;background:#eef4fb;color:#162033}
.wrap{max-width:1220px;margin:0 auto;padding:26px}
.hero,.card{background:#fff;border:1px solid #dbe5f2;border-radius:24px;padding:24px;box-shadow:0 22px 55px rgba(18,34,64,.12);margin-bottom:18px}
.warn-demo{margin-bottom:16px;text-align:center;font-weight:bold;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;padding:12px;border-radius:12px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.stat{background:#f8fbff;border:1px solid #dbe5f2;border-radius:16px;padding:14px}
.main-actions{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.action-card{min-height:180px;display:flex;flex-direction:column;justify-content:space-between}
.icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:10px}
.icon.blue{background:#eff6ff;color:#2563eb}.icon.purple{background:#f5f3ff;color:#7c3aed}.icon.green{background:#ecfdf3;color:#16a34a}.icon.orange{background:#fff7ed;color:#f97316}
.btn{display:inline-block;padding:12px 16px;border-radius:14px;color:#fff;text-decoration:none;font-weight:800;text-align:center}
.btn-blue{background:#2563eb}.btn-purple{background:#7c3aed}.btn-green{background:#16a34a}.btn-orange{background:#f97316}.btn-secondary{background:#fff;color:#28415f;border:1px solid #dbe5f2}
table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;border-bottom:1px solid #dbe5f2;text-align:left}
.modal-section{margin-top:18px;padding-top:18px;border-top:1px solid #dbe5f2}
.modal-tag{display:inline-block;padding:6px 10px;border-radius:999px;background:#f8fbff;border:1px solid #dbe5f2;font-size:12px;font-weight:800;text-transform:uppercase}
.dropzone{border:2px dashed #bfcee2;background:#f8fbff;border-radius:16px;padding:18px;text-align:center;margin-top:10px}
.group-card{width:100%;text-align:left;border:1px solid #dbe5f2;background:#f8fbff;border-radius:14px;padding:12px;margin-top:8px}
h1{margin:0 0 8px;font-size:36px}h2{margin:0 0 8px}h3{margin:0 0 8px}.muted{color:#5f6f86}
</style></head><body><div class="wrap">
<div class="warn-demo">Modo Demonstração — Nenhum e-mail real será enviado. Os disparos serão simulados no histórico e nos logs.</div>
<section class="hero"><h1>SmartMail Automation</h1><p class="muted">Gerenciador inteligente de campanhas de e-mail em lote construído com n8n, JavaScript, HTML, CSS e filas persistentes.</p>
<div class="stats"><div class="stat"><small>Contatos</small><b>${clientes.length}</b></div><div class="stat"><small>Fila pendente</small><b>${totalFilaContatos}</b></div><div class="stat"><small>Grupos</small><b>${gruposNomes.length}</b></div><div class="stat"><small>Modo</small><b>Demo</b></div></div></section>
<section class="main-actions">
<div class="card action-card"><div><div class="icon blue">💬</div><h3>Mensagem</h3><p class="muted">Assunto: ${escapeHtml(config.assunto || 'Comunicado SmartMail')}</p></div><span class="btn btn-blue">Editar mensagem</span></div>
<div class="card action-card"><div><div class="icon purple">🧪</div><h3>Teste</h3><p class="muted">Validar antes do envio</p></div><span class="btn btn-purple">Fazer teste</span></div>
<div class="card action-card"><div><div class="icon green">📨</div><h3>Enviar</h3><p class="muted">${clientes.length} contatos disponíveis</p></div><span class="btn btn-green">Enviar mensagem</span></div>
<div class="card action-card"><div><div class="icon orange">👥</div><h3>Contatos</h3><p class="muted">Importar e organizar</p></div><span class="btn btn-orange">Gerenciar contatos</span></div>
<div class="card action-card"><div><div class="icon blue">⚙️</div><h3>Configuração</h3><p class="muted">Lote ${envioConfig.lote_quantidade || 5} · ${envioConfig.intervalo_valor || 15} ${envioConfig.intervalo_unidade || 'minutos'}</p></div><span class="btn btn-secondary">Configurar</span></div>
</section>
<section class="card modal-section" id="sec-mensagem"><div class="modal-tag">Mensagem</div><h2>Assunto e prévia</h2><p><strong>${escapeHtml(config.assunto || '')}</strong></p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(config.mensagem_texto || '')}</pre><div class="dropzone">Passe o mouse aqui e cole com Ctrl + V</div><div style="margin-top:12px">${assinatura}</div></section>
<section class="card modal-section" id="sec-teste"><div class="modal-tag">Teste</div><h2>Envio de teste</h2><p>E-mail: <code>teste@example.com</code> · Nome: Teste Demo</p></section>
<section class="card modal-section" id="sec-enviar"><div class="modal-tag">Enviar</div><h2>Seleção de destinatários</h2><label>Grupo: <select><option>Todos / Geral</option>${gruposOptions}</select></label><div style="margin-top:12px;max-height:260px;overflow:auto"><table><thead><tr><th></th><th>#</th><th>Empresa</th><th>E-mail</th><th>Grupo</th></tr></thead><tbody>${clienteRows}</tbody></table></div></section>
<section class="card modal-section" id="sec-grupos"><div class="modal-tag">Grupos</div><h2>Grupos inteligentes</h2>${gruposCards}</section>
<section class="card modal-section" id="sec-config"><div class="modal-tag">Configuração</div><h2>Parcelamento</h2><p>Lote: <b>${envioConfig.lote_quantidade}</b> · Intervalo: <b>${envioConfig.intervalo_valor} ${envioConfig.intervalo_unidade}</b> · Proteção global: <b>${envioConfig.protecao_global !== false ? 'ativa' : 'inativa'}</b></p></section>
</div></body></html>`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(`✓ Painel demo renderizado em ${outPath}`);
