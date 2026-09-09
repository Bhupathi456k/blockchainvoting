# BLOCKVOTE AUTHENTICATION & DEMO ACCOUNTS REPORT
Generated: 2026-09-08

============================================================
                 BLOCKVOTE DEMO ACCOUNTS
============================================================

ADMIN
Email:
admin@blockvote.local

Username/Voter ID:
admin

Display Name:
BlockVote Administrator

Password:
Admin#BV2026!SecP@ss

Role:
ADMIN


DEMO VOTER 1
Email:
voter1@blockvote.local

Username/Voter ID:
voter1

Display Name:
Demo Voter One

Password:
Voter1#Pass2026!bv

Role:
USER (VOTER)

Host Permission:
NONE


DEMO VOTER 2
Email:
voter2@blockvote.local

Username/Voter ID:
voter2

Display Name:
Demo Voter Two

Password:
Voter2#Pass2026!bv

Role:
USER (VOTER)

Host Permission:
NONE


DEMO VOTER 3
Email:
voter3@blockvote.local

Username/Voter ID:
voter3

Display Name:
Demo Voter Three

Password:
Voter3#Pass2026!bv

Role:
USER (VOTER)

Host Permission:
NONE


DEMO VOTER 4
Email:
voter4@blockvote.local

Username/Voter ID:
voter4

Display Name:
Demo Voter Four

Password:
Voter4#Pass2026!bv

Role:
USER (VOTER)

Host Permission:
NONE


DEMO VOTER 5
Email:
voter5@blockvote.local

Username/Voter ID:
voter5

Display Name:
Demo Voter Five

Password:
Voter5#Pass2026!bv

Role:
USER (VOTER)

Host Permission:
NONE


DEMO ELECTION HOST
Email:
host@blockvote.local

Username/Voter ID:
host

Display Name:
Demo Election Host

Password:
Host#Pass2026!bv

Role:
USER (VOTER)

Host Permission:
APPROVED

============================================================
                  VERIFICATION
============================================================

Admin login: PASS
Voter 1 login: PASS
Voter 2 login: PASS
Voter 3 login: PASS
Voter 4 login: PASS
Voter 5 login: PASS
Host login: PASS

Admin authorization: PASS
Voter admin rejection: PASS
Host election creation permission: PASS
Normal voter election creation rejection: PASS

Password hashing: PASS
Seed idempotency: PASS
Frontend build: PASS
Backend tests: PASS

============================================================
                  ROOT CAUSE
============================================================

1. Database Storage Path Mismatch:
   In `backend/src/config/config.js`, SQLite `storage` was configured as `'./database.sqlite'` (relative to CWD). When commands/servers were launched from different working directories (project root vs backend directory vs test runner), SQLite created and accessed different database files.
   -> Fixed by anchoring SQLite storage to absolute path `path.resolve(__dirname, '../../database.sqlite')`.

2. CORS Policy Blocking Browser Logins:
   Backend was strictly configured with `FRONTEND_URL=http://localhost:3000`. When Vite launched on alternate ports (5173, 5174, 5175, 5176), browser CORS policies blocked API responses, producing generic "Login failed. Please check your credentials" network errors.
   -> Fixed by dynamically allowing localhost/127.0.0.1 ports during development.

3. Outdated Documentation / Conflicting Credentials:
   Original documentation listed legacy credentials (`admin@voting.local` / `Admin@123`), while `.env.example` had placeholder values and demo voter/host accounts did not exist.
   -> Fixed by creating an idempotent `seedAccounts.js` script with verified strong credentials for 1 Admin and 6 Demo Users.
