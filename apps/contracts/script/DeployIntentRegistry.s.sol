// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {IntentRegistry} from "../src/IntentRegistry.sol";

/**
 * @title DeployIntentRegistry — déploie le registre de confirmation sur la chaîne
 *        pointée par `--rpc-url` (L1 « pir » locale, Fuji C-Chain, Anvil…).
 * @notice Depuis la racine du monorepo (variables lues dans apps/web/.env.local) :
 *
 *     pnpm deploy:registry
 *
 *   ou directement :
 *
 *     cd apps/contracts && forge script script/DeployIntentRegistry.s.sol \
 *         --rpc-url "$CHAIN_RPC_URL" --broadcast
 *
 * Env : DEPLOYER_PRIVATE_KEY (devient owner = kill switch), AUDITOR_ADDRESS (optionnel,
 * persona « Auditeur » ; vide = aucun, l'owner signe les attestations).
 * Sortie : NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS à coller dans apps/web/.env.local.
 */
contract DeployIntentRegistry is Script {
    function run() external returns (IntentRegistry registry) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address auditor = vm.envOr("AUDITOR_ADDRESS", address(0));

        console2.log("Chain ID  :", block.chainid);
        console2.log("Deployer  :", deployer);
        console2.log("Auditor   :", auditor);

        vm.startBroadcast(pk);
        registry = new IntentRegistry(deployer, auditor);
        vm.stopBroadcast();

        console2.log("");
        console2.log("NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS=%s", address(registry));
    }
}
