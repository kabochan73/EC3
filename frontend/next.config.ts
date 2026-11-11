import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents（Next.js 16の新しい事前レンダリングモデル）は無効化する。
  // docs/frontend/rendering-strategy.mdはfetchレベルのnext:{tags,revalidate} +
  // revalidateTag()という従来のISRモデルを前提にしており、cacheComponents有効時は
  // searchParams/cookiesを読むServer Component（ログイン・マイページ等の個人化
  // ページ全般）がSuspense境界を求められ「Blocking Route」警告が多発するため。
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
