import { invariant } from "./errors.js";

const STELLAR_ADDRESS = /^[CGM][A-Z2-7]{55}$/;
const CONTRACT_ID = /^C[A-Z2-7]{55}$/;
const POSITIVE_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function assertNonEmptyString(value: string | undefined, label: string): asserts value is string {
  invariant(typeof value === "string" && value.trim().length > 0, `${label} is required`, "INVALID_INPUT");
}

export function assertStellarAddress(value: string, label = "Stellar address"): void {
  invariant(STELLAR_ADDRESS.test(value), `${label} is not a valid Stellar address`, "INVALID_STELLAR_ADDRESS");
}

export function assertContractId(value: string): void {
  invariant(CONTRACT_ID.test(value), "contractId is not a valid Soroban contract ID", "INVALID_CONTRACT_ID");
}

export function assertPositiveAmount(value: string): void {
  invariant(POSITIVE_DECIMAL.test(value) && Number(value) > 0, "amount must be a positive decimal string", "INVALID_AMOUNT");
}

export function assertBase64ishXdr(value: string, label: string): void {
  assertNonEmptyString(value, label);
  invariant(/^[A-Za-z0-9+/]+={0,2}$/.test(value), `${label} should be base64-encoded XDR`, "INVALID_XDR");
}
