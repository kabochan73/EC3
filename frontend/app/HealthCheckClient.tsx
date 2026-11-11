"use client";

import { useEffect, useState } from "react";

export function HealthCheckClient() {
  const [health, setHealth] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(setHealth)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <section>
      <h2 className="font-semibold">ブラウザ → Laravel（直接）</h2>
      {error && <p className="text-red-600">{error}</p>}
      {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : !error && <p>loading...</p>}
    </section>
  );
}
