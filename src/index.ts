export { DeterministicAddressResolver, StaticAddressResolver, normalizeEvmAddress } from "./addressMapping.js";
export { StellarMetaMaskConnectorError } from "./errors.js";
export { buildMessageToSign, buildPaymentTypedData, buildSorobanInvocationTypedData } from "./eip712.js";
export { DEFAULT_NETWORKS, STELLAR_PUBLIC, STELLAR_TESTNET, normalizeChainId } from "./networks.js";
export { MetaStellarAdapter } from "./adapter.js";
export { getInjectedMetaMaskProvider, getOptionalInjectedProvider, isMetaMaskAvailable, requestProvider } from "./provider.js";
export { StellarMetaMaskConnector } from "./connector.js";
export { evmSignatureToSorobanScVals, splitEvmSignature } from "./stellarScVal.js";
export { DEFAULT_STELLAR_SNAP_ID, StellarSnapClient, callMetaStellar } from "./snapClient.js";
export {
  assertBase64ishXdr,
  assertContractId,
  assertNonEmptyString,
  assertPositiveAmount,
  assertStellarAddress
} from "./validation.js";
export type {
  AddressMapping,
  AddressResolver,
  ConnectedAccount,
  ConnectorOptions,
  Eip712TypedData,
  EthereumProvider,
  Hex,
  MetaStellarAdapterMode,
  MetaStellarAdapterOptions,
  MetaStellarAdapterState,
  MetaStellarReadyState,
  MetaStellarSnapMethod,
  SignTransactionOptions,
  SignatureRequest,
  SignedMessage,
  SignedSorobanInvocation,
  SignedStellarPayment,
  SnapClientOptions,
  SorobanInvocationIntent,
  StellarNetworkConfig,
  StellarSnapRequestParams,
  StellarPaymentIntent
} from "./types.js";
