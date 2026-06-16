const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'workflow', 'mala-direta.json');

console.log('=== Iniciando Validação de Segurança do Workflow Público ===');

if (!fs.existsSync(workflowPath)) {
  console.error(`Erro: Arquivo do workflow não encontrado em: ${workflowPath}`);
  process.exit(1);
}

let hasErrors = false;

try {
  const fileContent = fs.readFileSync(workflowPath, 'utf8');
  const wf = JSON.parse(fileContent);

  // 1. Validar se o JSON é válido
  console.log('✓ Estrutura JSON válida.');

  // 2. Verificar o status ativo (deve ser false no portfólio)
  if (wf.active === true) {
    console.error('❌ Erro de Segurança: O workflow público está marcado como ativo ("active": true). No repositório, ele deve estar desativado para segurança.');
    hasErrors = true;
  } else {
    console.log('✓ Status do workflow está desativado (seguro para importação).');
  }

  // 3. Procurar por vazamento de credenciais e nomes internos
  const credsScan = fileContent.match(/"credentials":\s*\{[^}]+\}/g);
  if (credsScan) {
    console.error('❌ Erro de Segurança: Foram encontradas definições de credenciais n8n no workflow público:', credsScan);
    hasErrors = true;
  } else {
    console.log('✓ Nenhuma credencial n8n detectada no JSON (limpo).');
  }

  // 4. Varredura por termos confidenciais, IPs locais e e-mails reais via Regex
  const blacklist = [
    { pattern: /192\.168\.\d{1,3}\.\d{1,3}/g, name: 'IP de Rede Interna' },
    { pattern: /[a-zA-Z0-9._%+-]+@vesper\.ind\.br/gi, name: 'E-mail corporativo Vesper' },
    { pattern: /vesper\.ind\.br/gi, name: 'Domínio corporativo Vesper' },
    { pattern: /Vesper Equipamentos/gi, name: 'Nome corporativo Vesper' },
    { pattern: /smtp\.skymail\.net\.br/gi, name: 'SMTP SkyMail Produção' },
    { pattern: /sap@/gi, name: 'Conta de Envio de Produção SAP' },
    { pattern: /"host":\s*"(?!localhost|127\.0\.0\.1|smtp\.example\.com)[^"]+"/g, name: 'Host de Produção customizado' }
  ];

  blacklist.forEach(item => {
    const matches = fileContent.match(item.pattern);
    if (matches) {
      console.error(`❌ Vazamento detectado (${item.name}): Encontrado ${matches.length} ocorrência(s). Exemplo: "${matches[0]}"`);
      hasErrors = true;
    } else {
      console.log(`✓ Nenhum vazamento detectado para: ${item.name}.`);
    }
  });

  // 5. Nós SMTP podem existir, mas não devem trazer credenciais embutidas
  const smtpNodes = wf.nodes.filter(n => n.type === 'n8n-nodes-base.emailSend');
  const smtpWithCreds = smtpNodes.filter(n => n.credentials && Object.keys(n.credentials).length > 0);
  if (smtpWithCreds.length > 0) {
    console.error(`❌ Erro: ${smtpWithCreds.length} nó(s) SMTP com credenciais embutidas no JSON.`);
    hasErrors = true;
  } else if (smtpNodes.length > 0) {
    console.log(`✓ ${smtpNodes.length} nó(s) SMTP presentes sem credenciais no JSON (configure no n8n após importar).`);
  } else {
    console.log('✓ Nenhum nó SMTP nativo no workflow.');
  }

  // 6. Resumo
  if (hasErrors) {
    console.error('\n⚠️ A validação do workflow falhou! Corrija os problemas acima antes de fazer commits.');
    process.exit(1);
  } else {
    console.log('\n✨ Sucesso: O workflow passou na validação de segurança do repositório.');
    process.exit(0);
  }

} catch (err) {
  console.error('Erro ao processar validação:', err);
  process.exit(1);
}
