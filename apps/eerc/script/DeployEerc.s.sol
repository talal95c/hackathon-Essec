// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script, console2} from "forge-std/Script.sol";

import {EncryptedERC} from "eerc/EncryptedERC.sol";
import {Registrar} from "eerc/Registrar.sol";
import {CreateEncryptedERCParams} from "eerc/types/Types.sol";
// Vérifieurs « prod » = ceux qui correspondent aux artefacts circom/build (zkey, wasm) du dépôt.
// (contracts/verifiers/* sont les vérifieurs dev regénérés par hardhat-zkit : clés différentes.)
import {RegistrationVerifier} from "eerc/prod/RegistrationVerifier.sol";
import {MintVerifier} from "eerc/prod/MintVerifier.sol";
import {WithdrawVerifier} from "eerc/prod/WithdrawVerifier.sol";
import {TransferVerifier} from "eerc/prod/TransferVerifier.sol";
import {BurnVerifier} from "eerc/prod/BurnVerifier.sol";

import {MockUSDC} from "../src/MockUSDC.sol";

/**
 * @title DeployEerc — MockUSDC + eERC (ava-labs/EncryptedERC) en mode Converter.
 * @notice Chaîne pointée par `--rpc-url` (L1 « pir » locale, Fuji C-Chain…).
 *
 *     pnpm deploy:eerc
 *
 * Env : DEPLOYER_PRIVATE_KEY (owner du EncryptedERC : seul habilité à `setAuditorPublicKey`),
 *       MOCK_USDC_ADDRESS (optionnel : réutiliser un MockUSDC existant).
 * Déploie : 5 vérifieurs Groth16 « prod » (clés des artefacts circom/build du dépôt officiel), BabyJubJub (lib liée par forge),
 * Registrar, EncryptedERC(isConverter=true, decimals=6), MockUSDC.
 *
 * L'auditeur n'est PAS défini ici : `setAuditorPublicKey(auditor)` exige que l'auditeur soit
 * d'abord enregistré dans le Registrar avec une preuve zk de registration (voir
 * scripts/eerc-register.mjs côté Node). Étape séparée, marquée « partiel » tant qu'elle n'est
 * pas faite sur la chaîne cible.
 */
contract DeployEerc is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address usdcAddr = vm.envOr("MOCK_USDC_ADDRESS", address(0));

        console2.log("Chain ID :", block.chainid);
        console2.log("Deployer :", deployer);

        vm.startBroadcast(pk);

        MockUSDC usdc = usdcAddr == address(0) ? new MockUSDC() : MockUSDC(usdcAddr);

        address registrationVerifier = address(new RegistrationVerifier());
        address mintVerifier = address(new MintVerifier());
        address withdrawVerifier = address(new WithdrawVerifier());
        address transferVerifier = address(new TransferVerifier());
        address burnVerifier = address(new BurnVerifier());

        Registrar registrar = new Registrar(registrationVerifier);

        EncryptedERC eerc = new EncryptedERC(
            CreateEncryptedERCParams({
                registrar: address(registrar),
                isConverter: true,
                name: "",
                symbol: "",
                mintVerifier: mintVerifier,
                withdrawVerifier: withdrawVerifier,
                transferVerifier: transferVerifier,
                burnVerifier: burnVerifier,
                decimals: 6
            })
        );

        vm.stopBroadcast();

        console2.log("");
        console2.log("NEXT_PUBLIC_MOCK_USDC_ADDRESS=%s", address(usdc));
        console2.log("NEXT_PUBLIC_EERC_ADDRESS=%s", address(eerc));
        console2.log("NEXT_PUBLIC_EERC_REGISTRAR_ADDRESS=%s", address(registrar));
    }
}
