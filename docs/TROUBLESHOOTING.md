# Troubleshooting — SmartMail Automation

Problemas comuns e suas soluções.

---

## Painel não abre (`404` ou sem resposta)

**Sintoma:** Acessar `http://localhost:5678/webhook/smartmail` retorna 404.

**Causas e soluções:**

1. **Workflow não está ativo**
   - Abra o n8n (`http://localhost:5678`), vá em Workflows, encontre "SmartMail Automation Demo" e ative o toggle no canto superior direito.

2. **Container n8n não está rodando**
   ```bash
   docker ps | grep n8n
   docker start n8n-vesper  # ou o nome do seu container
   ```

3. **Porta diferente**
   - Verifique a porta com `docker ps` e ajuste a URL.

4. **Webhook registrado em nome diferente**
   - Abra o n8n e verifique o caminho do webhook no nó "Receber do Painel (GET)".

---

## Planilha de contatos não carrega

**Sintoma:** Lista de destinatários aparece vazia mesmo com a planilha preenchida.

**Causas e soluções:**

1. **Arquivo não está no volume Docker**
   - Execute `.\scripts\prepare-demo-files.ps1` para copiar os arquivos de demo.
   - Verifique se `C:\n8n\files\contacts.xlsx` existe no host.

2. **Arquivo com nome diferente**
   - O workflow espera o nome exato `contacts.xlsx`. Não renomeie.

3. **Planilha vazia ou sem cabeçalho**
   - O arquivo deve ter pelo menos as colunas `Empresa` e `Email` na primeira linha.

---

## Envio real não funciona (modo demo)

**Sintoma:** E-mails não chegam na caixa do destinatário.

**Explicação:** Esta versão de portfólio está em **modo de simulação**. Os nós de envio retornam sucesso sem conectar a um servidor SMTP.

**Para habilitar envio real:**
1. Substitua os nós "Simular Envio" por nós nativos `emailSend` do n8n
2. Configure as credenciais SMTP no n8n (Settings → Credentials → New → SMTP)
3. Preencha o `.env` com os dados reais do servidor de e-mail
4. Consulte [WORKFLOW_NOTES.md](../workflow/WORKFLOW_NOTES.md) para a estrutura correta dos nós

---

## Contatos adicionados somem após reiniciar o container

**Sintoma:** Contatos adicionados via painel desaparecem.

**Causa:** Os arquivos não estão sendo salvos no volume externo.

**Solução:**
1. Verifique se o volume Docker está mapeado corretamente:
   ```bash
   docker inspect n8n-vesper | findstr "Mounts" /A:10
   ```
2. Confirme que `C:\n8n\files` existe e tem permissão de escrita.
3. Recrie o container com o mapeamento correto:
   ```bash
   docker run -d --name n8n-vesper -p 5678:5678 -v C:/n8n/files:/files docker.n8n.io/n8nio/n8n:stable
   ```

---

## Erro ao importar o workflow

**Sintoma:** `n8n import:workflow` falha com erro JSON.

**Causas e soluções:**

1. **Arquivo corrompido ou inválido**
   - Execute: `node -e "JSON.parse(require('fs').readFileSync('workflow/smartmail-automation-demo.json','utf8'))" && echo "JSON valido"`
   - Se falhar, re-exporte o workflow pelo painel do n8n.

2. **Versão incompatível do n8n**
   - O workflow foi criado na versão `1.x` do n8n. Versões muito antigas (`<0.200`) podem ter problemas de importação.

3. **Flag incorreta**
   - Use `--input` (não `--file`): `n8n import:workflow --input /files/smartmail-automation-demo.json`

---

## Fila não é processada / envio parcelado trava

**Sintoma:** Contatos enfileirados não são enviados mesmo após o intervalo configurado.

**Causas e soluções:**

1. **Interval Trigger não ativo**
   - Verifique se o workflow está ativo no n8n (toggle no canto superior direito).

2. **`proxima_execucao` com timestamp futuro incorreto**
   - Abra `C:\n8n\files\queue.json` e verifique o campo `proxima_execucao`. Se estiver muito no futuro, edite para um timestamp passado e salve.

3. **`queue.json` com JSON inválido**
   - Execute: `node -e "JSON.parse(require('fs').readFileSync('C:/n8n/files/queue.json','utf8'))" && echo "OK"`
   - Se inválido, limpe o arquivo: `echo [] > C:\n8n\files\queue.json`

---

## Deduplicação muito agressiva / e-mail não enviado sem motivo

**Sintoma:** Contato não recebe o e-mail mesmo sendo selecionado.

**Causa:** O `campanha_id` (fingerprint da mensagem) está registrado em `sent_campaigns.json` para aquele e-mail.

**Soluções:**

1. **Limpar o histórico daquela campanha:**
   - Abra `C:\n8n\files\sent_campaigns.json`
   - Encontre o `campanha_id` correspondente e remova o e-mail do array `emails`
   - Salve o arquivo

2. **Alterar o conteúdo da mensagem:**
   - Qualquer mudança no assunto ou no texto gera um novo `campanha_id`
   - O contato será considerado "novo" para a campanha modificada

3. **Resetar completamente o histórico:**
   ```bash
   echo {} > C:\n8n\files\sent_campaigns.json
   ```
   > ⚠️ Isso remove a proteção anti-reenvio para todas as campanhas.

---

## Painel lento ou sem resposta ao clicar nos botões

**Sintoma:** Ações como "Salvar mensagem" ou "Enviar" não respondem.

**Causas e soluções:**

1. **Workflow não está ativo** (mais comum)
   - Ative o workflow no n8n.

2. **Webhook POST não está registrado**
   - Abra o workflow no n8n e verifique se o nó de webhook para ações tem o caminho `smartmail-acao`.

3. **Erro de CORS** (raro, apenas se acessar de outro host)
   - O n8n por padrão permite requisições do mesmo origin. Se acessar de IP diferente, configure `N8N_ALLOWED_CORS_DOMAINS` no `.env`.

---

## Arquivo de log cresce muito

**Sintoma:** `logs.jsonl` está com vários MB.

**Solução:**
- Rotacione manualmente:
  ```powershell
  $date = Get-Date -Format "yyyy-MM-dd"
  Rename-Item C:\n8n\files\logs.jsonl "logs_$date.jsonl"
  New-Item -ItemType File C:\n8n\files\logs.jsonl
  ```
- Ou implemente rotação automática no workflow (melhoria futura documentada).
