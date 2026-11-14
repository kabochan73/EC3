<?php

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 住所の作成（POST）と更新（PUT）で共用。ルールが完全に同じなので1つにまとめた。
 * PUTは「全項目を送って置き換える」前提なので、更新でもrequiredのままでよい。
 */
class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'regex:/^\d{3}-\d{4}$/'],
            'prefecture' => ['required', 'string', 'max:10'],
            'city' => ['required', 'string', 'max:100'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
