"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PrivyProvider, getAccessToken, usePrivy } from "@privy-io/react-auth";

type DashboardAuth = {
  ready: boolean;
  authenticated: boolean;
  label: string;
  initial: string;
  wallet?: string;
  mockMode: boolean;
  login: () => void;
  logout: () => void;
  linkGoogle: () => void;
  linkWallet: () => void;
  /** Fetch wrapper that automatically attaches the Privy access token. */
  apiFetch: (input: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<DashboardAuth | null>(null);

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function PrivyBridge({ children }: { children: ReactNode }) {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkGoogle,
    linkWallet,
  } = usePrivy();

  const wallet = user?.wallet?.address;
  const label =
    user?.google?.email ||
    user?.email?.address ||
    (wallet ? truncateAddress(wallet) : "Photo builder");

  const apiFetch = useCallback<DashboardAuth["apiFetch"]>(async (input, init) => {
    const token = await getAccessToken();
    const headers = new Headers(init?.headers);
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (!headers.has("content-type") && init?.body) {
      headers.set("content-type", "application/json");
    }
    return fetch(input, { ...init, headers });
  }, []);

  const value = useMemo<DashboardAuth>(
    () => ({
      ready,
      authenticated,
      label,
      initial: label.slice(0, 1).toUpperCase(),
      wallet,
      mockMode: false,
      login: () => login(),
      logout: () => void logout(),
      linkGoogle: () => linkGoogle(),
      linkWallet: () => linkWallet(),
      apiFetch,
    }),
    [apiFetch, authenticated, label, linkGoogle, linkWallet, login, logout, ready, wallet],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function MockAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const label = "demo@photoagents.ai";
  const wallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

  const apiFetch = useCallback<DashboardAuth["apiFetch"]>(async () => {
    return new Response(JSON.stringify({ error: "Mock auth: API disabled" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }, []);

  const value = useMemo<DashboardAuth>(
    () => ({
      ready: true,
      authenticated,
      label,
      initial: "D",
      wallet,
      mockMode: true,
      login: () => setAuthenticated(true),
      logout: () => setAuthenticated(false),
      linkGoogle: () => setAuthenticated(true),
      linkWallet: () => setAuthenticated(true),
      apiFetch,
    }),
    [apiFetch, authenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#0e1210",
          logo: "/logotransp.png",
        },
        loginMethods: ["google", "email", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyProvider>
  );
}

export function useDashboardAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useDashboardAuth must be used inside DashboardAuthProvider");
  return value;
}
