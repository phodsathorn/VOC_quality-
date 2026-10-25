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

// ─── Data Structure ──────────────────────────────────────────
struct SensorData {
  float temp, rh, pm25, tvoc, eco2;
  int   mq2, mq3, mq135, mq8, mics_co, no2, nh3;
};

WebServer server(80);
const char* FIRMWARE_VER = "1.0.2";
const char* BOX_ID       = "BOX-001";

SensorData readSensors();
void sendData(const SensorData& d);
void reportOtaStatus(const char* status, int errCode, const char* errDetail);
void performCloudOTA(const char* ota_url);

// ─── Premium Glassmorphic Web OTA Template (Stored in Flash PROGMEM) ──
const char OTA_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VOC E-Nose — Firmware OTA</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { min-height: 100vh; background: radial-gradient(circle at top, #1e293b 0%, #090d16 100%); color: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .card { width: 100%; max-width: 520px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
  .title-group h1 { font-size: 1.25rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
  .title-group p { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }
  .badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
  .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .stat-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); padding: 12px 14px; border-radius: 12px; }
  .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 4px; }
  .stat-val { font-size: 0.95rem; font-weight: 700; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, monospace; }
  .drop-zone { border: 2px dashed rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 28px 20px; text-align: center; cursor: pointer; transition: all 0.2s ease; background: rgba(15, 23, 42, 0.4); margin-bottom: 20px; }
  .drop-zone:hover, .drop-zone.dragover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
  .drop-icon { font-size: 2.2rem; margin-bottom: 8px; display: block; }
  .drop-text { font-size: 0.88rem; color: #cbd5e1; font-weight: 500; }
  .drop-sub { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
  .file-info { display: none; margin-top: 10px; font-size: 0.8rem; color: #38bdf8; font-weight: 600; word-break: break-all; }
  input[type="file"] { display: none; }
  .btn-submit { width: 100%; padding: 14px; border: none; border-radius: 12px; font-weight: 700; font-size: 0.95rem; cursor: pointer; background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: #fff; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14, 165, 233, 0.45); }
  .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .progress-wrap { display: none; margin-top: 20px; }
  .progress-bar { width: 100%; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 9999px; overflow: hidden; }
  .progress-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #10b981); transition: width 0.15s ease; border-radius: 9999px; }
  .progress-text { display: flex; justify-content: space-between; font-size: 0.78rem; color: #94a3b8; margin-top: 8px; font-weight: 600; }
  .status-modal { display: none; margin-top: 20px; padding: 16px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); text-align: center; }
  .status-title { font-size: 1rem; font-weight: 700; color: #34d399; margin-bottom: 4px; }
  .status-desc { font-size: 0.8rem; color: #a7f3d0; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="title-group">
      <h1>⚡ E-Nose Firmware OTA</h1>
      <p>ระบบอัปเดตเฟิร์มแวร์ไร้สายความเร็วสูง</p>
    </div>
    <div class="badge"><div class="dot"></div> ESP32 ONLINE</div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-label">Device Box ID</div>
      <div class="stat-val">%BOX_ID%</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Current Version</div>
      <div class="stat-val" style="color:#38bdf8">%FIRMWARE_VER%</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Wi-Fi Network</div>
      <div class="stat-val">%SSID%</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Free Heap RAM</div>
      <div class="stat-val">%FREE_HEAP% KB</div>
    </div>
  </div>

  <form id="uploadForm">
    <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
      <span class="drop-icon">🚀</span>
      <div class="drop-text">คลิกเพื่อเลือกไฟล์ <strong>.bin</strong> หรือลากไฟล์มาวางที่นี่</div>
      <div class="drop-sub">Compiled Binary จาก Arduino IDE (Cmd + Option + S)</div>
      <div class="file-info" id="fileInfo"></div>
    </div>
    <input type="file" id="fileInput" name="update" accept=".bin" onchange="handleFileSelect(this.files)">
    <button type="submit" class="btn-submit" id="btnSubmit" disabled>
      ⚡ เริ่มต้นแฟลชเฟิร์มแวร์ (Flash Firmware)
    </button>
  </form>

  <div class="progress-wrap" id="progressWrap">
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <div class="progress-text"><span id="progressStatus">กำลังส่งข้อมูล...</span><span id="progressPct">0%</span></div>
  </div>

  <div class="status-modal" id="statusModal">
    <div class="status-title">✅ แฟลชเฟิร์มแวร์สำเร็จเรียบร้อย!</div>
    <div class="status-desc" id="countdownDesc">กำลังรีบูต ESP32 และเชื่อมต่อเครือข่ายใหม่... (10 วินาที)</div>
  </div>
</div>

<script>
  let selectedFile = null;
  function handleFileSelect(files) {
    if (!files.length) return;
    selectedFile = files[0];
    const info = document.getElementById('fileInfo');
    info.style.display = 'block';
    const sizeMb = (selectedFile.size / 1024 / 1024).toFixed(2);
    info.innerHTML = '📄 ' + selectedFile.name + ' (' + sizeMb + ' MB)';
    document.getElementById('btnSubmit').disabled = false;
  }

  const dropZone = document.getElementById('dropZone');
  ['dragenter', 'dragover'].forEach(e => dropZone.addEventListener(e, (ev) => { ev.preventDefault(); dropZone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(e => dropZone.addEventListener(e, (ev) => { ev.preventDefault(); dropZone.classList.remove('dragover'); }));
  dropZone.addEventListener('drop', (ev) => {
    ev.preventDefault();
    if (ev.dataTransfer.files.length) {
      document.getElementById('fileInput').files = ev.dataTransfer.files;
      handleFileSelect(ev.dataTransfer.files);
    }
  });

  document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!selectedFile) return;
    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerHTML = '⏳ กำลังส่งไฟล์เข้าสู่ชิป ESP32...';

    const pWrap = document.getElementById('progressWrap');
    const pFill = document.getElementById('progressFill');
    const pPct  = document.getElementById('progressPct');
    const pStat = document.getElementById('progressStatus');
    pWrap.style.display = 'block';

    const fd = new FormData();
    fd.append('update', selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/update', true);

    xhr.upload.onprogress = function(ev) {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        pFill.style.width = pct + '%';
        pPct.innerText = pct + '%';
        pStat.innerText = 'อัปโหลด: ' + (ev.loaded / 1024 / 1024).toFixed(1) + ' MB / ' + (ev.total / 1024 / 1024).toFixed(1) + ' MB';
      }
    };

    xhr.onload = function() {
      pFill.style.width = '100%';
      pPct.innerText = '100%';
      document.getElementById('statusModal').style.display = 'block';
      let sec = 10;
      const timer = setInterval(() => {
        sec--;
        document.getElementById('countdownDesc').innerText = 'กำลังรีบูต ESP32 และเชื่อมต่อใหม่... (' + sec + ' วินาที)';
        if (sec <= 0) {
          clearInterval(timer);
          location.href = '/update';
        }
      }, 1000);
    };

    xhr.onerror = function() {
      document.getElementById('statusModal').style.display = 'block';
      let sec = 10;
      const timer = setInterval(() => {
        sec--;
        document.getElementById('countdownDesc').innerText = 'กำลังรีบูต ESP32 และเชื่อมต่อใหม่... (' + sec + ' วินาที)';
        if (sec <= 0) { clearInterval(timer); location.href = '/update'; }
      }, 1000);
    };

    xhr.send(fd);
  });
</script>
</body>
</html>
)rawliteral";

void handleServeOTA() {
  String html = FPSTR(OTA_PAGE);
  html.replace("%BOX_ID%", BOX_ID);
  html.replace("%FIRMWARE_VER%", FIRMWARE_VER);
  html.replace("%SSID%", WiFi.SSID().length() > 0 ? WiFi.SSID() : "N/A");
  html.replace("%FREE_HEAP%", String(ESP.getFreeHeap() / 1024));
  server.send(200, "text/html; charset=utf-8", html);
}

// ─── WiFi Multi (รองรับทั้งเน็ตแล็บ robot_club และเน็ตมือถือ) ─
WiFiMulti wifiMulti;

// ─── API ─────────────────────────────────────────────────────
const char* API_URL       = "https://voc-backend-api.onrender.com/api/ingest";
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
    reportOtaStatus("SUCCESS", 0, "Online and running");
  } else {
    Serial.println("\n[WiFi] Waiting for network connection in background...");
  }
  
  // 4. Init Web OTA & ArduinoOTA
  if (MDNS.begin("airmon")) {
    Serial.println("[mDNS] Responder started: http://airmon.local");
  }
  server.on("/", HTTP_GET, handleServeOTA);
  server.on("/update", HTTP_GET, handleServeOTA);
  server.on("/update", HTTP_POST, []() {
    server.sendHeader("Connection", "close");
    server.send(200, "text/plain; charset=utf-8", (Update.hasError()) ? "FAIL" : "OK");
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

  // DHT22 (ป้องกันค่าหลุด NaN หรือ -1 ซึ่งทำให้ AI เสียหาย)
  static float lastValidTemp = 25.0;
  static float lastValidRh   = 55.0;
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && t >= -10.0 && t <= 80.0) lastValidTemp = t;
  if (!isnan(h) && h >= 0.0 && h <= 100.0)  lastValidRh   = h;
  d.temp = lastValidTemp;
  d.rh   = lastValidRh;

  // CCS811 (TVOC/eCO2)
  // ชดเชยอุณหภูมิ/ความชื้นทุก 60 วินาที เพื่อไม่ให้ชิปรีเซ็ต Baseline บ่อยเกินไป
  static unsigned long lastEnvUpdate = 0;
  if (d.temp > 0 && d.rh > 0 && (millis() - lastEnvUpdate >= 60000)) {
    lastEnvUpdate = millis();
    ccs.setEnvironmentalData((uint8_t)d.rh, d.temp);
  }

  static float lastValidTvoc = 10.0;
  static float lastValidEco2 = 400.0;

  if (ccs.available() && !ccs.checkError() && !ccs.readData()) {
    uint16_t raw_tvoc = ccs.getTVOC();
    uint16_t raw_eco2 = ccs.geteCO2();
    // กรองขยะ I2C bus error frames (เช่น 64319, 39064, 32800) ซึ่งทำให้ AI ทายแอลกอฮอล์ผิดพลาด
    // ช่วงสเปกปกติของ CCS811: TVOC = 0 - 1187 ppb (สูงสุดไม่เกิน 2000), eCO2 = 400 - 8192 ppm
    if (raw_tvoc <= 2000 && raw_eco2 >= 400 && raw_eco2 <= 8192) {
      lastValidTvoc = (float)raw_tvoc;
      lastValidEco2 = (float)raw_eco2;
    }
  }
  d.tvoc = lastValidTvoc;
  d.eco2 = lastValidEco2;

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
  // แปลงค่าเป็น mV และ clamp ค่าไม่ให้ติดลบ
  int v0 = (int)(ads.computeVolts(ads.readADC_SingleEnded(0)) * 1000.0f);
  int v1 = (int)(ads.computeVolts(ads.readADC_SingleEnded(1)) * 1000.0f);
  int v2 = (int)(ads.computeVolts(ads.readADC_SingleEnded(2)) * 1000.0f);
  d.mics_co = max(0, v0);
  d.no2     = max(0, v1);
  d.nh3     = max(0, v2);

  return d;
}

// ─── OTA Diagnostic Report ───────────────────────────────────
void reportOtaStatus(const char* status, int errCode, const char* errDetail) {
  if (wifiMulti.run() != WL_CONNECTED) return;
  JsonDocument doc;
  doc["box_id"] = BOX_ID;
  doc["version"] = FIRMWARE_VER;
  doc["status"] = status;
  doc["error_code"] = errCode;
  doc["error_detail"] = errDetail;
  String payload;
  serializeJson(doc, payload);

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  String reportUrl = String(API_URL);
  int lastSlash = reportUrl.lastIndexOf("/api/");
  if (lastSlash != -1) {
    reportUrl = reportUrl.substring(0, lastSlash) + "/api/ota/report";
  } else {
    reportUrl = reportUrl + "/api/ota/report";
  }

  http.begin(client, reportUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(4000);
  int code = http.POST(payload);
  Serial.printf("[OTA Report] %s (ver %s) -> HTTP %d\n", status, FIRMWARE_VER, code);
  http.end();
}

// ─── Send to API ─────────────────────────────────────────────
void sendData(const SensorData& d) {
  if (wifiMulti.run() != WL_CONNECTED) return;

  JsonDocument doc;
  doc["box_id"]       = BOX_ID;
  doc["firmware_ver"] = FIRMWARE_VER;
  doc["temp"]         = d.temp;
  doc["rh"]           = d.rh;
  doc["pm25"]         = d.pm25;
  doc["tvoc"]         = d.tvoc;
  doc["eco2"]         = d.eco2;
  
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
    int errCode = httpUpdate.getLastError();
    String errStr = httpUpdate.getLastErrorString();
    Serial.printf("[Cloud OTA] Failed! Error (%d): %s\n", errCode, errStr.c_str());
    reportOtaStatus("FAILED", errCode, errStr.c_str());
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
