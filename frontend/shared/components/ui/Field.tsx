import { forwardRef, type InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** react-hook-formのerrors.xxx?.messageをそのまま渡す */
  error?: string;
};

/**
 * ラベル＋下線だけの入力＋エラーメッセージ。全フォーム共通の1フィールド。
 *   <Field label="Email" id="email" type="email" error={errors.email?.message} {...register("email")} />
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, id, className, ...rest },
  ref,
) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] tracking-widest text-gray-500 uppercase">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className={`mt-2 w-full border-b border-black bg-transparent py-2 text-sm outline-none ${className ?? ""}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-gray-600">{error}</p>}
    </div>
  );
});
