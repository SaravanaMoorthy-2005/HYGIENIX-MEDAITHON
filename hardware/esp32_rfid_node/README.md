# ESP32 + RC522 RFID Staff Identification Node (Module 1)

This folder contains the complete, production-ready Arduino firmware for the **Module 1: Staff Identification & Bed-Zone Access** node.

---

## 1. Hardware Pinout & Wiring

| RC522 RFID Module | ESP32 DevKit GPIO | Wire Color (Typical) | Notes |
|---|---|---|---|
| **3.3V (VCC)** | **3.3V** | Red | **CRITICAL: Connect to 3.3V ONLY. DO NOT USE 5V!** |
| **GND** | **GND** | Black | Common Ground |
| **RST** | **GPIO 22** | Orange | Reset |
| **SDA / SS** | **GPIO 5** | White / Yellow | SPI Chip Select (CS) |
| **SCK** | **GPIO 18** | Blue | SPI Clock |
| **MOSI** | **GPIO 23** | Green | SPI Master Out Slave In |
| **MISO** | **GPIO 19** | Purple | SPI Master In Slave Out |
| **IRQ** | *Unconnected* | - | Not used in polling mode |

### Feedback Indicators (LEDs & Buzzer)
| Component | ESP32 GPIO | Active State | Behavior |
|---|---|---|---|
| **Green LED** | **GPIO 2** | HIGH | Registered Staff Verified (Flashes 2x) |
| **Red LED** | **GPIO 4** | HIGH | Unknown / Revoked RFID Alert (1 sec tone) |
| **Active Buzzer (+)** | **GPIO 15** | HIGH | Audible beep for staff feedback |
| **Buzzer (-)** | **GND** | - | Ground return |

> [!CAUTION]
> **Power Safety Warning:** The MFRC522 reader chip operates strictly at **3.3V logic and supply voltage**. Connecting the RC522 VCC pin to 5V (or VIN) will permanently damage the reader or degrade RFID detection range.

---

## 2. Arduino IDE Setup Instructions

### Step 1: Open Arduino IDE
Open Arduino IDE (already installed on this machine).

### Step 2: Install Required Libraries
In Arduino IDE, go to **Tools -> Manage Libraries...** (or `Ctrl + Shift + I`):
1. Search for: **MFRC522** (by *GithubCommunity* / *Michal Valenta*)
2. Click **Install**.
*(Note: `WiFi.h`, `HTTPClient.h`, and `SPI.h` are built into the official ESP32 core package).*

### Step 3: Configure `config.h`
Open `config.h` located in this directory:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Use your computer's local Wi-Fi IP (e.g. run `ipconfig` in cmd to find IPv4)
const char* BACKEND_BASE_URL = "http://192.168.1.100:5000";

// Set device and bed identity for this physical node
const char* DEVICE_ID   = "ESP32-ICU-01";
const char* BED_ZONE_ID = "ICU-01";
```

### Step 4: Board Selection & Flash
1. Go to **Tools -> Board -> esp32 -> ESP32 Dev Module**.
2. Select your USB COM Port under **Tools -> Port** (e.g., `COM3`, `COM4`).
3. Set **Upload Speed**: `921600` or `115200`.
4. Click **Upload** (`Ctrl + U`). If the upload waits at `Connecting...`, hold down the `BOOT` button on the ESP32 until the upload begins.

### Step 5: Serial Monitor Verification
Open **Tools -> Serial Monitor** at **115200 baud**:
You will see:
```text
==================================================
 SMART HAND-HYGIENE MONITORING SYSTEM - MODULE 1
 Bed-Zone Staff RFID Node Booting...
 Device ID:   ESP32-ICU-01
 Bed Zone ID: ICU-01
==================================================
[WiFi] Connected Successfully! IP: 192.168.1.x
[RC522] Hardware Version: 0x92 (or 0x91)
[RC522] Reader initialized successfully on SPI bus.
[Heartbeat] Acknowledged by backend for ESP32-ICU-01
[System] Ready. Present RFID Staff Card to RC522 reader.
```

---

## 3. Physical Verification Flow

1. **Tap Dr. Arun Kumar's RFID Card (UID: `A1B2C3D4`):**
   - RC522 reads UID in uppercase hex.
   - ESP32 POSTs to `http://<YOUR_IP>:5000/api/rfid/scan`.
   - Backend matches active Doctor profile.
   - ESP32 sounds **2 short beeps** and flashes **Green LED**.
   - React Dashboard instantly updates ICU-01 to "ACTIVE - Dr. Arun Kumar".

2. **Tap Unknown RFID Card (any unregistered card or keyfob):**
   - ESP32 POSTs UID.
   - Backend returns `status: "UNKNOWN"`.
   - ESP32 sounds **1 long warning tone** and lights **Red LED**.
   - React Dashboard displays red alert badge with UID and Bed location.

3. **Tap Revoked RFID Card (`REV00112`):**
   - ESP32 returns `status: "REVOKED"`.
   - ESP32 sounds alert tone and displays Red LED.
   - Dashboard flags the revoked badge access attempt.

4. **Tap Card Twice Rapidly (within 2-3 seconds):**
   - ESP32 or backend ignores duplicate scan within cooldown window.
   - No duplicate event is logged in the database.
