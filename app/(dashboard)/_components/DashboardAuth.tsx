"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";

type DashboardAuth = {
  ready: boolean;
  authenticated: boolean;
  label: string;
  initial: string;
  wallet?: string;
  login: () => void;
  logout: () => void;
  linkGoogle: () => void;
  linkWallet: () => void;
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

  const value = useMemo<DashboardAuth>(
    () => ({
      ready,
      authenticated,
      label,
      initial: label.slice(0, 1).toUpperCase(),
      wallet,
      login: () => login(),
      logout: () => void logout(),
      linkGoogle: () => linkGoogle(),
      linkWallet: () => linkWallet(),
    }),
    [authenticated, label, linkGoogle, linkWallet, login, logout, ready, wallet],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function MockAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const label = "demo@photoagents.ai";
  const wallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

  const value = useMemo<DashboardAuth>(
    () => ({
      ready: true,
      authenticated,
      label,
      initial: "D",
      wallet,
      login: () => setAuthenticated(true),
      logout: () => setAuthenticated(false),
      linkGoogle: () => setAuthenticated(true),
      linkWallet: () => setAuthenticated(true),
    }),
    [authenticated],
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
