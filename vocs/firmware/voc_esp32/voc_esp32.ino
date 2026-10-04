/**
 * VOC / E-Nose — ESP32-S3 Firmware (Circuit Design v2)
 * ====================================================
 * รองรับฮาร์ดแวร์ V2:
 * - CCS811 (I2C: SDA=21, SCL=22) -> TVOC, eCO2
 * - ADS1115 (I2C: 0x48) -> MiCS-6814 (A0=CO, A1=NO2, A2=NH3)
 * - PMS5003 (UART2: RX=16, TX=17) -> PM2.5
 * - DHT22 (GPIO 4) -> Temp, RH
 * - MQ Sensors (ADC 3.3V) -> MQ-2(33), MQ-3(36), MQ-8(34), MQ-135(39)
 * - Fan Intake (GPIO 25) / Exhaust (GPIO 26)
 *
 * Dependencies (Arduino Library Manager):
 * - ArduinoJson @ 7.x
 * - DHT sensor library (Adafruit)
 * - Adafruit CCS811 Library
 * - Adafruit ADS1X15
 * - Adafruit PM25 AQI Sensor (สำหรับ PMS5003)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_CCS811.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_PM25AQI.h>

// ─── WiFi ────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─── API ─────────────────────────────────────────────────────
const char* API_URL       = "http://192.168.1.100:8000/api/ingest";  // เปลี่ยนเป็น IP Backend
const char* BOX_ID        = "BOX-001";
const char* ACTIVE_SESSION_URL = "http://192.168.1.100:8000/api/active-session";

int         SESSION_ID          = 0;
String      SESSION_LABEL       = "";
const unsigned long SESSION_POLL_MS = 10000;
unsigned long lastSessionPoll = 0;

// ─── Pin Mapping (v2) ────────────────────────────────────────
#define DHT_PIN     4
#define DHT_TYPE    DHT22

// I2C
#define I2C_SDA     21
#define I2C_SCL     22

// UART2 (PMS5003)
#define PMS_RX      16
#define PMS_TX      17

// Analog MQs
#define MQ2_PIN     33
#define MQ3_PIN     36
#define MQ8_PIN     34
#define MQ135_PIN   39

// Fans
#define FAN_INTAKE  25
#define FAN_EXHAUST 26

// ─── Settings ────────────────────────────────────────────────
const unsigned long SEND_INTERVAL_MS = 3000;
const unsigned long WARMUP_TIME_MS   = 30000; // อุ่นเครื่อง MQ 30 วินาที

// ─── Objects ─────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_CCS811 ccs;
Adafruit_ADS1115 ads; // 16-bit ADC
Adafruit_PM25AQI aqi = Adafruit_PM25AQI();

unsigned long lastSend = 0;
bool isWarmup = true;

// ─── Fetch Active Session ─────────────────────────────────────
void fetchActiveSession() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(ACTIVE_SESSION_URL) + "?box_id=" + BOX_ID;
  http.begin(url);
  int code = http.GET();

  if (code == 200) {
    String body = http.getString();
    JsonDocument doc;
    if (deserializeJson(doc, body) == DeserializationError::Ok) {
      bool active = doc["active"] | false;
      if (active) {
        int newId = doc["session_id"] | 0;
        if (newId != SESSION_ID) {
          SESSION_ID    = newId;
          SESSION_LABEL = doc["label"].as<String>();
          Serial.printf("[Session] Active: #%d — %s\n", SESSION_ID, SESSION_LABEL.c_str());
        }
      } else {
        if (SESSION_ID != 0) {
          Serial.println("[Session] No active session — realtime mode");
          SESSION_ID    = 0;
          SESSION_LABEL = "";
        }
      }
    }
  }
  http.end();
}

// ─── Setup ───────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, PMS_RX, PMS_TX); // PMS5003
  Wire.begin(I2C_SDA, I2C_SCL);
  delay(1000);
  Serial.println("\n[VOC] Starting E-Nose v2...");

  // Fan control
  pinMode(FAN_INTAKE, OUTPUT);
  pinMode(FAN_EXHAUST, OUTPUT);
  digitalWrite(FAN_INTAKE, HIGH);   // เปิดพัดลมตลอดการทำงาน
  digitalWrite(FAN_EXHAUST, HIGH);

  // Init Sensors
  dht.begin();
  
  if (!ccs.begin()) {
    Serial.println("[ERR] CCS811 not found! Check I2C wiring.");
  }
  if (!ads.begin(0x48)) {
    Serial.println("[ERR] ADS1115 not found! Check I2C wiring.");
  }
  if (!aqi.begin_UART(&Serial2)) {
    Serial.println("[ERR] PMS5003 not found on UART2.");
  }

  // Connect WiFi
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  
  Serial.println("[System] Warming up MQ sensors (30s)...");
}

// ─── Data Structure ──────────────────────────────────────────
struct SensorData {
  float temp, rh, pm25, tvoc, eco2;
  int   mq2, mq3, mq135, mq8, mics_co, no2, nh3;
};

// ─── Read Sensors ────────────────────────────────────────────
SensorData readSensors() {
  SensorData d = {0};

  // DHT22
  d.temp = dht.readTemperature();
  d.rh   = dht.readHumidity();
  if (isnan(d.temp)) d.temp = -1;
  if (isnan(d.rh))   d.rh   = -1;

  // CCS811 (TVOC/eCO2)
  // CCS811 มีฟังก์ชันชดเชยความชื้น/อุณหภูมิ เพื่อความแม่นยำ
  if (d.temp > 0 && d.rh > 0) {
    ccs.setEnvironmentalData(d.rh, d.temp);
  }
  if (ccs.available() && !ccs.readData()) {
    d.tvoc = ccs.getTVOC();
    d.eco2 = ccs.geteCO2();
  } else {
    d.tvoc = -1; d.eco2 = -1;
  }

  // PMS5003 (PM2.5)
  PM25_AQI_Data pmData;
  if (aqi.read(&pmData)) {
    d.pm25 = pmData.pm25_env;
  } else {
    d.pm25 = -1;
  }

  // Analog MQs (ESP32 ADC)
  d.mq2    = analogRead(MQ2_PIN);
  d.mq3    = analogRead(MQ3_PIN);
  d.mq8    = analogRead(MQ8_PIN);
  d.mq135  = analogRead(MQ135_PIN);

  // MiCS-6814 ผ่าน ADS1115 (16-bit ADC)
  // A0 = RED(CO), A1 = OX(NO2), A2 = NH3
  d.mics_co = ads.readADC_SingleEnded(0);
  d.no2     = ads.readADC_SingleEnded(1);
  d.nh3     = ads.readADC_SingleEnded(2);

  return d;
}

// ─── Send to API ─────────────────────────────────────────────
void sendData(const SensorData& d) {
  if (WiFi.status() != WL_CONNECTED) return;

  JsonDocument doc;
  doc["box_id"]   = BOX_ID;
  doc["temp"]     = d.temp;
  doc["rh"]       = d.rh;
  doc["pm25"]     = d.pm25;
  doc["tvoc"]     = d.tvoc;
  doc["eco2"]     = d.eco2;
  
  // Note: Backend might need update to save mq2 if needed
  doc["mq2"]      = d.mq2; 
  doc["mq3"]      = d.mq3;
  doc["mq135"]    = d.mq135;
  doc["mq8"]      = d.mq8;
  doc["mics_co"]  = d.mics_co;
  doc["no2"]      = d.no2;
  doc["nh3"]      = d.nh3;

  if (SESSION_ID > 0) doc["session_id"] = SESSION_ID;
  else doc["session_id"] = nullptr;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(payload);
  if (code == 200) {
    String resp = http.getString();
    Serial.printf("[OK] T:%.1f RH:%.0f | TVOC:%.0f PM25:%.0f | CO:%d\n", d.temp, d.rh, d.tvoc, d.pm25, d.mics_co);
    
    // Parse AI prediction
    JsonDocument resp_doc;
    if (deserializeJson(resp_doc, resp) == DeserializationError::Ok) {
      const char* pred = resp_doc["ai"]["prediction"] | "—";
      float conf       = resp_doc["ai"]["confidence"] | 0.0;
      Serial.printf("[AI]  %s (%.1f%%)\n", pred, conf);
    }
  } else {
    Serial.printf("[ERR] HTTP %d\n", code);
  }
  http.end();
}

// ─── Loop ────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // 1. Session Polling
  if (now - lastSessionPoll >= SESSION_POLL_MS) {
    lastSessionPoll = now;
    fetchActiveSession();
  }

  // 2. Warmup Check
  if (isWarmup) {
    if (now >= WARMUP_TIME_MS) {
      isWarmup = false;
      Serial.println("[System] Warmup complete! Starting data stream...");
    } else {
      // สามารถใส่ LED กระพริบตรงนี้ได้
      return; 
    }
  }

  // 3. Sensor Reading & Sending
  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    SensorData d = readSensors();
    if (SESSION_ID > 0) {
      Serial.printf("[Rec] Session #%d — %s\n", SESSION_ID, SESSION_LABEL.c_str());
    }
    sendData(d);
  }
}
