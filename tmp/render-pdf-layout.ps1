Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
function Await-Result($Operation, $ResultType) {
  $method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
  $task = $method.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  $task.Wait()
  $task.Result
}
$file = Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync('D:\Medsy\version_1(live)\tmp\question-paper-layout-check.pdf')) ([Windows.Storage.StorageFile])
$pdf = Await-Result ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
$page = $pdf.GetPage(0)
$stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
$action = $page.RenderToStreamAsync($stream)
$actionMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } | Select-Object -First 1
$task = $actionMethod.Invoke($null, @($action))
$task.Wait()
$reader = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream)
$output = [System.IO.File]::Create('D:\Medsy\version_1(live)\tmp\question-paper-layout-check.png')
$reader.CopyTo($output)
$output.Dispose()
$page.Dispose()
