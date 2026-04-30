import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";

// USDC on Base mainnet.
export const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const PLAN_PRICE_USD = 15;

const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const baseClient = createPublicClient({ chain: base, transport: http() });

export async function getUsdcBalanceOnBase(address: string): Promise<number> {
  if (!address) return 0;
  try {
    const raw = (await baseClient.readContract({
      address: USDC_BASE_ADDRESS,
      abi: erc20BalanceAbi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    })) as bigint;
    return Number(formatUnits(raw, 6));
  } catch (error) {
    console.warn("USDC balance check failed:", error);
    return 0;
  }
}

/**
 * Build a Coinbase Onramp URL for buying USDC on Base directly into the user's wallet.
 * If NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID is missing, falls back to the generic /buy page.
 */
export function buildOnrampUrl(input: {
  walletAddress: string;
  amountUsd?: number;
}): string {
  const amount = input.amountUsd ?? PLAN_PRICE_USD;
  const appId = process.env.NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID;

  if (!appId) {
    return "https://pay.coinbase.com/buy";
  }

  const destinationWallets = encodeURIComponent(
    JSON.stringify([{ address: input.walletAddress, blockchains: ["base"] }]),
  );

  const params = new URLSearchParams({
    appId,
    destinationWallets,
    presetFiatAmount: amount.toString(),
    fiatCurrency: "USD",
    defaultAsset: "USDC",
    defaultNetwork: "base",
  });

  return `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
}
