// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IntentHashLib — hash canonique d'une intention de paiement PIR.
 * @notice Doit rester identique à `intentHash()` de `packages/core/src/hash.ts` (test croisé :
 *         apps/contracts/test/IntentHash.t.sol ↔ packages/core/test/hash.test.ts).
 */
library IntentHashLib {
    bytes32 internal constant INTENT_TYPEHASH = keccak256(
        "PaymentIntent(bytes32 payerIdHash,bytes32 beneficiaryIdHash,uint256 maxAmount,bytes32 currency,uint64 deadline,bytes32 nonce)"
    );

    function hash(
        bytes32 payerIdHash,
        bytes32 beneficiaryIdHash,
        uint256 maxAmount,
        bytes32 currency,
        uint64 deadline,
        bytes32 nonce
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                INTENT_TYPEHASH,
                payerIdHash,
                beneficiaryIdHash,
                maxAmount,
                currency,
                deadline,
                nonce
            )
        );
    }
}
