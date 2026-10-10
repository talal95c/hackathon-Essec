import { parseAbi, type Address, type Hex, type PublicClient, type WalletClient } from "viem";
import { currencyToBytes32 } from "./hash.js";
import type { PaymentIntent } from "./types.js";

export const INTENT_REGISTRY_ABI = parseAbi([
  "function publishIntent(bytes32 intentHash, bytes32 payerIdHash, bytes32 beneficiaryIdHash, uint256 maxAmount, bytes32 currency, uint64 deadline)",
  "function revoke(bytes32 intentHash)",
  "function isConfirmed(bytes32 intentHash) view returns (bool exists, bool revoked, bool expired, address issuer, uint256 maxAmount, bytes32 currency, uint64 deadline)",
]);

export interface IntentConfirmation {
  exists: boolean;
  revoked: boolean;
  expired: boolean;
  issuer: Address;
  maxAmount: bigint;
  currency: Hex;
  deadline: bigint;
  /** exists && !revoked && !expired */
  ok: boolean;
}

/** Port d'écriture : implémenté par viem (ci-dessous) ou par un faux en test. */
export interface IntentRegistryWriter {
  publishIntent(intentHash: Hex, intent: PaymentIntent): Promise<Hex>;
}

/** Port de lecture synchrone au règlement (adaptateur stablecoin). */
export interface IntentRegistryReader {
  isConfirmed(intentHash: Hex): Promise<IntentConfirmation>;
}

export function viemRegistryWriter(wallet: WalletClient, address: Address): IntentRegistryWriter {
  return {
    async publishIntent(hash, intent) {
      if (!wallet.account) throw new Error("WalletClient sans compte");
      return wallet.writeContract({
        address,
        abi: INTENT_REGISTRY_ABI,
        functionName: "publishIntent",
        args: [
          hash,
          intent.payerIdHash,
          intent.beneficiaryIdHash,
          intent.maxAmountMinor,
          currencyToBytes32(intent.currency),
          intent.deadline,
        ],
        account: wallet.account,
        chain: wallet.chain ?? null,
      });
    },
  };
}

/** Sous-ensemble de PublicClient suffisant (évite les incompatibilités de génériques entre clients). */
export type ReadClient = Pick<PublicClient, "readContract">;

export function viemRegistryReader(client: ReadClient, address: Address): IntentRegistryReader {
  return {
    async isConfirmed(hash) {
      const [exists, revoked, expired, issuer, maxAmount, currency, deadline] =
        await client.readContract({
          address,
          abi: INTENT_REGISTRY_ABI,
          functionName: "isConfirmed",
          args: [hash],
        });
      return {
        exists,
        revoked,
        expired,
        issuer,
        maxAmount,
        currency,
        deadline,
        ok: exists && !revoked && !expired,
      };
    },
  };
}

/**
 * Garde de règlement : à appeler juste avant d'exécuter une jambe. Vérifie que l'intention est
 * confirmée on-chain et que la jambe ne l'élargit pas (montant ≤ max, même devise).
 */
export async function assertSettlementAllowed(
  reader: IntentRegistryReader,
  intentHash: Hex,
  leg: { amountMinor: bigint; currency: string },
): Promise<IntentConfirmation> {
  const c = await reader.isConfirmed(intentHash);
  if (!c.exists) throw new Error("Intention inconnue du registre");
  if (c.revoked) throw new Error("Intention révoquée");
  if (c.expired) throw new Error("Intention expirée");
  if (leg.amountMinor > c.maxAmount) throw new Error("Jambe au-dessus du plafond de l'intention");
  if (currencyToBytes32(leg.currency) !== c.currency)
    throw new Error("Devise de la jambe ≠ intention");
  return c;
}
