import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("package exposes expected connector files", async () => {
  const index = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");
  assert.match(index, /StellarMetaMaskConnector/);
  assert.match(index, /StaticAddressResolver/);
  assert.match(index, /evmSignatureToSorobanScVals/);
});

test("typed data builders include Stellar network passphrase", async () => {
  const source = await readFile(new URL("../src/eip712.ts", import.meta.url), "utf8");
  assert.match(source, /networkPassphrase/);
  assert.match(source, /SorobanInvocation/);
  assert.match(source, /StellarPayment/);
});
