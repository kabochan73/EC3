"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";

import type { AdminProductImage } from "../types";

type Props = {
  productId: number;
  productSlug: string;
  images: AdminProductImage[];
};

/**
 * 商品画像の管理（アップロード・▲▼並べ替え・削除）。0番目=主画像・1番目=ホバー画像。
 * 画像はpropsで受け取り、操作の後はrevalidateTags（products + product:{slug}）→
 * router.refresh()で描き直す。
 */
export function ProductImagesManager({ productId, productSlug, images }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 成功したら描き直す。失敗したらLaravelのメッセージを出す */
  async function act(request: () => Promise<Response>, failMessage: string) {
    setError(null);
    setBusy(true);
    const res = await request();
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? failMessage);
      return;
    }
    await revalidateTags(["products", `product:${productSlug}`]);
    startTransition(() => router.refresh());
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    await act(
      () => apiClientFetch(`/api/admin/products/${productId}/images`, { method: "POST", body: formData }),
      "アップロードに失敗しました。",
    );
    if (fileInputRef.current) fileInputRef.current.value = ""; // 同じファイルをもう一度選べるように
  }

  function handleDelete(image: AdminProductImage) {
    if (!window.confirm("この画像を削除しますか？")) return;
    act(
      () => apiClientFetch(`/api/admin/product-images/${image.id}`, { method: "DELETE" }),
      "削除に失敗しました。",
    );
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    act(
      () =>
        apiClientFetch(`/api/admin/products/${productId}/images/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: reordered.map((img) => img.id) }),
        }),
      "並べ替えに失敗しました。",
    );
  }

  const working = busy || pending;

  return (
    <section className={working ? "opacity-60" : ""}>
      <h2 className="mb-4 text-[11px] tracking-widest text-graphite uppercase">Images</h2>
      {error && <p className="mb-4 text-xs text-graphite">{error}</p>}

      {images.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.id} className="border border-ink p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- 管理画面のプレビューだけなのでnext/imageの最適化はいらない */}
              <img src={image.url} alt={image.alt ?? ""} className="aspect-square w-full bg-mist object-cover" />
              <p className="mt-2 text-[11px] text-graphite uppercase">
                {index === 0 ? "Primary" : index === 1 ? "Hover" : `#${index + 1}`}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0 || working}
                    className="disabled:opacity-30"
                    aria-label="前へ"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === images.length - 1 || working}
                    className="disabled:opacity-30"
                    aria-label="後ろへ"
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  disabled={working}
                  className="text-graphite underline underline-offset-2 hover:text-ink"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="inline-block cursor-pointer border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist">
        {busy ? "Uploading..." : "Upload Image"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={working}
          className="hidden"
        />
      </label>
    </section>
  );
}
