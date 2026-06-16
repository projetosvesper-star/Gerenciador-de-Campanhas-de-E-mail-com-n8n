# Política de Segurança — SmartMail Automation

## Escopo

Este repositório é uma **versão de portfólio sanitizada** de um projeto real de automação de campanhas de e-mail. Nenhum dado de produção, credencial ou contato real deve ser publicado aqui.

## O que nunca deve ser commitado

- Arquivos `.env` com senhas ou tokens reais
- Planilhas, CSVs ou JSONL com contatos reais
- Logs de envio de produção
- Workflows exportados com credenciais n8n vinculadas
- IPs internos, domínios corporativos reais ou caminhos pessoais
- Relatórios internos de auditoria (`AUDIT_INITIAL.md`)

Consulte [`.gitignore`](.gitignore) e [`.env.example`](.env.example).

## Modo demonstração

O workflow público (`workflow/smartmail-automation-demo.json`) usa **simulação de envio** em vez de SMTP real. Nós `emailSend` nativos não estão presentes no JSON público.

## Verificações antes de publicar

```powershell
.\scripts\security-scan.ps1
node scripts\validate-public-workflow.js
```

## Reportar vulnerabilidades

Se encontrar dados sensíveis neste repositório:

1. **Não abra issue pública** com o conteúdo sensível
2. Remova ou anonimize o dado localmente
3. Entre em contato pelo canal privado do mantenedor do repositório

## Documentação complementar

- [docs/PRIVACY_AND_SECURITY.md](docs/PRIVACY_AND_SECURITY.md) — privacidade, LGPD e boas práticas para produção
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — problemas comuns

## Responsabilidade

Este projeto é referência técnica e portfólio. Quem adaptar para produção é responsável por credenciais, consentimento de contatos, SPF/DKIM/DMARC e conformidade legal.
