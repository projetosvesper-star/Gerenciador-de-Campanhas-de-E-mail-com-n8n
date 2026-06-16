param(
    [string]$TargetDir = (Join-Path $PSScriptRoot "..\files")
)

$SourceDir = Join-Path $PSScriptRoot "..\demo-data"
$TargetDir = [System.IO.Path]::GetFullPath($TargetDir)

Write-Host "=== SmartMail Automation: Preparando arquivos de demonstracao ===" -ForegroundColor Cyan

if ($TargetDir -match '(?i)\\n8n\\files$' -and $TargetDir -notmatch 'Desktop\\n8n\\files') {
    Write-Host "AVISO: Voce esta apontando para a pasta de producao C:\n8n\files." -ForegroundColor Red
    Write-Host "Use o volume local do projeto: .\files (padrao) ou passe -TargetDir explicitamente." -ForegroundColor Yellow
    $confirm = Read-Host "Continuar mesmo assim? (digite SIM para confirmar)"
    if ($confirm -ne 'SIM') { exit 1 }
}

if (-not (Test-Path $TargetDir)) {
    Write-Host "Criando pasta de destino: $TargetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$FilesMap = @{
    "contacts.xlsx" = "contacts.xlsx"
    "groups.example.json" = "groups.json"
    "message-config.example.json" = "message_config.json"
    "send-config.example.json" = "send_config.json"
    "queue.example.json" = "queue.json"
    "sent-campaigns.example.json" = "sent_campaigns.json"
}

foreach ($item in $FilesMap.GetEnumerator()) {
    $src = Join-Path $SourceDir $item.Name
    $dest = Join-Path $TargetDir $item.Value

    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dest -Force
        Write-Host "Copiado: $($item.Name) -> $($item.Value)" -ForegroundColor Gray
    } else {
        Write-Host "Aviso: arquivo de origem nao encontrado: $src" -ForegroundColor Yellow
        if ($item.Name -eq "contacts.xlsx") {
            Write-Host "Execute: node scripts/generate-contacts-xlsx.js" -ForegroundColor Yellow
        }
    }
}

$SignaturePath = Join-Path $TargetDir "signature.html"
$SignatureHtml = @"
<p>Atenciosamente,</p>
<table style="border:0; font-family:Arial,sans-serif; color:#475569;">
  <tr>
    <td style="padding-right:12px; border-right:2px solid #2563eb;">
      <strong style="color:#2563eb; font-size:18px;">SmartMail Corp</strong><br>
      <span style="font-size:13px; color:#64748b;">Solucoes Inteligentes de Comunicacao</span>
    </td>
    <td style="padding-left:12px; font-size:13px;">
      E-mail: <a href="mailto:sender@example.com" style="color:#2563eb;">sender@example.com</a><br>
      Web: <a href="http://example.com" style="color:#2563eb;">www.example.com</a>
    </td>
  </tr>
</table>
"@
[System.IO.File]::WriteAllText($SignaturePath, $SignatureHtml, [System.Text.Encoding]::UTF8)
Write-Host "Criada assinatura de demonstracao em signature.html" -ForegroundColor Gray

$LogsJsonl = Join-Path $TargetDir "logs.jsonl"
if (-not (Test-Path $LogsJsonl)) {
    New-Item -Path $LogsJsonl -ItemType File | Out-Null
    Write-Host "Inicializado logs.jsonl" -ForegroundColor Gray
}

$LogsCsv = Join-Path $TargetDir "logs.csv"
if (-not (Test-Path $LogsCsv)) {
    [System.IO.File]::WriteAllText($LogsCsv, "Data/Hora,Origem,Empresa,E-mail,Status,Erro`r`n", [System.Text.Encoding]::UTF8)
    Write-Host "Inicializado logs.csv" -ForegroundColor Gray
}

$ContactsAdded = Join-Path $TargetDir "contacts_added.json"
if (-not (Test-Path $ContactsAdded)) {
    [System.IO.File]::WriteAllText($ContactsAdded, "[]", [System.Text.Encoding]::UTF8)
    Write-Host "Inicializado contacts_added.json" -ForegroundColor Gray
}

Write-Host "=== Arquivos de demonstracao prontos em $TargetDir ===" -ForegroundColor Green
