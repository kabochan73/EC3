# テスト戦略（frontend）

backend側は [docs/backend/testing.md](../backend/testing.md) 参照。

## 方針（今回も継続）

前回（EC-Portfolio2）で確立した「実装と同時にテストを書く」方針を継続する。**Vitest + Testing Library**。

feature-base化（[docs/frontend/folder-structure.md](./folder-structure.md)）に伴い、テストファイルの配置を変更する: 共有の`frontend/tests/`に`lib/`・`components/`をミラーする方式はやめ、**各featureの`__tests__/`にそのfeatureのテストを置く**（例: `features/public/catalog/__tests__/ProductCard.test.tsx`）。`shared/`配下のテストのみ、ルートの`tests/`にミラー配置する。

## テスト対象

- ロジック: 送料・カートの集計 / カートのストア（1明細10個まで）/ ログイン後の戻り先 / キャッシュの無効化 / zodスキーマ / **日本時間の日付の境目**（`TZ=UTC`で動かす）/ 422の割り当て / `moveItem`
- コンポーネント: `VariantSelector` / `CartLine` / `OrderStatusActions` など、各featureの主要コンポーネント

`npm test`でfeature内・shared内すべてのテストを実行する。

## やらないこと

自動E2E（Playwright等）は入れない（一人の学習プロジェクトで維持コストに見合わない）。主要導線（トップ表示・商品詳細・カート→チェックアウト→決済→完了・ログイン・管理画面のCRUD・CMS編集→反映）はヘッドレスChrome（CDP）で確認する。CDPのモバイル幅は`Emulation.setDeviceMetricsOverride`を使う（`--window-size`は効かない）。

## CI

[docs/backend/testing.md](../backend/testing.md)のCI節と対。GitHub Actionsのfrontendジョブ: Node 22（`.nvmrc`）→ `npm ci` → tsc → lint → Vitest。

`next build`はCIに入れない（トップページなどをビルド時にLaravelから作るため。ビルドの確認はVercelのデプロイに任せる）。
</content>
