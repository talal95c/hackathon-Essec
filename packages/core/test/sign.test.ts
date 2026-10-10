import { describe, expect, it } from "vitest";
import { keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { intentDomain, normalizeIntent, signIntent, verifySignedIntent } from "../src/index.js";

// Clé Anvil #0 (payeur) — test uniquement.
const payer = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const domain = intentDomain(7810, "0x95CA0a568236fC7413Cd2b794A7da24422c2BBb6");
const intent = normalizeIntent({
  payerIdHash: keccak256(toBytes("payer:fr-siren-123456789")),
  beneficiaryIdHash: keccak256(toBytes("beneficiary:cn-uscc-91310000")),
  maxAmount: "30000",
  currency: "EUR",
  deadline: 1791738608,
  nonce: keccak256(toBytes("nonce-1")),
});

describe("signature EIP-712", () => {
  it("signe puis vérifie", async () => {
    const signed = await signIntent(payer, intent, domain);
    expect(signed.signer).toBe(payer.address);
    expect(await verifySignedIntent(signed, domain)).toBe(true);
  });

  it("rejette une intention élargie après signature", async () => {
    const signed = await signIntent(payer, intent, domain);
    const widened = {
      ...signed,
      intent: { ...intent, maxAmountMinor: intent.maxAmountMinor + 1n },
    };
    expect(await verifySignedIntent(widened, domain)).toBe(false);
  });

  it("rejette un autre domaine (chaîne) et un autre signataire", async () => {
    const signed = await signIntent(payer, intent, domain);
    expect(await verifySignedIntent(signed, intentDomain(43113))).toBe(false);
    const other = privateKeyToAccount(
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    );
    expect(await verifySignedIntent({ ...signed, signer: other.address }, domain)).toBe(false);
  });
});
