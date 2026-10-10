// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IntentHashLib} from "../src/IntentHash.sol";

/// Vecteur croisé avec packages/core/test/hash.test.ts (mêmes entrées, même hash attendu).
contract IntentHashTest is Test {
    function test_TypeHash() public pure {
        assertEq(
            IntentHashLib.INTENT_TYPEHASH,
            0x676ff0fae9443fe9e53c0777519b304b922f14c8e24027c9d2ffae35492d4edb
        );
    }

    function test_CrossVector_TS() public pure {
        bytes32 h = IntentHashLib.hash(
            keccak256("payer:fr-siren-123456789"),
            keccak256("beneficiary:cn-uscc-91310000"),
            3_000_000,
            bytes32("EUR"),
            1_791_738_608,
            keccak256("nonce-1")
        );
        assertEq(h, 0x73082f6db08197160e1c6f6cc0a257b046c0d8f282ed0242b1bd6e39be6b0f4c);
    }

    function test_AnyFieldChangesHash() public pure {
        bytes32 base = IntentHashLib.hash(
            bytes32(uint256(1)), bytes32(uint256(2)), 3, bytes32("EUR"), 4, bytes32(uint256(5))
        );
        assertTrue(
            base
                != IntentHashLib.hash(
                    bytes32(uint256(1)),
                    bytes32(uint256(2)),
                    4,
                    bytes32("EUR"),
                    4,
                    bytes32(uint256(5))
                )
        );
        assertTrue(
            base
                != IntentHashLib.hash(
                    bytes32(uint256(1)),
                    bytes32(uint256(2)),
                    3,
                    bytes32("USD"),
                    4,
                    bytes32(uint256(5))
                )
        );
        assertTrue(
            base
                != IntentHashLib.hash(
                    bytes32(uint256(1)),
                    bytes32(uint256(2)),
                    3,
                    bytes32("EUR"),
                    5,
                    bytes32(uint256(5))
                )
        );
        assertTrue(
            base
                != IntentHashLib.hash(
                    bytes32(uint256(1)),
                    bytes32(uint256(2)),
                    3,
                    bytes32("EUR"),
                    4,
                    bytes32(uint256(6))
                )
        );
    }
}
