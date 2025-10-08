const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying Bridge contract with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  const usdcAddress = process.env.USDC_ADDRESS_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  console.log("Using USDC address:", usdcAddress);
  
  const Bridge = await hre.ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy(usdcAddress);
  
  await bridge.waitForDeployment();
  
  const bridgeAddress = await bridge.getAddress();
  console.log("\n✅ Bridge contract deployed to:", bridgeAddress);
  console.log("\n📋 Contract Info:");
  console.log("  - Network:", hre.network.name);
  console.log("  - Chain ID:", hre.network.config.chainId);
  console.log("  - USDC Token:", usdcAddress);
  console.log("  - Admin:", deployer.address);
  
  console.log("\n💾 Save this address to your .env file:");
  console.log(`BRIDGE_CONTRACT_ADDRESS=${bridgeAddress}`);
  
  console.log("\n🔍 Verify on BaseScan:");
  console.log(`https://sepolia.basescan.org/address/${bridgeAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
