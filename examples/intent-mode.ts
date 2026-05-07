import {
  MetaStellarAdapter,
  STELLAR_TESTNET,
  StaticAddressResolver
} from "@local/metastellar";

const adapter = new MetaStellarAdapter({
  appName: "MetaStellar Intent Demo",
  mode: "intent",
  networks: [STELLAR_TESTNET],
  defaultNetworkId: "testnet",
  requestTimeoutMs: 30_000,
  allowTypedDataFallback: false,
  addressResolver: new StaticAddressResolver({
    "testnet:0x742d35cc6634c0532925a3b844bc454e4438f44e":
      "CDLZFC3SYJYDZT7K67VZ75HPJVIEVZWR4SM4K6LGTZFN6JVJXW4UXAAA"
  })
});

adapter.on("accountChanged", (account) => {
  console.log("Account changed", account);
});

await adapter.connect();

const signedInvocation = await adapter.signSorobanInvocation({
  contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEVZWR4SM4K6LGTZFN6JVJXW4UXAAA",
  functionName: "transfer",
  argsXdr: [],
  validUntilLedgerSeq: 123456
});

console.log("Send this signed intent to your verifier", signedInvocation);
