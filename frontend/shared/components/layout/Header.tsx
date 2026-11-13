import Link from "next/link";

import { CartCount } from "./CartCount";

/**
 * ヘッダーは常に白背景・黒文字・下ボーダー固定（透過なし）。
 * 中央ナビ・検索は置かない。ロゴ＋ACCOUNT＋CARTのみ。
 * 項目が少ないのでモバイルもハンバーガーにせず同じ1行バーをそのまま使う。
 * fixedで常に画面上部に重ねる。本文側は(shop)/layout.tsxのpt-16で高さを避ける。
 *
 * Header自体はServer Component。CART (n)だけClient Component（CartCount。カートはlocalStorage）。
 * LOGINは今はただのリンクで、ログイン状態の表示（AccountLink）はフェーズ7のマイページで差し替える。
 */
export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink bg-paper text-ink">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-xs font-medium tracking-[0.15em] uppercase sm:text-sm sm:tracking-[0.2em]"
        >
          EC3
        </Link>

        <nav className="flex items-center gap-4 text-xs tracking-[0.12em] uppercase sm:gap-6 sm:tracking-[0.15em]">
          <Link href="/login" className="transition-opacity hover:opacity-60">
            Login
          </Link>
          <CartCount />
        </nav>
      </div>
    </header>
  );
}
