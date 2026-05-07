# MetaStellar Adapter Architecture

MetaStellar is designed as a bridge, not a replacement wallet. It gives dApps a Solflare-style adapter surface while supporting two execution paths.

## Execution Modes

### Intent Mode

Use intent mode when a dApp wants MetaMask to approve Soroban-compatible actions without depending on a Snap wallet implementation.

Flow:

1. The dApp connects to MetaMask through the EIP-1193 provider.
2. MetaStellar maps the EVM address to a Stellar identity or account contract.
3. The dApp builds a Soroban invocation or Stellar payment intent.
4. MetaMask signs typed EIP-712 data, with optional `personal_sign` fallback.
5. A Soroban account contract, relayer, or backend verifies the EVM signature.
6. The verified action is submitted to Stellar.

Best for:

- Soroban smart wallet/account-contract designs
- Sponsored transactions
- Backend relayers
- Apps that need strong typed signing consent

### Snap Mode

Use Snap mode when the user has access to a Stellar MetaMask Snap such as `npm:stellar-snap`.

Flow:

1. The dApp requests the Snap with `wallet_requestSnaps`.
2. MetaStellar invokes Stellar wallet methods with `wallet_invokeSnap`.
3. The Snap handles Stellar account and transaction operations.

Best for:

- Direct Stellar XDR signing
- Snap-compatible wallet flows
- Migration from StellarSnap-style integrations

## Adapter Surface

`MetaStellarAdapter` provides:

- `connect()`
- `disconnect()`
- `switchNetwork()`
- `getAddress()`
- `getBalance()`
- `signStr()`
- `signMessage()`
- `signTransaction()`
- `signAndSubmitTransaction()`
- `signSorobanInvocation()`
- `signPayment()`
- `on()` / `off()` event handling
- `destroy()` cleanup

## Robustness Decisions

- Provider requests are wrapped through `requestProvider()` for timeout handling and normalized errors.
- `accountsChanged` and `chainChanged` are synchronized into adapter events.
- Stellar addresses, contract IDs, payment amounts, and XDR payloads are validated before wallet prompts.
- Snap installation can be checked through `getInstalledSnaps()` and `isInstalled()`.
- `allowTypedDataFallback: false` lets security-sensitive apps reject opaque `personal_sign` fallback.

## Security Boundary

MetaMask does not natively sign Stellar Ed25519 transactions. MetaStellar therefore treats MetaMask signatures as approval over an intent. The Stellar execution layer must still verify that intent through a Snap wallet, relayer policy, or Soroban account contract.
