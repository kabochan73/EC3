import "@testing-library/jest-dom/vitest";

// shared/lib/api-server.ts・api-client.tsはモジュール読み込み時にprocess.envを
// 読むため、importより前に確定させておく（.env.localはVitestでは読み込まれない）。
process.env.API_URL ??= "http://backend:8080";
process.env.FRONTEND_ORIGIN ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8000";
