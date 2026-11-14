import Link from "next/link";

import { LogoutButton } from "./LogoutButton";

const MENU_ITEM_CLASS = "tracking-widest text-graphite uppercase transition-colors hover:text-ink";

const MENU_LINKS = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

/** マイページのメニュー。adminならADMIN PANELも出す（Laravel側で/api/admin/*の認可もあるので表示だけ）。 */
export function AccountMenu({ isAdmin }: { isAdmin: boolean }) {
  const links = isAdmin ? [...MENU_LINKS, { href: "/admin", label: "Admin Panel" }] : MENU_LINKS;

  return (
    <nav className="mt-6 flex flex-col gap-4 border-t border-ink pt-8 text-xl">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={MENU_ITEM_CLASS}>
          {link.label}
        </Link>
      ))}
      <LogoutButton />
    </nav>
  );
}
