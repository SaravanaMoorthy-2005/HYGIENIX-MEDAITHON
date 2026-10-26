#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// SMART HAND-HYGIENE MONITORING SYSTEM - MODULE 1 (ESP32 NODE CONFIG)
// ============================================================================

// --- Wi-Fi Network Credentials ---
// Replace with your local Wi-Fi SSID and Password
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- Backend API Configuration ---
// Use your computer's local IP address (e.g. 192.168.1.100), NOT "localhost"
// Port defaults to 5000 as configured in backend .env
const char* BACKEND_BASE_URL = "http://192.168.1.100:5000";

// --- Node Hardware Identity ---
// Change these per physical node (e.g., ESP32-ICU-01, ESP32-ICU-02, ESP32-GW-01)
const char* DEVICE_ID   = "ESP32-ICU-01";
const char* BED_ZONE_ID = "ICU-01";

// --- RC522 SPI Pin Configuration (Fixed for standard ESP32 DevKit) ---
// IMPORTANT: Connect RC522 VCC to 3.3V ONLY! DO NOT USE 5V!
#define PIN_SS          5   // RC522 SDA / SS
#define PIN_RST         22  // RC522 Reset
#define PIN_SCK         18  // SPI SCK
#define PIN_MISO        19  // SPI MISO
#define PIN_MOSI        23  // SPI MOSI

// --- Feedback Peripheral Pins ---
#define PIN_LED_GREEN   2   // Active HIGH - Success / Registered
#define PIN_LED_RED     4   // Active HIGH - Unknown / Revoked / Error
#define PIN_BUZZER      15  // Active HIGH - Audio buzzer alert

// --- Timing & Safety Parameters ---
#define SCAN_COOLDOWN_MS    3000   // 3-second cooldown to prevent duplicate reads
#define HEARTBEAT_INTERVAL_MS 45000 // Send heartbeat to backend every 45 seconds

#endif // CONFIG_H
