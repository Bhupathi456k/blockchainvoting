# System Architecture

## Overview

The Secure Digital Voting Platform is built using a multi-layered, decentralized-aware architecture designed to separate concerns while ensuring data integrity, tamper-proof vote recording, granular authorization, and transparent governance.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                            │
│                     React.js Single Page Application                     │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │     Unified Voter/Host Portal   │  │       Admin Control Hub       │  │
│  │   - Dynamic Hosting State Hub   │  │   - Host Request Reviewer     │  │
│  │   - Election Creation Wizard    │  │   - System Metrics & Users    │  │
│  │   - Active Voting & MetaMask    │  │   - Election Overseer         │  │
│  └─────────────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     │ HTTPS / REST API / JSON-RPC
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       APPLICATION / BACKEND LAYER                        │
│                           Node.js + Express.js                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Middleware: JWT Auth, requireApprovedElectionHost, requireOwner    │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ Modules: Host Requests, Elections, Candidates, Blockchain, Voters  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────┬──────────────────────────────────────────────┬─────────────┘
              │                                              │
    SQL / ORM │                                    Ethers.js │ JSON-RPC
              ▼                                              ▼
┌───────────────────────────┐                  ┌───────────────────────────┐
│      DATABASE LAYER       │                  │     BLOCKCHAIN LAYER      │
│     SQLite / PostgreSQL   │                  │    Ethereum Local Node    │
│  (Off-Chain Metadata,     │                  │   (Tamper-Proof Storage)  │
│   Host Requests, Users,   │                  └─────────────┬─────────────┘
│   Election Ownership)     │                                │
└───────────────────────────┘                                ▼
                                               ┌───────────────────────────┐
                                               │   SMART CONTRACT LAYER    │
                                               │       Voting.sol          │
                                               │ (Duplicate Prevention,    │
                                               │  Vote Counting, Results)  │
                                               └───────────────────────────┘
```

## Architectural Separation of Concerns

### 1. Off-Chain Layer (Database)
Stores user profiles, governance requests, and administrative metadata:
- **User Accounts & Roles**: Unified login credentials (passwords hashed with `bcrypt`), roles (`VOTER`, `ADMIN`), and dynamic host permission status (`NONE`, `PENDING`, `APPROVED`, `REJECTED`).
- **Election Host Requests**: Formal hosting applications tracking requester ID, election title, description, purpose, expected voter count, proposed schedule, election type, status, reviewing administrator ID, review timestamp, and rejection reasons.
- **Election Metadata & Ownership**: Election titles, descriptions, status (`UPCOMING`, `ACTIVE`, `ENDED`), timestamps, and `hostUserId` identifying the approved owner.
- **Candidate Profiles**: Names, party affiliations, bios, and election references.
- **Audit Logs & Transactions**: Cross-reference records linking off-chain user votes with on-chain transaction hashes.

### 2. On-Chain Layer (Ethereum Smart Contract)
Authoritative source of truth for all voting data:
- **Authoritative Duplicate Vote Prevention**: `mapping(address => bool) hasVoted` guarantees that each wallet address can vote exactly once per election.
- **Cryptographic Voter Authorization**: `mapping(address => bool) authorizedVoters` verifies voter eligibility.
- **Real-time Vote Tallies**: Candidate vote counts incremented atomically on-chain.
- **Immutable Vote Audit Trail**: Emitted `VoteCast` blockchain events provide cryptographic non-repudiation.
- **Election State Enforcement**: Smart contract enforces that votes can only be cast when the election is active.

---

## Role & Permission Model

The platform uses a role and permission model where standard voter accounts do not possess election hosting privileges by default. Users acquire hosting privileges through an administrative request and approval workflow:

| Role / Status | View Elections | Cast Vote | Submit Host Request | Create Election | Manage Owned Elections | Manage Any Election | Review Host Requests |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Voter (`NONE`)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Voter (`PENDING`)** | ✅ | ✅ | ❌ *(In review)* | ❌ | ❌ | ❌ | ❌ |
| **Voter (`APPROVED`)** | ✅ | ✅ | ❌ *(Already approved)* | ✅ | ✅ | ❌ | ❌ |
| **Voter (`REJECTED`)** | ✅ | ✅ | ✅ *(Can re-apply)* | ❌ | ❌ | ❌ | ❌ |
| **Administrator** | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | ✅ |

---

## Security & Authorization Middleware Architecture

All backend routes enforce server-side security boundaries:

```
                  ┌───────────────────────────────┐
                  │       Incoming Request        │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │      authenticate (JWT)       │
                  └───────────────┬───────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                ▼                                   ▼
  ┌───────────────────────────┐       ┌───────────────────────────┐
  │requireApprovedElectionHost│       │   requireElectionOwner    │
  │- Allows ADMIN             │       │- Allows ADMIN             │
  │- Checks hostPermission    │       │- Checks req.user.id ===   │
  │  === 'APPROVED'           │       │  election.hostUserId      │
  │- Returns 403 if invalid   │       │- Returns 403 if mismatch  │
  └───────────────────────────┘       └───────────────────────────┘
```

1. **`authenticate`**: Verifies the JWT Bearer token in the `Authorization` header, extracts the user profile, and attaches `req.user`. Returns `401 Unauthorized` if invalid or missing.
2. **`requireApprovedElectionHost`**: Applied to `POST /api/elections`. Ensures only users with `hostPermissionStatus === 'APPROVED'` (or `role === 'ADMIN'`) can create new elections. Returns `403 Forbidden` otherwise.
3. **`requireElectionOwner`**: Applied to election modification, candidate management, and election start/stop endpoints (`PATCH /api/elections/:id`, `POST /api/elections/:id/start`, `POST /api/elections/:id/end`, `POST /api/candidates/:electionId`). Verifies that the authenticated user is either the original election creator (`hostUserId === req.user.id`) or a system Administrator. Returns `403 Forbidden` if an unauthorized user attempts modification.
4. **`authorize('ADMIN')`**: Restricts sensitive administrative routes (such as host request approval/rejection and system audits) to administrators only.

---

## Key Workflows

### 1. Election Host Application & Approval Lifecycle

```
[ Voter ]                                       [ Admin ]
   │                                                │
   │ 1. Navigates to /dashboard                     │
   │ 2. Clicks "Request Hosting Permission"         │
   │ 3. Submits details at /host-request            │
   │    (Title, purpose, voter count, schedule)     │
   ▼                                                │
[ Backend: Status = PENDING, User = PENDING ]       │
   │                                                │
   │                                                │ 4. Receives request in /admin
   │                                                │ 5. Reviews proposal details
   │                                                │
   │                                                ├─► [ Option A: APPROVE ]
   │                                                │   - Request status -> APPROVED
   │                                                │   - User hostPermission -> APPROVED
   │                                                │
   │                                                └─► [ Option B: REJECT ]
   │                                                    - Collects rejection reason
   │                                                    - Request status -> REJECTED
   │                                                    - User hostPermission -> REJECTED
   │                                                                │
   ▼                                                                ▼
[ User Dashboard Updates ]                             [ Notification & Audit Trail ]
- If APPROVED: "Create & Host Election" unlocked       - Full audit log saved
- If REJECTED: Shows admin reason + reapply button     - ReviewedBy admin ID recorded
```

### 2. Election Creation & Candidate Management Flow

1. Approved host clicks **"Create & Host Election"** on their dashboard (`/elections/create`).
2. Host enters election parameters (title, description, start time, end time).
3. Backend validates input and assigns `hostUserId = req.user.id`.
4. Host adds candidates to their created election (`/api/candidates/:electionId`).
5. Host starts the election when ready (`/api/elections/:id/start`).

### 3. Secure Blockchain Vote Casting Flow

1. Registered voter logs into the Unified Portal and accesses an active election.
2. Voter connects their MetaMask Web3 wallet.
3. Voter selects their chosen candidate and initiates vote submission.
4. MetaMask requests transaction signature against the `Voting` smart contract.
5. Smart contract executes verification checks:
   - Is election active?
   - Is voter authorized?
   - Has the voter already voted? (`require(!hasVoted[msg.sender])`)
   - Is candidate ID valid?
6. Smart contract increments candidate tally and marks voter address as used.
7. `VoteCast` event is emitted on the blockchain with the transaction receipt.
8. Backend records transaction hash and voter participation off-chain.
