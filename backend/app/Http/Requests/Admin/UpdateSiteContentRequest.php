<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * keyごとにrulesを出し分ける（docs/backend/cms.md）。不正なkeyはroutes/admin.phpの
     * where()制約で404になるため、ここに到達する時点でkeyは4種のいずれかに確定している。
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return match ($this->route('key')) {
            'hero' => [
                'headline' => ['required', 'string'],
                'tagline' => ['required', 'string'],
                'images' => ['present', 'array'],
                'images.*.url' => ['required', 'string'],
                'images.*.alt' => ['nullable', 'string'],
            ],
            'concept' => [
                'body' => ['required', 'string'],
            ],
            'lookbook' => [
                'images' => ['present', 'array'],
                'images.*.url' => ['required', 'string'],
                'images.*.alt' => ['nullable', 'string'],
            ],
            'about' => [
                'blocks' => ['present', 'array'],
                'blocks.*.label' => ['required', 'string'],
                'blocks.*.heading' => ['required', 'string'],
                'blocks.*.body' => ['required', 'string'],
                'blocks.*.image_url' => ['nullable', 'string'],
            ],
        };
    }
}
