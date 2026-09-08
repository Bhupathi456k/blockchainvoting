# Comprehensive Testing Guide

## 1. Smart Contract Automated Testing

The smart contract test suite covers 32 unit and integration test cases using Hardhat, Chai, and Ethers.js.

### Running Smart Contract Tests
```bash
cd blockchain
npx hardhat test
```

### Test Coverage Highlights
- ✅ Deployer set as contract administrator
- ✅ Candidate registration and update restrictions
- ✅ Voter authorization (single and batch)
- ✅ **CRITICAL**: Duplicate vote prevention (same voter voting twice fails and reverts)
- ✅ Rejection of unauthorized voters
- ✅ Rejection of invalid candidate IDs
- ✅ Time locks: No voting before `startTime` or after `endTime`
- ✅ State locks: No candidate modification after election start
- ✅ Accurate vote counting and result calculation

---

## 2. End-to-End Verification Procedure

### Complete Demonstration Scenario
1. **Start Hardhat Blockchain**:
   ```bash
   cd blockchain && npx hardhat node
   ```
2. **Deploy Smart Contract**:
   ```bash
   cd blockchain && npx hardhat run scripts/deploy.js --network localhost
   ```
3. **Start Backend & Frontend**:
   ```bash
   cd backend && npm start
   cd frontend && npm run dev
   ```
4. **Admin Setup**:
   - Log in at `http://localhost:5173/login` using `admin@voting.local` / `Admin@123`.
   - Create an election "Student Council 2024".
   - Add Candidates: "Alice Smith" and "Bob Jones".
   - Start the election.
5. **Voter Registration & Voting**:
   - Register Voter 1 (`voter1@voting.local`).
   - Connect MetaMask with Hardhat Account #1.
   - Cast vote for "Alice Smith".
   - Transaction is mined on blockchain and transaction hash is displayed.
6. **Duplicate Voting Attempt**:
   - Attempt to vote again with Voter 1.
   - Frontend and Smart Contract reject the attempt with `"You have already cast your vote"`.
7. **End Election & Verify Results**:
   - Admin ends the election.
   - Results page reflects real-time counts directly sourced from the smart contract state.
