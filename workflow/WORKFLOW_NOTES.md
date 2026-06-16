# Notas do Workflow — SmartMail Automation

Este documento explica a estrutura técnica do workflow n8n para quem quiser entender, adaptar ou contribuir.

---

## Estrutura do Workflow

O workflow é composto por **três fluxos independentes** que se comunicam através de arquivos JSON persistentes:

```
Fluxo 1: Painel Web (GET webhook)
Fluxo 2: Ações do Painel (POST webhook)  
Fluxo 3: Fila Parcelada (Interval Trigger)
```

---

## Fluxo 1 — Painel Web

**Trigger:** `Webhook GET /webhook/smartmail`

```
Webhook GET
    ↓
Ler contacts.xlsx     ← n8n-nodes-base.spreadsheetFile
    ↓
Ler JSONs (Set)       ← contacts_added, groups, config, queue, sent_campaigns, logs
    ↓
Gerar HTML (Code)     ← Todo o HTML/CSS/JS do painel em uma string
    ↓
Respond to Webhook    ← Content-Type: text/html; charset=utf-8
```

**Nó crítico — "Gerar HTML":**
Este Code node contém o maior trecho de código do workflow. Ele:
1. Acessa todos os dados via `$json` (contatos, grupos, config, etc.)
2. Serializa todos os dados em `JSON.stringify()` e injeta em `window.__MDV_DATA__`
3. Gera a string HTML completa com CSS inline e JS embutido
4. Retorna `{ html: '<html>...</html>' }` para o nó Respond to Webhook

---

## Fluxo 2 — Ações do Painel

**Trigger:** `Webhook POST /webhook/smartmail-acao`

**Payload esperado:** `Content-Type: application/json` com o campo `action` obrigatório.

```
Webhook POST
    ↓
Switch por action
    ├── "salvar"                → Salvar mensagem
    ├── "teste_unico"          → Enviar teste (imediato)
    ├── "enviar_destinatarios" → Preparar e enfileirar/enviar
    ├── "adicionar_contato"    → Append em contacts_added.json
    ├── "importar_contatos"    → Parse e append em massa
    ├── "salvar_grupo_inteligente" → Gravar em groups.json
    ├── "excluir_grupo_inteligente" → Remover de groups.json
    └── "salvar_configuracao"  → Gravar em send_config.json
```

### Rota: `salvar`

Grava `message_config.json` com:
- `assunto`: string
- `mensagem`: string
- `anexos_base64`: array de `{ nome, tipo, base64 }`

### Rota: `teste_unico`

Chama o subroute de envio diretamente com os dados da mensagem atual + e-mail de destino do payload. Não enfileira.

### Rota: `enviar_destinatarios`

1. Lê `send_config.json` para verificar se parcelamento está ativo
2. Gera o `campanha_id` (hash FNV-1a sobre assunto+mensagem)
3. Filtra contatos que já receberam esta campanha (via `sent_campaigns.json`)
4. **Se parcelamento ativo:** Append na `queue.json` com `proxima_execucao = now`
5. **Se parcelamento inativo:** Envia diretamente (lote único)

### Rota: `adicionar_contato`

```json
{
  "action": "adicionar_contato",
  "empresa": "Nome da Empresa",
  "email": "contato@empresa.com.br"
}
```

Append atômico em `contacts_added.json`. Validação de e-mail já ocorre no frontend.

### Rota: `salvar_grupo_inteligente`

```json
{
  "action": "salvar_grupo_inteligente",
  "nome": "Nome do Grupo",
  "emails": ["a@b.com", "c@d.com"]
}
```

Merge em `groups.json` (substitui grupo existente com mesmo nome, cria novo se não existir).

---

## Fluxo 3 — Fila Parcelada

**Trigger:** `Interval Trigger — 1 minuto`

```
Interval Trigger (1 min)
    ↓
Ler queue.json
    ↓
Filtrar campanhas onde proxima_execucao <= now
    ↓
Para cada campanha:
    ├── Extrair lote (slice de N contatos)
    ├── Para cada contato do lote:
    │     ├── Verificar deduplicação
    │     ├── Simular/Enviar e-mail
    │     └── Gravar log
    ├── Atualizar proxima_execucao
    └── Se contatos esgotados: remover da fila
    ↓
Salvar queue.json atualizado
```

---

## Modo Demo vs. Modo Produção

### Nós de simulação (modo demo)

Os nós de envio nesta versão de portfólio são Code nodes que **simulam** o envio:

```javascript
// Simulação — substitua por nó emailSend para produção
return [{
  json: {
    ok: true,
    simulado: true,
    destinatario: $json.email,
    mensagem: 'E-mail simulado com sucesso (modo demo)'
  }
}];
```

### Para produção — substituir por nó nativo

Substitua os nós "Simular Envio Com Anexo" e "Simular Envio Sem Anexo" por nós `n8n-nodes-base.emailSend`:

**Configuração do nó emailSend (sem anexo):**
```
fromEmail: {{ $env.SMTP_FROM_EMAIL }}
toEmail: {{ $json.email }}
subject: {{ $json.assunto }}
text: {{ $json.mensagem }}
credentials: [selecionar credencial SMTP]
```

**Configuração do nó emailSend (com anexo):**
```
fromEmail: {{ $env.SMTP_FROM_EMAIL }}
toEmail: {{ $json.email }}
subject: {{ $json.assunto }}
text: {{ $json.mensagem }}
attachments: {{ $json.attachments }}   ← array de binárias preparadas com helpers.prepareBinaryData()
credentials: [selecionar credencial SMTP]
```

---

## Variáveis de Ambiente Utilizadas

| Variável | Uso | Exemplo |
|---|---|---|
| `SMTP_FROM_EMAIL` | E-mail do remetente | `noreply@suaempresa.com.br` |
| `SMTP_FROM_NAME` | Nome do remetente | `SmartMail Automation` |
| `N8N_HOST` | Host do n8n | `localhost` |
| `N8N_PORT` | Porta do n8n | `5678` |
| `N8N_BASIC_AUTH_ACTIVE` | Ativar autenticação | `true` |
| `N8N_BASIC_AUTH_USER` | Usuário admin | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Senha admin | `(segura)` |

Configure via `.env` (copie de `.env.example`) e passe ao container Docker com `--env-file .env`.

---

## Estrutura dos Arquivos JSON

### `queue.json`
```json
[
  {
    "campanha_id": "abc123",
    "assunto": "Comunicado Importante",
    "mensagem": "Texto da mensagem...",
    "assinatura_html": "<p>...</p>",
    "contatos": [
      { "empresa": "Alpha Ltda", "email": "compras@alpha.example" }
    ],
    "lote_quantidade": 50,
    "intervalo_valor": 15,
    "intervalo_unidade": "minutos",
    "proxima_execucao": "2024-01-15T14:30:00.000Z",
    "anexos_base64": []
  }
]
```

### `sent_campaigns.json`
```json
{
  "abc123": {
    "assunto": "Comunicado Importante",
    "emails": ["compras@alpha.example", "beta@example.com"],
    "total": 2,
    "ultima_atualizacao": "2024-01-15T14:32:00.000Z"
  }
}
```

### `logs.jsonl`
```
{"data":"2024-01-15T14:32:01.000Z","empresa":"Alpha Ltda","email":"compras@alpha.example","assunto":"Comunicado Importante","status":"enviado"}
{"data":"2024-01-15T14:32:02.000Z","empresa":"Beta Corp","email":"beta@example.com","assunto":"Comunicado Importante","status":"enviado"}
```

---

## Hash FNV-1a — Implementação

```javascript
function fnv1a(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16);
}

const campanha_id = fnv1a(assunto + '\n' + mensagem);
```

Este hash é determinístico: a mesma mensagem sempre gera o mesmo ID. Qualquer alteração no texto produz um ID completamente diferente.

---

## Limitações Conhecidas

1. **Sem autenticação no painel**: A URL do webhook é pública se o n8n estiver exposto.
2. **Concorrência da fila**: Se dois Interval Triggers rodassem simultaneamente (impossível na configuração padrão, mas teórico), poderia haver duplicação. Em produção com alto volume, usar banco de dados é recomendado.
3. **Sem paginação no log**: O painel exibe apenas os últimos 100 logs.
4. **Sem retry automático**: E-mails que falham não são reenfileirados. O operador precisa reenviar manualmente para os contatos com erro.
5. **Tamanho máximo de payload**: O n8n tem limite de 16MB por payload por padrão. Múltiplos anexos grandes podem exceder este limite.
