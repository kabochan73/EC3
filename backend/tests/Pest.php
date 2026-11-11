<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Featureテストは実Postgres（ecp_test）を挟む。Repositoryパターンを使わない設計
| なので、DBを挟んだテストが自然（docs/backend/testing.md）。RefreshDatabaseで
| 毎テストDBをまっさらに戻す（対象はphpunit.xmlのecp_test）。
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->extend(TestCase::class)
    ->in('Unit');
