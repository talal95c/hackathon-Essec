import { verifyTypedData, type Address, type Hex, type TypedDataDomain } from "viem";
import type { PrivateKeyAccount } from "viem/accounts";
import { currencyToBytes32, intentHash } from "./hash.js";
import type { PaymentIntent, SignedPaymentIntent } from "./types.js";

/** Types EIP-712 (F-KEY-1) : mêmes champs que le hash canonique. */
export const INTENT_TYPES = {
  PaymentIntent: [
    { name: "payerIdHash", type: "bytes32" },
    { name: "beneficiaryIdHash", type: "bytes32" },
    { name: "maxAmount", type: "uint256" },
    { name: "currency", type: "bytes32" },
    { name: "deadline", type: "uint64" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export function intentDomain(chainId: number, verifyingContract?: Address): TypedDataDomain {
  return { name: "PIR Payment Integrity Router", version: "1", chainId, verifyingContract };
}

export function intentMessage(intent: PaymentIntent) {
  return {
    payerIdHash: intent.payerIdHash,
    beneficiaryIdHash: intent.beneficiaryIdHash,
    maxAmount: intent.maxAmountMinor,
    currency: currencyToBytes32(intent.currency),
    deadline: intent.deadline,
    nonce: intent.nonce,
  } as const;
}

/** Signature du donneur d'ordre (compte local viem : clé de test, WebAuthn/passkey à brancher via F-KEY-1). */
export async function signIntent(
  account: PrivateKeyAccount,
  intent: PaymentIntent,
  domain: TypedDataDomain,
): Promise<SignedPaymentIntent> {
  const signature = await account.signTypedData({
    domain,
    types: INTENT_TYPES,
    primaryType: "PaymentIntent",
    message: intentMessage(intent),
  });
  return { intent, intentHash: intentHash(intent), signer: account.address, signature };
}

/** Vérification déterministe : hash recalculé + signature EIP-712 valide pour `signer`. */
export async function verifySignedIntent(
  signed: SignedPaymentIntent,
  domain: TypedDataDomain,
): Promise<boolean> {
  if (intentHash(signed.intent) !== signed.intentHash) return false;
  return verifyTypedData({
    address: signed.signer,
    domain,
    types: INTENT_TYPES,
    primaryType: "PaymentIntent",
    message: intentMessage(signed.intent),
    signature: signed.signature as Hex,
  });
}
