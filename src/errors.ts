export class StellarMetaMaskConnectorError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "StellarMetaMaskConnectorError";
  }
}

export function invariant(condition: unknown, message: string, code: string): asserts condition {
  if (!condition) {
    throw new StellarMetaMaskConnectorError(message, code);
  }
}
