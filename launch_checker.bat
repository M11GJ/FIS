@echo off
setlocal
chcp 65001 > nul
echo ==========================================
echo 卒業要件チェッカー - ローカル起動スクリプト
echo ==========================================

:: Node.jsの確認
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js がインストールされていないようです。
    echo https://nodejs.org/ から LTS版をインストールして、再起動してから実行してください。
    pause
    exit /b 1
)

:: 依存関係のインストール
if not exist "node_modules" (
    echo [INFO] 初回起動のため、ライブラリをインストールしています...
    echo (インターネット接続が必要です)
    call npm install
)

:: ビルドの実行
echo [INFO] 最新のデータを反映するためビルドを実行しています...
call npm run build

:: サーバーの起動
echo.
echo [SUCCESS] セットアップが完了しました！
echo.
echo ==========================================
echo 【他の端末からアクセスする方法】
echo 同じWi-Fiに繋がっているスマホやPCからアクセスするには：
echo.
echo 1. このPCのIPアドレスを確認します
echo    (別のコマンドプロンプトで "ipconfig" を入力し、IPv4 アドレスを確認)
echo 2. ブラウザで以下の形式のURLを入力してください：
echo    http://[IPアドレス]:8080/shu-binran/
echo ==========================================
echo.
echo サーバーを起動します... (Ctrl+C で終了できます)
call npm run preview -- --host --port 8080

pause
