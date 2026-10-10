import { describe, expect, it } from "vitest";
import { keccak256, toBytes } from "viem";
import { INTENT_TYPEHASH, currencyToBytes32, intentHash, normalizeIntent } from "../src/index.js";

/**
 * Vecteur croisé avec Foundry (apps/contracts/test/IntentHash.t.sol) : mêmes entrées, même hash.
 * Généré via `cast abi-encode` + `cast keccak`.
 */
const VECTOR = {
  payerIdHash: keccak256(toBytes("payer:fr-siren-123456789")),
  beneficiaryIdHash: keccak256(toBytes("beneficiary:cn-uscc-91310000")),
  nonce: keccak256(toBytes("nonce-1")),
  maxAmount: "30000.00",
  currency: "eur",
  deadline: 1791738608,
  expected: "0x73082f6db08197160e1c6f6cc0a257b046c0d8f282ed0242b1bd6e39be6b0f4c",
} as const;

describe("intentHash", () => {
  it("TYPEHASH identique à IntentHashLib.INTENT_TYPEHASH", () => {
    expect(INTENT_TYPEHASH).toBe(
      "0x676ff0fae9443fe9e53c0777519b304b922f14c8e24027c9d2ffae35492d4edb",
    );
  });

  it("bytes32('EUR')", () => {
    expect(currencyToBytes32("EUR")).toBe(
      "0x4555520000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("vecteur croisé Solidity", () => {
    const intent = normalizeIntent(VECTOR);
    expect(intent.maxAmountMinor).toBe(3_000_000n);
    expect(intent.currency).toBe("EUR");
    expect(intentHash(intent)).toBe(VECTOR.expected);
  });

  it("normalisation canonique : formes équivalentes → même hash", () => {
    const a = normalizeIntent(VECTOR);
    const b = normalizeIntent({
      ...VECTOR,
      maxAmount: 3_000_000n,
      currency: " EUR ",
      deadline: new Date(1791738608 * 1000),
    });
    expect(intentHash(a)).toBe(intentHash(b));
  });

  it("tout champ modifié change le hash", () => {
    const base = intentHash(normalizeIntent(VECTOR));
    expect(intentHash(normalizeIntent({ ...VECTOR, maxAmount: "30000.01" }))).not.toBe(base);
    expect(intentHash(normalizeIntent({ ...VECTOR, currency: "USD" }))).not.toBe(base);
    expect(intentHash(normalizeIntent({ ...VECTOR, deadline: 1791738609 }))).not.toBe(base);
    expect(
      intentHash(normalizeIntent({ ...VECTOR, nonce: keccak256(toBytes("nonce-2")) })),
    ).not.toBe(base);
  });

  it("refuse trop de décimales / devise invalide", () => {
    expect(() => normalizeIntent({ ...VECTOR, maxAmount: "1.234" })).toThrow();
    expect(() => normalizeIntent({ ...VECTOR, currency: "EURO" })).toThrow();
  });
});
