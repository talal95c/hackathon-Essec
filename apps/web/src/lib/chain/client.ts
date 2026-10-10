/**
 * Clients viem (serveur) pour le registre de confirmation.
 *
 * - `chainPublicClient()` : lectures (`isConfirmed` au règlement) — aucune clé.
 * - `chainWalletClient()` : écritures (`publishIntent`, `revoke`) avec `DEPLOYER_PRIVATE_KEY`
 *   (clé de test uniquement sur la L1 locale ; wallet de test financé sur Fuji).
 *
 * Les écritures doivent rester ASYNCHRONES et hors du chemin critique de la garde
 * (PRD §4.10) : la file de publication arrive avec packages/core.
 */
import "server-only";

import { createPublicClient, createWalletClient, http } from "viem";
import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { resolveChain } from "@/lib/chain/pir";
import { env } from "@/lib/env";

let _chain: ReturnType<typeof resolveChain> | null = null;
let _publicClient: ReturnType<typeof createPublicClient> | null = null;
let _walletClient: ReturnType<typeof createWalletClient> | null = null;

export function chain() {
  if (!_chain) {
    if (!env.CHAIN_RPC_URL) {
      throw new Error(
        "CHAIN_RPC_URL missing — run `infra/avalanche/l1-local.sh rpc` and copy the URL into apps/web/.env.local (see docs/avalanche-l1.md).",
      );
    }
    _chain = resolveChain({
      chainId: env.CHAIN_ID,
      rpcUrl: env.CHAIN_RPC_URL,
      explorerUrl: env.EXPLORER_URL,
    });
  }
  return _chain;
}

export function chainPublicClient() {
  if (!_publicClient) {
    const c = chain();
    _publicClient = createPublicClient({ chain: c, transport: http(c.rpcUrls.default.http[0]) });
  }
  return _publicClient;
}

export function chainWalletClient() {
  if (!_walletClient) {
    const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
    if (!pk) {
      throw new Error("DEPLOYER_PRIVATE_KEY missing — test key only, see docs/avalanche-l1.md.");
    }
    const c = chain();
    _walletClient = createWalletClient({
      chain: c,
      transport: http(c.rpcUrls.default.http[0]),
      account: privateKeyToAccount(pk),
    });
  }
  return _walletClient;
}

export const INTENT_REGISTRY_ADDRESS = (env.NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS ?? "") as Address;
export const HAS_INTENT_REGISTRY = INTENT_REGISTRY_ADDRESS.length === 42;

/** URL explorer (vide sur la L1 locale : utiliser `cast tx`). */
export function chainExplorerUrl(kind: "tx" | "address", value: string): string | null {
  const base = env.EXPLORER_URL;
  return base ? `${base.replace(/\/$/, "")}/${kind}/${value}` : null;
}
