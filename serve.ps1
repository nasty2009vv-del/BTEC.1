param(
  [int]$Port = 5500,
  [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

$rootFull = [System.IO.Path]::GetFullPath($Root)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add(("http://localhost:{0}/" -f $Port))
$listener.Start()

Write-Host ("Serving {0} on http://localhost:{1}/" -f $rootFull, $Port)

function Get-ContentType([string]$path) {
  $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
  switch ($ext) {
    '.html' { 'text/html; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.js'   { 'application/javascript; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.png'  { 'image/png' }
    '.jpg'  { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.gif'  { 'image/gif' }
    '.svg'  { 'image/svg+xml' }
    '.mp4'  { 'video/mp4' }
    default { 'application/octet-stream' }
  }
}

function Send-Bytes($ctx, [byte[]]$bytes, [string]$contentType, [int]$statusCode) {
  $ctx.Response.StatusCode = $statusCode
  $ctx.Response.ContentType = $contentType
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()

  try {
    $method = $ctx.Request.HttpMethod
    $rel = $ctx.Request.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
    $rel = [Uri]::UnescapeDataString($rel)

    $full = [System.IO.Path]::GetFullPath((Join-Path $rootFull $rel))
    if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }

    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
      Send-Bytes $ctx ([Text.Encoding]::UTF8.GetBytes('Not Found')) 'text/plain; charset=utf-8' 404
      continue
    }

    $fi = Get-Item -LiteralPath $full
    $len = [int64]$fi.Length
    $contentType = Get-ContentType $full

    $ctx.Response.Headers['Accept-Ranges'] = 'bytes'

    $range = $ctx.Request.Headers['Range']
    $start = [int64]0
    $end = $len - 1
    $isPartial = $false

    if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
      $s = $matches[1]
      $e = $matches[2]

      if ($s -ne '') { $start = [int64]$s }
      if ($e -ne '') { $end = [int64]$e }

      if ($s -eq '' -and $e -ne '') {
        $suffix = [int64]$e
        if ($suffix -gt 0) {
          $start = [Math]::Max(0, $len - $suffix)
          $end = $len - 1
        }
      }

      if ($start -lt 0) { $start = 0 }
      if ($end -ge $len) { $end = $len - 1 }

      if ($start -le $end) { $isPartial = $true }
    }

    if ($isPartial) {
      $ctx.Response.StatusCode = 206
      $ctx.Response.Headers['Content-Range'] = ("bytes {0}-{1}/{2}" -f $start, $end, $len)
      $ctx.Response.ContentType = $contentType
      $ctx.Response.ContentLength64 = ($end - $start + 1)
    } else {
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = $contentType
      $ctx.Response.ContentLength64 = $len
    }

    if ($method -eq 'HEAD') {
      $ctx.Response.Close()
      continue
    }

    $fs = [System.IO.File]::Open($full, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    try {
      if ($isPartial) { $null = $fs.Seek($start, [System.IO.SeekOrigin]::Begin) }

      $remaining = if ($isPartial) { ($end - $start + 1) } else { $len }
      $buffer = New-Object byte[] 65536

      while ($remaining -gt 0) {
        $toRead = [int][Math]::Min($buffer.Length, $remaining)
        $read = $fs.Read($buffer, 0, $toRead)
        if ($read -le 0) { break }
        $ctx.Response.OutputStream.Write($buffer, 0, $read)
        $remaining -= $read
      }

      $ctx.Response.Close()
    }
    finally {
      $fs.Dispose()
    }
  }
  catch {
    try {
      Send-Bytes $ctx ([Text.Encoding]::UTF8.GetBytes('Server Error')) 'text/plain; charset=utf-8' 500
    } catch { }
  }
}
