// Script para gerar demo-data/contacts.xlsx a partir do CSV de exemplo
// Uso: node scripts/generate-contacts-xlsx.js

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'demo-data', 'contacts.example.csv');
const xlsxPath = path.join(__dirname, '..', 'demo-data', 'contacts.xlsx');

let XLSX;
try {
  XLSX = require('xlsx');
} catch {
  console.error('Instale a dependencia: npm install xlsx');
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8').trim();
const lines = csv.split(/\r?\n/).filter(Boolean);
const headers = lines[0].split(',');
const rows = lines.slice(1).map((line) => {
  const [empresa, email] = line.split(',');
  return { Empresa: empresa, email: email };
});

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows, { header: ['Empresa', 'email'] });
XLSX.utils.book_append_sheet(wb, ws, 'Clientes_Validos');
XLSX.writeFile(wb, xlsxPath);

console.log(`✓ Gerado: ${xlsxPath} (${rows.length} contatos)`);
