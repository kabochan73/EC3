<?php

it('CSRFクッキーとセッションクッキーを発行し、frontendのOriginにCORSを許可する', function () {
    $response = $this->withHeaders(['Origin' => 'http://localhost:3000'])
        ->get('/sanctum/csrf-cookie');

    $response->assertNoContent();
    $response->assertCookie('XSRF-TOKEN');
    $response->assertCookie('ecp_session');
    $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    $response->assertHeader('Access-Control-Allow-Credentials', 'true');
});
