/**
 * VOC / E-Nose — ESP32 Firmware (Circuit Design v2)
 * ====================================================
 * สอดคล้องกับสถาปัตยกรรม Circuit Design v2 และ voc_quality:
 * - CCS811 (Bus #1 Hardware I2C: SDA=21, SCL=22, Addr=0x5B/0x5A) -> TVOC, eCO2
 * - ADS1115 (Bus #2 TwoWire(1): SDA=32, SCL=13, Addr=0x48) -> MiCS-6814 (A0=CO, A1=NO2, A2=NH3 ในหน่วย mV)
 * - PMS5003 (UART2: RX=16, TX=17, SET=23) -> PM2.5
 * - DHT22 (GPIO 27) -> Temp, RH
 * - MQ Sensors (ADC1 3.3V) -> MQ-2(33), MQ-3(36), MQ-8(34), MQ-135(39)
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
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_CCS811.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_PM25AQI.h>
#include <ArduinoOTA.h>
#include <ESPmDNS.h>
#include <WebServer.h>
#include <Update.h>
#include <HTTPUpdate.h>

WebServer server(80);
const char* FIRMWARE_VER = "1.0.0";

// ─── Data Structure ──────────────────────────────────────────
struct SensorData {
  float temp, rh, pm25, tvoc, eco2;
  int   mq2, mq3, mq135, mq8, mics_co, no2, nh3;
};

// ─── WiFi Multi (รองรับทั้งเน็ตแล็บ robot_club และเน็ตมือถือ) ─
WiFiMulti wifiMulti;

// ─── API ─────────────────────────────────────────────────────
const char* API_URL       = "https://voc-backend-api.onrender.com/api/ingest";
const char* BOX_ID        = "BOX-001";
const char* ACTIVE_SESSION_URL = "https://voc-backend-api.onrender.com/api/active-session";

int         SESSION_ID          = 0;
String      SESSION_LABEL       = "";
const unsigned long SESSION_POLL_MS = 10000;
unsigned long lastSessionPoll = 0;

// ─── Pin Mapping (Circuit Design v2) ─────────────────────────
#define DHT_PIN       27     // DHT22 DATA (GPIO 27 ตาม Circuit Design v2)
#define DHT_TYPE      DHT22

// I2C Bus #1: CCS811 (Hardware Wire)
#define I2C1_SDA      21
#define I2C1_SCL      22
#define CCS811_ADDR   0x5B   // ADDR pin -> HIGH (สำรอง 0x5A หาก ADDR -> GND)

// I2C Bus #2: ADS1115 (TwoWire Software/Secondary)
#define I2C2_SDA      32
#define I2C2_SCL      13
#define ADS1115_ADDR  0x48   // ADDR pin -> GND

// UART2 (PMS5003)
#define PMS_RX        16
#define PMS_TX        17
#define PMS_SET_PIN   23     // PMS5003 SET pin (HIGH = ทำงานปกติ)

// Analog MQs (ADC1 - ปลอดภัยเมื่อเปิด Wi-Fi)
#define MQ2_PIN       33
#define MQ3_PIN       36
#define MQ8_PIN       34
#define MQ135_PIN     39

// Fans / Relays
#define FAN_INTAKE    25
#define FAN_EXHAUST   26

// ─── Settings ────────────────────────────────────────────────
const unsigned long SEND_INTERVAL_MS = 3000;
const unsigned long WARMUP_TIME_MS   = 30000; // อุ่นเครื่องเริ่มต้น 30 วินาที

// ─── Objects ─────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
TwoWire I2C2 = TwoWire(1);   // Bus #2 แยกป้องกันบัสล่มและ CCS811 ดึง SDA ค้าง
Adafruit_CCS811 ccs;
Adafruit_ADS1115 ads;         // 16-bit ADC สำหรับ MiCS-6814
Adafruit_PM25AQI aqi = Adafruit_PM25AQI();

unsigned long lastSend = 0;
bool isWarmup = true;

// ─── Fetch Active Session ─────────────────────────────────────
void fetchActiveSession() {
  if (wifiMulti.run() != WL_CONNECTED) return;

  WiFiClientSecure client;
  HTTPClient http;
  String url = String(ACTIVE_SESSION_URL) + "?box_id=" + BOX_ID;
  if (url.startsWith("https://")) {
    client.setInsecure();
    http.begin(client, url);
  } else {
    http.begin(url);
  }
  http.setTimeout(4000);
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

  // Wake up PMS5003
  pinMode(PMS_SET_PIN, OUTPUT);
  digitalWrite(PMS_SET_PIN, HIGH);

  // Fan control
  pinMode(FAN_INTAKE, OUTPUT);
  pinMode(FAN_EXHAUST, OUTPUT);
  digitalWrite(FAN_INTAKE, HIGH);   // เปิดพัดลมตลอดการทำงาน
  digitalWrite(FAN_EXHAUST, HIGH);

  Serial.println("\n[VOC] Starting E-Nose v2 (Circuit Design v2)...");

  // 1. Init Bus #2 (ADS1115) ก่อนเสมอ เนื่องจาก CCS811 มักดึง SDA ค้างช่วง Power-up
  I2C2.begin(I2C2_SDA, I2C2_SCL);
  I2C2.setClock(100000);
  delay(50);
  if (!ads.begin(ADS1115_ADDR, &I2C2)) {
    Serial.println("[ERR] ADS1115 not found on Bus #2 (GPIO 32/13)!");
  } else {
    Serial.println("[OK] ADS1115 ready on Bus #2 (GPIO 32/13)");
  }

  // 2. Init Bus #1 (CCS811)
  Wire.begin(I2C1_SDA, I2C1_SCL);
  Wire.setClock(100000);
  delay(100);

  uint8_t ccs_addr = CCS811_ADDR;
  Wire.beginTransmission(ccs_addr);
  if (Wire.endTransmission() != 0) {
    Wire.beginTransmission(0x5A);
    if (Wire.endTransmission() == 0) ccs_addr = 0x5A;
  }
  if (!ccs.begin(ccs_addr, &Wire)) {
    Serial.println("[ERR] CCS811 not found on Bus #1 (GPIO 21/22)! Check wiring & WAKE pin (connect to GND).");
  } else {
    Serial.printf("[OK] CCS811 ready on Bus #1 (0x%02X)\n", ccs_addr);
  }

  // 3. Init DHT22 & PMS5003
  dht.begin();
  if (!aqi.begin_UART(&Serial2)) {
    Serial.println("[ERR] PMS5003 not found on UART2.");
  } else {
    Serial.println("[OK] PMS5003 ready on UART2");
  }

  // Connect WiFi (Auto-select robot_club / Urworld)
  wifiMulti.addAP("robot_club", "REDACTED_PASSWORD");
  wifiMulti.addAP("Urworld", "REDACTED_PASSWORD");

  Serial.println("[WiFi] Connecting to WiFi (robot_club / Urworld)...");
  int wifiRetry = 0;
  while (wifiMulti.run() != WL_CONNECTED && wifiRetry < 30) {
    delay(500);
    Serial.print(".");
    wifiRetry++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected to: %s | IP: %s\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Waiting for network connection in background...");
  }
  
  // 4. Init Web OTA & ArduinoOTA
  if (MDNS.begin("airmon")) {
    Serial.println("[mDNS] Responder started: http://airmon.local");
  }
  server.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><body style='font-family:sans-serif;background:#0f172a;color:#fff;padding:20px;text-align:center;'>";
    html += "<h2>⚡ VOC E-Nose Box Online</h2><p><a href='/update' style='color:#38bdf8;font-weight:bold'>🚀 Open Web Firmware OTA Updater</a></p></body></html>";
    server.send(200, "text/html", html);
  });
  server.on("/update", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><body style='font-family:sans-serif;background:#0f172a;color:#fff;padding:20px;text-align:center'>";
    html += "<div style='background:#1e293b;padding:30px;border-radius:12px;display:inline-block'>";
    html += "<h2>⚡ ESP32 Web Firmware Flash</h2>";
    html += "<p style='color:#94a3b8;font-size:13px'>เลือกไฟล์ <b>.bin</b> เพื่อแฟลชไร้สายผ่าน Wi-Fi</p>";
    html += "<form method='POST' action='/update' enctype='multipart/form-data'>";
    html += "<input type='file' name='update' accept='.bin'><br><br>";
    html += "<button type='submit' style='padding:10px 20px;background:#10b981;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer'>🚀 Flash Firmware</button>";
    html += "</form></div></body></html>";
    server.send(200, "text/html", html);
  });
  server.on("/update", HTTP_POST, []() {
    server.sendHeader("Connection", "close");
    server.send(200, "text/html", "<body style='font-family:sans-serif;background:#0f172a;color:#10b981;text-align:center;padding:50px'><h2>" +
      String((Update.hasError()) ? "❌ UPDATE FAILED" : "✅ UPDATE SUCCESSFUL! Rebooting ESP32...") +
      "</h2><script>setTimeout(function(){location.href='/';},10000);</script></body>");
    delay(1000);
    ESP.restart();
  }, []() {
    HTTPUpload& upload = server.upload();
    if (upload.status == UPLOAD_FILE_START) {
      Serial.printf("[Web OTA] Update: %s\n", upload.filename.c_str());
      if (!Update.begin(UPDATE_SIZE_UNKNOWN)) Update.printError(Serial);
    } else if (upload.status == UPLOAD_FILE_WRITE) {
      if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) Update.printError(Serial);
    } else if (upload.status == UPLOAD_FILE_END) {
      if (Update.end(true)) Serial.printf("[Web OTA] Success: %u bytes\n", upload.totalSize);
      else Update.printError(Serial);
    }
  });
  server.begin();
  ArduinoOTA.setHostname("airmon-box-001");
  ArduinoOTA.begin();
  Serial.println("[OTA] Web OTA ready at http://airmon.local/update and Arduino IDE Network Port");
  
  Serial.println("[System] Warming up MQ sensors (30s)...");
}

// ─── Read Sensors ────────────────────────────────────────────
SensorData readSensors() {
  SensorData d = {0};

  // DHT22
  d.temp = dht.readTemperature();
  d.rh   = dht.readHumidity();
  if (isnan(d.temp)) d.temp = -1;
  if (isnan(d.rh))   d.rh   = -1;

  // CCS811 (TVOC/eCO2)
  // ชดเชยอุณหภูมิ/ความชื้นทุก 60 วินาที เพื่อไม่ให้ชิปรีเซ็ต Baseline บ่อยเกินไป
  static unsigned long lastEnvUpdate = 0;
  if (d.temp > 0 && d.rh > 0 && (millis() - lastEnvUpdate >= 60000)) {
    lastEnvUpdate = millis();
    ccs.setEnvironmentalData((uint8_t)d.rh, d.temp);
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
  // แปลงค่าเป็น mV ให้ตรงกับสเกลชุดข้อมูล Machine Learning และ backend
  // A0 = RED (CO), A1 = OX (NO2), A2 = NH3
  d.mics_co = (int)(ads.computeVolts(ads.readADC_SingleEnded(0)) * 1000.0f);
  d.no2     = (int)(ads.computeVolts(ads.readADC_SingleEnded(1)) * 1000.0f);
  d.nh3     = (int)(ads.computeVolts(ads.readADC_SingleEnded(2)) * 1000.0f);

  return d;
}

// ─── Send to API ─────────────────────────────────────────────
void sendData(const SensorData& d) {
  if (wifiMulti.run() != WL_CONNECTED) return;

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

  WiFiClientSecure client;
  HTTPClient http;
  String url = String(API_URL);
  if (url.startsWith("https://")) {
    client.setInsecure();
    http.begin(client, url);
  } else {
    http.begin(url);
  }
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(4000);

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

      // ─── Cloud Pull OTA Auto Update ──────────────────────────
      bool otaAvailable = resp_doc["ota"]["available"] | false;
      const char* otaVer = resp_doc["ota"]["version"] | "";
      const char* otaUrl = resp_doc["ota"]["url"] | "";

      if (otaAvailable && strlen(otaVer) > 0 && strcmp(otaVer, FIRMWARE_VER) != 0 && strlen(otaUrl) > 0) {
        Serial.printf("\n[Cloud OTA] New version detected: %s (current: %s)\n", otaVer, FIRMWARE_VER);
        http.end();
        performCloudOTA(otaUrl);
        return;
      }
    }
  } else {
    Serial.printf("[ERR] HTTP %d\n", code);
  }
  http.end();
}

// ─── Cloud Pull OTA Execution ────────────────────────────────
void performCloudOTA(const char* ota_url) {
  Serial.printf("[Cloud OTA] Pulling firmware from Cloud: %s\n", ota_url);
  WiFiClientSecure otaClient;
  otaClient.setInsecure();
  httpUpdate.rebootOnUpdate(true);

  t_httpUpdate_return ret = httpUpdate.update(otaClient, ota_url);
  if (ret == HTTP_UPDATE_FAILED) {
    Serial.printf("[Cloud OTA] Failed! Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
  } else if (ret == HTTP_UPDATE_OK) {
    Serial.println("[Cloud OTA] Update success! Rebooting into new firmware...");
  }
}

// ─── Loop ────────────────────────────────────────────────────
void loop() {
  // OTA Server handlers
  server.handleClient();
  ArduinoOTA.handle();

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
