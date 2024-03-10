# ポート番号
$Port = "8080"

# URL
$url = "http://localhost:" + $Port + "/"

# リクエストがルート(/)の場合、呼び出されるファイル
$HomePage = "index.html"

# コンテンツタイプ辞書(ブラウザに送るデータの種類)
$ContentType = @{
	"css" = "text/css"
	"js" = "application/javascript"
	"json" = "application/json"
	"html" = "text/html"
	"pdf" = "application/pdf"
	"txt" = "text/plain"
	"jpg" = "image/jpeg"
	"png" = "image/png"
	"csv" = "text/plain"
	"*" = "application/octet-stream"
}

# リクエストに対してファイル送信を行う
function responseFile ([ref]$response, $fileName)
{
	$currentDirectory = Convert-Path .
	$fullPath = Join-Path $currentDirectory $fileName
	if ([IO.File]::Exists($fullPath)) {
		$extension = $(ls $fullPath).Extension.Replace(".", "")
		if ($ContentType.ContainsKey($extension)) {
			$response.Value.ContentType = $ContentType[$extension]
		} else {
			$response.Value.ContentType = $ContentType["*"]
		}
		$response.Value.ContentType += ";charset=UTF-8" # エンコードはUTF-8で決め打ち

		# 一旦ファイルを読み込んでからUTF-8形式でエンコードする
		$rawtxt = cat $fullPath
		$content = [System.Text.Encoding]::UTF8.GetBytes([String]::Join("`n", $rawtxt))

		$response.Value.ContentLength64 = $content.Length
		$output = $response.Value.OutputStream
		$output.Write($content, 0, $content.Length)
		$output.Close()
	} else {
		# 存在しないファイルは404エラー
		$response.Value.StatusCode = 404
	}
}

function responseFileList ([ref]$response)
{
	$response.Value.ContentType = $ContentType["txt"]
	$response.Value.ContentType += ";charset=UTF-8"

	# ファイル一覧取得
	$fileList = ls -r | % {$_.FullName | Resolve-Path -Relative}
	$content = [System.Text.Encoding]::UTF8.GetBytes([String]::Join("`n", $fileList))

	$response.Value.ContentLength64 = $content.Length
	$output = $response.Value.OutputStream
	$output.Write($content, 0, $content.Length)
	$output.Close()
}

function main {
	$listener = New-Object Net.HttpListener
	$listener.Prefixes.Add($url)
	Write-Output "* Running on $url (Press CTRL+C to quit)"

	try {
		$listener.Start()
		while ($listener.IsListening) {
			$task = $listener.GetContextAsync()
			# ブロッキングでCtrl+Cが効かなくなることへの対策
			while ($task.AsyncWaitHandle.WaitOne(500) -eq $false) {}
			$context = $task.GetAwaiter().GetResult()
			$request = $context.Request
			$response = $context.Response
			$query = $request.QueryString

			$command = $request.Url.LocalPath

			# ローカルPCからの接続だけ返答
			if ($request.IsLocal)
			{
				if ($command -eq "/getfiles")
				{
					responseFileList ([ref]$response)
				}
				elseif ($command -eq "/")
				{
					# 最初のページ送信
					responseFile ([ref]$response) $HomePage
				}
				else
				{
					# CSS,Javascriptなどのファイルが要求された場合
					responseFile ([ref]$response) $request.RawUrl
				}
			}


			Write-Output $request.RawUrl
			Write-Output $response
			$response.Close()
		}
	} catch {
		Write-Error($_.Exception)
	} finally {
		$listener.Close()
	}
}

main
exit
