import { encodeAbiParameters, keccak256, stringToHex, toBytes, type Hex } from "viem";
import type { PaymentIntent } from "./types.js";

/** Doit rester identique à `IntentHashLib.INTENT_TYPEHASH` (apps/contracts/src/IntentHash.sol). */
export const INTENT_TYPE =
  "PaymentIntent(bytes32 payerIdHash,bytes32 beneficiaryIdHash,uint256 maxAmount,bytes32 currency,uint64 deadline,bytes32 nonce)";
export const INTENT_TYPEHASH: Hex = keccak256(toBytes(INTENT_TYPE));

/** "EUR" → bytes32 ASCII complété à droite (= `bytes32("EUR")` en Solidity). */
export function currencyToBytes32(currency: string): Hex {
  return stringToHex(currency, { size: 32 });
}

/** Hash d'identité : keccak256 d'une étiquette normalisée (jamais la donnée brute on-chain). */
export function idHash(label: string): Hex {
  return keccak256(toBytes(label.trim().toLowerCase()));
}

/**
 * Hash canonique de l'intention = keccak256(abi.encode(TYPEHASH, payerIdHash, beneficiaryIdHash,
 * maxAmount, currency, deadline, nonce)). Vecteur croisé avec Foundry dans test/hash.test.ts.
 */
export function intentHash(intent: PaymentIntent): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "bytes32" },
        { type: "uint64" },
        { type: "bytes32" },
      ],
      [
        INTENT_TYPEHASH,
        intent.payerIdHash,
        intent.beneficiaryIdHash,
        intent.maxAmountMinor,
        currencyToBytes32(intent.currency),
        intent.deadline,
        intent.nonce,
      ],
    ),
  );
}
