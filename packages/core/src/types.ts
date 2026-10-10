import { z } from "zod";
import type { Address, Hex } from "viem";

const hex32 = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, "bytes32 hex attendu")
  .transform((v) => v.toLowerCase() as Hex);

/** Code devise ISO 4217 (3 lettres), normalisé en majuscules. */
export const CurrencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "code ISO 4217 attendu");
export type CurrencyCode = z.infer<typeof CurrencyCode>;

/**
 * Jambe d'exécution candidate (proposée par le routeur, bornée par l'intention).
 * `rail` étiquette honnêtement ce qui est simulé : seuls `eerc` et `registry` touchent une chaîne.
 */
export const PaymentLeg = z.object({
  rail: z.enum(["swift_sim", "psp_sim", "eerc", "stablecoin_sim"]),
  provider: z.string().trim().min(1),
  amountMinor: z.bigint().positive(),
  currency: CurrencyCode,
  feeMinor: z.bigint().nonnegative(),
  etaSeconds: z.number().int().nonnegative(),
  simulated: z.boolean(),
});
export type PaymentLeg = z.infer<typeof PaymentLeg>;

/**
 * Intention de paiement signée par le donneur d'ordre — source de vérité.
 * Les identités sont des hashes (jamais de donnée personnelle en clair) ; `maxAmountMinor` est en
 * unités mineures de `currency` (centimes) ; `deadline` en secondes unix ; `nonce` 32 octets aléatoires.
 */
export const PaymentIntent = z.object({
  payerIdHash: hex32,
  beneficiaryIdHash: hex32,
  maxAmountMinor: z.bigint().positive(),
  currency: CurrencyCode,
  deadline: z
    .bigint()
    .positive()
    .max(2n ** 64n - 1n),
  nonce: hex32,
});
export type PaymentIntent = z.infer<typeof PaymentIntent>;

/** Intention + signature EIP-712 du donneur d'ordre. */
export interface SignedPaymentIntent {
  intent: PaymentIntent;
  intentHash: Hex;
  signer: Address;
  signature: Hex;
}

/** Entrée souple (ISO date, montant décimal…) normalisée vers `PaymentIntent`. */
export const PaymentIntentInput = z.object({
  payerIdHash: hex32,
  beneficiaryIdHash: hex32,
  maxAmount: z.union([z.string(), z.number(), z.bigint()]),
  currency: CurrencyCode,
  deadline: z.union([z.string(), z.number(), z.bigint(), z.date()]),
  nonce: hex32,
});
export type PaymentIntentInput = z.infer<typeof PaymentIntentInput>;
