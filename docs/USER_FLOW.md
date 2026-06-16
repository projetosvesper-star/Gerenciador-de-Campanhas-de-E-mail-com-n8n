# Fluxo do Usuário — SmartMail Automation

Este documento descreve a experiência do usuário ao utilizar o SmartMail Automation, escrito na perspectiva de uma pessoa não técnica.

---

## Visão geral

O SmartMail Automation é acessado por uma URL simples no navegador. Não precisa instalar nada, não precisa fazer login no n8n e não precisa entender como funciona por dentro. A tela principal mostra tudo que é necessário de forma clara e organizada.

---

## Passo 1 — Editar a mensagem

**O que o usuário faz:**
1. Clica no botão **"Editar mensagem"**
2. Uma janela se abre com dois campos: **Assunto** e **Texto da mensagem**
3. À medida que digita, uma prévia aparece ao lado mostrando como o e-mail vai ficar
4. A assinatura da empresa é exibida abaixo da prévia — ela é adicionada automaticamente ao final de cada e-mail
5. Se quiser incluir arquivos padrão (que sempre acompanham a mensagem), cola uma imagem com **Ctrl+V**, arrasta um arquivo ou clica em "Escolher arquivo"
6. Clica em **"Salvar mensagem"**

**Feedback recebido:** Uma confirmação aparece na tela indicando que a mensagem foi salva.

---

## Passo 2 — Enviar um teste

**O que o usuário faz:**
1. Clica no botão **"Fazer teste"**
2. Informa um nome e o e-mail onde quer receber o teste (geralmente o próprio e-mail)
3. Opcionalmente adiciona anexos extras para este teste específico
4. Clica em **"Enviar teste agora"**

**O que acontece:** Um e-mail de teste chega na caixa do usuário, exatamente como os destinatários irão receber — com o mesmo texto, assinatura e anexos. Isso permite revisar formatação, links e aparência antes do envio real.

---

## Passo 3 — Escolher quem vai receber

**O que o usuário faz:**
1. Clica no botão **"Enviar mensagem"**
2. Uma lista de todos os contatos disponíveis aparece na tela
3. O usuário pode:
   - **Filtrar por grupo**: Selecionar um grupo no menu e os contatos daquele grupo aparecem marcados automaticamente
   - **Buscar**: Digitar o nome da empresa ou e-mail para filtrar a lista
   - **Marcar todos visíveis**: Marcar de uma vez todos os contatos que aparecem na busca/filtro atual
   - **Selecionar individualmente**: Marcar ou desmarcar contatos específicos
4. O sistema mostra um resumo: "X contatos marcados"

---

## Passo 4 — Revisar e confirmar

**O que o usuário vê antes de enviar:**
- Quantidade de contatos selecionados
- Checkbox de confirmação ("Revisei a mensagem e os destinatários")
- Informação sobre proteção anti-reenvio ativa ("X pessoas já receberam esta campanha e serão ignoradas")

**O que o usuário faz:**
1. Confere o resumo
2. Marca o checkbox de confirmação
3. Clica em **"Enviar mensagem"**

---

## Passo 5 — Acompanhar o envio

**Se o envio for imediato (sem parcelamento):**
- Uma confirmação aparece com o resultado (enviados e erros)
- O histórico na tela principal é atualizado

**Se o envio for parcelado:**
- Uma confirmação indica que a campanha foi enfileirada
- A tela principal mostra a fila pendente com a quantidade de contatos e o horário do próximo lote
- O envio acontece em background, lote por lote, nos horários configurados

---

## Acompanhar o histórico

A tela principal sempre exibe os últimos envios com:
- Data e hora
- Empresa destinatária
- E-mail destinatário
- Status: **enviado** ✅ ou **erro** ❌

---

## Gerenciar Contatos

O usuário pode, a qualquer momento:
- **Adicionar um contato**: Clicar em "Gerenciar contatos" → "Adicionar um contato" e preencher nome e e-mail
- **Importar vários**: Colar uma lista copiada do Excel, ou carregar um arquivo CSV/TXT/VCF
- **Criar grupos**: Agrupar contatos por categoria (ex: "fornecedores", "clientes premium") para facilitar seleções futuras
- **Gerenciar grupos**: Abrir um grupo e adicionar ou remover contatos; o sistema já mostra os membros atuais marcados

---

## Configurar o ritmo de envio

Para campanhas com muitos contatos ou para respeitar limites do servidor de e-mail:
1. Clicar em **"Configurar"**
2. Ativar o parcelamento
3. Definir a quantidade por lote (ex: 50)
4. Definir o intervalo (ex: 15 minutos, ou 12 horas)
5. Salvar

O sistema explica em texto simples como o envio vai funcionar: "Vai enviar no máximo **50** contatos por lote. Próximo lote a cada **15 minutos**."

---

## O que o usuário nunca precisa fazer

- Acessar o n8n ou qualquer interface técnica
- Editar JSON, YAML ou qualquer arquivo de configuração
- Copiar e colar e-mails um a um
- Verificar manualmente quem já recebeu um e-mail
- Instalar softwares ou extensões no computador
