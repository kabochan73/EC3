<?php

/*
|--------------------------------------------------------------------------
| 管理者アカウント（AdminUserSeederが使う）
|--------------------------------------------------------------------------
| 認証情報は.envに置き、リポジトリには入れない。未設定ならローカル用の
| デフォルトにフォールバックする。config経由で読むこと（本番はconfig:cacheが
| 効くのでseeder内のenv()はnullになる）。
|
| env('X', 既定値)の既定値は「変数が無いとき」にしか使われず、.env.exampleの
| `ADMIN_EMAIL=`のように「空で書いてある」と空文字が返る。空でも既定値に
| 落ちるよう?:を使う。
*/

return [
    'name' => env('ADMIN_NAME') ?: 'Store Admin',
    'email' => env('ADMIN_EMAIL') ?: 'admin@example.jp',
    'password' => env('ADMIN_PASSWORD') ?: 'password',
];
