const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bridge Contract", function () {
  let bridge;
  let mockUSDC;
  let owner;
  let addr1;
  let addr2;
  
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();
    
    const Bridge = await ethers.getContractFactory("Bridge");
    bridge = await Bridge.deploy(await mockUSDC.getAddress());
    await bridge.waitForDeployment();
    
    await mockUSDC.mint(addr1.address, ethers.parseUnits("1000", 6));
  });
  
  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      expect(await bridge.usdcToken()).to.equal(await mockUSDC.getAddress());
    });
    
    it("Should grant admin role to deployer", async function () {
      const ADMIN_ROLE = await bridge.ADMIN_ROLE();
      expect(await bridge.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });
  
  describe("Deposits", function () {
    it("Should allow users to deposit USDC", async function () {
      const amount = ethers.parseUnits("100", 6);
      const fiatRef = "MPESA-123456";
      
      await mockUSDC.connect(addr1).approve(await bridge.getAddress(), amount);
      
      await expect(
        bridge.connect(addr1).depositUSDC(addr2.address, amount, fiatRef)
      )
        .to.emit(bridge, "TransferEvent")
        .withArgs(addr1.address, addr2.address, amount, fiatRef, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
    });
    
    it("Should transfer USDC from sender to contract", async function () {
      const amount = ethers.parseUnits("100", 6);
      const fiatRef = "MPESA-123456";
      
      await mockUSDC.connect(addr1).approve(await bridge.getAddress(), amount);
      
      const bridgeBalanceBefore = await mockUSDC.balanceOf(await bridge.getAddress());
      await bridge.connect(addr1).depositUSDC(addr2.address, amount, fiatRef);
      const bridgeBalanceAfter = await mockUSDC.balanceOf(await bridge.getAddress());
      
      expect(bridgeBalanceAfter - bridgeBalanceBefore).to.equal(amount);
    });
    
    it("Should revert on zero amount", async function () {
      await expect(
        bridge.connect(addr1).depositUSDC(addr2.address, 0, "MPESA-123")
      ).to.be.revertedWith("Amount must be positive");
    });
    
    it("Should revert on zero address recipient", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(
        bridge.connect(addr1).depositUSDC(ethers.ZeroAddress, amount, "MPESA-123")
      ).to.be.revertedWith("Invalid recipient");
    });
    
    it("Should revert on empty fiat reference", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(
        bridge.connect(addr1).depositUSDC(addr2.address, amount, "")
      ).to.be.revertedWith("Fiat reference required");
    });
  });
  
  describe("Withdrawals", function () {
    beforeEach(async function () {
      const amount = ethers.parseUnits("500", 6);
      await mockUSDC.connect(addr1).approve(await bridge.getAddress(), amount);
      await bridge.connect(addr1).depositUSDC(addr2.address, amount, "MPESA-123");
    });
    
    it("Should allow admin to withdraw USDC", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      await expect(
        bridge.connect(owner).withdrawUSDC(addr2.address, amount)
      )
        .to.emit(bridge, "WithdrawalEvent")
        .withArgs(addr2.address, amount, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
    });
    
    it("Should transfer USDC from contract to recipient", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      const recipientBalanceBefore = await mockUSDC.balanceOf(addr2.address);
      await bridge.connect(owner).withdrawUSDC(addr2.address, amount);
      const recipientBalanceAfter = await mockUSDC.balanceOf(addr2.address);
      
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(amount);
    });
    
    it("Should revert when non-admin tries to withdraw", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      await expect(
        bridge.connect(addr1).withdrawUSDC(addr2.address, amount)
      ).to.be.reverted;
    });
    
    it("Should revert on insufficient balance", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      await expect(
        bridge.connect(owner).withdrawUSDC(addr2.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
  
  describe("View Functions", function () {
    it("Should return correct contract balance", async function () {
      const amount = ethers.parseUnits("250", 6);
      await mockUSDC.connect(addr1).approve(await bridge.getAddress(), amount);
      await bridge.connect(addr1).depositUSDC(addr2.address, amount, "MPESA-123");
      
      expect(await bridge.getContractBalance()).to.equal(amount);
    });
  });
});
