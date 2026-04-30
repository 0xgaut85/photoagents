"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Wallet } from "lucide-react";
import { useDashboardAuth } from "../../_components/DashboardAuth";

export default function LoginPage() {
  const router = useRouter();
  const { ready, authenticated, login } = useDashboardAuth();

  useEffect(() => {
    if (ready && authenticated) router.replace("/dashboard");
  }, [authenticated, ready, router]);

  return (
    <main className="relative flex min-h-dvh flex-col bg-[var(--color-paper)] text-[var(--color-ink)]">
      <header className="flex items-center justify-between p-6 md:p-10">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm uppercase tracking-[0.3em]"
        >
          <Image
            src="/logotransp.png"
            alt="photo agents"
            width={28}
            height={28}
            className="opacity-90"
          />
          <span>photo agents</span>
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/60 transition-opacity hover:opacity-100"
        >
          ← Back to site
        </Link>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 pb-16 pt-4 md:pb-24">
        <div className="grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-ink)]/60">
              API dashboard
            </p>
            <h1 className="mt-6 text-5xl font-extralight tracking-[-0.06em] md:text-7xl">
              Your agent
              <br />
              needs eyes.
            </h1>
            <p className="mt-8 max-w-md text-base font-light leading-relaxed text-[var(--color-ink)]/70 md:text-lg">
              Sign in once. Create photo API keys, watch usage, manage billing,
              invite your team.
            </p>
            <p className="mt-12 text-sm font-light italic text-[var(--color-ink)]/55">
              Smile, you&apos;re being trained.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-ink)]/15 bg-[var(--color-canvas)] p-8 shadow-[0_30px_80px_-40px_rgba(14,18,16,0.45)] md:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
              Open the console
            </p>
            <h2 className="mt-4 text-3xl font-extralight tracking-[-0.04em]">
              One sign-in. Three doors.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
              Privy opens a single modal for Google, email, and wallets — pick
              whichever you already trust.
            </p>

            <button
              type="button"
              onClick={login}
              disabled={!ready}
              className="mt-8 inline-flex w-full items-center justify-between rounded-full bg-[var(--color-ink)] px-6 py-4 text-sm uppercase tracking-[0.22em] text-[var(--color-canvas)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{ready ? "Continue with Privy" : "Loading…"}</span>
              <ArrowRight size={16} />
            </button>

            <ul className="mt-6 grid grid-cols-3 gap-2 text-xs text-[var(--color-muted)]">
              <li className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-2.5">
                <GoogleGlyph />
                <span>Google</span>
              </li>
              <li className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-2.5">
                <Mail size={13} strokeWidth={1.5} />
                <span>Email</span>
              </li>
              <li className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-2.5">
                <Wallet size={13} strokeWidth={1.5} />
                <span>Wallet</span>
              </li>
            </ul>

            <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
              By continuing, you agree to the photo agents terms.
            </p>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between px-6 pb-8 text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink)]/55 md:px-10">
        <span>© photo agents</span>
        <span>v0.1 — preview</span>
      </footer>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
