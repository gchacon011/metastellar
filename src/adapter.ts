import { StellarMetaMaskConnector } from "./connector.js";
import { STELLAR_TESTNET } from "./networks.js";
import { getInjectedMetaMaskProvider, isMetaMaskAvailable } from "./provider.js";
import { StellarSnapClient } from "./snapClient.js";
import type {
  ConnectedAccount,
  EthereumProvider,
  MetaStellarAdapterMode,
  MetaStellarAdapterOptions,
  MetaStellarAdapterState,
  MetaStellarReadyState,
  SignTransactionOptions,
  SignatureRequest,
  SignedMessage,
  SignedSorobanInvocation,
  SignedStellarPayment,
  SorobanInvocationIntent,
  StellarNetworkConfig,
  StellarPaymentIntent
} from "./types.js";

type AdapterEvent = "connect" | "disconnect" | "accountChanged" | "networkChanged" | "error";
type AdapterListener = (payload?: unknown) => void;

export class MetaStellarAdapter {
  readonly name = "MetaStellar";
  readonly url = "https://github.com/gchacon011/metastellar";
  readonly icon = "metastellar";
  readonly mode: MetaStellarAdapterMode;

  private readonly provider: EthereumProvider;
  private readonly connector: StellarMetaMaskConnector;
  private readonly snap: StellarSnapClient;
  private readonly listeners = new Map<AdapterEvent, Set<AdapterListener>>();
  private connecting = false;
  private readonly onAccountsChanged = (payload: unknown): void => {
    void this.handleProviderAccountsChanged(payload);
  };
  private readonly onChainChanged = (payload: unknown): void => {
    void this.handleProviderChainChanged(payload);
  };

  constructor(options: MetaStellarAdapterOptions) {
    this.mode = options.mode ?? "intent";
    this.provider = options.provider ?? getInjectedMetaMaskProvider();
    this.connector = new StellarMetaMaskConnector({ ...options, provider: this.provider });
    this.snap = new StellarSnapClient({
      ...options.snap,
      provider: this.provider
    });
    this.bindProviderEvents();
  }

  get readyState(): MetaStellarReadyState {
    return this.provider || isMetaMaskAvailable() ? "installed" : "not_detected";
  }

  get connected(): boolean {
    return Boolean(this.connector.account);
  }

  get account(): ConnectedAccount | undefined {
    return this.connector.account;
  }

  get network(): StellarNetworkConfig {
    return this.connector.network;
  }

  get state(): MetaStellarAdapterState {
    return {
      connected: this.connected,
      connecting: this.connecting,
      readyState: this.readyState,
      mode: this.mode,
      ...(this.account ? { account: this.account } : {})
    };
  }

  on(event: AdapterEvent, listener: AdapterListener): () => void {
    const listeners = this.listeners.get(event) ?? new Set<AdapterListener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return () => this.off(event, listener);
  }

  off(event: AdapterEvent, listener: AdapterListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  async connect(): Promise<ConnectedAccount> {
    this.connecting = true;
    try {
      if (this.mode === "snap") {
        await this.snap.connect();
      }

      const account = await this.connector.connect();
      this.emit("connect", account);
      return account;
    } catch (error) {
      this.emit("error", error);
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    await this.connector.disconnect();
    this.emit("disconnect");
  }

  destroy(): void {
    this.provider.removeListener?.("accountsChanged", this.onAccountsChanged);
    this.provider.removeListener?.("chainChanged", this.onChainChanged);
    this.listeners.clear();
  }

  async switchNetwork(networkId: string, options?: { switchEvmChain?: boolean }): Promise<ConnectedAccount> {
    const account = await this.connector.switchStellarNetwork(networkId, options);
    this.emit("networkChanged", this.network);
    this.emit("accountChanged", account);
    return account;
  }

  async getAddress(): Promise<string | undefined> {
    if (this.mode === "snap") {
      return this.snap.getAddress({ testnet: this.network.id === STELLAR_TESTNET.id });
    }

    return (await this.connector.resolveStellarAddress()).stellarAddress;
  }

  async getBalance(address?: string): Promise<unknown> {
    return this.snap.getBalance({
      ...(address ? { address } : {}),
      testnet: this.network.id === STELLAR_TESTNET.id
    });
  }

  signMessage(request: SignatureRequest): Promise<SignedMessage> {
    return this.connector.signMessage(request);
  }

  signStr(message: string): Promise<string | SignedMessage> {
    if (this.mode === "snap") {
      return this.snap.signStr(message, { testnet: this.network.id === STELLAR_TESTNET.id });
    }

    return this.connector.signMessage({
      purpose: "message",
      statement: message
    });
  }

  signTransaction(transactionXdr: string, options: SignTransactionOptions = {}): Promise<unknown> {
    const testnet = options.testnet ?? this.network.id === STELLAR_TESTNET.id;
    if (options.submit) {
      return this.snap.signAndSubmitTransaction(transactionXdr, { testnet });
    }

    return this.snap.signTransaction(transactionXdr, { testnet });
  }

  signAndSubmitTransaction(transactionXdr: string, options: SignTransactionOptions = {}): Promise<unknown> {
    return this.snap.signAndSubmitTransaction(transactionXdr, {
      testnet: options.testnet ?? this.network.id === STELLAR_TESTNET.id
    });
  }

  signSorobanInvocation(intent: SorobanInvocationIntent): Promise<SignedSorobanInvocation> {
    return this.connector.signSorobanInvocation(intent);
  }

  signPayment(intent: StellarPaymentIntent): Promise<SignedStellarPayment> {
    return this.connector.signPayment(intent);
  }

  private emit(event: AdapterEvent, payload?: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload);
    }
  }

  private bindProviderEvents(): void {
    this.provider.on?.("accountsChanged", this.onAccountsChanged);
    this.provider.on?.("chainChanged", this.onChainChanged);
  }

  private async handleProviderAccountsChanged(payload: unknown): Promise<void> {
    try {
      const accounts = Array.isArray(payload) ? payload.filter((value): value is string => typeof value === "string") : [];
      const account = await this.connector.handleAccountsChanged(accounts);
      if (account) {
        this.emit("accountChanged", account);
        return;
      }

      this.emit("disconnect");
    } catch (error) {
      this.emit("error", error);
    }
  }

  private async handleProviderChainChanged(payload: unknown): Promise<void> {
    try {
      if (typeof payload !== "string") return;
      const account = await this.connector.handleChainChanged(payload);
      if (account) this.emit("accountChanged", account);
    } catch (error) {
      this.emit("error", error);
    }
  }
}
