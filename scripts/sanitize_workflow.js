#!/usr/bin/env node
/**
 * Sanitiza arquivos do repositório público substituindo padrões sensíveis.
 * Uso: node scripts/sanitize_workflow.js [caminho]
 * Padrão: workflow/smartmail-automation-demo.json
 */
const fs = require('fs');
const path = require('path');

const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'workflow', 'mala-direta.json');

const replacements = [
  [/192\.168\.\d{1,3}\.\d{1,3}/g, 'localhost'],
  [/vesper\.ind\.br/gi, 'example.com'],
  [/smtp\.skymail\.net\.br/gi, 'smtp.example.com'],
  [/sap@vesper\.ind\.br/gi, 'sender@example.com'],
  [/sap@/gi, 'sender@'],
  [/Teste Vesper/g, 'Teste'],
  [/Vesper Equipamentos/gi, 'Empresa'],
  [/vesper@example\.com/gi, 'sender@example.com'],
  [/www\\.vesper\\.ind\\.br/gi, 'www.example.com'],
];

function sanitizeContent(content, filePath) {
  let result = content;
  let changed = false;
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      changed = true;
    }
  }
  return { result, changed };
}

function stripWorkflowMetadata(workflow) {
  let changed = false;
  if (workflow.shared) {
    delete workflow.shared;
    changed = true;
  }
  if (workflow.sourceWorkflowId) {
    workflow.sourceWorkflowId = null;
    changed = true;
  }
  return changed;
}

if (!fs.existsSync(target)) {
  console.error(`Arquivo não encontrado: ${target}`);
  process.exit(1);
}

const original = fs.readFileSync(target, 'utf8');
const { result: sanitized, changed: textChanged } = sanitizeContent(original, target);

let finalContent = sanitized;
let metaChanged = false;

if (target.endsWith('.json')) {
  try {
    const workflow = JSON.parse(sanitized);
    metaChanged = stripWorkflowMetadata(workflow);
    if (metaChanged || textChanged) {
      finalContent = JSON.stringify(workflow, null, 2) + '\n';
    }
  } catch {
    // mantém texto sanitizado se não for JSON válido
  }
}

if (!textChanged && !metaChanged) {
  console.log(`✓ Nenhuma alteração necessária em: ${path.relative(process.cwd(), target)}`);
  process.exit(0);
}

fs.writeFileSync(target, finalContent, 'utf8');
console.log(`✓ Sanitizado: ${path.relative(process.cwd(), target)}`);
