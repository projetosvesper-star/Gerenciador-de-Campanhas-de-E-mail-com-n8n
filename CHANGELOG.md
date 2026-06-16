# Changelog — SmartMail Automation

Todas as mudanças relevantes do projeto estão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] — 2024-01 (Portfólio)

### Adicionado
- Versão de portfólio completa e sanitizada do projeto real
- Workflow demonstrativo (`smartmail-automation-demo.json`) com dados fictícios
- Painel web completo: editor de mensagem, seleção de destinatários, grupos inteligentes
- Fila parcelada persistente em JSON com Interval Trigger de 1 minuto
- Deduplicação por fingerprint FNV-1a de campanha
- Suporte a anexos: drag-and-drop, seletor de arquivo, Ctrl+V para imagens do clipboard
- Gerenciamento completo de contatos: adicionar, importar CSV/TXT/VCF, colar do Excel
- Grupos inteligentes com auto-seleção de membros ao filtrar destinatários
- Histórico de envios com data, empresa, e-mail e status no painel
- Configuração de parcelamento via painel (lote + intervalo em minutos ou horas)
- Assinatura automática carregada de `signature.html`
- Scripts de automação: `prepare-demo-files.ps1`, `sanitize_workflow.js`, `validate-public-workflow.js`
- Dados de demonstração fictícios em `demo-data/`
- Documentação completa: README bilingue, ARCHITECTURE, TECHNICAL_DECISIONS, USER_FLOW, TESTING, TROUBLESHOOTING, PRIVACY_AND_SECURITY, WORKFLOW_NOTES, PORTFOLIO_COPY
- `.env.example` com todas as variáveis necessárias
- `.gitignore` com bloqueio de todos os arquivos sensíveis
- Infraestrutura Docker documentada com `docker-compose.yml` de exemplo

### Segurança
- IPs, domínios e credenciais reais removidos do workflow via script automatizado
- Validação pré-push com `validate-public-workflow.js`
- Dados de demo usando apenas domínios fictícios (`example.com`, `alpha.example`)

---

## Histórico do projeto real (sem dados sensíveis)

### Fase 1 — Levantamento e Prova de Conceito
- Mapeamento do processo manual de envio de comunicados
- Prova de conceito com webhook simples + planilha XLSX
- Validação de viabilidade técnica com n8n e SMTP corporativo

### Fase 2 — Painel Web (v0.1)
- Primeira versão do painel HTML gerado no Code node
- Funcionalidade básica: selecionar contatos e enviar
- Sem grupos, sem histórico, sem parcelamento

### Fase 3 — Funcionalidades Avançadas (v0.5)
- Adicionado suporte a grupos de destinatários
- Implementada fila parcelada com Interval Trigger
- Adicionado histórico de envios no painel
- Implementada deduplicação por conteúdo (fingerprint)
- Suporte a anexos via drag-and-drop e Ctrl+V

### Fase 4 — Estabilização e UX (v0.9)
- Refinamento da interface para usuários não técnicos
- Adicionada importação de contatos em massa (CSV, TXT, VCF)
- Feedback visual em todas as ações (toasts, indicadores de carregamento)
- Tratamento de erros robusto com mensagens em português claro
- Workflow de tratamento de erros separado

### Fase 5 — Produção e Portfólio (v1.0)
- Deploy em ambiente corporativo real
- Sanitização para portfólio público
- Documentação técnica completa
