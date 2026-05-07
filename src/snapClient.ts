import { StellarMetaMaskConnectorError } from "./errors.js";
import { getInjectedMetaMaskProvider, requestProvider } from "./provider.js";
import { assertBase64ishXdr, assertNonEmptyString, assertPositiveAmount, assertStellarAddress } from "./validation.js";
import type { EthereumProvider, MetaStellarSnapMethod, SnapClientOptions, StellarSnapRequestParams } from "./types.js";

export const DEFAULT_STELLAR_SNAP_ID = "npm:stellar-snap";

export class StellarSnapClient {
  private readonly provider: EthereumProvider;
  private readonly snapId: string;
  private readonly requireFlask: boolean;
  private readonly requestTimeoutMs?: number;

  constructor(options: SnapClientOptions = {}) {
    this.provider = options.provider ?? getInjectedMetaMaskProvider();
    this.snapId = options.snapId ?? DEFAULT_STELLAR_SNAP_ID;
    this.requireFlask = options.requireFlask ?? false;
    this.requestTimeoutMs = options.requestTimeoutMs;
  }

  async connect(): Promise<unknown> {
    await this.assertFlaskIfRequired();
    return requestProvider(
      this.provider,
      {
        method: "wallet_requestSnaps",
        params: {
          [this.snapId]: {}
        }
      },
      this.providerRequestOptions()
    );
  }

  async getInstalledSnaps(): Promise<Record<string, unknown>> {
    return requestProvider<Record<string, unknown>>(
      this.provider,
      { method: "wallet_getSnaps" },
      this.providerRequestOptions()
    );
  }

  async isInstalled(): Promise<boolean> {
    const snaps = await this.getInstalledSnaps();
    return Boolean(snaps[this.snapId]);
  }

  async invoke<T = unknown>(method: MetaStellarSnapMethod, params?: StellarSnapRequestParams): Promise<T> {
    if (method === "connect") {
      return this.connect() as Promise<T>;
    }

    return requestProvider<T>(
      this.provider,
      {
        method: "wallet_invokeSnap",
        params: {
          snapId: this.snapId,
          request: {
            method,
            params: params ?? {}
          }
        }
      },
      this.providerRequestOptions()
    );
  }

  getAddress(params?: StellarSnapRequestParams): Promise<string> {
    return this.invoke("getAddress", params);
  }

  getBalance(params?: StellarSnapRequestParams): Promise<unknown> {
    return this.invoke("getBalance", params);
  }

  getAccountInfo(address: string, params: StellarSnapRequestParams = {}): Promise<unknown> {
    assertStellarAddress(address);
    return this.invoke("getAccountInfo", { ...params, address });
  }

  transfer(to: string, amount: string, params: StellarSnapRequestParams = {}): Promise<unknown> {
    assertStellarAddress(to, "to");
    assertPositiveAmount(amount);
    return this.invoke("transfer", { ...params, to, amount });
  }

  fund(params: StellarSnapRequestParams = {}): Promise<unknown> {
    return this.invoke("fund", params);
  }

  signTransaction(transaction: string, params: StellarSnapRequestParams = {}): Promise<string> {
    assertBase64ishXdr(transaction, "transaction");
    return this.invoke("signTransaction", { ...params, transaction });
  }

  signAndSubmitTransaction(transaction: string, params: StellarSnapRequestParams = {}): Promise<unknown> {
    assertBase64ishXdr(transaction, "transaction");
    return this.invoke("signAndSubmitTransaction", { ...params, transaction });
  }

  signStr(message: string, params: StellarSnapRequestParams = {}): Promise<string> {
    assertNonEmptyString(message, "message");
    return this.invoke("signStr", { ...params, message });
  }

  listAccounts(params?: StellarSnapRequestParams): Promise<unknown> {
    return this.invoke("listAccounts", params);
  }

  getAssets(params?: StellarSnapRequestParams): Promise<unknown> {
    return this.invoke("getAssets", params);
  }

  private async assertFlaskIfRequired(): Promise<void> {
    if (!this.requireFlask) return;

    const version = await requestProvider<string>(
      this.provider,
      { method: "web3_clientVersion" },
      this.providerRequestOptions()
    );
    if (!version.toLowerCase().includes("flask")) {
      throw new StellarMetaMaskConnectorError(
        "MetaMask Flask is required for this Snap flow",
        "METAMASK_FLASK_REQUIRED"
      );
    }
  }

  private providerRequestOptions(): { timeoutMs?: number } {
    return this.requestTimeoutMs ? { timeoutMs: this.requestTimeoutMs } : {};
  }
}

export async function callMetaStellar<T = unknown>(
  method: MetaStellarSnapMethod,
  params?: StellarSnapRequestParams,
  options?: SnapClientOptions
): Promise<T> {
  const client = new StellarSnapClient(options);
  return client.invoke<T>(method, params);
}
