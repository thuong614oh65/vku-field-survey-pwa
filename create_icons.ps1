Add-Type -AssemblyName System.Drawing

function Create-VKUIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # 1. Background Gradient (Deep Ocean to Royal Navy)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $c1 = [System.Drawing.ColorTranslator]::FromHtml('#0284c7')
    $c2 = [System.Drawing.ColorTranslator]::FromHtml('#0f172a')
    $brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    
    # Rounded Rect Background (Squircle)
    $radius = [float]($size * 0.22)
    $pathBg = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathBg.AddArc([float]0, [float]0, [float]($radius * 2), [float]($radius * 2), [float]180, [float]90)
    $pathBg.AddArc([float]($size - $radius * 2), [float]0, [float]($radius * 2), [float]($radius * 2), [float]270, [float]90)
    $pathBg.AddArc([float]($size - $radius * 2), [float]($size - $radius * 2), [float]($radius * 2), [float]($radius * 2), [float]0, [float]90)
    $pathBg.AddArc([float]0, [float]($size - $radius * 2), [float]($radius * 2), [float]($radius * 2), [float]90, [float]90)
    $pathBg.CloseFigure()
    
    $g.FillPath($brushBg, $pathBg)

    # 2. Inner border glow
    $penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), [float]($size * 0.02))
    $g.DrawPath($penBorder, $pathBg)

    # 3. Clipboard Board (White Card)
    $cbW = [float]($size * 0.62)
    $cbH = [float]($size * 0.62)
    $cbX = [float](($size - $cbW) / 2)
    $cbY = [float]($size * 0.16)
    $cbRadius = [float]($size * 0.07)

    $pathCb = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathCb.AddArc($cbX, $cbY, [float]($cbRadius * 2), [float]($cbRadius * 2), [float]180, [float]90)
    $pathCb.AddArc([float]($cbX + $cbW - $cbRadius * 2), $cbY, [float]($cbRadius * 2), [float]($cbRadius * 2), [float]270, [float]90)
    $pathCb.AddArc([float]($cbX + $cbW - $cbRadius * 2), [float]($cbY + $cbH - $cbRadius * 2), [float]($cbRadius * 2), [float]($cbRadius * 2), [float]0, [float]90)
    $pathCb.AddArc($cbX, [float]($cbY + $cbH - $cbRadius * 2), [float]($cbRadius * 2), [float]($cbRadius * 2), [float]90, [float]90)
    $pathCb.CloseFigure()

    # Shadow
    $brushShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 0, 0, 0))
    $g.TranslateTransform(0, [float]($size * 0.025))
    $g.FillPath($brushShadow, $pathCb)
    $g.ResetTransform()

    # White Board
    $brushCb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPath($brushCb, $pathCb)

    # 4. Metallic Clip on top
    $clipW = [float]($cbW * 0.44)
    $clipH = [float]($size * 0.08)
    $clipX = [float](($size - $clipW) / 2)
    $clipY = [float]($cbY - ($clipH * 0.4))
    $clipRadius = [float]($size * 0.03)

    $pathClip = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathClip.AddArc($clipX, $clipY, [float]($clipRadius * 2), [float]($clipRadius * 2), [float]180, [float]90)
    $pathClip.AddArc([float]($clipX + $clipW - $clipRadius * 2), $clipY, [float]($clipRadius * 2), [float]($clipRadius * 2), [float]270, [float]90)
    $pathClip.AddArc([float]($clipX + $clipW - $clipRadius * 2), [float]($clipY + $clipH - $clipRadius * 2), [float]($clipRadius * 2), [float]($clipRadius * 2), [float]0, [float]90)
    $pathClip.AddArc($clipX, [float]($clipY + $clipH - $clipRadius * 2), [float]($clipRadius * 2), [float]($clipRadius * 2), [float]90, [float]90)
    $pathClip.CloseFigure()

    $brushClip = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0284c7'))
    $g.FillPath($brushClip, $pathClip)
    
    # Golden accent bar on clip
    $brushGold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f59e0b'))
    $ringW = [float]($clipW * 0.4)
    $ringH = [float]($clipH * 0.25)
    $ringX = [float](($size - $ringW) / 2)
    $ringY = [float]($clipY + ($clipH * 0.3))
    $g.FillRectangle($brushGold, $ringX, $ringY, $ringW, $ringH)

    # 5. Survey Checklist Items (3 colored check items)
    $lineX = [float]($cbX + ($cbW * 0.14))
    $lineW = [float]($cbW * 0.48)
    $lineH = [float]($size * 0.035)
    $checkSize = [float]($size * 0.052)

    # Item 1: Emerald Green Verified
    $b1Y = [float]($cbY + ($cbH * 0.26))
    $brushCheck1 = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#10b981'))
    $g.FillEllipse($brushCheck1, $lineX, [float]($b1Y - ($size * 0.008)), $checkSize, $checkSize)
    $brushBar1 = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0284c7'))
    $g.FillRectangle($brushBar1, [float]($lineX + $checkSize + ($size * 0.03)), $b1Y, [float]($lineW * 0.95), $lineH)

    # Item 2: Sky Blue
    $b2Y = [float]($b1Y + ($size * 0.10))
    $brushCheck2 = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0ea5e9'))
    $g.FillEllipse($brushCheck2, $lineX, [float]($b2Y - ($size * 0.008)), $checkSize, $checkSize)
    $brushBar2 = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#64748b'))
    $g.FillRectangle($brushBar2, [float]($lineX + $checkSize + ($size * 0.03)), $b2Y, [float]($lineW * 0.75), $lineH)

    # Item 3: Amber Gold
    $b3Y = [float]($b2Y + ($size * 0.10))
    $brushCheck3 = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f59e0b'))
    $g.FillEllipse($brushCheck3, $lineX, [float]($b3Y - ($size * 0.008)), $checkSize, $checkSize)
    $brushBar3 = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#10b981'))
    $g.FillRectangle($brushBar3, [float]($lineX + $checkSize + ($size * 0.03)), $b3Y, [float]($lineW * 0.6), $lineH)

    # 6. VKU Brand Title
    $fontVku = New-Object System.Drawing.Font('Arial', [float]($size * 0.088), [System.Drawing.FontStyle]::Bold)
    $brushVku = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0369a1'))
    $strFormat = New-Object System.Drawing.StringFormat
    $strFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString('VKU', $fontVku, $brushVku, [float]($size / 2), [float]($cbY + ($cbH * 0.68)), $strFormat)

    # 7. Subtitle 'FIELD SURVEY' at bottom banner
    $fontSub = New-Object System.Drawing.Font('Arial', [float]($size * 0.052), [System.Drawing.FontStyle]::Bold)
    $brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString('FIELD SURVEY', $fontSub, $brushSub, [float]($size / 2), [float]($size * 0.86), $strFormat)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Success: $outPath ($size x $size)"
}

Create-VKUIcon 512 'icons/icon-512.png'
Create-VKUIcon 192 'icons/icon-192.png'
Create-VKUIcon 180 'icons/apple-touch-icon.png'

# Android Launcher Mipmaps
$res = 'android/app/src/main/res'
Create-VKUIcon 48  "$res/mipmap-mdpi/ic_launcher.png"
Create-VKUIcon 72  "$res/mipmap-hdpi/ic_launcher.png"
Create-VKUIcon 96  "$res/mipmap-xhdpi/ic_launcher.png"
Create-VKUIcon 144 "$res/mipmap-xxhdpi/ic_launcher.png"
Create-VKUIcon 192 "$res/mipmap-xxxhdpi/ic_launcher.png"

Create-VKUIcon 48  "$res/mipmap-mdpi/ic_launcher_round.png"
Create-VKUIcon 72  "$res/mipmap-hdpi/ic_launcher_round.png"
Create-VKUIcon 96  "$res/mipmap-xhdpi/ic_launcher_round.png"
Create-VKUIcon 144 "$res/mipmap-xxhdpi/ic_launcher_round.png"
Create-VKUIcon 192 "$res/mipmap-xxxhdpi/ic_launcher_round.png"
