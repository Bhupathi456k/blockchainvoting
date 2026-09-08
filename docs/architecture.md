# System Architecture

## Overview

The Secure Digital Voting Platform is built using a multi-layered architecture designed to separate concerns while ensuring data integrity, tamper-proof vote recording, and high security.

```
┌─────────────────────────────────────────────────────────┐
│                 USER INTERFACE LAYER                    │
│            React.js Single Page Application             │
│   (Voter Dashboard, Admin Panel, Results, Web3.js)      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            │ HTTPS / REST API / JSON-RPC
                            ▼
┌─────────────────────────────────────────────────────────┐
│               APPLICATION / BACKEND LAYER               │
│                  Node.js + Express.js                   │
│  (Auth, Validation, Election Lifecycle, Auditing)       │
└─────────────┬─────────────────────────────┬─────────────┘
              │                             │
    SQL / ORM │                   Ethers.js │ JSON-RPC
              ▼                             ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│      DATABASE LAYER       │ │     BLOCKCHAIN LAYER      │
│     SQLite / PostgreSQL   │ │    Ethereum Local Node    │
│  (Off-Chain Metadata)     │ │   (Tamper-Proof Storage)  │
└───────────────────────────┘ └─────────────┬─────────────┘
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │   SMART CONTRACT LAYER    │
                              │       Voting.sol          │
                              │ (Duplicate Prevention,    │
                              │  Vote Counting, Results)  │
                              └───────────────────────────┘
```

## Architectural Separation of Concerns

### 1. Off-Chain Layer (Database)
Stores non-sensitive and administrative data:
- User authentication credentials (passwords hashed with bcrypt)
- Voter profiles (name, email, phone, voter ID)
- Election configuration metadata (titles, descriptions, scheduled times)
- Candidate profiles (names, party affiliations, descriptions)
- Audit logs and transaction references

### 2. On-Chain Layer (Ethereum Smart Contract)
Authoritative source of truth for all voting data:
- Authoritative duplicate vote prevention (`mapping(address => bool) hasVoted`)
- Cryptographic voter authorization (`mapping(address => bool) authorizedVoters`)
- Real-time vote counts for candidates
- Immutable vote audit trail (via emitted blockchain events)
- Election start/end enforcement

## Key Security Flows

### 1. Voter Registration Flow
1. Voter submits registration form with name, email, Voter ID, and password.
2. Backend validates input fields and ensures uniqueness of Voter ID and email.
3. Password is cryptographically hashed using `bcrypt` (10 salt rounds).
4. Voter record is stored in database.

### 2. Secure Vote Casting Flow
1. Voter logs in and connects MetaMask wallet.
2. Frontend verifies that the active wallet is authorized to vote.
3. Voter selects a candidate and confirms vote.
4. MetaMask requests transaction signing and submission to the `Voting` smart contract.
5. Smart contract validates:
   - Is election active?
   - Is voter authorized?
   - Has voter already voted? (`require(!hasVoted[msg.sender])`)
   - Is candidate valid?
6. Smart contract increments candidate's vote count and marks voter as voted.
7. Blockchain emits `VoteCast` event and generates a transaction hash.
8. Frontend captures transaction hash and syncs record with backend.
9. Voter is prevented from voting again on all layers.
