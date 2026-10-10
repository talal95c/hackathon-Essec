// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title IntentRegistry — registre de confirmation PIR (PRD §4.10 F-AVAX-1…9).
 * @notice Preuve indépendante qu'une intention de paiement signée existe, n'a pas été
 *         révoquée et borne le règlement (montant max, devise, deadline). Le registre ne
 *         détient aucun fonds et ne publie que des hashes / engagements : jamais de donnée
 *         personnelle en clair.
 *
 *         Règle produit : chaque composant ne peut que RESTREINDRE ou VÉRIFIER une
 *         intention, jamais l'élargir — d'où l'immuabilité d'une intention publiée
 *         (pas de mise à jour, seulement `revoke`).
 *
 *         Chain-agnostique : aucun précompilé Avalanche, même bytecode sur la L1 « pir »,
 *         Fuji C-Chain ou Anvil.
 *
 * Rôles :
 *   • issuer  — l'adresse qui publie (payeur ou service PIR agissant pour lui).
 *   • owner   — kill switch (peut révoquer n'importe quelle intention), gère l'auditeur
 *               et l'ancrage du journal.
 *   • auditor — persona « Auditeur » : signe les attestations de bénéficiaire (EIP-712)
 *               et reçoit la clé d'audit eERC (hors de ce contrat).
 */
contract IntentRegistry is Ownable, EIP712 {
    // ---------------------------- Types ----------------------------------- //

    struct Intent {
        address issuer;
        bytes32 payerIdHash;
        bytes32 beneficiaryIdHash;
        uint256 maxAmount;
        bytes32 currency; // code ISO 4217 ASCII, aligné à gauche (ex. bytes32("EUR"))
        uint64 deadline; // unix seconds, exclusif
        uint64 publishedAt;
        bool revoked;
    }

    // ---------------------------- Events ---------------------------------- //

    event IntentPublished(
        bytes32 indexed intentHash,
        address indexed issuer,
        bytes32 indexed payerIdHash,
        bytes32 beneficiaryIdHash,
        uint256 maxAmount,
        bytes32 currency,
        uint64 deadline
    );
    event Revoked(bytes32 indexed intentHash, address indexed by);
    event BeneficiaryAttested(
        bytes32 indexed beneficiaryIdHash, bytes32 indexed accountHash, address indexed attester
    );
    event AuditorSet(address indexed previousAuditor, address indexed newAuditor);
    event JournalAnchored(bytes32 indexed root, uint64 indexed anchoredAt);

    // ---------------------------- Errors ---------------------------------- //

    error ZeroHash();
    error ZeroAmount();
    error DeadlinePassed(uint64 deadline, uint64 nowTs);
    error IntentAlreadyPublished(bytes32 intentHash);
    error UnknownIntent(bytes32 intentHash);
    error AlreadyRevoked(bytes32 intentHash);
    error Unauthorized();
    error InvalidAttestation();

    // ---------------------------- Storage --------------------------------- //

    bytes32 public constant BENEFICIARY_ATTESTATION_TYPEHASH =
        keccak256("BeneficiaryAttestation(bytes32 beneficiaryIdHash,bytes32 accountHash)");

    address public auditor;
    bytes32 public journalRoot;
    uint64 public journalAnchoredAt;

    mapping(bytes32 intentHash => Intent) private _intents;
    /// @dev beneficiaryIdHash → accountHash attesté (hash du compte/IBAN vérifié hors bande).
    mapping(bytes32 beneficiaryIdHash => bytes32 accountHash) public attestedAccount;

    constructor(address initialOwner, address initialAuditor)
        Ownable(initialOwner)
        EIP712("PIR IntentRegistry", "1")
    {
        if (initialAuditor != address(0)) {
            auditor = initialAuditor;
            emit AuditorSet(address(0), initialAuditor);
        }
    }

    // ---------------------------- Intentions ------------------------------ //

    /**
     * @notice Publie une intention. `intentHash` est le keccak256 canonique des champs
     *         normalisés calculé hors chaîne (packages/core) ; le contrat le traite comme
     *         un identifiant opaque et ne peut pas le recalculer.
     */
    function publishIntent(
        bytes32 intentHash,
        bytes32 payerIdHash,
        bytes32 beneficiaryIdHash,
        uint256 maxAmount,
        bytes32 currency,
        uint64 deadline
    ) external {
        if (
            intentHash == bytes32(0) || payerIdHash == bytes32(0) || beneficiaryIdHash == bytes32(0)
        ) {
            revert ZeroHash();
        }
        if (maxAmount == 0) revert ZeroAmount();
        if (deadline <= block.timestamp) revert DeadlinePassed(deadline, uint64(block.timestamp));
        if (_intents[intentHash].issuer != address(0)) revert IntentAlreadyPublished(intentHash);

        _intents[intentHash] = Intent({
            issuer: msg.sender,
            payerIdHash: payerIdHash,
            beneficiaryIdHash: beneficiaryIdHash,
            maxAmount: maxAmount,
            currency: currency,
            deadline: deadline,
            publishedAt: uint64(block.timestamp),
            revoked: false
        });

        emit IntentPublished(
            intentHash, msg.sender, payerIdHash, beneficiaryIdHash, maxAmount, currency, deadline
        );
    }

    /// @notice Révoque une intention : émetteur, ou owner (kill switch).
    function revoke(bytes32 intentHash) external {
        Intent storage it = _intents[intentHash];
        if (it.issuer == address(0)) revert UnknownIntent(intentHash);
        if (msg.sender != it.issuer && msg.sender != owner()) revert Unauthorized();
        if (it.revoked) revert AlreadyRevoked(intentHash);

        it.revoked = true;
        emit Revoked(intentHash, msg.sender);
    }

    /**
     * @notice Lecture au moment du règlement (adaptateur stablecoin, F-AVAX-4).
     * @return exists    l'intention a été publiée
     * @return revoked   elle a été révoquée
     * @return expired   la deadline est dépassée
     * @return issuer    adresse émettrice
     * @return maxAmount montant plafond (unités de `currency`, décimales fixées hors chaîne)
     * @return currency  code devise
     * @return deadline  deadline unix
     */
    function isConfirmed(bytes32 intentHash)
        external
        view
        returns (
            bool exists,
            bool revoked,
            bool expired,
            address issuer,
            uint256 maxAmount,
            bytes32 currency,
            uint64 deadline
        )
    {
        Intent storage it = _intents[intentHash];
        exists = it.issuer != address(0);
        revoked = it.revoked;
        expired = exists && block.timestamp >= it.deadline;
        issuer = it.issuer;
        maxAmount = it.maxAmount;
        currency = it.currency;
        deadline = it.deadline;
    }

    /// @notice Intention complète (lecture tierce, indexation).
    function getIntent(bytes32 intentHash) external view returns (Intent memory) {
        return _intents[intentHash];
    }

    // ---------------------------- Bénéficiaires (P2) ---------------------- //

    /**
     * @notice Enregistre qu'un compte (`accountHash`) a été vérifié hors bande pour un
     *         bénéficiaire (`beneficiaryIdHash`). La signature EIP-712 doit provenir de
     *         l'auditeur (ou de l'owner si aucun auditeur n'est défini). N'importe qui peut
     *         relayer la signature. Stub P2 : un seul compte par bénéficiaire, dernier gagne.
     */
    function attestBeneficiary(
        bytes32 beneficiaryIdHash,
        bytes32 accountHash,
        bytes calldata signature
    ) external {
        if (beneficiaryIdHash == bytes32(0) || accountHash == bytes32(0)) {
            revert ZeroHash();
        }

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(BENEFICIARY_ATTESTATION_TYPEHASH, beneficiaryIdHash, accountHash))
        );
        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(digest, signature);
        if (err != ECDSA.RecoverError.NoError || signer != attester()) revert InvalidAttestation();

        attestedAccount[beneficiaryIdHash] = accountHash;
        emit BeneficiaryAttested(beneficiaryIdHash, accountHash, signer);
    }

    /// @notice Adresse habilitée à signer les attestations : auditeur, sinon owner.
    function attester() public view returns (address) {
        return auditor == address(0) ? owner() : auditor;
    }

    // ---------------------------- Administration -------------------------- //

    /// @notice Change le persona « Auditeur » (clé rotative). `address(0)` = aucun.
    function setAuditor(address newAuditor) external onlyOwner {
        address previous = auditor;
        auditor = newAuditor;
        emit AuditorSet(previous, newAuditor);
    }

    /// @notice Ancre la racine du journal hash-chaîné de la garde (P2, F-AVAX-6).
    function anchorJournal(bytes32 root) external onlyOwner {
        if (root == bytes32(0)) revert ZeroHash();
        journalRoot = root;
        journalAnchoredAt = uint64(block.timestamp);
        emit JournalAnchored(root, journalAnchoredAt);
    }

    /// @notice Séparateur de domaine EIP-712 (pour signer côté TS avec viem `signTypedData`).
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
