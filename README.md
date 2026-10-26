# Smart Hand-Hygiene Monitoring System
## Module 1: Staff Identification & Bed-Zone Access

A healthcare hackathon MVP integrating physical IoT hardware (ESP32 DevKit + RC522 RFID reader) with a Node.js/Express REST API, real-time Socket.IO WebSocket gateway, SQLite persistent database, and a React live monitoring dashboard for hospital **General Wards** and **ICUs**.

---

## 1. System Architecture & Data Flow

```text
[RFID Staff Badge] (e.g. UID: A1B2C3D4)
        ↓  (13.56 MHz SPI Tap)
[RC522 RFID Reader] (3.3V Logic)
        ↓
[ESP32 DevKit Node] (Fixed mapping: e.g. ESP32-ICU-01 -> ICU-01)
        ↓  (Wi-Fi HTTP POST /api/rfid/scan)
[Node.js + Express Backend]
   ├── 1. Request & Device validation
   ├── 2. Bed-Zone mapping verification
   ├── 3. Staff UID lookup & Status check (ACTIVE / UNKNOWN / REVOKED)
   ├── 4. 2-3s Cooldown debounce protection
   ├── 5. Audit event creation in SQLite
   └── 6. Real-time broadcast via Socket.IO
        ↓
[React + Vite Live Dashboard]
   ├── Metric Cards (Staff, Active Beds, Today's Events, Unknown Cards)
   ├── Live Bed Cards (ICU & General Ward with Filters)
   ├── Real-time Access Event Log
   ├── Staff & Bed Management
   └── Device Health & Heartbeat Telemetry
```

---

## 2. Product Safety Notice
In clinical environments, badge presence does **NOT** equal hygiene compliance.
- **Allowed terminology:** `"Staff Identified"`, `"Access Request"`, `"Bed-Zone Event"`, `"RFID Scan Recorded"`, `"Possible Missed Hygiene Event"`, `"Unknown RFID"`.
- **Never claim:** `"Patient contact detected"`, `"Patient examined"`, `"Hand hygiene completed"`, `"100% compliance"`, or `"Staff touched patient"`.

---

## 3. Quick Start & Run Commands

### Prerequisites
- Node.js v18+ (tested on v22.19.0)
- npm v9+

### Step 1: Start Backend API & Gateway
```powershell
# From project root:
cd backend
npm install
npm run seed     # Seeds demo staff, beds, devices, and sample events
npm start        # Starts server on http://localhost:5000
```

### Step 2: Start Frontend Dashboard
In a separate terminal:
```powershell
# From project root:
cd frontend
npm install
npm run dev      # Launches Vite dev server at http://localhost:5173
```

Open your browser at **http://localhost:5173**.

---

## 4. Hardware Integration (ESP32 + RC522)

### Pinout & Wiring (SPI 3.3V)

| RC522 RFID Module | ESP32 GPIO | Notes |
|---|---|---|
| **VCC (3.3V)** | **3.3V** | **CRITICAL: Connect to 3.3V ONLY. DO NOT USE 5V!** |
| **GND** | **GND** | Ground return |
| **RST** | **GPIO 22** | Reset pin |
| **SDA / SS** | **GPIO 5** | SPI Chip Select |
| **SCK** | **GPIO 18** | SPI Clock |
| **MOSI** | **GPIO 23** | SPI Master Out |
| **MISO** | **GPIO 19** | SPI Master In |
| **Green LED (+)** | **GPIO 2** | Registered staff success indicator |
| **Red LED (+)** | **GPIO 4** | Unknown / Revoked RFID alert indicator |
| **Buzzer (+)** | **GPIO 15** | Audible feedback (2x short = success, 1x long = error) |

### Flashing Firmware:
1. Open Arduino IDE.
2. Install library: **MFRC522** (by *GithubCommunity*).
3. Open `hardware/esp32_rfid_node/esp32_rfid_node.ino`.
4. Update `hardware/esp32_rfid_node/config.h` with your Wi-Fi SSID, Password, and your computer's local IP address (e.g. `http://192.168.1.100:5000`).
5. Select Board: **ESP32 Dev Module**, choose the USB COM Port, and click **Upload**.

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rfid/scan` | RFID tap event from ESP32 with debounce & resolution |
| `GET` | `/api/access-events` | Retrieve access audit events (supports `ward_type`, `status`, pagination) |
| `GET` | `/api/access-events/recent` | Recent 10-15 events for live dashboard stream |
| `GET` | `/api/staff` | List registered healthcare staff roster |
| `POST` | `/api/staff` | Register new staff member with RFID UID |
| `PATCH`| `/api/staff/:id/status`| Update staff status (`ACTIVE`, `REVOKED`, `INACTIVE`) |
| `GET` | `/api/bed-zones` | List all bed zones with live presence and device links |
| `POST` | `/api/bed-zones` | Register new bed zone and map ESP32 controller |
| `GET` | `/api/devices` | Device telemetry inventory & health status |
| `POST` | `/api/device/heartbeat` | ESP32 periodic heartbeat ping (updates `last_seen`) |
| `GET` | `/api/dashboard/summary`| Aggregated dashboard metrics |
| `POST` | `/api/reset-demo` | Resets SQLite database back to initial clean demo state |

---

## 6. Demo Test Scenarios

| Scenario | Card UID | Bed Zone | Device | Expected Backend Outcome | Expected Feedback |
|---|---|---|---|---|---|
| **Dr. Arun Kumar (Doctor)** | `A1B2C3D4` | `ICU-01` | `ESP32-ICU-01` | `REGISTERED` (HTTP 200) | Green LED + 2 short beeps; Bed ICU-01 shows ACTIVE |
| **Nurse Priya (Nurse)** | `B1C2D3E4` | `ICU-03` | `ESP32-ICU-03` | `REGISTERED` (HTTP 200) | Green LED + 2 short beeps; Bed ICU-03 shows ACTIVE |
| **Dr. Ravi (Doctor)** | `C1D2E3F4` | `GW-01` | `ESP32-GW-01` | `REGISTERED` (HTTP 200) | Green LED + 2 short beeps; Bed GW-01 shows ACTIVE |
| **Unknown RFID Card** | `99887766` | `ICU-02` | `ESP32-ICU-02` | `UNKNOWN` (HTTP 200) | Red LED + long alert tone; Red dashboard notification |
| **Revoked RFID Card** | `REV00112` | `ICU-03` | `ESP32-ICU-03` | `REVOKED` (HTTP 200) | Red LED + long alert tone; Orange dashboard notification |
| **Rapid Double-Tap** | `A1B2C3D4` | `ICU-01` | `ESP32-ICU-01` | `DEBOUNCED` (HTTP 200) | Duplicate tap ignored within 2.5s window |

---

## 7. Automated Verification Suite
Run the automated test suite anytime:
```powershell
# Run backend integration tests:
cd backend
npm test

# Run end-to-end full system verification:
node verify_system.js
```
