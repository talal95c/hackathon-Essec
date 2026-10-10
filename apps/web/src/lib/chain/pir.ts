/**
 * Définitions viem des chaînes cibles du registre de confirmation (docs/avalanche-l1.md).
 *
 * - `pirL1`  : L1 Avalanche dédiée « pir » (Subnet-EVM, chainId 7810, gas natif PIR).
 *              L'URL RPC change à chaque redéploiement local → toujours passée en paramètre.
 * - Fuji C-Chain (43113) : repli, mêmes contrats.
 *
 * Fichier isomorphe (pas de `server-only`) : importable par les composants client pour
 * afficher le nom de chaîne / l'explorer.
 */
import { defineChain } from "viem";
import type { Chain } from "viem";
import { avalancheFuji } from "viem/chains";

export const PIR_L1_CHAIN_ID = 7810;
export const FUJI_C_CHAIN_ID = avalancheFuji.id;

export interface ChainConfig {
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
}

export function pirL1(rpcUrl: string, explorerUrl?: string): Chain {
  return defineChain({
    id: PIR_L1_CHAIN_ID,
    name: "PIR L1",
    nativeCurrency: { name: "PIR", symbol: "PIR", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: explorerUrl ? { default: { name: "Explorer", url: explorerUrl } } : undefined,
    testnet: true,
  });
}

/** Résout la chaîne viem à partir de `CHAIN_ID` / `CHAIN_RPC_URL` / `EXPLORER_URL`. */
export function resolveChain({ chainId, rpcUrl, explorerUrl }: ChainConfig): Chain {
  if (chainId === FUJI_C_CHAIN_ID) {
    return {
      ...avalancheFuji,
      rpcUrls: { default: { http: [rpcUrl] } },
      blockExplorers: explorerUrl
        ? { default: { name: "Snowtrace", url: explorerUrl } }
        : avalancheFuji.blockExplorers,
    };
  }
  if (chainId === PIR_L1_CHAIN_ID) return pirL1(rpcUrl, explorerUrl);
  return defineChain({
    id: chainId,
    name: `Chain ${chainId}`,
    nativeCurrency: { name: "Native", symbol: "NATIVE", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: explorerUrl ? { default: { name: "Explorer", url: explorerUrl } } : undefined,
    testnet: true,
  });
}
