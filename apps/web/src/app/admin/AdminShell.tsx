// apps/web/src/app/admin/AdminShell.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./AuthContext";

const NAV = [
  { href: "/admin/dashboard", label: "Tableau de bord" },
  { href: "/admin/taxonomies", label: "Taxonomies" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // La page de connexion n'a pas de navigation : elle s'affiche en pleine page.
  if (pathname === "/admin/login" || pathname === "/admin") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-4">
          <Image
            src="/images/brand/logo.png"
            alt="Sakalava Tours"
            width={180}
            height={56}
            className="h-10 w-auto object-contain"
            priority
          />
          <p className="mt-2 text-xs uppercase tracking-wide text-stone-400">
            Administration
          </p>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-[#1a6b2f] font-medium text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 px-3 text-xs font-medium uppercase tracking-wide text-stone-400">
            À venir
          </p>
          <ul className="mt-1 space-y-1">
            {["Réservations", "Avis", "Médias", "Blog"].map((label) => (
              <li
                key={label}
                className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-stone-300"
                title="Pas encore disponible"
              >
                {label}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-stone-200 p-3">
          {user && (
            <p className="mb-1 truncate px-3 text-xs text-stone-500" title={user.email}>
              {user.email}
            </p>
          )}
          {user && (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-[#1a6b2f]">
              {user.role}
            </p>
          )}
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:bg-stone-100"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
}