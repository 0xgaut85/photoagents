"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
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
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/docs", label: "Docs / Playground", icon: BookOpen },
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
      <main className="flex min-h-dvh items-center justify-center bg-[var(--color-canvas)] text-[var(--color-ink)]">
        <div className="text-sm font-light uppercase tracking-[0.25em] text-[var(--color-muted)]">
          Loading dashboard
        </div>
      </main>
    );
  }

  const active = navItems.find((item) =>
    item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href),
  );

  return (
    <main className="min-h-dvh overflow-y-auto bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className="flex min-h-dvh">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--color-line)] bg-[var(--color-canvas)] p-5 transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-extralight tracking-[-0.04em]">
              photo<span className="text-[var(--color-muted)]"> api</span>
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
                      ? "bg-white text-[var(--color-ink)] shadow-sm"
                      : "text-[var(--color-muted)] hover:bg-white/60 hover:text-[var(--color-ink)]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isActive ? "bg-[var(--color-ink)]" : "bg-[var(--color-line)]"
                    }`}
                  />
                  <Icon size={17} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-[var(--color-line)] bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Current plan
            </p>
            <p className="mt-2 text-2xl font-extralight">$15/mo</p>
            <p className="mt-1 text-sm font-light text-[var(--color-muted)]">
              50k monthly requests
            </p>
          </div>
        </aside>

        {open ? (
          <button
            className="fixed inset-0 z-30 bg-[var(--color-ink)]/20 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu overlay"
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                <Menu size={22} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
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
                  className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
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
