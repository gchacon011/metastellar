# MetaStellar

MetaStellar is building the bridge between Ethereum-native wallets and the Soroban ecosystem, enabling MetaMask users to seamlessly access Stellar dApps through secure wallet interoperability, familiar Web3 UX, and frictionless cross-chain onboarding.

The strategic angle is simple: MetaStellar is not competing with wallets. It reduces onboarding friction for an entire blockchain ecosystem.

This package is intentionally an adapter, not a magic Ed25519 wallet. MetaMask signs secp256k1 EIP-712 or `personal_sign` payloads. Soroban apps can consume those signatures through a custom account contract, sponsored transaction flow, or backend relayer that verifies the signed intent before submitting to Stellar.

## Positioning

**Primary pitch:** MetaStellar is the onboarding layer between MetaMask and Soroban.

Short punchlines:

- Connecting MetaMask users to the future of Soroban.
- Bringing Ethereum-native UX into the Stellar ecosystem.
- Making Stellar dApps accessible to millions of MetaMask users.
- Cross-chain wallet interoperability for the next generation of Soroban applications.

MetaStellar is designed for Stellar ecosystem grants, Soroban hackathons, wallet interoperability tooling, Web3 onboarding infrastructure, and developer SDK expansion.

## Problem Statement

The rapid growth of Web3 has created fragmented blockchain ecosystems where users are often locked into specific wallets, transaction models, and user experiences. While millions of users already rely on MetaMask as their primary gateway to decentralized applications, emerging ecosystems like Soroban on Stellar still require users to install new wallets, learn unfamiliar transaction flows, and adapt to entirely different onboarding experiences.

This creates significant friction for adoption.

Today, EVM-native users who want to explore Stellar or Soroban applications face multiple barriers:

- Wallet incompatibility
- Unfamiliar signing and transaction models
- Confusing onboarding processes
- Network and address translation challenges
- Fragmented user experience across ecosystems

For developers, this fragmentation limits user acquisition and slows ecosystem growth because applications built on Soroban cannot easily tap into the massive existing MetaMask user base.

As a result, potentially millions of Web3 users remain disconnected from the Stellar ecosystem, not because of lack of interest, but because the onboarding experience is too complex.

MetaStellar solves this problem by creating a secure interoperability layer that allows MetaMask users to seamlessly interact with Soroban applications using familiar wallet behaviors and Web3-native UX patterns. By bridging Ethereum-style wallet interactions into Soroban-compatible actions, MetaStellar dramatically lowers adoption friction and accelerates cross-chain accessibility for both users and developers.

## Solution Overview

MetaStellar is building a secure interoperability and onboarding layer that enables MetaMask users to seamlessly interact with Soroban applications on Stellar without requiring a new wallet or unfamiliar onboarding process.

At its core, MetaStellar acts as a wallet compatibility bridge between Ethereum-native user experiences and Soroban-compatible blockchain interactions.

The platform introduces a Solflare-style adapter architecture that:

- Connects MetaMask directly to Soroban applications
- Translates Ethereum-style transaction and signing flows into Soroban-compatible actions
- Enables secure wallet interoperability across ecosystems
- Preserves familiar Web3 UX patterns for existing MetaMask users
- Simplifies cross-chain onboarding for both users and developers

MetaStellar is designed to support critical functionality including:

- Wallet connection and authentication
- Address mapping and identity translation
- Network switching
- Message signing
- Transaction conversion and execution
- Cross-chain interaction handling
- Developer-friendly integration tooling

Instead of forcing users to abandon their existing Web3 workflow, MetaStellar allows them to access Stellar and Soroban applications using the wallet experience they already know and trust.

For developers, MetaStellar provides an onboarding infrastructure layer that dramatically lowers friction for user acquisition by making Soroban dApps immediately accessible to millions of existing MetaMask users.

Ultimately, MetaStellar helps transform Soroban adoption from a fragmented multi-wallet experience into a seamless, interoperable Web3 journey.

## Target Audience

### Primary Audience - EVM-Native Web3 Users

MetaStellar is primarily designed for existing Web3 users who already operate within the Ethereum ecosystem and use wallets such as MetaMask as their main gateway to decentralized applications.

This includes:

- DeFi users
- NFT collectors and traders
- Web3 gamers
- DAO participants
- Crypto-native investors
- Multi-chain explorers
- Developers already familiar with EVM tooling

These users are highly active in Web3 but often avoid exploring new ecosystems due to onboarding friction, wallet fragmentation, and unfamiliar UX patterns.

### Secondary Audience - Soroban & Stellar Developers

Developers building on Soroban within the Stellar ecosystem represent a critical secondary audience.

MetaStellar helps them:

- Access a significantly larger wallet user base
- Reduce onboarding abandonment
- Increase dApp adoption
- Simplify wallet integration flows
- Deliver familiar Web3 UX expectations
- Accelerate ecosystem growth

For developers, MetaStellar acts as an onboarding and interoperability layer that removes one of the biggest barriers to user acquisition.

### Tertiary Audience - Blockchain Ecosystems & Infrastructure Partners

MetaStellar also serves:

- Blockchain foundations
- Web3 incubators
- Hackathon ecosystems
- Cross-chain infrastructure providers
- Wallet providers
- Enterprise blockchain adoption initiatives

These organizations benefit from:

- Increased cross-chain interoperability
- Faster user onboarding
- Improved ecosystem accessibility
- Higher user retention
- Expanded developer participation

### Ideal User Persona

> "A Web3-native user with an existing MetaMask wallet who wants to explore new blockchain ecosystems like Soroban without learning new wallet systems or changing their existing Web3 workflow."

MetaStellar transforms Stellar adoption from:

> "Install a new wallet and learn a new system"

into:

> "Connect with the wallet you already trust."

## Features

- Connects to MetaMask through `window.ethereum` or an injected EIP-1193 provider.
- Maps an EVM address to a Stellar identity using a pluggable resolver.
- Switches active Stellar network and can optionally request MetaMask EVM chain switching.
- Signs human-readable messages for login, challenges, and consent screens.
- Signs Soroban invocation intents with contract ID, function name, transaction XDR, auth entry XDR, ledger expiration, and metadata.
- Signs Stellar payment intents for relayed or sponsored payments.
- Exposes helpers to convert EVM signatures into Soroban-friendly `ScVal` inputs.

## Install

```bash
npm install @stellar/stellar-sdk
```

Copy this package into your app or publish it under your own scope, then build it with:

```bash
npm install
npm run build
```

## Quick Start

```ts
import { StellarMetaMaskConnector, StaticAddressResolver, STELLAR_TESTNET } from "@local/metastellar";

const connector = new StellarMetaMaskConnector({
  appName: "Soroban Bridge Demo",
  defaultNetworkId: "testnet",
  networks: [STELLAR_TESTNET],
  addressResolver: new StaticAddressResolver({
    "testnet:0x742d35cc6634c0532925a3b844bc454e4438f44e":
      "CDLZFC3SYJYDZT7K67VZ75HPJVIEVZWR4SM4K6LGTZFN6JVJXW4UXAAA"
  })
});

const account = await connector.connect();

const signedInvocation = await connector.signSorobanInvocation({
  contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEVZWR4SM4K6LGTZFN6JVJXW4UXAAA",
  functionName: "transfer",
  argsXdr: ["..."],
  authEntryXdr: "...",
  validUntilLedgerSeq: 123456
});
```

Send `signedInvocation` to your Soroban account contract, relayer, or dApp backend. The verifier should recover the EVM signer from the EIP-712 payload and compare it with the mapped EVM address for the Stellar account or contract address.

## Address Mapping

The default `DeterministicAddressResolver` creates an off-chain identity hash from:

```text
sha256(stellarNetworkPassphrase + ":" + evmAddress)
```

That is useful for session identity and indexing, but it is not an on-chain Stellar account. For production, provide an `AddressResolver` backed by your Soroban account factory, registry contract, or backend database:

```ts
const resolver = {
  name: "registry-v1",
  async resolve(evmAddress, network) {
    const stellarAddress = await lookupAccountContract(evmAddress, network.id);
    return {
      evmAddress,
      stellarAddress,
      identityHash: await myHash(`${network.networkPassphrase}:${evmAddress}`),
      resolver: "registry-v1"
    };
  }
};
```

## Network Switching

Stellar network selection is separate from MetaMask chain selection. You can switch only the connector's Stellar context:

```ts
await connector.switchStellarNetwork("public");
```

Or ask MetaMask to switch to the configured EVM chain at the same time:

```ts
await connector.switchStellarNetwork("testnet", { switchEvmChain: true });
```

By default, public network is paired with Ethereum mainnet (`0x1`) and Stellar testnet with Sepolia (`0xaa36a7`) as an EVM signing context. Override `expectedEvmChainId` in your network config if your app uses another EVM network.

## Soroban Integration Model

The normal production shape is:

1. The dApp builds or simulates a Soroban transaction with `@stellar/stellar-sdk`.
2. The dApp passes `transactionXdr` or `authEntryXdr` into `signSorobanInvocation`.
3. MetaMask signs an EIP-712 `SorobanInvocation`.
4. A Soroban account contract or relayer verifies the secp256k1 signature.
5. The relayer submits the assembled Stellar transaction through Stellar RPC.

For account contracts that expect signature values as Soroban `ScVal`s:

```ts
import { nativeToScVal } from "@stellar/stellar-sdk";
import { evmSignatureToSorobanScVals } from "@local/metastellar";

const signatureArgs = evmSignatureToSorobanScVals({
  sdk: { nativeToScVal },
  signer: signedInvocation.evmAddress,
  signature: signedInvocation.signature,
  nonce: signedInvocation.nonce,
  issuedAt: signedInvocation.issuedAt
});
```

Adjust the exact `ScVal` schema to match your Soroban account contract. Some contracts prefer a map, others expect positional values like signer, r, s, v, nonce, and deadline.

## Security Notes

- Always include `networkPassphrase`, `contractId`, `functionName`, `nonce`, and expiration data in the signed payload.
- Store and reject used nonces server-side or in the Soroban account contract.
- Treat `personal_sign` fallback as a compatibility path. Prefer `eth_signTypedData_v4` for production consent clarity.
- Do not submit classic Stellar payments from a MetaMask signature alone. Use a sponsored account, custom account contract, or relayer policy that validates the signed intent.
- Verify that the recovered EVM address maps to the Stellar account or contract being used.

## Sources

- [Stellar JavaScript SDK docs](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Soroban authorization docs](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization)
- [Stellar transaction simulation docs](https://developers.stellar.org/docs/learn/fundamentals/contract-development/contract-interactions/transaction-simulation)
- [MetaMask Ethereum provider API](https://metamask.github.io/mm-docs-v2/staging/wallet/reference/provider-api/)
- [MetaMask sign data docs](https://metamask.github.io/mm-docs-v2/87-onboarding/wallet/how-to/sign-data/)
