param([Parameter(Mandatory=$true)][string]$ZipPath, [Parameter(Mandatory=$true)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
  $documents = foreach ($entry in $archive.Entries | Where-Object { $_.FullName.EndsWith('.docx') }) {
    $buffer = New-Object System.IO.MemoryStream
    $source = $entry.Open(); $source.CopyTo($buffer); $source.Dispose(); $buffer.Position = 0
    $docArchive = New-Object System.IO.Compression.ZipArchive($buffer)
    try {
      $reader = New-Object System.IO.StreamReader($docArchive.GetEntry('word/document.xml').Open())
      [xml]$xml = $reader.ReadToEnd(); $reader.Dispose()
      $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
      $ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
      $tableNumber = 0
      $blocks = foreach ($node in $xml.SelectNodes('//w:body/*', $ns)) {
        if ($node.LocalName -eq 'p') {
          $text = (($node.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '').Trim()
          if ($text) { [pscustomobject]@{type='paragraph';text=$text} }
        } elseif ($node.LocalName -eq 'tbl') {
          $tableNumber++
          $rows = @($node.SelectNodes('./w:tr', $ns) | ForEach-Object {
            ,@($_.SelectNodes('./w:tc', $ns) | ForEach-Object { (($_.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ' ').Trim() })
          })
          [pscustomobject]@{type='table';number=$tableNumber;rows=$rows}
        }
      }
      [pscustomobject]@{file=$entry.FullName;blocks=@($blocks)}
    } finally { $docArchive.Dispose(); $buffer.Dispose() }
  }
  $json = ConvertTo-Json -InputObject @($documents) -Depth 10
  [System.IO.File]::WriteAllText($OutputPath, $json, (New-Object System.Text.UTF8Encoding($false)))
} finally { $archive.Dispose() }
