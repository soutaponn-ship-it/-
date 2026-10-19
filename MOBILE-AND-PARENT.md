# スマホ接続と保護者共有

## スマホから開く

1. PCとスマホを同じ家庭内Wi-Fiへ接続します。
2. PCで `Allow-StudyManager-LAN.cmd` を右クリックし、「管理者として実行」します。これはTCP 3000番ポートを家庭内のプライベートネットワークだけに許可します。
3. `Start-StudyManager.cmd` を実行します。Windowsのスタートアップにも登録済みなので、次回からPC起動時に自動起動します。
4. PCのIPv4アドレスをPowerShellで確認します。

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' }
```

5. スマホのブラウザで次の形式を開きます。

```text
http://PCのIPv4アドレス:3000
```

例：`http://192.168.68.59:3000`

PCがスリープ・終了するとサーバーも停止します。家庭内Wi-Fiの外から公開する場合は、ポート開放ではなく、HTTPS・認証・リバースプロキシ・本番DBを用意してください。

## Googleログイン

Google Cloud ConsoleのOAuthクライアントで、JavaScript生成元だけでなく「承認済みのリダイレクトURI」に次を登録します。

```text
http://127.0.0.1:3000/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

GoogleログインはPC上の `127.0.0.1` または `localhost` から利用してください。スマホのLANアドレスはGoogleのリダイレクトURI規則上、そのままでは利用できないため、スマホでもGoogleログインを使う場合はHTTPSドメインが必要です。

## 保護者共有

生徒側で「保護者共有」から招待コードを発行し、保護者側は別アカウントでログインしてコードを入力します。共有範囲は、生徒側で計画・勉強時間・成績・苦手単元ごとに管理します。

メールログインとGoogleログインはサーバーセッション化され、Supabaseの `users`、`study_data`、`parent_links` に保存されます。生徒が発行した招待コードを、別端末の保護者アカウントで入力すると、保護者側に生徒が共有を許可した学習データが表示されます。共有設定の変更は生徒側だけが行えます。

## 公開前に追加するもの

- HTTPSドメイン
- HTTPSドメイン（Googleログインをスマホから使う場合）
- パスワード再設定とメール確認
- 保護者の閲覧専用権限をサーバー側で確認するテスト
- 添付ファイルの容量・形式制限
- 問い合わせ先、プライバシーポリシー、利用規約の確定
- Windows PCを常時稼働させない場合のクラウドホスティング
