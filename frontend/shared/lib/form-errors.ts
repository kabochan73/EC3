// Laravelの422（{ message, errors }）をreact-hook-formのフィールドに割り当てる
// （docs/frontend/component-types.md、docs/frontend/rendering-strategy.md）。

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

type LaravelErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Laravelのerrorsを各フィールドの下に割り当てる。
 * 割り当てられるものが無ければmessageを返す（フォームの下にまとめて出す用）。
 */
export function applyLaravelErrors<T extends FieldValues>(
  body: LaravelErrorBody | null,
  setError: UseFormSetError<T>,
  fallback: string,
): string | null {
  if (body?.errors && Object.keys(body.errors).length > 0) {
    for (const [field, messages] of Object.entries(body.errors)) {
      setError(field as Path<T>, { message: messages[0] });
    }
    return null;
  }

  return body?.message ?? fallback;
}
