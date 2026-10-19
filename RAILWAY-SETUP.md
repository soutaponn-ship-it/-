# Railway MySQL接続手順

## Railway側

1. Railwayで新しいProjectを作成します。
2. `+ New` から `Database` → `MySQL` を追加します。
3. MySQLサービスのVariablesで、`MYSQL_PUBLIC_URL`を使えるようにします。外部接続が必要な場合はSettings → Networking → Public NetworkingからTCP Proxyを有効にします。
4. `MYSQL_PUBLIC_URL`の値をコピーします。これはパスワードを含む接続情報なので公開しないでください。

Railway公式のMySQLテンプレートでは、`MYSQLHOST`、`MYSQLPORT`、`MYSQLUSER`、`MYSQLPASSWORD`、`MYSQLDATABASE`、`MYSQL_URL`が作成されます。プロジェクト外のPCから接続する場合は、外部接続用の`MYSQL_PUBLIC_URL`を使います。

## Study Manager側

`C:\manus\StudyManager\.env`に次の1行を追加します。値はRailwayの`MYSQL_PUBLIC_URL`をそのまま貼り付けます。

```env
DATABASE_URL=mysql://ユーザー名:パスワード@ホスト:ポート/データベース名
```

その後、PowerShellでプロジェクトフォルダーから一度だけスキーマを作成します。

```powershell
cd C:\manus\StudyManager
npm.cmd run db:push
```

続けて、Study Managerを再起動します。

```powershell
.\Start-StudyManager.cmd
```

## 保護者の利用

生徒と保護者が別の端末からGoogleログインし、同じRailway MySQLを使うことで、招待コード、共有範囲、学習データをサーバー側で同期できます。

- 生徒：保護者共有 → 招待コードを発行
- 保護者：別のGoogleアカウントでログイン → 招待コードを入力
- 生徒：計画、勉強時間、成績、苦手単元の共有範囲を設定

## セキュリティ

- `DATABASE_URL`はGitHub、スクリーンショット、チャットに貼らない
- `.env`はGit管理対象外のままにする
- Railwayの外部接続は必要な期間だけ有効にする
- Railwayでバックアップと監視を設定する
- パスワードや接続URLを紛失・公開した場合は、Railwayでパスワードを変更する
