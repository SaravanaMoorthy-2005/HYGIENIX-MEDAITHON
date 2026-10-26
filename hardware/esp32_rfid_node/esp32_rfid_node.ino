/*
  =============================================================================
  SMART HAND-HYGIENE MONITORING SYSTEM - MODULE 1
  STAFF IDENTIFICATION & BED-ZONE ACCESS (ESP32 + RC522 FIRMWARE)
  =============================================================================

  Pinout:
    RC522 SDA/SS   -->  ESP32 GPIO 5
    RC522 SCK      -->  ESP32 GPIO 18
    RC522 MOSI     -->  ESP32 GPIO 23
    RC522 MISO     -->  ESP32 GPIO 19
    RC522 RST      -->  ESP32 GPIO 22
    RC522 3.3V     -->  ESP32 3.3V (DO NOT CONNECT TO 5V!)
    RC522 GND      -->  ESP32 GND
    
    Green LED      -->  ESP32 GPIO 2
    Red LED        -->  ESP32 GPIO 4
    Buzzer (+)     -->  ESP32 GPIO 15
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include "config.h"

// Hardware instances
MFRC522 rfid(PIN_SS, PIN_RST);

// State tracking variables
unsigned long lastScanTimestamp = 0;
unsigned long lastHeartbeatTimestamp = 0;
String lastScannedUID = "";

// Forward function declarations
void connectWiFi();
void initializeRFID();
bool readRFID();
String getCardUID();
void sendRFIDEvent(const String& uid);
void sendHeartbeat();
void handleRegisteredCard();
void handleUnknownCard();
void beepSuccess();
void beepError();
void showStatus(int greenState, int redState);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("==================================================");
  Serial.println(" SMART HAND-HYGIENE MONITORING SYSTEM - MODULE 1");
  Serial.println(" Bed-Zone Staff RFID Node Booting...");
  Serial.printf(" Device ID:   %s\n", DEVICE_ID);
  Serial.printf(" Bed Zone ID: %s\n", BED_ZONE_ID);
  Serial.println("==================================================");

  // Initialize Peripheral GPIOs
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Initial LED self-test
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_RED, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(150);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Connect to Local Wi-Fi
  connectWiFi();

  // Initialize SPI & RC522 Reader
  initializeRFID();

  // Send initial startup heartbeat
  sendHeartbeat();

  Serial.println("[System] Ready. Present RFID Staff Card to RC522 reader.");
}

void loop() {
  // Check Wi-Fi connection health periodically
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Connection dropped. Reconnecting...");
    connectWiFi();
  }

  // Periodic Heartbeat check
  unsigned long currentMillis = millis();
  if (currentMillis - lastHeartbeatTimestamp >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    lastHeartbeatTimestamp = currentMillis;
  }

  // Check for Card Detection
  if (readRFID()) {
    String currentUID = getCardUID();

    // Debounce / Cooldown Check (2 to 3 seconds)
    if (currentUID == lastScannedUID && (currentMillis - lastScanTimestamp < SCAN_COOLDOWN_MS)) {
      Serial.printf("[RFID] Debounced scan for UID %s (cooldown active)\n", currentUID.c_str());
    } else {
      lastScanTimestamp = currentMillis;
      lastScannedUID = currentUID;

      Serial.println();
      Serial.println("----------------------------------------------");
      Serial.printf("[RFID] Card Detected! UID: %s\n", currentUID.c_str());
      Serial.printf("[RFID] Associating with Bed Zone: %s\n", BED_ZONE_ID);

      // Transmit Event to Backend API
      sendRFIDEvent(currentUID);
      Serial.println("----------------------------------------------");
    }

    // Halt PICC to stop reading until next swipe
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  delay(50); // Small loop yielding delay
}

// ============================================================================
// WIFI CONNECTION
// ============================================================================
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to SSID: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    // Blink red led while searching for wifi
    digitalWrite(PIN_LED_RED, !digitalRead(PIN_LED_RED));
    attempts++;
  }
  digitalWrite(PIN_LED_RED, LOW);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WiFi] Connected Successfully!");
    Serial.printf("[WiFi] IP Address:  %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] Signal RSSI: %d dBm\n", WiFi.RSSI());
    // Flash green once on connect
    digitalWrite(PIN_LED_GREEN, HIGH);
    delay(300);
    digitalWrite(PIN_LED_GREEN, LOW);
  } else {
    Serial.println();
    Serial.println("[WiFi] Failed to connect. RFID node will continue in offline mode.");
  }
}

// ============================================================================
// RFID INITIALIZATION
// ============================================================================
void initializeRFID() {
  SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_SS);
  rfid.PCD_Init();
  delay(100);

  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("[RC522] Hardware Version: 0x%02X\n", version);

  if (version == 0x00 || version == 0xFF) {
    Serial.println("[RC522] WARNING: RC522 not responding. Check 3.3V power and SPI wiring!");
    beepError();
  } else {
    Serial.println("[RC522] Reader initialized successfully on SPI bus.");
  }
}

// ============================================================================
// READ RFID CARD
// ============================================================================
bool readRFID() {
  // Look for new cards
  if (!rfid.PICC_IsNewCardPresent()) {
    return false;
  }
  // Select one of the cards
  if (!rfid.PICC_ReadCardSerial()) {
    return false;
  }
  return true;
}

// ============================================================================
// EXTRACT UID AS UPPERCASE HEX STRING
// ============================================================================
String getCardUID() {
  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uidStr += "0";
    }
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  return uidStr;
}

// ============================================================================
// SEND RFID EVENT TO BACKEND API
// ============================================================================
void sendRFIDEvent(const String& uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Error: Wi-Fi offline. Cannot send scan event.");
    beepError();
    return;
  }

  HTTPClient http;
  String endpoint = String(BACKEND_BASE_URL) + "/api/rfid/scan";
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON payload matching Module 1 specification
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"bed_zone_id\":\"" + String(BED_ZONE_ID) + "\",";
  payload += "\"rfid_uid\":\"" + uid + "\",";
  payload += "\"event_type\":\"ACCESS_REQUEST\"";
  payload += "}";

  Serial.printf("[HTTP] POST %s\n", endpoint.c_str());
  Serial.printf("[HTTP] Payload: %s\n", payload.c_str());

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Response Code: %d\n", httpCode);
    Serial.printf("[HTTP] Response Body: %s\n", response.c_str());

    // Inspect server response outcome
    if (response.indexOf("\"status\":\"REGISTERED\"") != -1) {
      handleRegisteredCard();
    } else if (response.indexOf("\"status\":\"DEBOUNCED\"") != -1) {
      Serial.println("[Action] Card tap debounced by backend.");
    } else {
      // UNKNOWN, REVOKED, or INVALID_DEVICE
      handleUnknownCard();
    }
  } else {
    Serial.printf("[HTTP] POST Failed. Error: %s\n", http.errorToString(httpCode).c_str());
    beepError();
  }

  http.end();
}

// ============================================================================
// SEND PERIODIC HEARTBEAT
// ============================================================================
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String endpoint = String(BACKEND_BASE_URL) + "/api/device/heartbeat";
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\",\"status\":\"ONLINE\"}";
  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    Serial.printf("[Heartbeat] Acknowledged by backend for %s\n", DEVICE_ID);
  }
  http.end();
}

// ============================================================================
// REGISTERED CARD FEEDBACK (Green LED + 2 Short Success Beeps)
// ============================================================================
void handleRegisteredCard() {
  Serial.println("[Feedback] Registered Healthcare Staff Verified!");
  beepSuccess();
}

// ============================================================================
// UNKNOWN / REVOKED CARD FEEDBACK (Red LED + Long Warning Beep)
// ============================================================================
void handleUnknownCard() {
  Serial.println("[Feedback] UNKNOWN / REVOKED Card Detected!");
  beepError();
}

// ============================================================================
// BEEP SUCCESS (Two crisp short beeps + Green LED)
// ============================================================================
void beepSuccess() {
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
  delay(80);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
  delay(600);
  digitalWrite(PIN_LED_GREEN, LOW);
}

// ============================================================================
// BEEP ERROR / WARNING (One long alert tone + Red LED)
// ============================================================================
void beepError() {
  digitalWrite(PIN_LED_RED, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(600);
  digitalWrite(PIN_BUZZER, LOW);
  delay(400);
  digitalWrite(PIN_LED_RED, LOW);
}

// ============================================================================
// SHOW STATUS LED
// ============================================================================
void showStatus(int greenState, int redState) {
  digitalWrite(PIN_LED_GREEN, greenState);
  digitalWrite(PIN_LED_RED, redState);
}
