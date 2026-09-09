# REST API Specification

## Authentication Endpoints

### 1. Register User
- **POST** `/api/auth/register`
- **Access**: Public
- **Description**: Registers a new user account. Initial `role` defaults to `VOTER` and `hostPermissionStatus` defaults to `NONE`.
- **Request Body**:
  ```json
  {
    "voterId": "VOTER001",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "password": "Password123!",
    "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": 2,
        "voterId": "VOTER001",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "role": "VOTER",
        "hostPermissionStatus": "NONE",
        "isEligible": true,
        "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

### 2. Login User
- **POST** `/api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "identifier": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": 2,
        "voterId": "VOTER001",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "role": "VOTER",
        "hostPermissionStatus": "NONE",
        "isEligible": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

### 3. Get Current User Profile
- **GET** `/api/auth/me`
- **Access**: Private (Bearer JWT)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 2,
        "voterId": "VOTER001",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "role": "VOTER",
        "hostPermissionStatus": "APPROVED",
        "isEligible": true
      }
    }
  }
  ```

---

## Election Host Requests Endpoints

### 1. Submit Host Permission Request
- **POST** `/api/host-requests`
- **Access**: Private (Authenticated Users)
- **Description**: Submits an application for election hosting privileges. Updates the user's `hostPermissionStatus` to `PENDING`.
- **Request Body**:
  ```json
  {
    "electionTitle": "Annual Department Representative Election",
    "electionDescription": "Election to select student council department chairs",
    "purpose": "Electing 2026 CS faculty representatives",
    "expectedVoters": 350,
    "proposedStartDate": "2026-10-01T09:00:00.000Z",
    "proposedEndDate": "2026-10-02T18:00:00.000Z",
    "electionType": "Student Council",
    "additionalInformation": "Supervised by faculty advisors"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Election host request submitted successfully. Awaiting administrator review.",
    "data": {
      "id": 1,
      "userId": 2,
      "electionTitle": "Annual Department Representative Election",
      "status": "PENDING",
      "createdAt": "2026-09-08T10:00:00.000Z"
    }
  }
  ```

### 2. Get User's Host Requests & Status
- **GET** `/api/host-requests/me`
- **Access**: Private (Authenticated Users)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "hostPermissionStatus": "PENDING",
      "canHost": false,
      "latestRequest": {
        "id": 1,
        "electionTitle": "Annual Department Representative Election",
        "status": "PENDING",
        "adminReason": null,
        "createdAt": "2026-09-08T10:00:00.000Z"
      },
      "requests": [...]
    }
  }
  ```

### 3. List All Host Requests (Admin Only)
- **GET** `/api/host-requests`
- **Access**: Private (Admin Only)
- **Query Parameters**:
  - `status`: Filter by `PENDING`, `APPROVED`, or `REJECTED`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "requests": [
        {
          "id": 1,
          "electionTitle": "Annual Department Representative Election",
          "purpose": "Electing 2026 CS faculty representatives",
          "expectedVoters": 350,
          "status": "PENDING",
          "requester": {
            "id": 2,
            "name": "Alice Johnson",
            "email": "alice@example.com",
            "voterId": "VOTER001"
          }
        }
      ],
      "stats": {
        "total": 5,
        "pending": 2,
        "approved": 2,
        "rejected": 1
      },
      "pagination": { "total": 5, "page": 1, "pages": 1 }
    }
  }
  ```

### 4. Approve Host Request (Admin Only)
- **POST** `/api/host-requests/:id/approve`
- **Access**: Private (Admin Only)
- **Description**: Approves a host request and updates the applicant's `hostPermissionStatus` to `APPROVED`.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Host request approved. User is now authorized to create and host elections.",
    "data": {
      "request": { "id": 1, "status": "APPROVED", "reviewedAt": "2026-09-08T10:15:00.000Z" },
      "user": { "id": 2, "hostPermissionStatus": "APPROVED" }
    }
  }
  ```

### 5. Reject Host Request (Admin Only)
- **POST** `/api/host-requests/:id/reject`
- **Access**: Private (Admin Only)
- **Request Body**:
  ```json
  {
    "adminReason": "Proposed dates conflict with platform maintenance window."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Host request rejected.",
    "data": {
      "request": {
        "id": 1,
        "status": "REJECTED",
        "adminReason": "Proposed dates conflict with platform maintenance window.",
        "reviewedAt": "2026-09-08T10:15:00.000Z"
      },
      "user": { "id": 2, "hostPermissionStatus": "REJECTED" }
    }
  }
  ```

---

## Election Endpoints

### 1. Create Election
- **POST** `/api/elections`
- **Access**: Private (Approved Hosts or Admins)
- **Description**: Creates a new election. Sets `hostUserId` to the authenticated user ID.
- **Request Body**:
  ```json
  {
    "title": "Computer Science Faculty Election 2026",
    "description": "Annual student representative election",
    "startTime": "2026-10-01T09:00:00.000Z",
    "endTime": "2026-10-02T18:00:00.000Z"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Election created successfully",
    "data": {
      "id": 10,
      "title": "Computer Science Faculty Election 2026",
      "status": "UPCOMING",
      "hostUserId": 2,
      "startTime": "2026-10-01T09:00:00.000Z",
      "endTime": "2026-10-02T18:00:00.000Z"
    }
  }
  ```

### 2. List Elections
- **GET** `/api/elections`
- **Access**: Public / Authenticated
- **Query Parameters**:
  - `status`: `UPCOMING`, `ACTIVE`, or `ENDED`
  - `hostedByMe`: `true` to filter elections created by the authenticated user

### 3. Start Election
- **POST** `/api/elections/:id/start`
- **Access**: Private (Election Owner or Admin)
- **Description**: Changes election status to `ACTIVE`. Only the election's host or an admin can start it.

### 4. End Election
- **POST** `/api/elections/:id/end`
- **Access**: Private (Election Owner or Admin)
- **Description**: Changes election status to `ENDED`.

---

## Candidate Endpoints

### 1. Add Candidate to Election
- **POST** `/api/candidates/:electionId`
- **Access**: Private (Election Owner or Admin)
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "party": "Innovation Coalition",
    "description": "Platform focused on research funding and student advocacy"
  }
  ```

### 2. Update Candidate
- **PATCH** `/api/candidates/:electionId/:id`
- **Access**: Private (Election Owner or Admin)

### 3. Delete Candidate
- **DELETE** `/api/candidates/:electionId/:id`
- **Access**: Private (Election Owner or Admin)

---

## Blockchain Endpoints

### 1. Record Vote Transaction
- **POST** `/api/blockchain/vote`
- **Access**: Private (Authenticated Voter)
- **Request Body**:
  ```json
  {
    "electionId": 10,
    "transactionHash": "0x4b7c89f02931...",
    "candidateId": 1
  }
  ```

### 2. Verify Transaction
- **GET** `/api/blockchain/transactions/:txHash`
- **Access**: Private (Authenticated)
