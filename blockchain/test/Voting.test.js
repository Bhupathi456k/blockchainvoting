const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Voting Smart Contract", function () {
  let Voting;
  let voting;
  let admin;
  let voter1, voter2, voter3;
  let unauthorized;

  // Helper function to get future timestamp
  const getFutureTimestamp = (daysFromNow) => {
    return Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
  };

  beforeEach(async function () {
    // Get signers
    [admin, voter1, voter2, voter3, unauthorized] = await ethers.getSigners();

    // Deploy the contract
    Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("Should initialize with zero candidates", async function () {
      expect(await voting.candidateCount()).to.equal(0);
    });

    it("Should initialize with zero votes cast", async function () {
      expect(await voting.totalVotesCast()).to.equal(0);
    });
  });

  describe("Election Creation", function () {
    it("Should allow admin to create an election", async function () {
      const startTime = getFutureTimestamp(1);
      const endTime = getFutureTimestamp(7);

      await expect(
        voting.createElection(
          "Presidential Election 2024",
          "National presidential election",
          startTime,
          endTime
        )
      ).to.emit(voting, "ElectionCreated")
        .withArgs("Presidential Election 2024", startTime, endTime);

      const electionStatus = await voting.getElectionStatus();
      expect(electionStatus.title).to.equal("Presidential Election 2024");
      expect(electionStatus.isActive).to.equal(false);
      expect(electionStatus.isEnded).to.equal(false);
    });

    it("Should reject election creation by non-admin", async function () {
      const startTime = getFutureTimestamp(1);
      const endTime = getFutureTimestamp(7);

      await expect(
        voting.connect(voter1).createElection(
          "Unauthorized Election",
          "Should fail",
          startTime,
          endTime
        )
      ).to.be.revertedWith("Only admin can perform this operation");
    });

    it("Should reject election with end time before start time", async function () {
      const startTime = getFutureTimestamp(7);
      const endTime = getFutureTimestamp(1);

      await expect(
        voting.createElection(
          "Invalid Election",
          "Invalid times",
          startTime,
          endTime
        )
      ).to.be.revertedWith("Start time must be before end time");
    });

    it("Should reject election with past end time", async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) - 1800;

      await expect(
        voting.createElection(
          "Past Election",
          "Should fail",
          startTime,
          endTime
        )
      ).to.be.revertedWith("End time must be in the future");
    });
  });

  describe("Candidate Registration", function () {
    beforeEach(async function () {
      const startTime = getFutureTimestamp(1);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Test Election", "Test", startTime, endTime);
    });

    it("Should allow admin to register a candidate", async function () {
      await expect(
        voting.registerCandidate(
          "Alice Johnson",
          "Progressive Party",
          "Experienced leader"
        )
      ).to.emit(voting, "CandidateAdded")
        .withArgs(1, "Alice Johnson", "Progressive Party");

      expect(await voting.candidateCount()).to.equal(1);

      const candidate = await voting.getCandidate(1);
      expect(candidate.name).to.equal("Alice Johnson");
      expect(candidate.party).to.equal("Progressive Party");
      expect(candidate.voteCount).to.equal(0);
    });

    it("Should allow registering multiple candidates", async function () {
      await voting.registerCandidate("Alice", "Party A", "Desc A");
      await voting.registerCandidate("Bob", "Party B", "Desc B");
      await voting.registerCandidate("Charlie", "Party C", "Desc C");

      expect(await voting.candidateCount()).to.equal(3);

      const allCandidates = await voting.getAllCandidates();
      expect(allCandidates.length).to.equal(3);
      expect(allCandidates[0].name).to.equal("Alice");
      expect(allCandidates[1].name).to.equal("Bob");
      expect(allCandidates[2].name).to.equal("Charlie");
    });

    it("Should reject candidate registration by non-admin", async function () {
      await expect(
        voting.connect(voter1).registerCandidate("Unauthorized", "Party", "Desc")
      ).to.be.revertedWith("Only admin can perform this operation");
    });

    it("Should reject empty candidate name", async function () {
      await expect(
        voting.registerCandidate("", "Party", "Desc")
      ).to.be.revertedWith("Candidate name cannot be empty");
    });

    it("Should allow updating candidate before election starts", async function () {
      await voting.registerCandidate("Alice", "Party A", "Desc A");

      await expect(
        voting.updateCandidate(1, "Alice Johnson", "Progressive Party", "Updated description")
      ).to.emit(voting, "CandidateUpdated")
        .withArgs(1, "Alice Johnson", "Progressive Party");

      const candidate = await voting.getCandidate(1);
      expect(candidate.name).to.equal("Alice Johnson");
      expect(candidate.party).to.equal("Progressive Party");
    });
  });

  describe("Voter Authorization", function () {
    it("Should allow admin to authorize a voter", async function () {
      await expect(voting.authorizeVoter(voter1.address))
        .to.emit(voting, "VoterAuthorized")
        .withArgs(voter1.address);

      expect(await voting.checkIsAuthorized(voter1.address)).to.equal(true);
    });

    it("Should allow batch authorization of voters", async function () {
      const voters = [voter1.address, voter2.address, voter3.address];

      await voting.authorizeVotersBatch(voters);

      expect(await voting.checkIsAuthorized(voter1.address)).to.equal(true);
      expect(await voting.checkIsAuthorized(voter2.address)).to.equal(true);
      expect(await voting.checkIsAuthorized(voter3.address)).to.equal(true);
    });

    it("Should reject authorization by non-admin", async function () {
      await expect(
        voting.connect(voter1).authorizeVoter(voter2.address)
      ).to.be.revertedWith("Only admin can perform this operation");
    });

    it("Should reject duplicate authorization", async function () {
      await voting.authorizeVoter(voter1.address);

      await expect(
        voting.authorizeVoter(voter1.address)
      ).to.be.revertedWith("Voter already authorized");
    });

    it("Should allow deauthorization before voting", async function () {
      await voting.authorizeVoter(voter1.address);

      await expect(voting.deauthorizeVoter(voter1.address))
        .to.emit(voting, "VoterDeauthorized")
        .withArgs(voter1.address);

      expect(await voting.checkIsAuthorized(voter1.address)).to.equal(false);
    });
  });

  describe("Voting Process", function () {
    beforeEach(async function () {
      // Create election starting now
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Test Election", "Test", startTime, endTime);

      // Register candidates
      await voting.registerCandidate("Alice", "Party A", "Desc A");
      await voting.registerCandidate("Bob", "Party B", "Desc B");
      await voting.registerCandidate("Charlie", "Party C", "Desc C");

      // Authorize voters
      await voting.authorizeVotersBatch([
        voter1.address,
        voter2.address,
        voter3.address
      ]);

      // Start election
      await voting.startElection();
    });

    it("Should allow authorized voter to cast a vote", async function () {
      await expect(voting.connect(voter1).castVote(1))
        .to.emit(voting, "VoteCast");

      expect(await voting.checkHasVoted(voter1.address)).to.equal(true);
      expect(await voting.totalVotesCast()).to.equal(1);

      const candidate = await voting.getCandidate(1);
      expect(candidate.voteCount).to.equal(1);
    });

    it("Should reject vote from unauthorized voter", async function () {
      await expect(
        voting.connect(unauthorized).castVote(1)
      ).to.be.revertedWith("You are not authorized to vote");
    });

    it("Should reject vote for invalid candidate", async function () {
      await expect(
        voting.connect(voter1).castVote(999)
      ).to.be.revertedWith("Invalid candidate selected");

      await expect(
        voting.connect(voter1).castVote(0)
      ).to.be.revertedWith("Invalid candidate selected");
    });

    it("🔥 CRITICAL: Should prevent duplicate voting (Same voter voting twice)", async function () {
      // First vote should succeed
      await voting.connect(voter1).castVote(1);
      expect(await voting.checkHasVoted(voter1.address)).to.equal(true);

      // Second vote attempt should fail
      await expect(
        voting.connect(voter1).castVote(2)
      ).to.be.revertedWith("You have already cast your vote");

      // Verify vote count remains 1
      expect(await voting.totalVotesCast()).to.equal(1);

      const candidate1 = await voting.getCandidate(1);
      expect(candidate1.voteCount).to.equal(1);

      const candidate2 = await voting.getCandidate(2);
      expect(candidate2.voteCount).to.equal(0);
    });

    it("Should allow multiple different voters to vote", async function () {
      await voting.connect(voter1).castVote(1); // Vote for Alice
      await voting.connect(voter2).castVote(2); // Vote for Bob
      await voting.connect(voter3).castVote(1); // Vote for Alice

      expect(await voting.totalVotesCast()).to.equal(3);

      const candidate1 = await voting.getCandidate(1);
      expect(candidate1.voteCount).to.equal(2);

      const candidate2 = await voting.getCandidate(2);
      expect(candidate2.voteCount).to.equal(1);
    });

    it("Should correctly calculate results", async function () {
      await voting.connect(voter1).castVote(1);
      await voting.connect(voter2).castVote(2);
      await voting.connect(voter3).castVote(1);

      const results = await voting.getResults();
      expect(results.totalVotes).to.equal(3);
      expect(results.isComplete).to.equal(false);
      expect(results.results[0].voteCount).to.equal(2);
      expect(results.results[1].voteCount).to.equal(1);
      expect(results.results[2].voteCount).to.equal(0);
    });
  });

  describe("Election Lifecycle", function () {
    it("Should not allow voting before election starts", async function () {
      const startTime = getFutureTimestamp(1);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Future Election", "Test", startTime, endTime);
      await voting.registerCandidate("Alice", "Party A", "Desc A");
      await voting.registerCandidate("Bob", "Party B", "Desc B");
      await voting.authorizeVoter(voter1.address);
      await voting.startElection();

      await expect(
        voting.connect(voter1).castVote(1)
      ).to.be.revertedWith("Election has not started yet");
    });

    it("Should not allow starting election without minimum candidates", async function () {
      const startTime = getFutureTimestamp(1);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Test Election", "Test", startTime, endTime);
      await voting.registerCandidate("Alice", "Party A", "Desc A");

      await expect(
        voting.startElection()
      ).to.be.revertedWith("Must have at least 2 candidates to start election");
    });

    it("Should allow admin to end election", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Test Election", "Test", startTime, endTime);
      await voting.registerCandidate("Alice", "Party A", "Desc A");
      await voting.registerCandidate("Bob", "Party B", "Desc B");
      await voting.startElection();

      await expect(voting.endElection())
        .to.emit(voting, "ElectionEnded");

      const status = await voting.getElectionStatus();
      expect(status.isActive).to.equal(false);
      expect(status.isEnded).to.equal(true);
    });

    it("Should not allow voting after election ends", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Test Election", "Test", startTime, endTime);
      await voting.registerCandidate("Alice", "Party A", "Desc A");
      await voting.registerCandidate("Bob", "Party B", "Desc B");
      await voting.authorizeVoter(voter1.address);
      await voting.startElection();
      await voting.endElection();

      await expect(
        voting.connect(voter1).castVote(1)
      ).to.be.revertedWith("Election is not currently active");
    });

    it("Should not allow modifying candidates after election starts", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Test Election", "Test", startTime, endTime);
      await voting.registerCandidate("Alice", "Party A", "Desc A");
      await voting.registerCandidate("Bob", "Party B", "Desc B");
      await voting.startElection();

      await expect(
        voting.registerCandidate("Charlie", "Party C", "Desc C")
      ).to.be.revertedWith("Cannot modify election once started");

      await expect(
        voting.updateCandidate(1, "Alice Updated", "Party", "Desc")
      ).to.be.revertedWith("Cannot modify election once started");
    });
  });

  describe("Results and Status Queries", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = getFutureTimestamp(7);
      await voting.createElection("Test Election", "Test", startTime, endTime);
      await voting.registerCandidate("Alice", "Party A", "Desc A");
      await voting.registerCandidate("Bob", "Party B", "Desc B");
      await voting.registerCandidate("Charlie", "Party C", "Desc C");
      await voting.authorizeVotersBatch([voter1.address, voter2.address, voter3.address]);
      await voting.startElection();
    });

    it("Should return correct election status", async function () {
      const status = await voting.getElectionStatus();
      expect(status.title).to.equal("Test Election");
      expect(status.isActive).to.equal(true);
      expect(status.isEnded).to.equal(false);
      expect(status.totalCandidates).to.equal(3);
    });

    it("Should return all candidates", async function () {
      const candidates = await voting.getAllCandidates();
      expect(candidates.length).to.equal(3);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[1].name).to.equal("Bob");
      expect(candidates[2].name).to.equal("Charlie");
    });

    it("Should track voting status correctly", async function () {
      expect(await voting.checkHasVoted(voter1.address)).to.equal(false);

      await voting.connect(voter1).castVote(1);

      expect(await voting.checkHasVoted(voter1.address)).to.equal(true);
      expect(await voting.checkHasVoted(voter2.address)).to.equal(false);
    });

    it("Should provide accurate final results after election ends", async function () {
      await voting.connect(voter1).castVote(1);
      await voting.connect(voter2).castVote(1);
      await voting.connect(voter3).castVote(2);
      await voting.endElection();

      const results = await voting.getResults();
      expect(results.isComplete).to.equal(true);
      expect(results.totalVotes).to.equal(3);
      expect(results.results[0].voteCount).to.equal(2); // Alice: 2 votes
      expect(results.results[1].voteCount).to.equal(1); // Bob: 1 vote
      expect(results.results[2].voteCount).to.equal(0); // Charlie: 0 votes
    });
  });
});
