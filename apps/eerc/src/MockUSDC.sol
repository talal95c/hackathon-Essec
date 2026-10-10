// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC — stablecoin de TEST (6 décimales) pour la jambe eERC de PIR.
 * @notice Mint libre : TESTNET UNIQUEMENT (L1 « pir » locale, Fuji). N'a aucune valeur.
 *         Jamais déployé en mainnet. Sert de sous-jacent au EncryptedERC en mode Converter.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin (test)", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint libre, sans contrôle d'accès : jeton de test uniquement.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
