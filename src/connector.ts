import { DeterministicAddressResolver, normalizeEvmAddress, randomNonce } from "./addressMapping.js";
import { StellarMetaMaskConnectorError, invariant } from "./errors.js";
import { buildMessageToSign, buildPaymentTypedData, buildSorobanInvocationTypedData } from "./eip712.js";
import { DEFAULT_NETWORKS, normalizeChainId } from "./networks.js";
import type {
  AddressMapping,
  AddressResolver,
  ConnectedAccount,
  ConnectorOptions,
  EthereumProvider,
  Hex,
  SignatureRequest,
  SignedMessage,
  SignedSorobanInvocation,
  SignedStellarPayment,
  SorobanInvocationIntent,
  StellarNetworkConfig,
  StellarPaymentIntent
} from "./types.js";

export class StellarMetaMaskConnector {
  private readonly provider: EthereumProvider;
  private readonly appName: string;
  private readonly appVersion: string;
  private readonly networks: StellarNetworkConfig[];
  private readonly addressResolver: AddressResolver;
  private readonly nonceProvider: () => Promise<string> | string;
  private readonly now: () => Date;
  private activeNetwork: StellarNetworkConfig;
  private evmAddress?: Hex;
  private evmChainId?: Hex;
  private stellarMapping?: AddressMapping;

  constructor(options: ConnectorOptions) {
    this.provider = options.provider ?? getInjectedMetaMaskProvider();
    this.appName = options.appName;
    this.appVersion = options.appVersion ?? "1";
    this.networks = [...(options.networks ?? DEFAULT_NETWORKS)];
    invariant(this.networks.length > 0, "At least one Stellar network must be configured", "NO_NETWORKS");
    this.activeNetwork =
      this.networks.find((network) => network.id === options.defaultNetworkId) ?? this.networks[0]!;
    this.addressResolver = options.addressResolver ?? new DeterministicAddressResolver();
    this.nonceProvider = options.nonceProvider ?? randomNonce;
    this.now = options.now ?? (() => new Date());
  }

  get network(): StellarNetworkConfig {
    return this.activeNetwork;
  }

  get account(): ConnectedAccount | undefined {
    if (!this.evmAddress || !this.evmChainId) return undefined;
    return {
      evmAddress: this.evmAddress,
      evmChainId: this.evmChainId,
      ...(this.stellarMapping?.stellarAddress ? { stellarAddress: this.stellarMapping.stellarAddress } : {}),
      stellarNetwork: this.activeNetwork
    };
  }

  async connect(): Promise<ConnectedAccount> {
    const accounts = await this.provider.request<string[]>({ method: "eth_requestAccounts" });
    invariant(accounts.length > 0 && accounts[0], "MetaMask returned no accounts", "NO_ACCOUNTS");
    this.evmAddress = normalizeEvmAddress(accounts[0]);
    this.evmChainId = normalizeChainId(await this.provider.request<string>({ method: "eth_chainId" }));
    this.stellarMapping = await this.addressResolver.resolve(this.evmAddress, this.activeNetwork);
    return this.requireAccount();
  }

  async disconnect(): Promise<void> {
    this.evmAddress = undefined;
    this.evmChainId = undefined;
    this.stellarMapping = undefined;
  }

  async switchStellarNetwork(networkId: string, options: { switchEvmChain?: boolean } = {}): Promise<ConnectedAccount> {
    const next = this.networks.find((network) => network.id === networkId);
    invariant(next, `Unknown Stellar network: ${networkId}`, "UNKNOWN_NETWORK");
    this.activeNetwork = next;

    if (options.switchEvmChain && next.expectedEvmChainId) {
      await this.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: next.expectedEvmChainId }]
      });
      this.evmChainId = normalizeChainId(await this.provider.request<string>({ method: "eth_chainId" }));
    }

    if (!this.evmAddress) {
      return this.connect();
    }

    this.stellarMapping = await this.addressResolver.resolve(this.evmAddress, this.activeNetwork);
    return this.requireAccount();
  }

  async resolveStellarAddress(): Promise<AddressMapping> {
    const account = await this.ensureConnected();
    this.stellarMapping = await this.addressResolver.resolve(account.evmAddress, this.activeNetwork);
    return this.stellarMapping;
  }

  async signMessage(request: SignatureRequest): Promise<SignedMessage> {
    const account = await this.ensureConnected();
    const issuedAt = request.issuedAt ?? this.now().toISOString();
    const message = buildMessageToSign({ ...request, issuedAt }, this.activeNetwork);
    const signature = await this.provider.request<Hex>({
      method: "personal_sign",
      params: [message, account.evmAddress]
    });

    return {
      evmAddress: account.evmAddress,
      evmChainId: account.evmChainId,
      stellarNetworkId: this.activeNetwork.id,
      message,
      signature,
      issuedAt
    };
  }

  async signSorobanInvocation(intent: SorobanInvocationIntent): Promise<SignedSorobanInvocation> {
    const account = await this.ensureConnected();
    const nonce = await this.nonceProvider();
    const issuedAt = this.now().toISOString();
    const typedData = buildSorobanInvocationTypedData({
      appName: this.appName,
      appVersion: this.appVersion,
      evmChainId: account.evmChainId,
      network: this.activeNetwork,
      evmAddress: account.evmAddress,
      ...(account.stellarAddress ? { stellarAddress: account.stellarAddress } : {}),
      nonce,
      issuedAt,
      intent
    });
    const signed = await this.signTypedDataOrFallback(account.evmAddress, typedData);

    return {
      kind: "soroban-invocation",
      evmAddress: account.evmAddress,
      evmChainId: account.evmChainId,
      ...(account.stellarAddress ? { stellarAddress: account.stellarAddress } : {}),
      stellarNetwork: this.activeNetwork,
      intent,
      nonce,
      issuedAt,
      signature: signed.signature,
      signingMethod: signed.method
    };
  }

  async signPayment(intent: StellarPaymentIntent): Promise<SignedStellarPayment> {
    const account = await this.ensureConnected();
    const nonce = await this.nonceProvider();
    const issuedAt = this.now().toISOString();
    const typedData = buildPaymentTypedData({
      appName: this.appName,
      appVersion: this.appVersion,
      evmChainId: account.evmChainId,
      network: this.activeNetwork,
      evmAddress: account.evmAddress,
      ...(account.stellarAddress ? { stellarAddress: account.stellarAddress } : {}),
      nonce,
      issuedAt,
      intent
    });
    const signed = await this.signTypedDataOrFallback(account.evmAddress, typedData);

    return {
      kind: "stellar-payment",
      evmAddress: account.evmAddress,
      evmChainId: account.evmChainId,
      ...(account.stellarAddress ? { stellarAddress: account.stellarAddress } : {}),
      stellarNetwork: this.activeNetwork,
      intent,
      nonce,
      issuedAt,
      signature: signed.signature,
      signingMethod: signed.method
    };
  }

  private async ensureConnected(): Promise<ConnectedAccount> {
    return this.account ?? this.connect();
  }

  private requireAccount(): ConnectedAccount {
    invariant(this.evmAddress && this.evmChainId, "Connector is not connected", "NOT_CONNECTED");
    return {
      evmAddress: this.evmAddress,
      evmChainId: this.evmChainId,
      ...(this.stellarMapping?.stellarAddress ? { stellarAddress: this.stellarMapping.stellarAddress } : {}),
      stellarNetwork: this.activeNetwork
    };
  }

  private async signTypedDataOrFallback(
    evmAddress: Hex,
    typedData: unknown
  ): Promise<{ signature: Hex; method: "eth_signTypedData_v4" | "personal_sign" }> {
    try {
      return {
        signature: await this.provider.request<Hex>({
          method: "eth_signTypedData_v4",
          params: [evmAddress, JSON.stringify(typedData)]
        }),
        method: "eth_signTypedData_v4"
      };
    } catch (cause) {
      const signature = await this.provider.request<Hex>({
        method: "personal_sign",
        params: [JSON.stringify(typedData), evmAddress]
      });
      return { signature, method: "personal_sign" };
    }
  }
}

function getInjectedMetaMaskProvider(): EthereumProvider {
  const maybeWindow = globalThis as typeof globalThis & { ethereum?: EthereumProvider };
  if (!maybeWindow.ethereum) {
    throw new StellarMetaMaskConnectorError("MetaMask provider was not found", "NO_METAMASK");
  }

  return maybeWindow.ethereum;
}
