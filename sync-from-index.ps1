param(
    [switch]$Bootstrap,
    [switch]$Materialize
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexPath = Join-Path $root 'index.html'

if ($Bootstrap) {
    $html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
    $css = Get-Content -LiteralPath (Join-Path $root 'style.css') -Raw -Encoding UTF8
    $app = Get-Content -LiteralPath (Join-Path $root 'app.js') -Raw -Encoding UTF8
    $content = Get-Content -LiteralPath (Join-Path $root 'content.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $contentJson = $content | ConvertTo-Json -Depth 100

    $html = [regex]::Replace($html, '<link rel="stylesheet" href="style\.css">', [System.Text.RegularExpressions.MatchEvaluator]{ param($match) "<style id=`"portfolio-styles`">`n$css`n</style>" }, 1)
    $html = [regex]::Replace($html, '<script defer src="content\.js"></script>\s*<script defer src="app\.js"></script>', [System.Text.RegularExpressions.MatchEvaluator]{ param($match) "<script id=`"portfolio-content`">`nwindow.CONTENT = $contentJson;`n</script>`n<script id=`"portfolio-app`">`n$app`n</script>" }, 1)

    if ($html -match '<link rel="stylesheet" href="style\.css">|<script defer src="content\.js"></script>') {
        throw 'Не удалось встроить все внешние ресурсы. index.html оставлен без записи.'
    }
    Set-Content -LiteralPath $indexPath -Value $html -Encoding UTF8
}

$html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$cssMatch = [regex]::Match($html, '<style id="portfolio-styles">([\s\S]*?)</style>')
$contentMatch = [regex]::Match($html, '<script id="portfolio-content">([\s\S]*?)</script>')
$appMatch = [regex]::Match($html, '<script id="portfolio-app">([\s\S]*?)</script>')

if (-not $cssMatch.Success -or -not $contentMatch.Success -or -not $appMatch.Success) {
    throw 'В index.html не найдены встроенные блоки portfolio-styles, portfolio-content и portfolio-app.'
}

$contentJs = $contentMatch.Groups[1].Value.Trim()
$prefix = 'window.CONTENT = '
if (-not $contentJs.StartsWith($prefix)) {
    throw 'Блок portfolio-content должен начинаться с window.CONTENT ='
}
$jsonText = $contentJs.Substring($prefix.Length).Trim()
if ($jsonText.EndsWith(';')) { $jsonText = $jsonText.Substring(0, $jsonText.Length - 1).TrimEnd() }
$contentObject = $jsonText | ConvertFrom-Json

if ($Materialize) {
    $ru = $contentObject.ru
    $encode = { param($value) [System.Net.WebUtility]::HtmlEncode([string]$value) }

    foreach ($property in $ru.PSObject.Properties) {
        if ($property.Value -is [string]) {
            $key = [regex]::Escape($property.Name)
            $value = & $encode $property.Value
            $pattern = '(<[^>]*\bdata-t="' + $key + '"[^>]*>)[\s\S]*?(</[^>]+>)'
            $html = [regex]::Replace($html, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $match.Groups[1].Value + $value + $match.Groups[2].Value })
        }
    }

    $navLinks = for ($i = 0; $i -lt $ru.nav.Count; $i++) { '<a href="#' + @('about','experience','achievements','skills','projects','contacts')[$i] + '">' + (& $encode $ru.nav[$i]) + '</a>' }
    $html = $html.Replace('<nav id="nav" aria-label="Sections"></nav>', '<nav id="nav" aria-label="Sections">' + ($navLinks -join '') + '</nav>')
    foreach ($i in 0..5) {
        $pattern = '(<span data-nav="' + $i + '">)[\s\S]*?(</span>)'
        $value = & $encode $ru.nav[$i]
        $html = [regex]::Replace($html, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $match.Groups[1].Value + $value + $match.Groups[2].Value })
    }

    $journey = for ($i = 0; $i -lt $ru.route.Count; $i++) { '<div><small>0' + ($i + 1) + '</small><h3>' + (& $encode $ru.route[$i]) + '</h3><p>' + (& $encode $ru.routeSub[$i]) + '</p></div>' }
    $html = $html.Replace('<div class="journey" id="journey"></div>', '<div class="journey" id="journey">' + ($journey -join '') + '</div>')

    $timeline = for ($i = 0; $i -lt $ru.roles.Count; $i++) {
        $role = $ru.roles[$i]
        $bullets = ($role.bullets | ForEach-Object { '<li>' + (& $encode $_) + '</li>' }) -join ''
        $open = if ($i -eq 0) { ' open' } else { '' }
        '<details class="career"' + $open + '><summary><time>' + (& $encode $role.date) + '</time><div><h3>' + (& $encode $role.company) + '</h3><span class="job">' + (& $encode $role.title) + '</span></div><span class="plus" aria-hidden="true">+</span></summary><ul>' + $bullets + '</ul></details>'
    }
    $html = $html.Replace('<div id="timeline"></div>', '<div id="timeline">' + ($timeline -join '') + '</div>')

    $achievements = foreach ($item in $ru.achievements) { '<article class="achievement"><strong>' + (& $encode $item.value) + '</strong><h3>' + (& $encode $item.title) + '</h3><p>' + (& $encode $item.text) + '</p></article>' }
    $html = $html.Replace('<div class="achievement-grid" id="achievements-grid"></div>', '<div class="achievement-grid" id="achievements-grid">' + ($achievements -join '') + '</div>')

    $skills = foreach ($group in $ru.skillGroups) { '<div class="skill-row"><h3>' + (& $encode $group[0]) + '</h3><p>' + (& $encode $group[1]) + '</p></div>' }
    $html = $html.Replace('<div id="skill-list"></div>', '<div id="skill-list">' + ($skills -join '') + '</div>')
    $education = ($ru.education | ForEach-Object { '<li>' + (& $encode $_) + '</li>' }) -join ''
    $html = $html.Replace('<ul id="education-list"></ul>', '<ul id="education-list">' + $education + '</ul>')

    $projects = for ($i = 0; $i -lt $ru.projects.Count; $i++) {
        $project = $ru.projects[$i]
        $links = ($project.links | ForEach-Object { '<a class="text-link" href="' + (& $encode $_[1]) + '" target="_blank" rel="noopener noreferrer">' + (& $encode $_[0]) + ' ↗</a>' }) -join ''
        '<article class="project"><span class="project-num">0' + ($i + 1) + '</span><div><span class="project-tag">' + (& $encode $project.tag) + '</span><h3>' + (& $encode $project.name) + '</h3></div><div><p>' + (& $encode $project.text) + '</p><div class="actions">' + $links + '</div></div></article>'
    }
    $html = $html.Replace('<div id="project-list"></div>', '<div id="project-list">' + ($projects -join '') + '</div>')

    Set-Content -LiteralPath $indexPath -Value $html -Encoding UTF8
}

# Read edited static text fields back into the embedded data so generated files
# and the live JavaScript view stay aligned with the HTML edited in OpenDesign.
$html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
foreach ($property in $contentObject.ru.PSObject.Properties) {
    if ($property.Value -is [string]) {
        $key = [regex]::Escape($property.Name)
        $pattern = '<[^>]*\bdata-t="' + $key + '"[^>]*>([\s\S]*?)</[^>]+>'
        $match = [regex]::Match($html, $pattern)
        if ($match.Success) {
            $textValue = [regex]::Replace($match.Groups[1].Value, '<[^>]+>', '')
            $contentObject.ru.($property.Name) = [System.Net.WebUtility]::HtmlDecode($textValue).Trim()
        }
    }
}
$staticHtml = [regex]::Match($html, '<body[^>]*>([\s\S]*?)</body>').Groups[1].Value
# Preserve edits to repeated HTML sections as well as scalar data-t fields.
function Read-Text([string]$value) {
    [System.Net.WebUtility]::HtmlDecode([regex]::Replace($value, '<[^>]+>', '')).Trim()
}
function Read-Part([string]$value, [string]$pattern) {
    Read-Text ([regex]::Match($value, $pattern).Groups[1].Value)
}
$roles = @([regex]::Matches($staticHtml, '<details class="career"[^>]*>([\s\S]*?)</details>') | ForEach-Object {
    $part = $_.Groups[1].Value
    [pscustomobject]@{
        date = Read-Part $part '<time[^>]*>([\s\S]*?)</time>'
        company = Read-Part $part '<h3[^>]*>([\s\S]*?)</h3>'
        title = Read-Part $part '<span class="job"[^>]*>([\s\S]*?)</span>'
        bullets = @([regex]::Matches($part, '<li[^>]*>([\s\S]*?)</li>') | ForEach-Object { Read-Text $_.Groups[1].Value })
    }
})
if ($roles.Count) { $contentObject.ru.roles = $roles }
$achievements = @([regex]::Matches($staticHtml, '<article class="achievement"[^>]*>([\s\S]*?)</article>') | ForEach-Object {
    $part = $_.Groups[1].Value
    [pscustomobject]@{value = Read-Part $part '<strong[^>]*>([\s\S]*?)</strong>'; title = Read-Part $part '<h3[^>]*>([\s\S]*?)</h3>'; text = Read-Part $part '<p[^>]*>([\s\S]*?)</p>'}
})
if ($achievements.Count) { $contentObject.ru.achievements = $achievements }
$groups = @([regex]::Matches($staticHtml, '<div class="skill-row"[^>]*>([\s\S]*?)</div>') | ForEach-Object {
    ,@((Read-Part $_.Groups[1].Value '<h3[^>]*>([\s\S]*?)</h3>'), (Read-Part $_.Groups[1].Value '<p[^>]*>([\s\S]*?)</p>'))
})
if ($groups.Count) { $contentObject.ru.skillGroups = $groups }
$projects = @([regex]::Matches($staticHtml, '<article class="project"[^>]*>([\s\S]*?)</article>') | ForEach-Object {
    $part = $_.Groups[1].Value
    $links = @([regex]::Matches($part, '<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>') | ForEach-Object {
        ,@((Read-Text $_.Groups[2].Value).TrimEnd(' ', [char]0x2197), [System.Net.WebUtility]::HtmlDecode($_.Groups[1].Value))
    })
    [pscustomobject]@{tag = Read-Part $part '<span class="project-tag"[^>]*>([\s\S]*?)</span>'; name = Read-Part $part '<h3[^>]*>([\s\S]*?)</h3>'; text = Read-Part $part '<p[^>]*>([\s\S]*?)</p>'; links = $links}
})
if ($projects.Count) { $contentObject.ru.projects = $projects }
$journey = [regex]::Match($staticHtml, '<div[^>]*id="journey"[^>]*>([\s\S]*?)</section>').Groups[1].Value
if ($journey) {
    $contentObject.ru.route = @([regex]::Matches($journey, '<h3[^>]*>([\s\S]*?)</h3>') | ForEach-Object { Read-Text $_.Groups[1].Value })
    $contentObject.ru.routeSub = @([regex]::Matches($journey, '<p[^>]*>([\s\S]*?)</p>') | ForEach-Object { Read-Text $_.Groups[1].Value })
}
$education = [regex]::Match($staticHtml, '<ul[^>]*id="education-list"[^>]*>([\s\S]*?)</ul>').Groups[1].Value
if ($education) { $contentObject.ru.education = @([regex]::Matches($education, '<li[^>]*>([\s\S]*?)</li>') | ForEach-Object { Read-Text $_.Groups[1].Value }) }
$nav = [regex]::Match($staticHtml, '<nav[^>]*id="nav"[^>]*>([\s\S]*?)</nav>').Groups[1].Value
if ($nav) { $contentObject.ru.nav = @([regex]::Matches($nav, '<a[^>]*>([\s\S]*?)</a>') | ForEach-Object { Read-Text $_.Groups[1].Value }) }
$jsonText = $contentObject | ConvertTo-Json -Depth 100
$newContentBlock = "`nwindow.CONTENT = $jsonText;`n"
$html = [regex]::Replace($html, '<script id="portfolio-content">([\s\S]*?)</script>', [System.Text.RegularExpressions.MatchEvaluator]{ param($match) '<script id="portfolio-content">' + $newContentBlock + '</script>' }, 1)
Set-Content -LiteralPath $indexPath -Value $html -Encoding UTF8
$html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$contentMatch = [regex]::Match($html, '<script id="portfolio-content">([\s\S]*?)</script>')
$contentJs = $contentMatch.Groups[1].Value.Trim()
$prefix = 'window.CONTENT = '
$jsonText = $contentJs.Substring($prefix.Length).Trim()
if ($jsonText.EndsWith(';')) { $jsonText = $jsonText.Substring(0, $jsonText.Length - 1).TrimEnd() }
$contentObject = $jsonText | ConvertFrom-Json
$formattedJson = $contentObject | ConvertTo-Json -Depth 100

Set-Content -LiteralPath (Join-Path $root 'style.css') -Value $cssMatch.Groups[1].Value.Trim("`r", "`n") -Encoding UTF8
Set-Content -LiteralPath (Join-Path $root 'content.js') -Value "window.CONTENT=$($jsonText);" -Encoding UTF8
Set-Content -LiteralPath (Join-Path $root 'content.json') -Value $formattedJson -Encoding UTF8
Set-Content -LiteralPath (Join-Path $root 'app.js') -Value $appMatch.Groups[1].Value.Trim("`r", "`n") -Encoding UTF8

Write-Output 'Синхронизированы style.css, content.js, content.json и app.js из index.html.'

