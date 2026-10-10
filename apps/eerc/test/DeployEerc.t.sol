// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";

import {EncryptedERC} from "eerc/EncryptedERC.sol";
import {Registrar} from "eerc/Registrar.sol";
import {CreateEncryptedERCParams} from "eerc/types/Types.sol";
import {RegistrationVerifier} from "eerc/prod/RegistrationVerifier.sol";
import {MintVerifier} from "eerc/prod/MintVerifier.sol";
import {WithdrawVerifier} from "eerc/prod/WithdrawVerifier.sol";
import {TransferVerifier} from "eerc/prod/TransferVerifier.sol";
import {BurnVerifier} from "eerc/prod/BurnVerifier.sol";

import {MockUSDC} from "../src/MockUSDC.sol";

/// Câblage Converter : les preuves zk sont générées côté client (scripts/eerc-register.mjs) ;
/// ici on vérifie ce qui est testable sans preuve.
contract DeployEercTest is Test {
    MockUSDC internal usdc;
    Registrar internal registrar;
    EncryptedERC internal eerc;
    address internal owner = makeAddr("owner");
    address internal payer = makeAddr("payer");

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        registrar = new Registrar(address(new RegistrationVerifier()));
        eerc = new EncryptedERC(
            CreateEncryptedERCParams({
                registrar: address(registrar),
                isConverter: true,
                name: "",
                symbol: "",
                mintVerifier: address(new MintVerifier()),
                withdrawVerifier: address(new WithdrawVerifier()),
                transferVerifier: address(new TransferVerifier()),
                burnVerifier: address(new BurnVerifier()),
                decimals: 6
            })
        );
        vm.stopPrank();
    }

    function test_MockUSDC_6Decimals_FreeMint() public {
        assertEq(usdc.decimals(), 6);
        vm.prank(payer);
        usdc.mint(payer, 30_000e6);
        assertEq(usdc.balanceOf(payer), 30_000e6);
    }

    function test_Eerc_IsConverter_WiredToRegistrar() public view {
        assertTrue(eerc.isConverter());
        assertEq(address(eerc.registrar()), address(registrar));
        assertEq(eerc.owner(), owner);
        assertFalse(eerc.isAuditorKeySet());
    }

    function test_Deposit_RequiresRegistration() public {
        usdc.mint(payer, 100e6);
        vm.startPrank(payer);
        usdc.approve(address(eerc), 100e6);
        uint256[7] memory pct;
        vm.expectRevert();
        eerc.deposit(100e6, address(usdc), pct);
        vm.stopPrank();
    }

    function test_SetAuditor_RequiresRegisteredUser() public {
        vm.prank(owner);
        vm.expectRevert();
        eerc.setAuditorPublicKey(payer);
    }
}
