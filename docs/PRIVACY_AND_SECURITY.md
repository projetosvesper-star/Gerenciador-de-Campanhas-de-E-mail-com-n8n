# Privacidade e Segurança — SmartMail Automation

---

## Escopo deste documento

Este documento descreve as medidas de privacidade e segurança adotadas tanto no **projeto de portfólio** (este repositório) quanto as **boas práticas recomendadas** para quem for usar a automação em produção.

---

## Este repositório (portfólio público)

### Dados fictícios

Todos os dados presentes neste repositório são **completamente fictícios e gerados especificamente para demonstração**:

| Tipo de dado | Exemplo usado neste repo | Real? |
|---|---|---|
| Empresa | Alpha Ltda, Beta Corp, Gama S.A. | ❌ Fictício |
| E-mail | `compras@alpha.example`, `beta@example.com` | ❌ Fictício |
| Nome | João Silva, Maria Santos | ❌ Fictício |
| IP / Servidor | `192.168.x.x`, `smtp.example.com` | ❌ Removido |
| Credenciais | (não presentes) | ❌ Removidas |
| Domínio corporativo | (não presente) | ❌ Removido |

### Processo de sanitização

Antes de publicar, o workflow original passou por um processo automatizado de sanitização:

1. **Script `scripts/sanitize_workflow.js`**: Remove ou substitui IPs, domínios, endereços de e-mail, caminhos de arquivo e credenciais do JSON exportado do n8n.
2. **Script `scripts/validate-public-workflow.js`**: Valida que o JSON final não contém nenhum padrão sensível antes do push.
3. **`.gitignore`**: Bloqueia arquivos que nunca devem ser versionados.

### Arquivos bloqueados pelo `.gitignore`

```
.env
database.sqlite
*.sqlite
logs.jsonl
logs.csv
contacts.xlsx
sent_campaigns.json
queue.json
contacts_added.json
message_config.json
signature.html
```

---

## Para uso em produção (boas práticas)

### Credenciais

- **Nunca coloque credenciais diretamente no workflow do n8n.** Use o sistema de Credentials do n8n (Settings → Credentials) ou variáveis de ambiente.
- Crie um arquivo `.env` baseado no `.env.example` e **nunca versione o `.env`**.
- Se usar um servidor SMTP corporativo, prefira autenticação por **OAuth2** em vez de usuário/senha.

### Isolamento do servidor

- Não exponha o n8n diretamente à internet sem autenticação.
- Use um **reverse proxy** (Nginx, Traefik, Caddy) com HTTPS e certificado TLS.
- Configure `N8N_BASIC_AUTH_ACTIVE=true` ou use o sistema de autenticação nativo do n8n se o painel precisar de proteção.

### Proteção do painel web

- O webhook GET que serve o painel **não tem autenticação nativa nesta versão de demonstração**.
- Em produção, adicione proteção via:
  - IP allowlist no firewall ou reverse proxy
  - Header de autenticação no webhook (`Webhook Header Auth`)
  - Basic Auth configurado no n8n

### Dados de contatos (LGPD / GDPR)

- Todos os e-mails armazenados devem ter consentimento registrado conforme a LGPD (Lei 13.709/2018) e, se aplicável, o GDPR.
- O sistema não coleta consentimento automaticamente — esta responsabilidade é do processo de CRM upstream.
- Dados de contatos ficam em `contacts.xlsx` e `contacts_added.json` — mantenha esses arquivos com permissões restritas no servidor.

### Logs de envio

- O arquivo `logs.jsonl` contém nomes de empresas e e-mails dos destinatários. Trate-o com as mesmas políticas de proteção de dados que os arquivos de contatos.
- Implemente retenção de dados: logs com mais de 90 dias devem ser arquivados ou anonimizados.

### SPF, DKIM e DMARC

Para garantir entregabilidade e evitar que os e-mails caiam em spam:

| Registro | O que faz | Onde configurar |
|---|---|---|
| **SPF** | Define quais servidores podem enviar e-mail pelo seu domínio | DNS do domínio (`TXT _spf`) |
| **DKIM** | Assina digitalmente cada e-mail para verificar autenticidade | DNS + configuração no servidor SMTP |
| **DMARC** | Define política para e-mails que falham SPF/DKIM | DNS do domínio (`TXT _dmarc`) |

Esses registros são configurados no **servidor de e-mail / provedor de DNS** — fora do escopo do n8n e desta automação.

### Limite de taxa (rate limiting)

- Servidores SMTP corporativos geralmente têm limites de envio por hora ou por dia.
- Use a funcionalidade de **parcelamento** do SmartMail para respeitar esses limites.
- Servidores de terceiros (Office 365, Google Workspace) têm limites documentados — consulte o suporte antes de campanhas grandes.

### Manutenção e atualizações

- Mantenha o n8n atualizado. Vulnerabilidades de segurança são corrigidas regularmente — consulte os [changelogs](https://github.com/n8n-io/n8n/releases).
- Monitore os logs de execução do n8n para detectar execuções com erro ou comportamento inesperado.

---

## Responsabilidade de uso

Este projeto é disponibilizado como portfólio e referência técnica. O autor não se responsabiliza por:

- Uso indevido da automação para envio de spam ou comunicações não solicitadas
- Violações de LGPD, GDPR ou outras legislações de proteção de dados resultantes do uso em produção
- Danos causados por configuração incorreta do servidor de e-mail

Cada organização é responsável por adaptar, auditar e usar esta automação em conformidade com suas próprias políticas internas e obrigações legais.
