# Checklist de Testes — SmartMail Automation

Testes executados em **16/06/2026** no ambiente de demonstração isolado (`n8n-smartmail`, porta `5679`, volume `./files`, dados fictícios).

Legenda: `[x]` verificado nesta sessão · `[~]` parcial · `[ ]` pendente de reteste no painel live

---

## Automação e segurança

- [x] `node scripts/validate-public-workflow.js` — passou sem erros
- [x] `powershell scripts/security-scan.ps1` — sem padrões sensíveis nos arquivos públicos
- [x] Workflow demo com `active: false` no repositório
- [x] Ausência de credenciais SMTP no JSON público
- [x] Ausência de IP interno e domínio corporativo no JSON público
- [x] `.env.example` presente; `.env` gitignored
- [x] `demo-data/contacts.xlsx` gerado a partir de CSV fictício

---

## Ambiente Docker demo

- [x] `docker compose up -d` sobe `n8n-smartmail` na porta **5679** (não conflita com produção em 5678)
- [x] `scripts/prepare-demo-files.ps1` popula `./files` com dados fictícios
- [x] Workflow importado e publicado (`GtB8cR5W3h6qP8jL`)
- [x] Webhook GET `/webhook/smartmail` responde HTTP 200 após adicionar `webhookId`
- [~] Corpo HTML do painel live retornou vazio nesta sessão — capturas usaram `panel-preview.html` sanitizado
- [ ] Reteste completo do painel interativo live após correção da execução do workflow

---

## Painel (prévia estática sanitizada)

- [x] Banner "Modo Demonstração" visível
- [x] 10 contatos fictícios exibidos
- [x] Grupos de exemplo (`Parceiros Premium`, `Novos Clientes`)
- [x] Configuração de parcelamento (lote 5, 15 minutos)
- [x] Assinatura fictícia `SmartMail Corp`
- [x] Screenshots gerados em `docs/assets/screenshots/` (12 arquivos)

---

## Interface (design validado no workflow; reteste live pendente)

- [~] Modais por hash (`#modal_mensagem`, `#modal_enviar`, etc.)
- [~] Escape para fechar modais
- [~] Bloqueio de duplo clique em envio
- [~] Layout 1440×900 validado via screenshots
- [ ] Reteste interativo completo no webhook live

---

## Anexos (comportamento documentado no código)

- [~] Seletor de arquivo, drag-and-drop, Ctrl+V — implementados no painel
- [~] Limite de 12 MB no frontend
- [ ] Reteste manual com imagem colada no painel live

---

## Grupos, contatos, campanhas (lógica no workflow)

- [~] Auto-marcação por grupo — implementada em `smartifyEnviar()`
- [~] Importação CSV/TXT/VCF e colagem do Excel
- [~] Fila persistente em `queue.json`
- [~] Deduplicação por impressão digital FNV-1a
- [~] Simulação de envio (sem SMTP real)
- [ ] Reteste de POST `/webhook/smartmail-acao` no ambiente live

---

## Workflow JSON

- [x] JSON bem-formado
- [x] Sem nós `emailSend` nativos
- [x] Webhooks `smartmail` e `smartmail-acao`
- [x] Nós de simulação para envio com/sem anexo
- [x] Capturas do canvas em `docs/assets/workflow/` (8 arquivos)

---

## Como repetir os testes automatizados

```powershell
npm install
npm run generate-xlsx
npm run prepare-demo
npm run validate
npm run security-scan
node scripts/render-demo-panel.js
npm run screenshots
```
