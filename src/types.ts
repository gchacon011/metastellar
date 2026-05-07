export type Hex = `0x${string}`;

export interface EthereumProvider {
  isMetaMask?: boolean;
  request<T = unknown>(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export type MetaStellarSnapMethod =
  | "connect"
  | "getAddress"
  | "getAccountInfo"
  | "getBalance"
  | "transfer"
  | "fund"
  | "signTransaction"
  | "signAndSubmitTransaction"
  | "getDataPacket"
  | "setCurrentAccount"
  | "showAddress"
  | "createAccount"
  | "listAccounts"
  | "renameAccount"
  | "importAccount"
  | "getAssets"
  | "sendAuthRequest"
  | "signStr";

export interface SnapClientOptions {
  provider?: EthereumProvider;
  snapId?: string;
  requireFlask?: boolean;
  requestTimeoutMs?: number;
}

export interface StellarSnapRequestParams {
  testnet?: boolean;
  [key: string]: unknown;
}

export type MetaStellarAdapterMode = "snap" | "intent";

export type MetaStellarReadyState = "not_detected" | "installed" | "loadable";

export interface MetaStellarAdapterOptions extends ConnectorOptions {
  mode?: MetaStellarAdapterMode;
  snap?: SnapClientOptions;
}

export interface MetaStellarAdapterState {
  connected: boolean;
  connecting: boolean;
  readyState: MetaStellarReadyState;
  mode: MetaStellarAdapterMode;
  account?: ConnectedAccount;
}

export interface SignTransactionOptions {
  testnet?: boolean;
  submit?: boolean;
}

export interface StellarNetworkConfig {
  id: string;
  name: string;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl?: string;
  friendbotUrl?: string;
  expectedEvmChainId?: Hex;
}

export interface ConnectedAccount {
  evmAddress: Hex;
  evmChainId: Hex;
  stellarAddress?: string;
  stellarNetwork: StellarNetworkConfig;
}

export interface AddressMapping {
  evmAddress: Hex;
  stellarAddress?: string;
  identityHash: Hex;
  resolver: string;
}

export interface AddressResolver {
  name: string;
  resolve(evmAddress: Hex, network: StellarNetworkConfig): Promise<AddressMapping>;
}

export interface ConnectorOptions {
  appName: string;
  appVersion?: string;
  provider?: EthereumProvider;
  networks?: StellarNetworkConfig[];
  defaultNetworkId?: string;
  addressResolver?: AddressResolver;
  nonceProvider?: () => Promise<string> | string;
  now?: () => Date;
  requestTimeoutMs?: number;
  allowTypedDataFallback?: boolean;
}

export interface SignatureRequest {
  purpose: "message" | "soroban-invocation" | "stellar-payment";
  statement: string;
  nonce?: string;
  issuedAt?: string;
  expirationTime?: string;
  metadata?: Record<string, unknown>;
}

export interface SignedMessage {
  evmAddress: Hex;
  evmChainId: Hex;
  stellarNetworkId: string;
  message: string;
  signature: Hex;
  issuedAt: string;
}

export interface SorobanInvocationIntent {
  contractId: string;
  functionName: string;
  argsXdr?: string[];
  transactionXdr?: string;
  authEntryXdr?: string;
  sourceAccount?: string;
  maxFee?: string;
  validUntilLedgerSeq?: number;
  metadata?: Record<string, unknown>;
}

export interface SignedSorobanInvocation {
  kind: "soroban-invocation";
  evmAddress: Hex;
  evmChainId: Hex;
  stellarAddress?: string;
  stellarNetwork: StellarNetworkConfig;
  intent: SorobanInvocationIntent;
  nonce: string;
  issuedAt: string;
  signature: Hex;
  signingMethod: "eth_signTypedData_v4" | "personal_sign";
}

export interface StellarPaymentIntent {
  destination: string;
  asset: "XLM" | { code: string; issuer: string };
  amount: string;
  memo?: string;
  sourceAccount?: string;
  maxFee?: string;
  validUntilLedgerSeq?: number;
  metadata?: Record<string, unknown>;
}

export interface SignedStellarPayment {
  kind: "stellar-payment";
  evmAddress: Hex;
  evmChainId: Hex;
  stellarAddress?: string;
  stellarNetwork: StellarNetworkConfig;
  intent: StellarPaymentIntent;
  nonce: string;
  issuedAt: string;
  signature: Hex;
  signingMethod: "eth_signTypedData_v4" | "personal_sign";
}

export interface Eip712TypedData {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: Record<string, unknown>;
  message: Record<string, unknown>;
}
