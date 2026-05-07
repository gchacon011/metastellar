import type {
  Eip712TypedData,
  Hex,
  SignatureRequest,
  SorobanInvocationIntent,
  StellarNetworkConfig,
  StellarPaymentIntent
} from "./types.js";

export function buildBaseDomain(
  appName: string,
  appVersion: string,
  chainId: Hex,
  network: StellarNetworkConfig
): Record<string, unknown> {
  return {
    name: appName,
    version: appVersion,
    chainId: Number.parseInt(chainId.slice(2), 16),
    salt: network.networkPassphrase
  };
}

export function buildMessageToSign(request: SignatureRequest, network: StellarNetworkConfig): string {
  const issuedAt = request.issuedAt ?? new Date().toISOString();
  const lines = [
    request.statement,
    "",
    `Purpose: ${request.purpose}`,
    `Stellar Network: ${network.name}`,
    `Network Passphrase: ${network.networkPassphrase}`,
    `Issued At: ${issuedAt}`
  ];

  if (request.expirationTime) lines.push(`Expiration Time: ${request.expirationTime}`);
  if (request.nonce) lines.push(`Nonce: ${request.nonce}`);
  if (request.metadata) lines.push(`Metadata: ${stableStringify(request.metadata)}`);

  return lines.join("\n");
}

export function buildSorobanInvocationTypedData(params: {
  appName: string;
  appVersion: string;
  evmChainId: Hex;
  network: StellarNetworkConfig;
  evmAddress: Hex;
  stellarAddress?: string;
  nonce: string;
  issuedAt: string;
  intent: SorobanInvocationIntent;
}): Eip712TypedData {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "salt", type: "string" }
      ],
      SorobanInvocation: [
        { name: "evmAddress", type: "address" },
        { name: "stellarAddress", type: "string" },
        { name: "stellarNetwork", type: "string" },
        { name: "networkPassphrase", type: "string" },
        { name: "contractId", type: "string" },
        { name: "functionName", type: "string" },
        { name: "argsXdr", type: "string" },
        { name: "transactionXdr", type: "string" },
        { name: "authEntryXdr", type: "string" },
        { name: "sourceAccount", type: "string" },
        { name: "maxFee", type: "string" },
        { name: "validUntilLedgerSeq", type: "uint32" },
        { name: "nonce", type: "string" },
        { name: "issuedAt", type: "string" },
        { name: "metadata", type: "string" }
      ]
    },
    primaryType: "SorobanInvocation",
    domain: buildBaseDomain(params.appName, params.appVersion, params.evmChainId, params.network),
    message: {
      evmAddress: params.evmAddress,
      stellarAddress: params.stellarAddress ?? "",
      stellarNetwork: params.network.id,
      networkPassphrase: params.network.networkPassphrase,
      contractId: params.intent.contractId,
      functionName: params.intent.functionName,
      argsXdr: stableStringify(params.intent.argsXdr ?? []),
      transactionXdr: params.intent.transactionXdr ?? "",
      authEntryXdr: params.intent.authEntryXdr ?? "",
      sourceAccount: params.intent.sourceAccount ?? "",
      maxFee: params.intent.maxFee ?? "",
      validUntilLedgerSeq: params.intent.validUntilLedgerSeq ?? 0,
      nonce: params.nonce,
      issuedAt: params.issuedAt,
      metadata: stableStringify(params.intent.metadata ?? {})
    }
  };
}

export function buildPaymentTypedData(params: {
  appName: string;
  appVersion: string;
  evmChainId: Hex;
  network: StellarNetworkConfig;
  evmAddress: Hex;
  stellarAddress?: string;
  nonce: string;
  issuedAt: string;
  intent: StellarPaymentIntent;
}): Eip712TypedData {
  const asset =
    params.intent.asset === "XLM"
      ? "XLM"
      : `${params.intent.asset.code}:${params.intent.asset.issuer}`;

  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "salt", type: "string" }
      ],
      StellarPayment: [
        { name: "evmAddress", type: "address" },
        { name: "stellarAddress", type: "string" },
        { name: "stellarNetwork", type: "string" },
        { name: "networkPassphrase", type: "string" },
        { name: "destination", type: "string" },
        { name: "asset", type: "string" },
        { name: "amount", type: "string" },
        { name: "memo", type: "string" },
        { name: "sourceAccount", type: "string" },
        { name: "maxFee", type: "string" },
        { name: "validUntilLedgerSeq", type: "uint32" },
        { name: "nonce", type: "string" },
        { name: "issuedAt", type: "string" },
        { name: "metadata", type: "string" }
      ]
    },
    primaryType: "StellarPayment",
    domain: buildBaseDomain(params.appName, params.appVersion, params.evmChainId, params.network),
    message: {
      evmAddress: params.evmAddress,
      stellarAddress: params.stellarAddress ?? "",
      stellarNetwork: params.network.id,
      networkPassphrase: params.network.networkPassphrase,
      destination: params.intent.destination,
      asset,
      amount: params.intent.amount,
      memo: params.intent.memo ?? "",
      sourceAccount: params.intent.sourceAccount ?? "",
      maxFee: params.intent.maxFee ?? "",
      validUntilLedgerSeq: params.intent.validUntilLedgerSeq ?? 0,
      nonce: params.nonce,
      issuedAt: params.issuedAt,
      metadata: stableStringify(params.intent.metadata ?? {})
    }
  };
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortValue(nested)])
    );
  }

  return value;
}
