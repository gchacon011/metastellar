import type { Hex, StellarNetworkConfig } from "./types.js";

export const STELLAR_PUBLIC: StellarNetworkConfig = {
  id: "public",
  name: "Stellar Public Network",
  networkPassphrase: "Public Global Stellar Network ; September 2015",
  rpcUrl: "https://mainnet.sorobanrpc.com",
  horizonUrl: "https://horizon.stellar.org",
  expectedEvmChainId: "0x1"
};

export const STELLAR_TESTNET: StellarNetworkConfig = {
  id: "testnet",
  name: "Stellar Testnet",
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  expectedEvmChainId: "0xaa36a7"
};

export const DEFAULT_NETWORKS = [STELLAR_PUBLIC, STELLAR_TESTNET] as const;

export function normalizeChainId(chainId: string | number): Hex {
  if (typeof chainId === "number") {
    return `0x${chainId.toString(16)}`;
  }

  if (chainId.startsWith("0x")) {
    return `0x${chainId.slice(2).toLowerCase()}`;
  }

  return `0x${Number(chainId).toString(16)}`;
}
