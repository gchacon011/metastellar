import { invariant } from "./errors.js";
import type { AddressMapping, AddressResolver, Hex, StellarNetworkConfig } from "./types.js";

const HEX_40 = /^0x[a-fA-F0-9]{40}$/;

export function normalizeEvmAddress(address: string): Hex {
  invariant(HEX_40.test(address), `Invalid EVM address: ${address}`, "INVALID_EVM_ADDRESS");
  return `0x${address.slice(2).toLowerCase()}`;
}

export async function sha256Hex(input: string): Promise<Hex> {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

export function bytesToHex(bytes: Uint8Array): Hex {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function randomNonce(bytes = 16): string {
  const out = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(out);
  return Array.from(out, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class DeterministicAddressResolver implements AddressResolver {
  readonly name = "deterministic-offchain-v1";

  async resolve(evmAddress: Hex, network: StellarNetworkConfig): Promise<AddressMapping> {
    return {
      evmAddress,
      identityHash: await sha256Hex(`${network.networkPassphrase}:${evmAddress}`),
      resolver: this.name
    };
  }
}

export class StaticAddressResolver implements AddressResolver {
  readonly name = "static-map-v1";

  constructor(private readonly mappings: Record<string, string>) {}

  async resolve(evmAddress: Hex, network: StellarNetworkConfig): Promise<AddressMapping> {
    const normalized = normalizeEvmAddress(evmAddress);
    const stellarAddress = this.mappings[`${network.id}:${normalized}`] ?? this.mappings[normalized];

    return {
      evmAddress: normalized,
      ...(stellarAddress ? { stellarAddress } : {}),
      identityHash: await sha256Hex(`${network.networkPassphrase}:${normalized}`),
      resolver: this.name
    };
  }
}
