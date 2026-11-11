<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * S3互換バケット操作の薄いラッパー（docs/backend/storage-layout.md）。
 * config/filesystems.phpのs3ディスクはthrow => trueなので、保存失敗は例外になる
 * （呼び出し元のActionが保存成功を確認してから行を作れる）。
 */
final class StorageService
{
    /** キー（path）を返す。例: products/12/01J....jpg、content/hero/01J....jpg */
    public function put(string $prefix, UploadedFile $file): string
    {
        $filename = sprintf('%s.%s', (string) Str::ulid(), $file->getClientOriginalExtension());

        return Storage::disk('s3')->putFileAs($prefix, $file, $filename);
    }

    public function delete(string $key): void
    {
        Storage::disk('s3')->delete($key);
    }

    /** 1件失敗しても残りを続行し、報告のみ行う（DBの行は既に削除済みのため）。 */
    public function deleteMany(array $keys): void
    {
        foreach ($keys as $key) {
            try {
                $this->delete($key);
            } catch (Throwable $e) {
                report($e);
            }
        }
    }
}
