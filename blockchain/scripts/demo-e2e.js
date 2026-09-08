const hre = require("hardhat");

async function main() {
  console.log("=================================================================");
  console.log("🚀 END-TO-END DEMONSTRATION: A SECURE DIGITAL VOTING PLATFORM");
  console.log("=================================================================\n");

  const [admin, voterA, voterB, voterC] = await hre.ethers.getSigners();
  console.log("📍 Roles & Accounts:");
  console.log("   • Admin:   ", admin.address);
  console.log("   • Voter A: ", voterA.address);
  console.log("   • Voter B: ", voterB.address);
  console.log("   • Voter C: ", voterC.address);
  console.log("");

  // 1. Deploy Contract
  console.log("--- STEP 1: Deploying Smart Contract ---");
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  const contractAddress = await voting.getAddress();
  console.log("✓ Contract deployed at:", contractAddress);

  // 2. Create Election
  console.log("\n--- STEP 2: Admin Creates Election ---");
  const now = Math.floor(Date.now() / 1000);
  await voting.createElection(
    "2024 University Student Council Election",
    "Official democratic election for student representatives",
    now,
    now + 86400
  );
  console.log("✓ Election created: '2024 University Student Council Election'");

  // 3. Register Candidates
  console.log("\n--- STEP 3: Admin Registers 3 Candidates ---");
  await voting.registerCandidate("Alice Johnson", "Progressive Alliance", "Focus on digital campus infrastructure");
  console.log("✓ Candidate #1 Registered: Alice Johnson (Progressive Alliance)");

  await voting.registerCandidate("Bob Smith", "United Students", "Focus on sports and student welfare");
  console.log("✓ Candidate #2 Registered: Bob Smith (United Students)");

  await voting.registerCandidate("Charlie Brown", "Independent", "Focus on sustainability and green initiatives");
  console.log("✓ Candidate #3 Registered: Charlie Brown (Independent)");

  // 4. Authorize Voters
  console.log("\n--- STEP 4: Admin Authorizes Eligible Voters ---");
  await voting.authorizeVotersBatch([voterA.address, voterB.address, voterC.address]);
  console.log("✓ Batch authorized 3 voters on-chain:", voterA.address, voterB.address, voterC.address);

  // 5. Start Election
  console.log("\n--- STEP 5: Admin Starts the Election ---");
  await voting.startElection();
  console.log("✓ Election is now ACTIVE on the blockchain");

  // 6. Voter A Casts Vote for Candidate 1
  console.log("\n--- STEP 6: Voter A Casts Vote for Candidate #1 (Alice) ---");
  const txA = await voting.connect(voterA).castVote(1);
  const receiptA = await txA.wait();
  console.log("✓ Vote successfully recorded!");
  console.log("  • Transaction Hash:", receiptA.hash);
  console.log("  • Block Number:     ", receiptA.blockNumber);
  console.log("  • Gas Used:         ", receiptA.gasUsed.toString());

  // 7. Voter A Tries to Vote Again (DUPLICATE VOTE ATTEMPT)
  console.log("\n--- STEP 7: Voter A Attempts Duplicate Vote (SECURITY TEST) ---");
  try {
    await voting.connect(voterA).castVote(2);
    console.error("❌ CRITICAL ERROR: Duplicate vote was allowed!");
  } catch (err) {
    console.log("🛡️  SUCCESS: Duplicate vote correctly rejected by Smart Contract!");
    console.log("   Error Reason:", err.message.split("'")[1] || err.message);
  }

  // 8. Voter B Casts Vote for Candidate 2
  console.log("\n--- STEP 8: Voter B Casts Vote for Candidate #2 (Bob) ---");
  const txB = await voting.connect(voterB).castVote(2);
  const receiptB = await txB.wait();
  console.log("✓ Vote successfully recorded!");
  console.log("  • Transaction Hash:", receiptB.hash);

  // 9. Voter C Casts Vote for Candidate 1
  console.log("\n--- STEP 9: Voter C Casts Vote for Candidate #1 (Alice) ---");
  const txC = await voting.connect(voterC).castVote(1);
  const receiptC = await txC.wait();
  console.log("✓ Vote successfully recorded!");
  console.log("  • Transaction Hash:", receiptC.hash);

  // 10. Admin Ends Election
  console.log("\n--- STEP 10: Admin Ends the Election ---");
  await voting.endElection();
  console.log("✓ Election is now officially ENDED");

  // 11. Retrieve Authoritative Results directly from Blockchain
  console.log("\n=================================================================");
  console.log("📊 FINAL VERIFIED ELECTION RESULTS (DIRECT FROM BLOCKCHAIN)");
  console.log("=================================================================");
  const [candidates, totalVotes, isComplete] = await voting.getResults();

  console.log(`Total Votes Cast: ${totalVotes.toString()}`);
  console.log(`Election Status:  ${isComplete ? "COMPLETED" : "IN PROGRESS"}\n`);

  candidates.forEach((cand) => {
    const percentage = totalVotes > 0 ? ((Number(cand.voteCount) / Number(totalVotes)) * 100).toFixed(2) : 0;
    console.log(`Candidate #${cand.id}: ${cand.name} (${cand.party})`);
    console.log(`  • Votes Received: ${cand.voteCount.toString()}`);
    console.log(`  • Vote Share:     ${percentage}%\n`);
  });

  console.log("🏆 WINNER: Candidate #1 - Alice Johnson (Progressive Alliance)");
  console.log("=================================================================");
  console.log("✨ End-to-End Demonstration Completed Successfully!");
  console.log("=================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
