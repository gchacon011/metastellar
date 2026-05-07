import { StellarMetaMaskConnectorError } from "./errors.js";
import type { EthereumProvider, MetaStellarSnapMethod, SnapClientOptions, StellarSnapRequestParams } from "./types.js";

export const DEFAULT_STELLAR_SNAP_ID = "npm:stellar-snap";

export class StellarSnapClient {
  private readonly provider: EthereumProvider;
  private readonly snapId: string;
  private readonly requireFlask: boolean;

  constructor(options: SnapClientOptions = {}) {
    this.provider = options.provider ?? getInjectedMetaMaskProvider();
    this.snapId = options.snapId ?? DEFAULT_STELLAR_SNAP_ID;
    this.requireFlask = options.requireFlask ?? false;
  }

  async connect(): Promise<unknown> {
    await this.assertFlaskIfRequired();
    return this.provider.request({
      method: "wallet_requestSnaps",
      params: {
        [this.snapId]: {}
      }
    });
  }

  async invoke<T = unknown>(method: MetaStellarSnapMethod, params?: StellarSnapRequestParams): Promise<T> {
    if (method === "connect") {
      return this.connect() as Promise<T>;
    }

    return this.provider.request<T>({
      method: "wallet_invokeSnap",
      params: {
        snapId: this.snapId,
        request: {
          method,
          params: params ?? {}
        }
      }
    });
  }

  getAddress(params?: StellarSnapRequestParams): Promise<string> {
    return this.invoke("getAddress", params);
  }

  getBalance(params?: StellarSnapRequestParams): Promise<unknown> {
    return this.invoke("getBalance", params);
  }

  signTransaction(transaction: string, params: StellarSnapRequestParams = {}): Promise<string> {
    return this.invoke("signTransaction", { ...params, transaction });
  }

  signAndSubmitTransaction(transaction: string, params: StellarSnapRequestParams = {}): Promise<unknown> {
    return this.invoke("signAndSubmitTransaction", { ...params, transaction });
  }

  signStr(message: string, params: StellarSnapRequestParams = {}): Promise<string> {
    return this.invoke("signStr", { ...params, message });
  }

  private async assertFlaskIfRequired(): Promise<void> {
    if (!this.requireFlask) return;

    const version = await this.provider.request<string>({ method: "web3_clientVersion" });
    if (!version.toLowerCase().includes("flask")) {
      throw new StellarMetaMaskConnectorError(
        "MetaMask Flask is required for this Snap flow",
        "METAMASK_FLASK_REQUIRED"
      );
    }
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

function getInjectedMetaMaskProvider(): EthereumProvider {
  const maybeWindow = globalThis as typeof globalThis & { ethereum?: EthereumProvider };
  if (!maybeWindow.ethereum) {
    throw new StellarMetaMaskConnectorError("MetaMask provider was not found", "NO_METAMASK");
  }

  return maybeWindow.ethereum;
}
