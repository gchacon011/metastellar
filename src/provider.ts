import { StellarMetaMaskConnectorError } from "./errors.js";
import type { EthereumProvider } from "./types.js";

export interface ProviderRequestOptions {
  timeoutMs?: number;
}

export function isMetaMaskAvailable(): boolean {
  return Boolean(getOptionalInjectedProvider());
}

export function getOptionalInjectedProvider(): EthereumProvider | undefined {
  const maybeWindow = globalThis as typeof globalThis & { ethereum?: EthereumProvider };
  return maybeWindow.ethereum;
}

export function getInjectedMetaMaskProvider(): EthereumProvider {
  const provider = getOptionalInjectedProvider();
  if (!provider) {
    throw new StellarMetaMaskConnectorError("MetaMask provider was not found", "NO_METAMASK");
  }

  return provider;
}

export async function requestProvider<T>(
  provider: EthereumProvider,
  args: { method: string; params?: unknown[] | Record<string, unknown> },
  options: ProviderRequestOptions = {}
): Promise<T> {
  try {
    const request = provider.request<T>(args);
    if (!options.timeoutMs) {
      return await request;
    }

    return await withTimeout(request, options.timeoutMs, args.method);
  } catch (error) {
    throw normalizeProviderError(error, args.method);
  }
}

export function normalizeProviderError(error: unknown, method: string): StellarMetaMaskConnectorError {
  if (error instanceof StellarMetaMaskConnectorError) {
    return error;
  }

  const providerError = error as { code?: unknown; message?: unknown };
  const code = typeof providerError.code === "number" ? providerError.code : undefined;
  const message = typeof providerError.message === "string" ? providerError.message : undefined;

  if (code === 4001) {
    return new StellarMetaMaskConnectorError(`User rejected ${method}`, "USER_REJECTED", error);
  }

  if (code === -32002) {
    return new StellarMetaMaskConnectorError(
      `MetaMask already has a pending ${method} request`,
      "REQUEST_ALREADY_PENDING",
      error
    );
  }

  if (code === 4902) {
    return new StellarMetaMaskConnectorError(`Requested EVM chain is not available in MetaMask`, "UNKNOWN_EVM_CHAIN", error);
  }

  return new StellarMetaMaskConnectorError(message ?? `MetaMask request failed: ${method}`, "PROVIDER_REQUEST_FAILED", error);
}

async function withTimeout<T>(request: Promise<T>, timeoutMs: number, method: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new StellarMetaMaskConnectorError(`Timed out waiting for ${method}`, "PROVIDER_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([request, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
