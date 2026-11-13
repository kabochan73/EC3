// ダミーの連絡先。ドメインはIANA予約のexample.jpなので実在しない（誤送信の心配なし）。
const PHONE = "03-1234-5678";
const EMAIL = "contact@ec3.example.jp";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-16">
        <p className="text-sm tracking-[0.2em] uppercase">EC3</p>
        <div className="text-xs tracking-widest text-graphite uppercase">
          <a href={`tel:${PHONE}`} className="block transition-opacity hover:opacity-60">
            Tel {PHONE}
          </a>
          <a href={`mailto:${EMAIL}`} className="block lowercase transition-opacity hover:opacity-60">
            {EMAIL}
          </a>
        </div>
      </div>

      <div className="border-t border-ink px-6 py-6 text-center text-[11px] tracking-widest text-graphite uppercase">
        © 2026 EC3. All rights reserved.
      </div>
    </footer>
  );
}
