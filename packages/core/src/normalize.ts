import { PaymentIntent, PaymentIntentInput } from "./types.js";

const MINOR_DECIMALS: Record<string, number> = { JPY: 0, KRW: 0, XOF: 0, XAF: 0 };

/** Nombre de décimales des unités mineures (2 par défaut, ISO 4217). */
export function minorDecimals(currency: string): number {
  return MINOR_DECIMALS[currency] ?? 2;
}

/** "30000.50" EUR → 3000050n. Rejette plus de décimales que la devise n'en admet. */
export function toMinorUnits(amount: string | number | bigint, currency: string): bigint {
  if (typeof amount === "bigint") return amount;
  const s = typeof amount === "number" ? amount.toString() : amount.trim();
  const m = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m || m[1] === undefined) throw new Error(`Montant invalide : ${s}`);
  const decimals = minorDecimals(currency);
  const frac = (m[2] ?? "").padEnd(decimals, "0");
  if (frac.length > decimals) throw new Error(`Trop de décimales pour ${currency} : ${s}`);
  return BigInt(m[1]) * 10n ** BigInt(decimals) + BigInt(frac || "0");
}

/** ISO 8601 / Date / secondes unix → secondes unix (bigint). */
export function toUnixSeconds(deadline: string | number | bigint | Date): bigint {
  if (typeof deadline === "bigint") return deadline;
  if (deadline instanceof Date) return BigInt(Math.floor(deadline.getTime() / 1000));
  if (typeof deadline === "number") return BigInt(Math.floor(deadline));
  const ms = Date.parse(deadline);
  if (Number.isNaN(ms)) throw new Error(`Date invalide : ${deadline}`);
  return BigInt(Math.floor(ms / 1000));
}

/** Normalisation canonique : même entrée sémantique → même `PaymentIntent` → même hash. */
export function normalizeIntent(input: PaymentIntentInput): PaymentIntent {
  const i = PaymentIntentInput.parse(input);
  return PaymentIntent.parse({
    payerIdHash: i.payerIdHash,
    beneficiaryIdHash: i.beneficiaryIdHash,
    maxAmountMinor: toMinorUnits(i.maxAmount, i.currency),
    currency: i.currency,
    deadline: toUnixSeconds(i.deadline),
    nonce: i.nonce,
  });
}
