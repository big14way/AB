// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Bridge is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    IERC20 public immutable usdcToken;
    
    event TransferEvent(
        address indexed from,
        address indexed to,
        uint256 amount,
        string fiatRef,
        uint256 timestamp
    );
    
    event WithdrawalEvent(
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );
    
    constructor(address _usdcAddress) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function depositUSDC(
        address to,
        uint256 amount,
        string calldata fiatRef
    ) external nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(bytes(fiatRef).length > 0, "Fiat reference required");
        
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        emit TransferEvent(msg.sender, to, amount, fiatRef, block.timestamp);
    }
    
    function withdrawUSDC(
        address to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(
            usdcToken.balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );
        
        require(
            usdcToken.transfer(to, amount),
            "Transfer failed"
        );
        
        emit WithdrawalEvent(to, amount, block.timestamp);
    }
    
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
}
