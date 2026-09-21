# Stavya Spine Hospital — Local Windows Server Deployment & Architecture Guide

This comprehensive guide explains the system flow, database architecture, and step-by-step instructions for hosting the **CarePulse / Stavya Spine Hospital Billing Discount Management System** live on an internal **Windows Server** (LAN / Hospital Wi-Fi network).

---

## 1. System Architecture & Flow Analysis

### Approval Hierarchy Matrix
The system strictly enforces role-based discount authority thresholds:

| Role | User Type | Max Discount Approval Threshold |
| :--- | :--- | :--- |
| **RECEPTIONIST** | Billing Clerk / Front Desk | Can create & submit discount requests on behalf of patients. |
| **BILLING_MANAGER** | Finance Desk Manager | Can approve discount requests **up to ₹25,000/-**. |
| **CFO** | Chief Financial Officer | Can approve discount requests **above ₹25,000/- up to ₹2,00,000/-**. |
| **MD** | Managing Director / Board | Required for high-value discount requests **exceeding ₹2,00,000/-**. |
| **DOCTOR** | Consultant / Spine Surgeon | Digital recommendation & biometric PIN authorization for OPD/IPD waivers. |
| **ADMIN** | IT System Administrator | Directory control, role assignment, audit logs, data backup & porting. |

### Request Lifecycle Flow
```
[Billing Desk Submission] 
       │
       ▼
Calculates Discount Amount
       │
       ├─► ≤ ₹25,000 ──────────► Assigned to BILLING_MANAGER ──► Approved / Rejected
       ├─► ₹25,001 - ₹200,000 ─► Assigned to CFO Desk ──────────► Approved / Rejected
       └─► > ₹200,000 ─────────► Assigned to MD Board ─────────► Approved / Rejected
```
All state transitions log an append-only audit trail containing actor name, role, timestamp, action, and mandatory comments.

---

## 2. Database Architecture & Data Synchronization

The system uses a **tri-layer resilient sync model**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                React Frontend Web Client                    │
 └──────────────┬──────────────────────────────┬───────────────┘
                │                              │
                ▼                              ▼
    ┌───────────────────────┐      ┌────────────────────────┐
    │  Local Network Server │      │  Supabase Cloud DB     │
    │  API (/api/sync)      │      │  (Postgres Realtime)   │
    └───────────┬───────────┘      └────────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Server Disk           │
    │ (deployment/data.json)│
    └───────────────────────┘
```

1. **Layer A — Standalone Local Server (`data.json`)**:
   - The production server (`server.js`) runs directly on your Windows Server.
   - Saves all requests, user accounts, doctors, departments, and services into `deployment/data.json`.
   - **Requires zero cloud internet connection** — operates 100% offline inside the hospital network.

2. **Layer B — Supabase PostgreSQL Cloud Sync (Optional Realtime DB)**:
   - When connected to Supabase (`https://xyz.supabase.co`), updates sync instantly via WebSockets across all hospital billing desks and mobile devices in real-time.

3. **Layer C — Offline LocalStorage Fallback**:
   - If network drops, client browsers retain state locally and auto-sync when reconnected to the server.

---

## 3. Deployment Prerequisites on Windows Server

Before running the server, ensure:
1. **Node.js (v18.0.0 or higher)** is installed on the Windows Server:
   - Download from [https://nodejs.org](https://nodejs.org) (LTS version).
   - Verify in Command Prompt: `node -v`
2. **Static IP Address** (Recommended):
   - Assign a static LAN IP to your Windows Server (e.g. `192.168.1.50` or `10.0.0.100`) so staff can bookmark the URL.

---

## 4. Quick Start — Deploying the Package

### Step 1: Prepare Deployment Bundle
On your development machine, run:
```bash
npm run build:deploy
```
This builds the React application into `deployment/dist/` and seeds `deployment/data.json`.

---

### Step 2: Running the Server Manually (Option A)

1. Open the `deployment/` folder on your Windows Server.
2. Double-click **`start-server.bat`**.
3. A command window will open displaying your server access URLs:
   ```
   ================================================================
   🏥 STAVYA SPINE HOSPITAL — LOCAL WINDOWS SERVER RUNNING
   ================================================================
   💻 Local Workstation Access:   http://localhost:3000
   🌐 Hospital Network Access:    http://192.168.1.50:3000
   ================================================================
   ```

---

### Step 3: Installing as an Auto-Boot Windows Service (Option B - Recommended)

To ensure the server starts automatically whenever the Windows Server boots up (even before any user logs in):

1. Right-click **PowerShell** and select **Run as Administrator**.
2. Navigate to your deployment directory:
   ```powershell
   cd F:\Discount\deployment
   ```
3. Run the installer script:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\install-windows-service.ps1
   ```
4. **Done!** The system will now auto-start on boot, run silently in the background, and open Windows Firewall Port 3000.

To remove the auto-boot service in the future:
```powershell
.\uninstall-windows-service.ps1
```

---

## 5. Windows Firewall Configuration

If other computers on the hospital network cannot connect to `http://<SERVER-IP>:3000`, open TCP Port 3000 manually:

1. Open **Windows Defender Firewall with Advanced Security**.
2. Click **Inbound Rules** -> **New Rule...**
3. Select **Port** -> Click **Next**.
4. Select **TCP**, enter Specific local ports: `3000` -> Click **Next**.
5. Select **Allow the connection** -> Click **Next**.
6. Check **Domain**, **Private**, and **Public** -> Click **Next**.
7. Name the rule: `Stavya Hospital Discount System` -> Click **Finish**.

---

## 6. Accessing the System Across Hospital Workstations

Staff can open the application from any web browser (Chrome, Edge, Safari, Firefox) on the hospital network:

- **Billing Desktops / Reception**: `http://<SERVER-IP>:3000`
- **CFO & Management Laptops**: `http://<SERVER-IP>:3000`
- **Doctor Mobile Tablets / Phones**: `http://<SERVER-IP>:3000`

### Mobile Sync & QR Code:
Within the web application header, click the **Mobile LAN Sync** button to display a QR code that doctors or executives can scan with their phone/tablet camera to open the app instantly.

---

## 7. Enterprise Integration & REST API Endpoints

The local server exposes standard REST API v1 endpoints for integrating with hospital HIS, EMR, ERP, and Tally accounting systems:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/health` | `GET` | Health check & system status JSON. |
| `/api/sync` | `GET / POST` | Real-time state synchronization endpoint. |
| `/api/v1/requests` | `GET` | Fetch list of discount requests (filters: `status`, `patientId`, `doctor`). |
| `/api/v1/requests` | `POST` | Create a new discount request directly from external HIS/EMR. |
| `/api/v1/users` | `GET / POST` | List or sync hospital staff user directory. |
| `/api/v1/export` | `GET` | Download full system data backup JSON package. |
| `/api/v1/import` | `POST` | Upload and restore system data package. |
| `/api/v1/openapi.json` | `GET` | OpenAPI 3.0 specification for developers. |

---

## 8. Backup & Maintenance

- **Data File**: All data lives in `deployment/data.json`.
- **Daily Backup**: Simply copy `deployment/data.json` to a backup location or USB drive.
- **Data Export from UI**: Admins can also click **Data Porting** in the app header to download or restore complete system JSON backups at any time.
