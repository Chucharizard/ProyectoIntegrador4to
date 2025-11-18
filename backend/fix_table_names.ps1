# Script de PowerShell para reemplazar todas las referencias de tablas
$filePath = "app\routes\usuarios.py"
$content = Get-Content $filePath -Raw

# Reemplazar todas las referencias
$content = $content -replace '\.table\("Usuario"\)', '.table("usuario")'
$content = $content -replace '\.table\("Empleado"\)', '.table("empleado")'
$content = $content -replace '\.table\("Rol"\)', '.table("rol")'

# Guardar el archivo
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Archivo corregido: $filePath"
Write-Host "✅ Todas las tablas ahora están en minúsculas"
