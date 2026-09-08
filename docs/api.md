# REST API Specification

## Authentication Endpoints

### 1. Register Voter
- **POST** `/api/auth/register`
- **Access**: Public
- **Body**:
  ```json
  {
    "voterId": "VOTER001",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "password": "Password123",
    "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }
  ```

### 2. Login User
- **POST** `/api/auth/login`
- **Access**: Public
- **Body**:
  ```json
  {
    "identifier": "alice@example.com",
    "password": "Password123"
  }
  ```

### 3. Get Current User Profile
- **GET** `/api/auth/me`
- **Access**: Private (Bearer JWT)

---

## Election Endpoints

### 1. Create Election
- **POST** `/api/elections`
- **Access**: Admin only
- **Body**:
  ```json
  {
    "title": "General Election 2024",
    "description": "National presidential election",
    "startTime": "2024-11-01T08:00:00.000Z",
    "endTime": "2024-11-02T20:00:00.000Z"
  }
  ```

### 2. Get Active Election
- **GET** `/api/elections/active`
- **Access**: Authenticated

### 3. Start Election
- **POST** `/api/elections/:id/start`
- **Access**: Admin only

### 4. End Election
- **POST** `/api/elections/:id/end`
- **Access**: Admin only

### 5. Get Results
- **GET** `/api/elections/:id/results`
- **Access**: Authenticated

---

## Candidate Endpoints

### 1. Add Candidate
- **POST** `/api/candidates/:electionId`
- **Access**: Admin only
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "party": "Forward Party",
    "description": "Progressive technology leadership"
  }
  ```

---

## Blockchain Endpoints

### 1. Record Vote Transaction
- **POST** `/api/blockchain/vote`
- **Access**: Authenticated Voter
- **Body**:
  ```json
  {
    "electionId": 1,
    "transactionHash": "0x1234567890abcdef...",
    "candidateId": 1
  }
  ```

### 2. Verify Transaction
- **GET** `/api/blockchain/transactions/:txHash`
- **Access**: Authenticated
