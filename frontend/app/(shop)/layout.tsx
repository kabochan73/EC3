import { Footer } from "@/shared/components/layout/Footer";
import { Header } from "@/shared/components/layout/Header";

/** ストアフロント共通レイアウト。全ページにHeader/Footerを付ける。管理画面（app/admin/）は別レイアウト。 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* Headerがfixed（h-16）なので本文側で高さを確保する。 */}
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
    </>
  );
}
