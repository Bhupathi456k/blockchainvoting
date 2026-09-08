# Complete Setup and Installation Guide

## System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Browser**: Google Chrome, Brave, or Firefox with MetaMask extension installed
- **Operating System**: Windows, macOS, or Linux

---

## Step-by-Step Installation

### Step 1: Install Dependencies

From the project root:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install blockchain dependencies
cd ../blockchain
npm install

cd ..
```

---

### Step 2: Start Local Ethereum Blockchain

Open a new terminal window:

```bash
cd blockchain
npx hardhat node
```

> ⚠️ **Keep this terminal open.** It will output 20 development accounts with 10,000 test ETH each.

---

### Step 3: Deploy Smart Contract

Open a second terminal window:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Copy the deployed contract address from the output.** Example:
`0x5FbDB2315678afecb367f032d93F642f64180aa3`

---

### Step 4: Configure Environment Variables

Update `backend/.env`:
```env
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ADMIN_EMAIL=admin@voting.local
ADMIN_PASSWORD=Admin@123
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Update `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

### Step 5: Configure MetaMask

1. Open your MetaMask browser extension.
2. Click the Network selector at the top left and select **Add Network** → **Add a network manually**.
3. Fill in the network details:
   - **Network Name**: `Hardhat Local`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Click **Save** and switch to the Hardhat Local network.
5. Import a test account:
   - Copy one of the Private Keys displayed in the Hardhat terminal (Account #1, #2, etc.)
   - In MetaMask, click account icon → **Import Account** → Paste Private Key.

---

### Step 6: Start the Backend API

In a new terminal:

```bash
cd backend
npm start
```

Backend will run on `http://localhost:5000`.

---

### Step 7: Start the React Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173` (or `http://localhost:3000`).

---

## Default Credentials

### Administrator
- **Email**: `admin@voting.local`
- **Password**: `Admin@123`
