import { invariant } from "./errors.js";
import type { Hex } from "./types.js";

export interface StellarSdkLike {
  nativeToScVal(value: unknown, options?: unknown): unknown;
}

export interface SorobanEvmSignatureScVals {
  signer: unknown;
  signature: unknown;
  nonce: unknown;
  issuedAt: unknown;
}

export function splitEvmSignature(signature: Hex): { r: Hex; s: Hex; v: number } {
  invariant(/^0x[a-fA-F0-9]{130}$/.test(signature), "Expected a 65-byte EVM signature", "INVALID_SIGNATURE");
  const r = `0x${signature.slice(2, 66)}` as Hex;
  const s = `0x${signature.slice(66, 130)}` as Hex;
  const v = Number.parseInt(signature.slice(130, 132), 16);
  return { r, s, v };
}

export function evmSignatureToSorobanScVals(params: {
  sdk: StellarSdkLike;
  signer: Hex;
  signature: Hex;
  nonce: string;
  issuedAt: string;
}): SorobanEvmSignatureScVals {
  return {
    signer: params.sdk.nativeToScVal(params.signer),
    signature: params.sdk.nativeToScVal(splitEvmSignature(params.signature)),
    nonce: params.sdk.nativeToScVal(params.nonce),
    issuedAt: params.sdk.nativeToScVal(params.issuedAt)
  };
}
