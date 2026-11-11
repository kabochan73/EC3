# EC3

架空のミニマル・アパレルブランドのECサイト。ポートフォリオ用の作り直し3回目。

設計・決定事項は [docs/](./docs/01-overview.md) を参照（[01-overview.md](./docs/01-overview.md) から読むのがおすすめ）。

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| バックエンド | Laravel 13 (API専用) + Sanctum（セッション認証） |
| DB | PostgreSQL 16 |
| 決済 | Stripe |
| メール | Resend（本番）/ Mailpit（ローカル） |
| デプロイ | frontend: Vercel / backend: Railway |

詳細は [docs/01-overview.md](./docs/01-overview.md) 参照。

## セットアップ（ローカル）

```bash
docker compose up -d
```

詳細手順は [docs/infra/local-dev.md](./docs/infra/local-dev.md) 参照。

## 進捗

[docs/04-implementation-roadmap.md](./docs/04-implementation-roadmap.md) のチェックボックスで管理している。
</content>
