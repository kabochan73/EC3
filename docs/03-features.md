# 機能スコープ（確定版）

前回（EC-Portfolio2）から変更なし。詳細な設計は各ドキュメント参照。

## 公開ページ

- [ ] トップページ（CMS駆動。ヒーロー・ブランドコンセプト・ルックブック・カテゴリ別商品グリッド・About）
- [ ] 商品詳細ページ
- [ ] カート
- [ ] チェックアウト（配送先入力→注文作成→決済→完了）
- [ ] ログイン / 会員登録
- [ ] パスワードリセット（申請・再設定）
- [ ] マイページ（ダッシュボード・注文履歴・注文詳細・住所録・プロフィール）

**やらない**: カテゴリ別一覧ページ・全商品一覧ページ（小規模カタログのためトップのカテゴリセクションで出し切る）、お気に入り、検索、レビュー、クーポン、ゲスト注文、複数配送先、分割配送、返品RMAフロー、多言語/多通貨、メール認証（アドレス確認）

詳細なページ構成・業務ルール（送料・在庫閾値等）は [docs/frontend/routing.md](./frontend/routing.md) 参照。

## 決済

- [ ] Stripe Payment Element（カード決済のみ、test mode）
- [ ] 注文作成と決済の分離（`pending`注文→PaymentIntent作成→Webhookで`paid`に遷移）
- [ ] Webhookの冪等性実装
- [ ] 未決済注文の自動キャンセル（30分TTL）と在庫復元
- [ ] admin操作によるキャンセル・返金

**やらない**: 決済手段の追加（コンビニ・PayPay等）、部分返金

詳細は [docs/backend/payments.md](./backend/payments.md)・[docs/frontend/payments.md](./frontend/payments.md) 参照。

## メール

- [ ] パスワードリセットメール
- [ ] 注文確認メール
- [ ] 発送通知メール

**やらない**: メール認証（アドレス確認）、独自ドメインでの送信（Resendの共有ドメインのまま）

詳細は [docs/backend/mail.md](./backend/mail.md) 参照。

## 軽量CMS

- [ ] トップページのHero（見出し・タグライン・背景画像のスライドショー）編集
- [ ] BrandConcept（本文テキスト）編集
- [ ] Lookbook（画像リスト）編集
- [ ] About（ブロック配列: label/heading/body/画像）編集
- [ ] 編集後のオンデマンド再検証（`revalidateTag`）でトップページに即反映

**やらない**: ページ追加、ブロックの自由配置、リッチテキストエディタ、多言語、下書き/公開ワークフロー、バージョン履歴

詳細は [docs/backend/cms.md](./backend/cms.md)・[docs/frontend/cms.md](./frontend/cms.md) 参照。

## 管理画面

- [ ] ログイン（通常のログインを共用、`role=admin`で認可）
- [ ] 運用ダッシュボード（未発送・受け取り待ち・在庫わずか・売り切れの件数、未発送注文一覧）
- [ ] 商品管理（基本情報・画像・バリアントのCRUD、公開フラグ）
- [ ] カテゴリ管理（CRUD・並べ替え）
- [ ] 注文管理（一覧・詳細・ステータス変更によるフルフィルメント）
- [ ] 会員閲覧（一覧・詳細、閲覧のみ）
- [ ] CMS編集画面

**やらない**: カテゴリ管理での商品の一括操作、会員情報の編集・削除、売上ダッシュボード

詳細は [docs/api/admin.md](./api/admin.md) 参照。

## 管理者アカウント

- [ ] Laravelのdatabase seederで初期管理者を投入

## デプロイ

- [ ] 今回のスコープに含める
- [ ] backend/queue/scheduler/DB/bucket: Railway
- [ ] frontend: **Vercel**

詳細は [docs/infra/railway.md](./infra/railway.md)・[docs/infra/vercel.md](./infra/vercel.md) 参照。

## テスト（今回、実装と同時に書く方針に変更）

- [ ] backend: Feature中心 + 純粋ロジックのUnit（Pest 3）
- [ ] frontend: 単体テスト（Vitest + Testing Library）
- [ ] CI（GitHub Actions、backend/frontend並列ジョブ）

自動E2E（Playwright等）はやらない。詳細は [docs/backend/testing.md](./backend/testing.md)・[docs/frontend/testing.md](./frontend/testing.md) 参照。
</content>
