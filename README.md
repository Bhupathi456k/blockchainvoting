# Secure Digital Voting Platform Using Blockchain Technology

A complete blockchain-based digital voting and election management system featuring Ethereum smart contracts, granular election-host authorization workflows, cryptographic vote verification, and real-time tallying.

## 🎯 Project Overview

This platform implements a secure, transparent, and tamper-proof digital voting ecosystem. The system features a **Unified Portal Model** where all participants register and log in through a single user dashboard. Standard voters can participate in active elections and apply to host their own elections via an administrative review and approval workflow.

### Key Features

✅ **Unified User Dashboard** - Single entry point for both voting participation and election hosting management  
✅ **Election Host Authorization Workflow** - Formal hosting application lifecycle (`NONE` → `PENDING` → `APPROVED` / `REJECTED`)  
✅ **Administrative Governance Panel** - Review, approve, or reject host applications with transparent feedback  
✅ **Election Ownership & Access Control** - Approved hosts manage their own elections with strict API authorization  
✅ **Blockchain Vote Storage** - All votes recorded on the Ethereum blockchain via Solidity smart contracts  
✅ **Cryptographic Duplicate Prevention** - Smart contract-level duplicate voting prevention via address mapping  
✅ **MetaMask Web3 Integration** - Wallet-based transaction signing and cryptographic confirmation  
✅ **Real-Time Blockchain Explorer** - Live transaction validation, block inspection, and immutable tallies  
✅ **Responsive Glassmorphism UI** - Modern React + Tailwind CSS interface with dynamic status indicators  

---

## 🏗️ Architecture

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

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Ethers.js / Web3.js
- **Backend**: Node.js, Express.js, Sequelize ORM, SQLite / PostgreSQL, JWT, bcryptjs, Helmet, Express-Rate-Limit
- **Blockchain**: Solidity (`^0.8.19`), Hardhat, Local Ethereum Node, MetaMask
- **Testing**: Jest, Supertest, Hardhat Chai / Mocha

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Blockchain
cd blockchain && npm install && cd ..
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Local Blockchain
```bash
# Terminal 1
cd blockchain
npx hardhat node
```

### 4. Deploy Smart Contract
```bash
# Terminal 2
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
# Copy output contract address into .env -> CONTRACT_ADDRESS=0x...
```

### 5. Seed Admin User & Start Backend
```bash
# Terminal 3
cd backend
npm run seed:admin
npm start
```
*Backend runs on `http://localhost:5000`.*

### 6. Start Frontend Application
```bash
# Terminal 4
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000` or `http://localhost:5173`.*

---

## 🎮 Step-by-Step Workflow Guide

### 1. Voter & Host Workflow
1. **Register**: Go to `/register` and create an account with Name, Voter ID, Email, Phone, and Password.
2. **Unified Dashboard (`/dashboard`)**:
   - View active elections and cast votes with MetaMask.
   - View your dynamic **Election Hosting Status** card.
3. **Request Hosting Privileges**:
   - Click **"Request Hosting Permission"** to open `/host-request`.
   - Provide election title, purpose, expected voter count, and schedule.
   - Dashboard status transitions to **`PENDING`** (Under Review).
4. **Create & Manage Election (Once Approved)**:
   - Once an administrator approves your request, status updates to **`APPROVED`**.
   - Click **"Create & Host Election"** to access `/elections/create`.
   - Configure election dates, add candidates, and start the election.

### 2. Administrator Governance Workflow
1. **Admin Login**: Access `/admin/login` using credentials from `ADMIN_CREDENTIALS.md`.
2. **Review Host Requests**:
   - Navigate to the **"Election Host Requests"** tab.
   - Inspect pending host applications.
   - **Approve**: Immediately elevates user's status to `APPROVED`, granting election hosting rights.
   - **Reject**: Provides feedback reason to the user; status updates to `REJECTED` (user can re-apply).

---

## 🧪 Testing

### Backend Authorization & Lifecycle Tests
Run all 18 test cases validating permissions, route protection, and ownership enforcement:
```bash
cd backend
npm test
```

### Smart Contract Tests
Run unit tests validating duplicate prevention, time locks, and tally calculations:
```bash
cd blockchain
npx hardhat test
```

---

## 🔐 Security Matrix

| Action | Unauthenticated | Standard Voter | Pending Host | Approved Host | Administrator |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Active Elections | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cast Vote via MetaMask | ❌ | ✅ | ✅ | ✅ | ✅ |
| Submit Host Request | ❌ | ✅ | ❌ | ❌ | N/A |
| Create Election | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Own Election | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Other's Election | ❌ | ❌ | ❌ | ❌ | ✅ |
| Review Host Applications | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📚 Documentation

- [System Architecture](docs/architecture.md)
- [REST API Specification](docs/api.md)
- [Testing & Verification Guide](docs/testing.md)
- [Blockchain & Smart Contracts](docs/blockchain.md)
- [Installation & Setup](docs/setup.md)
