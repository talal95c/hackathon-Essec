// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IntentRegistry} from "../src/IntentRegistry.sol";

contract IntentRegistryTest is Test {
    IntentRegistry internal registry;

    address internal owner = makeAddr("owner-pir");
    address internal issuer = makeAddr("issuer-pme-fr");
    address internal stranger = makeAddr("stranger");
    uint256 internal auditorPk = 0xA11CE;
    address internal auditor = vm.addr(auditorPk);

    bytes32 internal constant INTENT = keccak256("intent-1");
    bytes32 internal constant PAYER = keccak256("payer-id");
    bytes32 internal constant BENEF = keccak256("beneficiary-id");
    bytes32 internal constant EUR = bytes32("EUR");
    uint256 internal constant MAX = 30_000e6;
    uint64 internal deadline;

    function setUp() public {
        vm.warp(1_760_000_000);
        deadline = uint64(block.timestamp + 7 days);
        registry = new IntentRegistry(owner, auditor);
    }

    function _publish() internal {
        vm.prank(issuer);
        registry.publishIntent(INTENT, PAYER, BENEF, MAX, EUR, deadline);
    }

    // ---------------------------- publish --------------------------------- //

    function test_Publish_Nominal_EmitsAndStores() public {
        vm.expectEmit(address(registry));
        emit IntentRegistry.IntentPublished(INTENT, issuer, PAYER, BENEF, MAX, EUR, deadline);
        _publish();

        (
            bool exists,
            bool revoked,
            bool expired,
            address iss,
            uint256 max,
            bytes32 cur,
            uint64 dl
        ) = registry.isConfirmed(INTENT);
        assertTrue(exists);
        assertFalse(revoked);
        assertFalse(expired);
        assertEq(iss, issuer);
        assertEq(max, MAX);
        assertEq(cur, EUR);
        assertEq(dl, deadline);

        IntentRegistry.Intent memory it = registry.getIntent(INTENT);
        assertEq(it.publishedAt, uint64(block.timestamp));
        assertEq(it.payerIdHash, PAYER);
        assertEq(it.beneficiaryIdHash, BENEF);
    }

    function test_Publish_Twice_Reverts() public {
        _publish();
        vm.prank(issuer);
        vm.expectRevert(
            abi.encodeWithSelector(IntentRegistry.IntentAlreadyPublished.selector, INTENT)
        );
        registry.publishIntent(INTENT, PAYER, BENEF, MAX, EUR, deadline);
    }

    function test_Publish_SameHashByOther_Reverts() public {
        _publish();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(IntentRegistry.IntentAlreadyPublished.selector, INTENT)
        );
        registry.publishIntent(INTENT, PAYER, BENEF, MAX + 1, EUR, deadline);
    }

    function test_Publish_PastDeadline_Reverts() public {
        uint64 past = uint64(block.timestamp);
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(IntentRegistry.DeadlinePassed.selector, past, past));
        registry.publishIntent(INTENT, PAYER, BENEF, MAX, EUR, past);
    }

    function test_Publish_ZeroAmountOrHash_Reverts() public {
        vm.startPrank(issuer);
        vm.expectRevert(IntentRegistry.ZeroAmount.selector);
        registry.publishIntent(INTENT, PAYER, BENEF, 0, EUR, deadline);
        vm.expectRevert(IntentRegistry.ZeroHash.selector);
        registry.publishIntent(bytes32(0), PAYER, BENEF, MAX, EUR, deadline);
        vm.expectRevert(IntentRegistry.ZeroHash.selector);
        registry.publishIntent(INTENT, PAYER, bytes32(0), MAX, EUR, deadline);
        vm.stopPrank();
    }

    // ---------------------------- revoke ---------------------------------- //

    function test_Revoke_ByIssuer() public {
        _publish();
        vm.expectEmit(address(registry));
        emit IntentRegistry.Revoked(INTENT, issuer);
        vm.prank(issuer);
        registry.revoke(INTENT);

        (bool exists, bool revoked,,,,,) = registry.isConfirmed(INTENT);
        assertTrue(exists);
        assertTrue(revoked);
    }

    function test_Revoke_ByOwner_KillSwitch() public {
        _publish();
        vm.prank(owner);
        registry.revoke(INTENT);
        (, bool revoked,,,,,) = registry.isConfirmed(INTENT);
        assertTrue(revoked);
    }

    function test_Revoke_ByStranger_Reverts() public {
        _publish();
        vm.prank(stranger);
        vm.expectRevert(IntentRegistry.Unauthorized.selector);
        registry.revoke(INTENT);
    }

    function test_Revoke_Twice_Reverts() public {
        _publish();
        vm.startPrank(issuer);
        registry.revoke(INTENT);
        vm.expectRevert(abi.encodeWithSelector(IntentRegistry.AlreadyRevoked.selector, INTENT));
        registry.revoke(INTENT);
        vm.stopPrank();
    }

    function test_Revoke_Unknown_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IntentRegistry.UnknownIntent.selector, INTENT));
        registry.revoke(INTENT);
    }

    // ---------------------------- read ------------------------------------ //

    function test_IsConfirmed_ByThirdParty_AndUnknown() public {
        _publish();
        vm.prank(stranger);
        (bool exists,,, address iss,,,) = registry.isConfirmed(INTENT);
        assertTrue(exists);
        assertEq(iss, issuer);

        (bool exists2, bool revoked2, bool expired2, address iss2,,,) =
            registry.isConfirmed(keccak256("nope"));
        assertFalse(exists2);
        assertFalse(revoked2);
        assertFalse(expired2);
        assertEq(iss2, address(0));
    }

    function test_IsConfirmed_ExpiredAfterDeadline() public {
        _publish();
        vm.warp(deadline);
        (bool exists, bool revoked, bool expired,,,,) = registry.isConfirmed(INTENT);
        assertTrue(exists);
        assertFalse(revoked);
        assertTrue(expired);
    }

    // ---------------------------- auditor --------------------------------- //

    function test_Constructor_SetsAuditor() public view {
        assertEq(registry.auditor(), auditor);
        assertEq(registry.attester(), auditor);
    }

    function test_SetAuditor_OnlyOwner() public {
        address next = makeAddr("auditor-2");
        vm.expectEmit(address(registry));
        emit IntentRegistry.AuditorSet(auditor, next);
        vm.prank(owner);
        registry.setAuditor(next);
        assertEq(registry.auditor(), next);

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        registry.setAuditor(stranger);
    }

    function test_Attester_FallsBackToOwner() public {
        vm.prank(owner);
        registry.setAuditor(address(0));
        assertEq(registry.attester(), owner);
    }

    // ---------------------------- attestBeneficiary (P2) ------------------ //

    function _sign(uint256 pk, bytes32 benef, bytes32 account)
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(
            abi.encode(registry.BENEFICIARY_ATTESTATION_TYPEHASH(), benef, account)
        );
        bytes32 digest =
            keccak256(abi.encodePacked("\x19\x01", registry.domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_AttestBeneficiary_ByAuditorSig_RelayedByAnyone() public {
        bytes32 account = keccak256("iban-verified");
        bytes memory sig = _sign(auditorPk, BENEF, account);

        vm.expectEmit(address(registry));
        emit IntentRegistry.BeneficiaryAttested(BENEF, account, auditor);
        vm.prank(stranger);
        registry.attestBeneficiary(BENEF, account, sig);
        assertEq(registry.attestedAccount(BENEF), account);
    }

    function test_AttestBeneficiary_WrongSigner_Reverts() public {
        bytes32 account = keccak256("iban-verified");
        bytes memory sig = _sign(0xBAD, BENEF, account);
        vm.expectRevert(IntentRegistry.InvalidAttestation.selector);
        registry.attestBeneficiary(BENEF, account, sig);
    }

    function test_AttestBeneficiary_TamperedPayload_Reverts() public {
        bytes memory sig = _sign(auditorPk, BENEF, keccak256("iban-verified"));
        vm.expectRevert(IntentRegistry.InvalidAttestation.selector);
        registry.attestBeneficiary(BENEF, keccak256("iban-swapped"), sig);
    }

    // ---------------------------- anchorJournal (P2) ---------------------- //

    function test_AnchorJournal_OnlyOwner() public {
        bytes32 root = keccak256("journal-root");
        vm.expectEmit(address(registry));
        emit IntentRegistry.JournalAnchored(root, uint64(block.timestamp));
        vm.prank(owner);
        registry.anchorJournal(root);
        assertEq(registry.journalRoot(), root);
        assertEq(registry.journalAnchoredAt(), uint64(block.timestamp));

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        registry.anchorJournal(root);
    }
}
