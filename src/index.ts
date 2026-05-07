export { DeterministicAddressResolver, StaticAddressResolver, normalizeEvmAddress } from "./addressMapping.js";
export { StellarMetaMaskConnectorError } from "./errors.js";
export { buildMessageToSign, buildPaymentTypedData, buildSorobanInvocationTypedData } from "./eip712.js";
export { DEFAULT_NETWORKS, STELLAR_PUBLIC, STELLAR_TESTNET, normalizeChainId } from "./networks.js";
export { StellarMetaMaskConnector } from "./connector.js";
export { evmSignatureToSorobanScVals, splitEvmSignature } from "./stellarScVal.js";
export type {
  AddressMapping,
  AddressResolver,
  ConnectedAccount,
  ConnectorOptions,
  Eip712TypedData,
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
