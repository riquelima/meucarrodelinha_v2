
$answers = @(
    "", # URL path
    "", # App name
    "", # Short name
    "com.meucarrosalinas.twa", # App ID
    "", # Display mode
    "", # Orientation
    "", # Status bar color
    "", # Splash screen color
    "", # Icon
    "", # Maskable
    "n", # Monochrome
    "y", # Shortcuts
    "n", # Share
    "n", # Keystore - No (Create new)
    "", # Path
    "meucarro123", # Password
    "android", # Alias
    "meucarro123", # Key pass
    "Meu Carro de Linha", # Name
    "Mobile",
    "Meu Carro de Linha",
    "Salinas",
    "MG",
    "BR"
)

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "bubblewrap.cmd" # Using .cmd for global npm package on Windows
$psi.Arguments = "init --manifest https://meucarrodelinhasalinas.com.br/manifest.json"
$psi.RedirectStandardInput = $true
$psi.UseShellExecute = $false
$psi.WorkingDirectory = "c:\Users\henri\OneDrive\Documentos\Henrique\Projetos Sistemas\Meu carro de linha\meucarrodelinhasalinas_v2\android-app"

$p = [System.Diagnostics.Process]::Start($psi)
if ($null -eq $p) {
    Write-Error "Failed to start bubblewrap"
    exit 1
}

foreach ($a in $answers) {
    Start-Sleep -Milliseconds 1500
    if ($p.HasExited) { break }
    $p.StandardInput.WriteLine($a)
}

$p.WaitForExit(60000) # Wait up to 60 seconds
if (-not $p.HasExited) {
    $p.Kill()
}
exit $p.ExitCode
