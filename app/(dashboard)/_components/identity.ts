import type { User } from "@privy-io/react-auth";

export function getUserLabel(user: User | null) {
  if (!user) return "Photo builder";
  const email = user.email?.address;
  const google = user.google?.email;
  const wallet = user.wallet?.address;

  if (google) return google;
  if (email) return email;
  if (wallet) return truncateAddress(wallet);
  return "Photo builder";
}

export function getUserInitial(user: User | null) {
  return getUserLabel(user).slice(0, 1).toUpperCase();
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
