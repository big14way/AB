const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 Checking wallet setup for Base Sepolia deployment...\n");

  try {
    const signers = await hre.ethers.getSigners();
    
    if (!signers || signers.length === 0) {
      throw new Error("No signers available. Check your PRIVATE_KEY in .env");
    }
    
    const deployer = signers[0];
    const address = deployer.address;

    console.log("📍 Wallet Address:", address);

    const balance = await hre.ethers.provider.getBalance(address);
    const balanceInEth = hre.ethers.formatEther(balance);

    console.log("💰 Balance:", balanceInEth, "ETH");

    const networkInfo = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", networkInfo.name);
    console.log("🔗 Chain ID:", networkInfo.chainId.toString());

    const minBalance = hre.ethers.parseEther("0.001");
    
    if (balance < minBalance) {
      console.log("\n⚠️  WARNING: Low balance!");
      console.log("   You need at least 0.001 ETH for deployment");
      console.log("   Get ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
      process.exit(1);
    } else {
      console.log("\n✅ Balance sufficient for deployment!");
      console.log("\n📋 Ready to deploy:");
      console.log("   npx hardhat run scripts/deploy.js --network sepolia");
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("invalid private key")) {
      console.log("\n💡 Fix: Update PRIVATE_KEY in .env file");
      console.log("   Should be 64 hex characters (or 66 with 0x prefix)");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
