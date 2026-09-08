# Secure Digital Voting Platform Using Blockchain Technology

A complete blockchain-based electronic voting system with smart contracts, secure authentication, and real-time vote counting.

## 🎯 Project Overview

This is an academic engineering project implementing a secure, transparent, and tamper-proof digital voting platform using Ethereum blockchain technology and Solidity smart contracts.

### Key Features

✅ **Voter Registration & Authentication** - Secure voter registration with JWT-based authentication  
✅ **Blockchain Vote Storage** - All votes stored on Ethereum blockchain via smart contracts  
✅ **Duplicate Vote Prevention** - Smart contract-level duplicate voting prevention  
✅ **MetaMask Integration** - Wallet-based transaction signing  
✅ **Admin Dashboard** - Complete election and candidate management  
✅ **Real-time Results** - Vote counting directly from blockchain state  
✅ **Transaction Verification** - Display blockchain transaction hashes and block details  
✅ **Responsive UI** - Professional React-based user interface  

## 🏗️ Architecture

```
                    ┌───────────────────────┐
                    │   VOTER / ADMIN       │
                    │  (React Frontend)     │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Node.js + Express   │
                    │   (REST API Backend)  │
                    └───────┬───────┬───────┘
                            │       │
                    Database│       │Blockchain
                            ▼       ▼
                    ┌──────────┐ ┌──────────────┐
                    │ SQLite/  │ │   Ethereum   │
                    │PostgreSQL│ │  Blockchain  │
                    └──────────┘ └──────┬───────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │ Solidity Smart  │
                               │   Contract      │
                               │ (Voting Logic)  │
                               └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- React.js
- Web3.js
- React Router
- Axios

### Backend
- Node.js
- Express.js
- Sequelize ORM
- JWT Authentication
- bcrypt

### Database
- SQLite (development)
- PostgreSQL (production-ready)

### Blockchain
- Ethereum (local development chain)
- Solidity
- Hardhat
- MetaMask
- Web3.js

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MetaMask** browser extension - [Install](https://metamask.io/)
- **Git** (optional, for version control)

## 🚀 Installation & Setup

### 1. Clone or Download the Project

```bash
cd blockchain-voting-platform
```

### 2. Install Dependencies

#### Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

#### Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### Install Blockchain Dependencies
```bash
cd blockchain
npm install
cd ..
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration (the defaults work for local development).

### 4. Start the Local Blockchain

Open a new terminal and start Hardhat's local Ethereum node:

```bash
cd blockchain
npx hardhat node
```

**Keep this terminal running.** You should see:
- Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
- 20 accounts with private keys
- Account #0 will be used for contract deployment

### 5. Deploy the Smart Contract

Open a **new terminal** (keep the blockchain running):

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Important:** Copy the deployed contract address and update `.env`:

```
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 6. Configure MetaMask

1. Open MetaMask browser extension
2. Click on the network dropdown (top right)
3. Select "Add Network" → "Add a network manually"
4. Enter the following:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
5. Click "Save"

6. Import a test account:
   - Click on your account icon → "Import Account"
   - Copy a private key from the Hardhat node terminal (Account #1 or later)
   - Paste it into MetaMask
   - You should see 10000 ETH (test funds)

### 7. Start the Backend Server

Open a **new terminal**:

```bash
cd backend
npm start
```

The backend will run on `http://localhost:5000`

### 8. Start the Frontend Application

Open a **new terminal**:

```bash
cd frontend
npm start
```

The frontend will open automatically at `http://localhost:3000`

## 🎮 Usage Guide

### Admin Workflow

1. **Login as Admin**
   - Email: `admin@voting.local`
   - Password: `Admin@123` (or as configured in .env)

2. **Create an Election**
   - Navigate to "Elections" → "Create Election"
   - Enter title, description, start/end dates
   - Click "Create"

3. **Add Candidates**
   - Select the election
   - Click "Add Candidate"
   - Enter candidate name, party, description
   - Add 2-5 candidates

4. **Start the Election**
   - Click "Start Election" when ready

5. **Monitor Voting**
   - View real-time vote counts
   - See blockchain transactions
   - Monitor voter participation

6. **End Election & View Results**
   - Click "End Election"
   - View final results with blockchain verification

### Voter Workflow

1. **Register**
   - Click "Register" on homepage
   - Enter: Name, Voter ID, Email, Phone, Password
   - Submit registration

2. **Login**
   - Enter Email/Voter ID and Password
   - Click "Login"

3. **Connect Wallet**
   - Click "Connect Wallet" in the dashboard
   - MetaMask will open
   - Select your account
   - Click "Connect"

4. **Vote**
   - View active election and candidates
   - Select ONE candidate
   - Click "Cast Vote"
   - Confirm transaction in MetaMask
   - Wait for blockchain confirmation

5. **Verify Vote**
   - View transaction hash
   - Verify on blockchain
   - See confirmation message

6. **View Results**
   - After election ends
   - View vote distribution
   - See winning candidate

## 🧪 Testing

### Smart Contract Tests

```bash
cd blockchain
npm test
```

Key tests include:
- Contract deployment
- Candidate registration
- Voter authorization
- Vote casting
- **Duplicate vote prevention** ✅
- Result calculation

### Backend Tests

```bash
cd backend
npm test
```

### Run All Tests

```bash
# From project root
npm run test:all
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Role-based access control (VOTER/ADMIN)
- ✅ Input validation
- ✅ SQL injection protection via Sequelize ORM
- ✅ CORS configuration
- ✅ Smart contract access control
- ✅ Duplicate vote prevention at contract level
- ✅ Election state validation
- ✅ Unauthorized voter rejection

## 📊 Project Structure

```
blockchain-voting-platform/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and Web3 services
│   │   ├── context/       # React context for state
│   │   └── App.js
│   └── package.json
│
├── backend/               # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, validation, errors
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   └── config/        # Configuration
│   ├── tests/
│   └── package.json
│
├── blockchain/            # Smart contracts & deployment
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   ├── test/              # Contract tests
│   └── hardhat.config.js
│
├── docs/                  # Documentation
│   ├── architecture.md
│   ├── api.md
│   └── testing.md
│
├── .env.example           # Environment template
├── .gitignore
└── README.md
```

## 🐛 Troubleshooting

### MetaMask Connection Issues

**Problem:** "Wrong network" error  
**Solution:** Ensure MetaMask is connected to "Hardhat Local" (Chain ID: 31337)

**Problem:** "Insufficient funds"  
**Solution:** Import an account from Hardhat's generated accounts (they have 10000 ETH each)

### Smart Contract Issues

**Problem:** "Contract not deployed"  
**Solution:** 
1. Ensure Hardhat node is running
2. Deploy contract: `npx hardhat run scripts/deploy.js --network localhost`
3. Update CONTRACT_ADDRESS in .env

**Problem:** "Transaction reverted"  
**Solution:** Check Hardhat node logs for detailed error messages

### Backend Issues

**Problem:** "Database connection failed"  
**Solution:** Check DATABASE_URL in .env file

**Problem:** "JWT authentication error"  
**Solution:** Ensure JWT_SECRET is set in .env

## 📚 Documentation

- [Architecture Documentation](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Testing Guide](docs/testing.md)
- [Blockchain Guide](docs/blockchain.md)

## 🎓 Academic Context

This project demonstrates:

1. **Blockchain Integration** - Real Ethereum blockchain interaction
2. **Smart Contract Development** - Solidity programming
3. **Full-Stack Development** - React + Node.js + Database
4. **Security Best Practices** - Authentication, authorization, validation
5. **Cryptographic Concepts** - Hashing, signing, verification
6. **Distributed Systems** - Decentralized vote storage

## ⚠️ Limitations & Future Enhancements

### Current Limitations

- This is an academic prototype, not production-ready
- Uses local blockchain (not mainnet)
- Basic privacy model (wallet addresses visible on-chain)
- Limited scalability testing

### Future Enhancements

- [ ] Advanced voter anonymity (Zero-Knowledge Proofs)
- [ ] Differential privacy mechanisms
- [ ] Self-Sovereign Identity (SSI) integration
- [ ] Mobile application
- [ ] Biometric authentication
- [ ] Multi-election support
- [ ] Advanced analytics dashboard
- [ ] Export results as PDF reports

## 📄 License

This project is created for academic purposes.

## 👥 Contributors

Created as a final year engineering project.

## 📧 Support

For issues or questions, refer to the troubleshooting section above or check the documentation in the `docs/` folder.

---

**⚡ Quick Start Summary**

```bash
# Terminal 1 - Blockchain
cd blockchain && npx hardhat node

# Terminal 2 - Deploy contract
cd blockchain && npx hardhat run scripts/deploy.js --network localhost
# Copy contract address to .env

# Terminal 3 - Backend
cd backend && npm start

# Terminal 4 - Frontend
cd frontend && npm start

# Browser - Configure MetaMask to Hardhat Local network
# Start voting!
```
