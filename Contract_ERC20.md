// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title OG Token — Quantum Gratitude Token
/// @notice ERC-20 токен для QG-экосистемы
contract OGToken is ERC20, Ownable {

    /// @notice Конструктор задает имя токена и символ
    constructor() ERC20("Quantum Gratitude Token", "OGT") Ownable(msg.sender) {
        // Начальная эмиссия (опционально)
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /// @notice Функция для выпуска новых токенов (доступна только владельцу)
    /// @param to Адрес получателя
    /// @param amount Количество токенов (в минимальных единицах)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @notice Опционально: функция для сжигания токенов
    /// @param amount Количество токенов для сжигания
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
