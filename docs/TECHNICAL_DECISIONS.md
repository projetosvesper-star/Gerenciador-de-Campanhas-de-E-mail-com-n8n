# Decisões Técnicas — SmartMail Automation

Este documento registra as principais decisões de design e arquitetura tomadas durante o desenvolvimento, incluindo alternativas consideradas e justificativas.

---

## 1. Por que n8n?

**Decisão:** Usar o n8n como plataforma central de automação.

**Contexto:** O ambiente já tinha n8n instalado e funcionando via Docker. A proposta era criar uma solução que usasse a infraestrutura existente sem adicionar servidores ou serviços extras.

**Alternativas consideradas:**
- **Python + FastAPI**: Exigiria instalação de dependências no servidor e um processo separado.
- **Node.js standalone**: Mais controle, mas precisaria de gerenciamento de processo (PM2) e deploy manual.
- **Make/Zapier**: SaaS — sem controle sobre dados, custo mensal, e limite de operações.

**Por que n8n ganhou:** Zero infraestrutura adicional, webhooks nativos, execução de código Node.js arbitrário nos Code nodes, persistência integrada, e já estava no ambiente.

---

## 2. Por que um painel próprio em vez de usar a interface do n8n?

**Decisão:** Construir um painel HTML/CSS/JS renderizado pelo próprio n8n.

**Contexto:** Os usuários finais são pessoas não técnicas que precisavam de uma interface simples, em português, sem nenhuma curva de aprendizado.

**Alternativas consideradas:**
- **Interface nativa do n8n**: Exige login, conhecimento de workflows, inglês e acesso a dados sensíveis da plataforma.
- **Formulário externo (Typeform, Google Forms)**: Sem customização adequada, sem histórico integrado, sem gerenciamento de contatos.
- **App separado (Next.js, etc.)**: Exigiria deploy separado, certificado TLS, e mais infraestrutura.

**Por que painel próprio ganhou:** O webhook GET retorna HTML completo — sem servidores extras, sem deploy, sem login separado. O usuário acessa uma URL e o painel aparece. Simples e eficiente.

---

## 3. Por que o POST usa JSON e não `multipart/form-data`?

**Decisão:** Todas as ações (incluindo anexos) são enviadas como `application/json`.

**Contexto:** O n8n lida nativamente muito melhor com payloads JSON nos webhooks. O `multipart/form-data` criava problemas de parse nos Code nodes e exigia módulos adicionais.

**Como os anexos funcionam:**
1. O usuário seleciona/cola/arrasta um arquivo no painel
2. O JavaScript usa `FileReader.readAsDataURL()` para converter o arquivo em Base64
3. O Base64 é incluído no array `anexos_base64` do payload JSON
4. O n8n recebe o JSON, e o Code node reconstrói os binários usando `helpers.prepareBinaryData()`

**Trade-off:** Payloads maiores (Base64 aumenta ~33% o tamanho). Para o volume de campanhas corporativas deste projeto (anexos menores que 5MB), isso é completamente aceitável.

---

## 4. Por que a fila é persistida em JSON no disco?

**Decisão:** Usar `queue.json` no volume Docker em vez de Redis, banco de dados ou fila dedicada.

**Contexto:** A escala do projeto (dezenas a centenas de envios por campanha) não justificava a complexidade de uma fila dedicada.

**Alternativas consideradas:**
- **Redis Queue**: Mais robusto, mas exigiria outro container Docker, configuração de conexão, e muito mais complexidade operacional.
- **PostgreSQL**: Mais confiável para concorrência, mas overkill para o volume atual.
- **SQLite**: Solução intermediária, mas o n8n já usa SQLite internamente e adicionar outro seria arriscado.

**Por que JSON ganhou:** Um único arquivo lido e reescrito atomicamente a cada minuto. Para o volume deste projeto, a janela de concorrência é zero (só um Interval Trigger processa a fila). Simples de inspecionar, fazer backup e depurar.

**Limitação conhecida:** Se o volume crescer para milhares de envios simultâneos, migrar para PostgreSQL/Redis é a evolução natural — documentada nas melhorias futuras.

---

## 5. Como funciona o parcelamento?

**Decisão:** Interval Trigger de 1 minuto que verifica `proxima_execucao` no JSON da fila.

**Funcionamento:**
1. Ao enviar uma campanha parcelada, o sistema cria um objeto na fila com `proxima_execucao = agora`
2. O Interval Trigger roda a cada minuto
3. Se `proxima_execucao <= agora`, extrai `lote_quantidade` contatos do array
4. Processa o envio daquele lote
5. Atualiza `proxima_execucao = agora + intervalo` e salva a fila atualizada

**Exemplos de configuração:**
- 50 contatos a cada 15 minutos → campanha de 1000 enviada em ~5 horas
- 10 a cada 1 hora → 240/dia (conservador para provedores SMTP com limites diários)
- Lote `0` → envia todos de uma vez (sem parcelamento)

---

## 6. Como funciona a deduplicação?

**Decisão:** Dois níveis de proteção independentes.

**Nível 1 — Intra-campanha (seleção):**
- Antes de enfileirar, o sistema remove e-mails duplicados da seleção
- Usa `Set` JavaScript para garantir unicidade

**Nível 2 — Global por fingerprint:**
- Um hash FNV-1a é calculado sobre `assunto + "\n" + mensagem`
- Este hash é o `campanha_id`
- `sent_campaigns.json` armazena, por `campanha_id`, todos os e-mails que já receberam aquela mensagem
- Antes de cada envio (imediato ou pela fila), o sistema filtra os contatos que já estão em `sent_campaigns[campanha_id].emails`

> **Nota:** FNV-1a não é um hash criptográfico — é uma função de hash determinística de alta velocidade, adequada para identificação de conteúdo em contexto não-segurança. Para o caso de uso (identificar campanhas idênticas), é perfeitamente apropriado.

---

## 7. Por que o webhook responde imediatamente ao painel?

**Decisão:** O webhook POST responde em menos de 2 segundos, sem esperar o envio de e-mails.

**Contexto:** Enviar 100 e-mails via SMTP pode levar vários minutos. Deixar o usuário aguardando é inaceitável.

**Solução:** O webhook processa a lógica de negócio (validação, enfileiramento, salvamento de config) e responde imediatamente. O envio real acontece na fila pelo Interval Trigger.

**Para envios imediatos (sem parcelamento):** O webhook processa e envia diretamente, mas o n8n retorna a resposta ao cliente assim que os dados estão prontos — o timeout padrão do navegador para fetch é de 30s, suficiente para lotes pequenos.

---

## 8. Como os dados ficam fora do container?

**Decisão:** Volume Docker mapeando `C:\n8n\files` (host) → `/files` (container).

**Consequências:**
- Dados persistem após `docker restart`, `docker rm` e atualizações de imagem
- Backup trivial: copiar a pasta do host
- Inspeção direta dos arquivos JSON sem acessar o container
- Separação clara entre infraestrutura (container) e dados (host)

---

## 9. Como o sistema atende usuários não técnicos?

**Princípios de UX aplicados:**

- **Linguagem natural:** Botões como "Enviar mensagem" em vez de "POST /api/send"
- **Feedback imediato:** Toast de confirmação ou erro após cada ação
- **Confirmação antes de ações irreversíveis:** Checkbox de confirmação antes de disparar
- **Prevenção de erro:** Bloqueio de duplo clique (debounce), validação de e-mail no cliente
- **Auto-seleção de grupos:** Ao filtrar por grupo, os contatos daquele grupo aparecem automaticamente marcados
- **Prévia em tempo real:** O texto da mensagem é renderizado ao lado conforme o usuário digita
- **Status visual:** Indicadores de assinatura ativa, deduplicação, fila pendente

---

## 10. Por que Ctrl+V para colar imagens?

**Decisão:** Interceptar o evento `paste` no dropzone para capturar itens do clipboard como binários.

**Contexto:** Usuários frequentemente tiram prints de tela (Snipping Tool, Print Screen) e querem anexar sem salvar arquivo.

**Implementação:**
```javascript
document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      // Adicionar ao array de anexos, converter Base64
    }
  }
});
```

**Proteção contra duplicidade:** O código rastreia o timestamp do último `paste` e descarta eventos duplicados dentro de 500ms — evitando que o mesmo print apareça duas vezes por eventos de bubble.
