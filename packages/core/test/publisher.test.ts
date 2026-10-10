import { describe, expect, it } from "vitest";
import { keccak256, toBytes, type Hex } from "viem";
import {
  IntentPublisher,
  assertSettlementAllowed,
  currencyToBytes32,
  intentHash,
  normalizeIntent,
  type IntentRegistryReader,
  type IntentRegistryWriter,
} from "../src/index.js";

const intent = normalizeIntent({
  payerIdHash: keccak256(toBytes("p")),
  beneficiaryIdHash: keccak256(toBytes("b")),
  maxAmount: "30000",
  currency: "EUR",
  deadline: 1791738608,
  nonce: keccak256(toBytes("n")),
});
const hash = intentHash(intent);

function fakeWriter(failures: number): IntentRegistryWriter & { calls: number } {
  const w = {
    calls: 0,
    async publishIntent(): Promise<Hex> {
      w.calls += 1;
      if (w.calls <= failures) throw new Error("rpc down");
      return `0x${"ab".repeat(32)}` as Hex;
    },
  };
  return w;
}
const noSleep = async () => {};

describe("IntentPublisher (asynchrone)", () => {
  it("enqueue rend la main immédiatement, publie en arrière-plan", async () => {
    const writer = fakeWriter(0);
    const publisher = new IntentPublisher(writer, { sleep: noSleep });
    const job = publisher.enqueue(hash, intent);
    expect(["queued", "publishing"]).toContain(job.status);
    await publisher.idle();
    expect(job.status).toBe("published");
    expect(job.txHash).toBeDefined();
    expect(writer.calls).toBe(1);
  });

  it("retente puis réussit", async () => {
    const writer = fakeWriter(2);
    const publisher = new IntentPublisher(writer, { maxAttempts: 3, sleep: noSleep });
    const job = publisher.enqueue(hash, intent);
    await publisher.idle();
    expect(job.status).toBe("published");
    expect(job.attempts).toBe(3);
  });

  it("échoue proprement après maxAttempts, sans lever", async () => {
    const writer = fakeWriter(99);
    const statuses: string[] = [];
    const publisher = new IntentPublisher(writer, {
      maxAttempts: 2,
      sleep: noSleep,
      onChange: (j) => statuses.push(j.status),
    });
    const job = publisher.enqueue(hash, intent);
    await publisher.idle();
    expect(job.status).toBe("failed");
    expect(job.lastError).toBe("rpc down");
    expect(statuses.at(-1)).toBe("failed");
  });

  it("déduplique un même intentHash", async () => {
    const writer = fakeWriter(0);
    const publisher = new IntentPublisher(writer, { sleep: noSleep });
    publisher.enqueue(hash, intent);
    publisher.enqueue(hash, intent);
    await publisher.idle();
    expect(writer.calls).toBe(1);
  });
});

describe("assertSettlementAllowed (lecture synchrone au règlement)", () => {
  const reader = (
    over: Partial<Awaited<ReturnType<IntentRegistryReader["isConfirmed"]>>>,
  ): IntentRegistryReader => ({
    async isConfirmed() {
      return {
        exists: true,
        revoked: false,
        expired: false,
        issuer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        maxAmount: 3_000_000n,
        currency: currencyToBytes32("EUR"),
        deadline: 1791738608n,
        ok: true,
        ...over,
      };
    },
  });

  it("autorise une jambe dans les bornes", async () => {
    await expect(
      assertSettlementAllowed(reader({}), hash, { amountMinor: 3_000_000n, currency: "EUR" }),
    ).resolves.toBeTruthy();
  });

  it("refuse élargissement, révocation, expiration, devise", async () => {
    await expect(
      assertSettlementAllowed(reader({}), hash, { amountMinor: 3_000_001n, currency: "EUR" }),
    ).rejects.toThrow(/plafond/);
    await expect(
      assertSettlementAllowed(reader({ revoked: true }), hash, {
        amountMinor: 1n,
        currency: "EUR",
      }),
    ).rejects.toThrow(/révoquée/);
    await expect(
      assertSettlementAllowed(reader({ expired: true }), hash, {
        amountMinor: 1n,
        currency: "EUR",
      }),
    ).rejects.toThrow(/expirée/);
    await expect(
      assertSettlementAllowed(reader({ exists: false }), hash, {
        amountMinor: 1n,
        currency: "EUR",
      }),
    ).rejects.toThrow(/inconnue/);
    await expect(
      assertSettlementAllowed(reader({}), hash, { amountMinor: 1n, currency: "USD" }),
    ).rejects.toThrow(/Devise/);
  });
});
