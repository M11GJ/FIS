# ==========================================
# 卒業要件チェッカー - 自動更新スクリプト
# ==========================================

$LogFile = "stats/update_history.log"
$MaxLogLines = 1000  # ログが肥大化しないように制限

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Output $LogEntry
    $LogEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# 初回のログファイル作成
if (-not (Test-Path $LogFile)) {
    New-Item -ItemType File -Path $LogFile
    Write-Log "更新チェックログを開始しました。"
}

Write-Log "----- 更新チェック開始 -----"

try {
    # 最新情報の取得
    Write-Log "GitHub から最新情報を取得中..."
    $gitFetch = git fetch origin main 2>&1
    
    # 変更があるか確認
    $gitStatus = git status -uno 2>&1
    
    if ($gitStatus -match "Your branch is behind") {
        Write-Log "更新が見つかりました。ダウンロードして再ビルドします..."
        
        $gitPull = git pull origin main 2>&1
        Write-Log "git pull 完了。"
        
        $dockerBuild = docker compose up -d --build 2>&1
        Write-Log "Docker コンテナの再起動に成功しました。"
    } else {
        Write-Log "更新はありませんでした。"
    }
} catch {
    Write-Log "エラーが発生しました: $_"
}

Write-Log "----- 更新チェック終了 -----"

# ログの行数制限（簡易的なローテーション）
$lines = Get-Content $LogFile
if ($lines.Count -gt $MaxLogLines) {
    $lines | Select-Object -Last $MaxLogLines | Out-File $LogFile -Encoding UTF8
}
