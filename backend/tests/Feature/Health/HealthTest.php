<?php

// GET /api/health … APIが起きているか・DBに繋がっているかを確認する。

it('reports ok and a reachable database', function () {
    $this->getJson('/api/health')
        ->assertOk()
        ->assertJson([
            'status' => 'ok',
            'app' => config('app.name'),
            'database' => 'ok',
        ])
        ->assertJsonStructure(['status', 'app', 'database', 'time']);
});
