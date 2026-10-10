import "server-only";

import {
  IntentPublisher,
  assertSettlementAllowed,
  viemRegistryReader,
  viemRegistryWriter,
  type IntentConfirmation,
  type PaymentIntent,
  type PublishJob,
} from "@pir/core";
import type { Hex } from "viem";
import {
  HAS_INTENT_REGISTRY,
  INTENT_REGISTRY_ADDRESS,
  chainPublicClient,
  chainWalletClient,
} from "./client";

/**
 * Adaptateur IntentRegistry côté app.
 * - Écriture : ASYNCHRONE via `IntentPublisher` (jamais sur le chemin critique de la garde).
 * - Lecture : SYNCHRONE au règlement via `settlementGuard` (adaptateur stablecoin / eERC).
 * Si `NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS` est absent, l'app fonctionne en mode « registre non branché ».
 */
let publisher: IntentPublisher | undefined;

function requireRegistry(): `0x${string}` {
  if (!HAS_INTENT_REGISTRY || !INTENT_REGISTRY_ADDRESS) {
    throw new Error("IntentRegistry non configuré (NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS)");
  }
  return INTENT_REGISTRY_ADDRESS;
}

export function intentPublisher(): IntentPublisher {
  publisher ??= new IntentPublisher(viemRegistryWriter(chainWalletClient(), requireRegistry()));
  return publisher;
}

/** Non bloquant : met l'intention en file de publication et rend la main. */
export function publishIntentAsync(intentHash: Hex, intent: PaymentIntent): PublishJob | null {
  if (!HAS_INTENT_REGISTRY) return null;
  return intentPublisher().enqueue(intentHash, intent);
}

/** À appeler juste avant d'exécuter une jambe : lève si l'intention n'est pas confirmée on-chain ou si la jambe l'élargit. */
export function settlementGuard(
  intentHash: Hex,
  leg: { amountMinor: bigint; currency: string },
): Promise<IntentConfirmation> {
  return assertSettlementAllowed(
    viemRegistryReader(chainPublicClient(), requireRegistry()),
    intentHash,
    leg,
  );
}
