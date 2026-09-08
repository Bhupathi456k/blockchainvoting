const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of Voting smart contract...");
  console.log("---------------------------------------------------");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contract with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the Voting contract
  console.log("\n⏳ Deploying Voting contract...");
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Voting contract deployed successfully!");
  console.log("📄 Contract address:", contractAddress);
  console.log("👤 Admin address:", deployer.address);

  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  const admin = await voting.admin();
  console.log("✓ Contract admin verified:", admin);
  console.log("✓ Admin matches deployer:", admin === deployer.address);

  const candidateCount = await voting.candidateCount();
  console.log("✓ Initial candidate count:", candidateCount.toString());

  const totalVotes = await voting.totalVotesCast();
  console.log("✓ Initial total votes:", totalVotes.toString());

  // Display important information
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Contract Address:    ", contractAddress);
  console.log("Network:             ", hre.network.name);
  console.log("Chain ID:            ", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("Admin Address:       ", deployer.address);
  console.log("Deployment Timestamp:", new Date().toISOString());
  console.log("=".repeat(60));

  console.log("\n⚠️  IMPORTANT: Copy the contract address above and update your .env file:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n✨ Deployment complete!");

  return contractAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
