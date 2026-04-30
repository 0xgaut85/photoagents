"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useDashboardAuth } from "./DashboardAuth";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/keys", label: "API keys", icon: KeyRound },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/docs", label: "Docs", icon: BookOpen },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/account", label: "Account", icon: Settings },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated, label, initial, logout } = useDashboardAuth();
  const [open, setOpen] = useState(false);
  const isLogin = pathname === "/dashboard/login";

  useEffect(() => {
    if (ready && !authenticated && !isLogin) {
      router.replace("/dashboard/login");
    }
  }, [authenticated, isLogin, ready, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!ready || !authenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink)]">
        <div className="text-sm font-light uppercase tracking-[0.25em] text-[var(--color-ink)]/60">
          Loading dashboard
        </div>
      </main>
    );
  }

  const active = navItems.find((item) =>
    item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href),
  );

  return (
    <main className="min-h-dvh overflow-y-auto bg-[var(--color-paper)] text-[var(--color-ink)]">
      <div className="flex min-h-dvh">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[var(--color-ink)]/10 bg-[var(--color-paper)] p-5 transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logotransp.png"
                alt="photo agents"
                width={24}
                height={24}
                className="opacity-90"
              />
              <span className="text-sm uppercase tracking-[0.28em]">photo agents</span>
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <nav className="mt-12 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-light transition ${
                    isActive
                      ? "bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-[0_8px_24px_-12px_rgba(14,18,16,0.3)]"
                      : "text-[var(--color-ink)]/65 hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
                  }`}
                >
                  <Icon size={17} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink)]/45">
            v0.1 — preview
          </div>
        </aside>

        {open ? (
          <button
            className="fixed inset-0 z-30 bg-[var(--color-ink)]/30 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu overlay"
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/85 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                <Menu size={22} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-ink)]/55">
                  Dashboard
                </p>
                <h1 className="text-2xl font-extralight tracking-[-0.04em]">
                  {active?.label ?? "Overview"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm font-light md:block">
                <p>{label}</p>
                <button
                  onClick={logout}
                  className="text-xs text-[var(--color-ink)]/55 transition hover:text-[var(--color-ink)]"
                >
                  Sign out
                </button>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-ink)] text-sm text-[var(--color-canvas)]">
                {initial}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 md:px-8 lg:py-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
