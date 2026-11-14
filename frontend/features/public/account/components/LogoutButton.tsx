"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClientFetch } from "@/shared/lib/api-client";

/** ログアウト。成功後はヘッダーのAccountLinkがすぐLoginに戻るよう["session"]をnullにする。 */
export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await apiClientFetch("/api/logout", { method: "POST" });
    queryClient.setQueryData(["session"], null);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="text-left text-xl tracking-widest text-graphite uppercase transition-colors hover:text-ink disabled:opacity-50"
    >
      {loading ? "..." : "Logout"}
    </button>
  );
}
