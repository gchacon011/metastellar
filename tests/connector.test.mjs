import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("package exposes expected connector files", async () => {
  const index = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");
  assert.match(index, /StellarMetaMaskConnector/);
  assert.match(index, /StaticAddressResolver/);
  assert.match(index, /evmSignatureToSorobanScVals/);
  assert.match(index, /StellarSnapClient/);
  assert.match(index, /MetaStellarAdapter/);
});

test("typed data builders include Stellar network passphrase", async () => {
  const source = await readFile(new URL("../src/eip712.ts", import.meta.url), "utf8");
  assert.match(source, /networkPassphrase/);
  assert.match(source, /SorobanInvocation/);
  assert.match(source, /StellarPayment/);
});

test("snap client aligns with StellarSnap request methods", async () => {
  const source = await readFile(new URL("../src/snapClient.ts", import.meta.url), "utf8");
  assert.match(source, /wallet_requestSnaps/);
  assert.match(source, /wallet_invokeSnap/);
  assert.match(source, /npm:stellar-snap/);
  assert.match(source, /signAndSubmitTransaction/);
});

test("adapter exposes Solflare-style wallet surface", async () => {
  const source = await readFile(new URL("../src/adapter.ts", import.meta.url), "utf8");
  assert.match(source, /connect/);
  assert.match(source, /disconnect/);
  assert.match(source, /switchNetwork/);
  assert.match(source, /signTransaction/);
  assert.match(source, /signSorobanInvocation/);
});
