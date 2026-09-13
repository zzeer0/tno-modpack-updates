# Neo Otherworld - checagem de EP duplicado
# Procura o mesmo "type" definido em mais de um arquivo de entity_existence ou
# gear_existence, somando a KubeJS do repo e os jars (repo + instancia).
#  - entity: com duas entradas, qual EP vale e imprevisivel
#  - gear:   o GearHandler aplica TODAS as entradas que batem
# O mesmo arquivo (mesmo namespace/caminho) em duas fontes e override, nao duplicata.
#
# Uso: powershell -ExecutionPolicy Bypass -File C:\tnorepo\tools\check_existence_dupes.ps1
# Sai com codigo 1 se achar duplicata. Rodar antes de todo commit que mexe em EP.
param(
    [string]$Repo = 'C:\tnorepo\1.0.0',
    [string]$Mods = "$env:USERPROFILE\curseforge\minecraft\Instances\Tensura Neo Otherworld (1)\mods"
)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$kinds = @{ entity_existence = 'entity'; gear_existence = 'gear' }
$seen = @{}

function Add-Entry($kind, $json, $id, $source) {
    try { $d = $json | ConvertFrom-Json } catch { Write-Warning "JSON invalido: $source ($id)"; return }
    if (-not $d.type) { Write-Warning "sem type: $source ($id)"; return }
    $key = "$kind|$($d.type)"
    if (-not $seen.ContainsKey($key)) { $seen[$key] = New-Object System.Collections.ArrayList }
    [void]$seen[$key].Add([pscustomobject]@{ id = $id; source = $source })
}

# KubeJS do repo
foreach ($sub in $kinds.Keys) {
    Get-ChildItem (Join-Path $Repo "kubejs\data\*\$sub\*.json") -ErrorAction SilentlyContinue | ForEach-Object {
        $ns = $_.Directory.Parent.Name
        Add-Entry $kinds[$sub] ([IO.File]::ReadAllText($_.FullName)) "$ns/$sub/$($_.Name)" 'kubejs'
    }
}

# Jars: os do repo ganham da versao antiga do mesmo mod na instancia
function Get-ModKey($name) { $name -replace '-\d.*\.jar$', '' -replace '\.jar$', '' }
$jars = @{}
Get-ChildItem (Join-Path $Repo 'mods\*.jar') | ForEach-Object { $jars[(Get-ModKey $_.Name)] = $_ }
if (Test-Path $Mods) {
    Get-ChildItem (Join-Path $Mods '*.jar') | ForEach-Object {
        $k = Get-ModKey $_.Name
        if (-not $jars.ContainsKey($k)) { $jars[$k] = $_ }
    }
}

$rx = '^data/([^/]+)/(entity_existence|gear_existence)/(.+\.json)$'
foreach ($jar in $jars.Values) {
    try { $z = [IO.Compression.ZipFile]::OpenRead($jar.FullName) } catch { Write-Warning "nao abriu: $($jar.Name)"; continue }
    try {
        foreach ($e in $z.Entries) {
            if ($e.FullName -notmatch $rx) { continue }
            $r = New-Object IO.StreamReader($e.Open())
            try { $text = $r.ReadToEnd() } finally { $r.Close() }
            Add-Entry $kinds[$Matches[2]] $text "$($Matches[1])/$($Matches[2])/$($Matches[3])" $jar.Name
        }
    } finally { $z.Dispose() }
}

$dupes = $seen.GetEnumerator() | Where-Object { @($_.Value | Select-Object -ExpandProperty id -Unique).Count -gt 1 } | Sort-Object Name
$total = @($seen.Keys | Where-Object { $_ -like 'entity|*' }).Count
$totalGear = @($seen.Keys | Where-Object { $_ -like 'gear|*' }).Count
"Mobs com EP: $total   Itens com EP: $totalGear   Jars lidos: $($jars.Count)"
if (-not $dupes) { "OK: nenhuma duplicata."; exit 0 }
"DUPLICATAS: $(@($dupes).Count)"
foreach ($d in $dupes) {
    "  $($d.Name)"
    foreach ($s in $d.Value) { "      $($s.source)  ->  $($s.id)" }
}
exit 1
