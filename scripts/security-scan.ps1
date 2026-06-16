# Varredura de seguranca pre-commit - Mala Direta
# Uso: .\scripts\security-scan.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Mala Direta - Security Scan ===" -ForegroundColor Cyan
Write-Host "Raiz: $Root" -ForegroundColor Gray

$patterns = @(
    @{ Name = "IP de rede interna"; Regex = '192\.168\.\d{1,3}\.\d{1,3}' },
    @{ Name = "Dominio corporativo Vesper"; Regex = 'vesper\.ind\.br' },
    @{ Name = "Conta SAP producao"; Regex = 'sap@' },
    @{ Name = "SMTP SkyMail producao"; Regex = 'smtp\.skymail\.net\.br' },
    @{ Name = "Caminho usuario Windows"; Regex = 'C:\\Users\\' },
    @{ Name = "Senha em texto"; Regex = '(?i)(password|senha)\s*[:=]\s*.+' },
    @{ Name = "Token em texto"; Regex = '(?i)(api[_-]?key|bearer|authorization)\s*[:=]\s*.+' }
)

$extensions = @("*.json", "*.js", "*.md", "*.html", "*.css", "*.ps1", "*.yml", "*.yaml", "*.csv", "*.txt", "*.env.example")
$excludeFiles = @("AUDIT_INITIAL.md", "mala-direta-export.json", ".env.screenshots")
$excludeDirs = @("node_modules", ".git", "files", "data", "logs", "credentials", "secrets")

$files = Get-ChildItem -Path $Root -Recurse -File -Include $extensions | Where-Object {
    $rel = $_.FullName.Substring($Root.Length + 1)
    if ($excludeFiles -contains $_.Name) { return $false }
    $skip = $false
    foreach ($dir in $excludeDirs) {
        if ($rel -like "$dir*") { $skip = $true; break }
    }
    -not $skip -and $_.Name -ne "AUDIT_INITIAL.md"
}

$issues = @()
$securityToolFiles = @('sanitize_workflow.js', 'validate-public-workflow.js', 'security-scan.ps1', 'generate-screenshots.js')

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $isSecurityTool = $securityToolFiles -contains $file.Name

    foreach ($pattern in $patterns) {
        if ($isSecurityTool -and ($pattern.Name -match 'SAP|Workflow ID|Senha em texto')) { continue }
        if ($pattern.Name -eq 'Senha em texto' -and $file.Name -eq 'docker-compose.yml') { continue }
        $matches = [regex]::Matches($content, $pattern.Regex)
        if ($matches.Count -gt 0) {
            $relPath = $file.FullName.Substring($Root.Length + 1)
            $sample = $matches[0].Value
            if ($sample.Length -gt 60) { $sample = $sample.Substring(0, 60) + "..." }
            $issues += [PSCustomObject]@{
                File = $relPath
                Pattern = $pattern.Name
                Sample = $sample
                Count = $matches.Count
            }
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Host ""
    Write-Host "Nenhum padrao sensivel encontrado nos arquivos publicos." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Foram encontrados $($issues.Count) problema(s):" -ForegroundColor Red
$issues | Format-Table -AutoSize
Write-Host "Corrija os itens acima antes de fazer commit ou push." -ForegroundColor Yellow
exit 1
