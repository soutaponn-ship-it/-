# 公式仕様メモ

- Google OAuth Web Server: https://developers.google.com/identity/protocols/oauth2/web-server
  - 通常のredirect URIはHTTPSが必要。localhost/localhost IPはHTTPの例外。
  - raw private IP (例: 192.168.x.x) はredirect URIに使えない。
- Supabase Pricing: https://supabase.com/pricing
  - Free: $0、50,000 MAU、500MB DB、1GB Storage、5GB egress、Edge Function 500,000 invocations、2 active projects、1週間非アクティブでpause。
- Supabase PostgreSQL接続: https://supabase.com/docs/guides/database/connecting-to-postgres
  - IPv4-only persistent backendはshared pooler session modeが推奨。transaction poolerは6543。
  - poolerのhost/usernameはDashboardのConnectから取得する。
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
  - Deno互換TypeScriptのserver-side function。短時間・オンデマンドAPI向け。
