"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Wallet } from "lucide-react";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import { Button, Card } from "../../_components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { ready, authenticated, login } = useDashboardAuth();

  useEffect(() => {
    if (ready && authenticated) router.replace("/dashboard");
  }, [authenticated, ready, router]);

  return (
    <main className="grid min-h-dvh bg-[var(--color-canvas)] text-[var(--color-ink)] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between p-8 md:p-12">
        <Link href="/" className="text-2xl font-extralight tracking-[-0.04em]">
          photo<span className="text-[var(--color-muted)]"> agents</span>
        </Link>

        <div className="max-w-2xl py-20">
          <p className="mb-5 text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            API dashboard
          </p>
          <h1 className="text-6xl font-extralight tracking-[-0.07em] md:text-7xl">
            Your agent needs eyes.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-[var(--color-muted)]">
            Sign in with Google, email, or a wallet. Create photo API keys, watch
            usage, invite your team, and test requests before the backend exists.
          </p>
        </div>

        <p className="text-sm font-light text-[var(--color-muted)]">
          Smile, you're being trained.
        </p>
      </section>

      <section className="flex items-center justify-center border-t border-[var(--color-line)] p-6 lg:border-l lg:border-t-0">
        <Card className="w-full max-w-md">
          <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-ink)] text-[var(--color-canvas)]">
            <KeyRound size={24} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-extralight tracking-[-0.04em]">
            Open the console
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
            Privy opens one unified modal for Google, email, and wallets. Add
            your real app id to `.env.local` when you are ready to test live auth.
          </p>

          <Button className="mt-8 w-full" onClick={login} disabled={!ready}>
            Continue with Privy <ArrowRight size={16} />
          </Button>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-[var(--color-muted)]">
            <span className="rounded-full border border-[var(--color-line)] px-3 py-2">
              Google
            </span>
            <span className="rounded-full border border-[var(--color-line)] px-3 py-2">
              Email
            </span>
            <span className="rounded-full border border-[var(--color-line)] px-3 py-2">
              <Wallet className="mx-auto" size={14} />
            </span>
          </div>
        </Card>
      </section>
    </main>
  );
}
