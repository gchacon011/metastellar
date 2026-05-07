import { StellarMetaMaskConnector } from "./connector.js";
import { STELLAR_TESTNET } from "./networks.js";
import { StellarSnapClient } from "./snapClient.js";
import type {
  ConnectedAccount,
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

  private readonly connector: StellarMetaMaskConnector;
  private readonly snap: StellarSnapClient;
  private readonly listeners = new Map<AdapterEvent, Set<AdapterListener>>();
  private connecting = false;

  constructor(options: MetaStellarAdapterOptions) {
    this.mode = options.mode ?? "intent";
    this.connector = new StellarMetaMaskConnector(options);
    this.snap = new StellarSnapClient({
      ...(options.provider ? { provider: options.provider } : {}),
      ...options.snap
    });
  }

  get readyState(): MetaStellarReadyState {
    const maybeWindow = globalThis as typeof globalThis & { ethereum?: unknown };
    return maybeWindow.ethereum ? "installed" : "not_detected";
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
}
