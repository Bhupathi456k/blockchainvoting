# Comprehensive Testing Guide

## 1. Smart Contract Automated Testing

The smart contract test suite covers comprehensive unit and integration test cases using Hardhat, Chai, and Ethers.js.

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

## 2. Backend Host Authorization & Workflow Automated Tests

The backend test suite (`backend/test/hostAuthorization.test.js`) verifies all 18 security and authorization rules for the election hosting lifecycle:

```bash
cd backend
npm test
```

### Verified Test Matrix:
1. **TEST 1**: New user registers with `hostPermissionStatus = NONE`.
2. **TEST 2**: User submits hosting request -> request status is `PENDING` and user status updates to `PENDING`.
3. **TEST 3**: User submits second request while one is pending -> rejected with `400 Bad Request`.
4. **TEST 4**: User tries to create election while status is `PENDING` -> rejected with `403 Forbidden`.
5. **TEST 5**: Admin views pending requests -> request is visible with requester metadata.
6. **TEST 6**: Normal user attempts admin approval endpoint -> rejected with `403 Forbidden`.
7. **TEST 7**: Admin approves request -> request and user status update to `APPROVED`.
8. **TEST 8**: Approved user profile endpoint returns `hostPermissionStatus: 'APPROVED'`.
9. **TEST 9**: Approved user successfully creates an election with `hostUserId` attached.
10. **TEST 10**: Another approved host attempts to modify first user's election -> rejected with `403 Forbidden`.
11. **TEST 11**: Rejected user attempts to create election -> rejected with `403 Forbidden`.
12. **TEST 12**: Admin rejects request with reason -> request status is `REJECTED` and reason is saved.
13. **TEST 13**: Rejected user views dashboard -> sees `REJECTED` status and admin explanation.
14. **TEST 14**: Rejected user resubmits new request -> status transitions back to `PENDING`.
15. **TEST 15**: Unauthenticated user attempts host request -> rejected with `401 Unauthorized`.
16. **TEST 16**: User attempts self-approval -> rejected with `403 Forbidden`.
17. **TEST 17**: User cannot elevate role directly.
18. **TEST 18**: Full end-to-end lifecycle: host creates election, adds candidates, starts election, and ends election with ownership enforcement.

---

## 3. End-to-End Verification Procedure

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
4. **User Registration & Hosting Application**:
   - Register a new account at `http://localhost:3000/register`.
   - Log in at `/login` into the Unified User Dashboard (`/dashboard`).
   - Observe hosting status shows **"Standard Voter"** with **"Request Hosting Permission"** button.
   - Click button to open `/host-request` and submit election hosting proposal.
   - Dashboard dynamically reflects **"Application Under Review (PENDING)"**.
5. **Admin Review & Approval**:
   - Open `/admin/login` and log in with admin credentials.
   - Navigate to the **"Election Host Requests"** tab.
   - Inspect the pending request details and click **"Approve Request"**.
6. **Host Creates Election**:
   - Return to user session on `/dashboard`.
   - Observe hosting banner has updated to **"Approved Election Host"** with **"Create & Host Election"** button.
   - Click to open `/elections/create`, fill election parameters, and submit.
   - Add candidates and start the election.
7. **Voter Registration & Voting**:
   - Connect MetaMask wallet on the dashboard.
   - Cast vote for a candidate.
   - Verify transaction on the blockchain.
   - Attempt duplicate vote and observe smart-contract rejection.
8. **End Election & Results**:
   - Host or Admin ends the election.
   - View real-time blockchain results on the explorer.
