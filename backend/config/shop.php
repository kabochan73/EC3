<?php

// ECサイト固有のマジックナンバーをここに集約する（docs/backend/folder-structure.md §7）。
// コード中に閾値・日数・金額を直接書かず、必ずconfig('shop.xxx')を参照する。

return [

    // 在庫がこの数値以下なら「残りわずか（low_stock）」表示にする
    'low_stock_threshold' => 5,

    // created_atからこの日数以内なら「新着（is_new）」扱い
    'new_product_days' => 30,

    // 送料（一律）と、送料無料になる小計のしきい値
    'shipping_fee' => 800,
    'free_shipping_threshold' => 20000,

    // 1明細あたりの最大注文数量
    'cart_max_quantity_per_line' => 10,

    // 未決済（pending）注文の有効期限（分）
    'pending_order_ttl_minutes' => 30,

    // 注文番号のプレフィックス（EC-YYYYMMDD-NNNN）
    'order_number_prefix' => 'EC',

    // 決済通貨（Stripeに渡すcurrency。JPYはゼロ小数なのでamountは円そのまま）
    'currency' => 'jpy',

];
