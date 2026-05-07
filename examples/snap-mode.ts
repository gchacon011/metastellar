import { MetaStellarAdapter, STELLAR_TESTNET } from "@local/metastellar";

const adapter = new MetaStellarAdapter({
  appName: "MetaStellar Snap Demo",
  mode: "snap",
  networks: [STELLAR_TESTNET],
  defaultNetworkId: "testnet",
  requestTimeoutMs: 30_000,
  snap: {
    snapId: "npm:stellar-snap"
  }
});

await adapter.connect();

const address = await adapter.getAddress();
const balance = await adapter.getBalance(address);

console.log({ address, balance });

const signedXdr = await adapter.signTransaction("AAAA...");
console.log("Signed transaction XDR", signedXdr);
