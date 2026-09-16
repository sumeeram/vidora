Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "app-icon.png"
$size = 1024
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(255, 14, 32, 36))

$bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 45, 212, 191))
$fg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 36, 34))
$rect = New-Object System.Drawing.Rectangle 96, 96, 832, 832
$g.FillEllipse($bg, $rect)

$points = @(
    (New-Object System.Drawing.Point 390, 300),
    (New-Object System.Drawing.Point 710, 512),
    (New-Object System.Drawing.Point 390, 724)
)
$g.FillPolygon($fg, $points)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Wrote $out"
