# Smart Contract Architecture & Security

## Smart Contract Overview

The `Voting.sol` smart contract is written in Solidity `^0.8.20` and serves as the authoritative, tamper-proof vote recording mechanism for the platform.

## Key State Variables

```solidity
// Structs
struct Candidate {
    uint256 id;
    string name;
    string party;
    string description;
    uint256 voteCount;
}

struct Election {
    string title;
    string description;
    uint256 startTime;
    uint256 endTime;
    bool isActive;
    bool isEnded;
}

// State Mappings
mapping(uint256 => Candidate) public candidates;
mapping(address => bool) public authorizedVoters;
mapping(address => bool) public hasVoted; // AUTHORITATIVE DUPLICATE PREVENTION
```

## Security Controls

### 1. Duplicate Vote Prevention
Enforced directly within the smart contract function `castVote(uint256 _candidateId)`:
```solidity
require(!hasVoted[msg.sender], "You have already cast your vote");
hasVoted[msg.sender] = true;
```

### 2. Role-Based Access Control
The `onlyAdmin` modifier restricts management functions (creating elections, adding candidates, authorizing voters) to the contract deployer.

### 3. State & Time Locks
Voting is only permissible during the active election window:
```solidity
modifier electionActive() {
    require(election.isActive, "Election is not currently active");
    require(!election.isEnded, "Election has ended");
    require(block.timestamp >= election.startTime, "Election has not started yet");
    require(block.timestamp <= election.endTime, "Election has expired");
    _;
}
```
