/**
 * Air Quality Monitor — ESP32-WROOM-32U
 * ======================================
 * Phase 1: Device Check  — ตรวจสอบอุปกรณ์ทุกชิ้น
 * Phase 2: Warm-up       — วอร์มเซนเซอร์ (จำค่าใน Flash NVS เปิดครั้งต่อไปไม่ต้องรอวอร์ม)
 * Phase 3: Running       — อ่านค่าเซนเซอร์ทุกตัวแบบ Realtime
 *
 * I2C Bus #1 (Hardware Wire):    CCS811  → GPIO 21(SDA), 22(SCL)
 * I2C Bus #2 (Software TwoWire): ADS1115 → GPIO 32(SDA), 13(SCL)
 * ⚠️  ต้อง init Bus #2 ก่อนเสมอ (CCS811 ดึง SDA ค้างตอน power-up)
 *
 * Serial Commands:
 *   's' : ข้ามการวอร์มทันที (Skip) และบันทึกลง Flash NVS
 *   'w' : บังคับวอร์มเซนเซอร์ใหม่อีกครั้ง (Force Warm-up)
 *   'c' : ล้างประวัติการวอร์มใน Flash NVS (Clear Memory)
 *   'r' : รีสตาร์ทบอร์ด ESP32
 */

#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_CCS811.h>
#include <DHT.h>
#include <Preferences.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ═══════════════════════════════════════════════════════
// WIRELESS (ANTENNA) CONFIGURATION
// ═══════════════════════════════════════════════════════
const char* WIFI_SSID     = "Urworld";
const char* WIFI_PASSWORD = "REDACTED_PASSWORD";
const char* API_URL       = "http://172.20.10.2:8000/api/ingest";
const char* BOX_ID        = "BOX-001";

// ═══════════════════════════════════════════════════════
// PIN DEFINITIONS
// ═══════════════════════════════════════════════════════
#define PIN_DHT22       27
#define PIN_PMS_RX      16
#define PIN_PMS_TX      17
#define PIN_PMS_SET     23
#define PIN_RELAY_IN1   25
#define PIN_RELAY_IN2   26
#define PIN_MQ2_ADC     33
#define PIN_MQ3_ADC     36
#define PIN_MQ8_ADC     34
#define PIN_MQ135_ADC   39

// I2C Buses
#define I2C1_SDA  21   // Bus #1: CCS811  (Hardware I2C)
#define I2C1_SCL  22
#define I2C2_SDA  32   // Bus #2: ADS1115 (Software I2C)
#define I2C2_SCL  13

// I2C Addresses
#define CCS811_ADDR   0x5B  // ADDR pin → HIGH
#define ADS1115_ADDR  0x48  // ADDR pin → GND

// ═══════════════════════════════════════════════════════
// WARM-UP TIMES (วินาที)
// ═══════════════════════════════════════════════════════
const uint32_t WARMUP_DHT22    = 2;
const uint32_t WARMUP_PMS5003  = 30;
const uint32_t WARMUP_CCS811   = 20 * 60;   // 20 นาที
const uint32_t WARMUP_MICS6814 = 120 * 60;  // 120 นาที
const uint32_t WARMUP_MQ       = 5 * 60;    // 5 นาที ต่อตัว

// ═══════════════════════════════════════════════════════
// DISPLAY MODE CONFIG
// ═══════════════════════════════════════════════════════
// 0 = plain text (Serial Monitor ปกติ ไม่ลายตา ไม่กระพริบ ไม่ปริ้นท์รหัส [16A)
// 1 = สี ANSI / อัพเดทที่เดิม (ต้องเปิด Terminal Mode ในโปรแกรม Serial Monitor)
#define USE_ANSI  1

#if USE_ANSI
  const String CLR_SCREEN = "\033[2J\033[H";
  const String CLR_LINE   = "\033[2K\r";
  const String G   = "\033[32m";
  const String Y   = "\033[33m";
  const String R   = "\033[31m";
  const String C   = "\033[36m";
  const String W   = "\033[97m";
  const String GR  = "\033[90m";
  const String RST = "\033[0m";
  const String B   = "\033[1m";
#else
  const String G="", Y="", R="", C="", W="", GR="", RST="", B="";
  const String CLR_SCREEN = "\n";
  const String CLR_LINE   = "";
#endif

// ═══════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════

// ── Sensor status ──────────────────────────────────────
struct SensorInfo {
  const char* name;
  const char* role;
  bool        found;
  bool        ready;
  uint32_t    warmupSec;
  uint32_t    startedAt;
  char        errMsg[48];
};

SensorInfo sensors[] = {
  { "DHT22",     "Temp/Humidity",       false, false, WARMUP_DHT22,    0, "" },
  { "PMS5003",   "Particle PM1/2.5/10", false, false, WARMUP_PMS5003,  0, "" },
  { "CCS811",    "eCO2/TVOC",           false, false, WARMUP_CCS811,   0, "" },
  { "ADS1115",   "External ADC",        false, false, 0,               0, "" },
  { "MiCS-6814", "CO/NO2/NH3",          false, false, WARMUP_MICS6814, 0, "" },
  { "MQ-2",      "Smoke/Flammable",     false, false, WARMUP_MQ,       0, "" },
  { "MQ-3",      "Alcohol",             false, false, WARMUP_MQ,       0, "" },
  { "MQ-8",      "Hydrogen",            false, false, WARMUP_MQ,       0, "" },
  { "MQ-135",    "Air Quality",         false, false, WARMUP_MQ,       0, "" },
};
const int NUM_SENSORS = sizeof(sensors) / sizeof(sensors[0]);

// ── Sensor readings ────────────────────────────────────
struct Readings {
  float    temp     = NAN;
  float    humidity = NAN;
  uint16_t eco2     = 0;
  uint16_t tvoc     = 0;
  float    co_mv    = 0;
  float    no2_mv   = 0;
  float    nh3_mv   = 0;
  uint16_t pm1      = 0;
  uint16_t pm25     = 0;
  uint16_t pm10     = 0;
  uint16_t mq2      = 0;
  uint16_t mq3      = 0;
  uint16_t mq8      = 0;
  uint16_t mq135    = 0;
};
Readings data;

// ── PMS5003 packet ─────────────────────────────────────
struct PMS_Data {
  uint16_t pm1;
  uint16_t pm25;
  uint16_t pm10;
  bool     valid;
};

// ── Clean Air Baseline (R0) ────────────────────────────
struct Baseline {
  bool  calibrated = false;
  float mq2_r0     = 0;
  float mq3_r0     = 0;
  float mq8_r0     = 0;
  float mq135_r0   = 0;
  float co_r0      = 0;
  float no2_r0     = 0;
  float nh3_r0     = 0;
};
Baseline baseline;

// ═══════════════════════════════════════════════════════
// OBJECTS & GLOBALS
// ═══════════════════════════════════════════════════════
TwoWire          I2C2 = TwoWire(1);
Adafruit_ADS1115 ads;
Adafruit_CCS811  ccs;
DHT              dht(PIN_DHT22, DHT22);
HardwareSerial   pmsSerial(2);
Preferences      prefs;

// ═══════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════
enum Phase { PHASE_CHECK, PHASE_WARMUP, PHASE_RUNNING, PHASE_CALIBRATE, PHASE_ERROR };
Phase currentPhase = PHASE_CHECK;

// ═══════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════

String fmt_time(uint32_t sec) {
  char buf[12];
  if (sec >= 3600) {
    snprintf(buf, sizeof(buf), "%02lu:%02lu:%02lu", sec / 3600, (sec % 3600) / 60, sec % 60);
  } else {
    snprintf(buf, sizeof(buf), "%02lu:%02lu", sec / 60, sec % 60);
  }
  return String(buf);
}

String progress_bar(uint32_t elapsed, uint32_t total) {
  int filled = (total == 0) ? 16 : min((int)((float)elapsed / total * 16.0f), 16);
  String bar = "[";
  for (int i = 0; i < 16; i++)
    bar += (i < filled) ? (G + String("#")) : (GR + String("-"));
  return bar + RST + "]";
}

bool i2c_ping(TwoWire &wire, uint8_t addr) {
  wire.beginTransmission(addr);
  return wire.endTransmission() == 0;
}

// ═══════════════════════════════════════════════════════
// PHASE 1 — DEVICE CHECK
// ═══════════════════════════════════════════════════════

void print_check(const char* name, bool ok, const char* detail) {
  String badge = ok ? (B + G + "  [ OK ]" + RST) : (B + R + "  [FAIL]" + RST);
  char buf[24];
  snprintf(buf, sizeof(buf), "  %-18s", name);
  Serial.print(badge);
  Serial.print(String(buf));
  Serial.println(GR + String(detail) + RST);
}

void decide_warmup_flow(); // Forward declaration

void run_device_check() {
  #if USE_ANSI
  Serial.print(CLR_SCREEN);
  #endif
  Serial.println(B + C +
    String("\n  ╔══════════════════════════════════════╗") +
    "\n  ║   AIR QUALITY MONITOR — v1.0         ║" +
    "\n  ║   Phase 1 : Device Check             ║" +
    "\n  ╚══════════════════════════════════════╝\n" + RST);

  bool all_ok = true;

  // ── DHT22 ────────────────────────────────────────────
  dht.begin();
  delay(1000);
  {
    bool ok = false;
    for (int retry = 0; retry < 3; retry++) {
      float t = dht.readTemperature();
      if (!isnan(t)) { ok = true; break; }
      delay(800);
    }
    sensors[0].found = ok;
    if (!ok) snprintf(sensors[0].errMsg, 48, "No response GPIO %d", PIN_DHT22);
    print_check("DHT22", ok, ok ? "GPIO 27 OK" : sensors[0].errMsg);
    all_ok &= ok;
  }

  // ── PMS5003 ──────────────────────────────────────────
  pmsSerial.begin(9600, SERIAL_8N1, PIN_PMS_RX, PIN_PMS_TX);
  pinMode(PIN_PMS_SET, OUTPUT);
  digitalWrite(PIN_PMS_SET, HIGH);
  delay(500);
  {
    uint32_t t0 = millis();
    bool got = false;
    while (millis() - t0 < 2000) {
      if (pmsSerial.available()) { got = true; break; }
    }
    sensors[1].found = got;
    if (!got) snprintf(sensors[1].errMsg, 48, "No UART GPIO %d/%d", PIN_PMS_RX, PIN_PMS_TX);
    print_check("PMS5003", got, got ? "UART2 GPIO 16/17 OK" : sensors[1].errMsg);
    all_ok &= got;
  }

  // ── ADS1115 — Bus #2 (⚠️ init FIRST!) ───────────────
  I2C2.begin(I2C2_SDA, I2C2_SCL);
  I2C2.setClock(100000);
  delay(50);
  {
    bool ok = i2c_ping(I2C2, ADS1115_ADDR);
    if (ok) ok = ads.begin(ADS1115_ADDR, &I2C2);
    sensors[3].found = ok;
    if (!ok) snprintf(sensors[3].errMsg, 48, "0x%02X not found Bus#2", ADS1115_ADDR);
    print_check("ADS1115", ok, ok ? "Bus#2 GPIO 32/13 OK" : sensors[3].errMsg);
    all_ok &= ok;
  }

  // ── CCS811 — Bus #1 (init AFTER ADS1115) ─────────────
  Wire.begin(I2C1_SDA, I2C1_SCL);
  Wire.setClock(100000);
  delay(100);
  {
    bool ok = i2c_ping(Wire, CCS811_ADDR);
    if (ok) ok = ccs.begin(CCS811_ADDR, &Wire);
    sensors[2].found = ok;
    if (!ok) snprintf(sensors[2].errMsg, 48, "0x%02X not found Bus#1", CCS811_ADDR);
    print_check("CCS811", ok, ok ? "Bus#1 GPIO 21/22 OK" : sensors[2].errMsg);
    all_ok &= ok;
  }

  // ── MiCS-6814 (via ADS1115) ──────────────────────────
  {
    bool ok = sensors[3].found;
    sensors[4].found = ok;
    print_check("MiCS-6814", ok, ok ? "via ADS1115 A0/A1/A2" : "requires ADS1115");
    all_ok &= ok;
  }

  // ── MQ Sensors ───────────────────────────────────────
  {
    const int   mqPins[]   = { PIN_MQ2_ADC, PIN_MQ3_ADC, PIN_MQ8_ADC, PIN_MQ135_ADC };
    const char* mqLabels[] = { "MQ-2", "MQ-3", "MQ-8", "MQ-135" };
    for (int i = 0; i < 4; i++) {
      int val = analogRead(mqPins[i]);
      bool ok = (val > 50 && val < 4090);
      sensors[5 + i].found = ok;
      char detail[40];
      snprintf(detail, sizeof(detail), "ADC=%d GPIO%d", val, mqPins[i]);
      print_check(mqLabels[i], ok, detail);
      all_ok &= ok;
    }
  }

  Serial.println();
  if (all_ok) {
    decide_warmup_flow();
  } else {
    Serial.println(B + Y + "  [WARNING] อุปกรณ์บางชิ้นไม่พร้อม — กำลังข้ามและเริ่มระบบต่อด้วยเซนเซอร์ที่พร้อมใช้งาน...\n" + RST);
    delay(1500);
    decide_warmup_flow();
  }
}

// ═══════════════════════════════════════════════════════
// WARM-UP MEMORY & FLOW DECISION (NVS Flash)
// ═══════════════════════════════════════════════════════
void decide_warmup_flow() {
  prefs.begin("airmon", false);
  bool previously_warmed = prefs.getBool("warmed", false);

  if (previously_warmed) {
    Serial.println(B + G + "  All devices OK!" + RST);
    Serial.println(B + C + "  ┌────────────────────────────────────────────────────────┐" + RST);
    Serial.println(B + C + "  │ [Flash NVS] เซนเซอร์เคยผ่านการวอร์มแล้ว                │" + RST);
    Serial.println(B + C + "  │ ข้ามการรอวอร์ม เข้าโหมดอ่านค่าทันทีใน 3 วินาที...      │" + RST);
    Serial.println(B + C + "  │                                                        │" + RST);
    Serial.println(B + C + "  │   กด 'w' + Enter : เพื่อบังคับวอร์มใหม่อีกครั้ง        │" + RST);
    Serial.println(B + C + "  │   กด 'c' + Enter : เพื่อล้างประวัติการวอร์ม            │" + RST);
    Serial.println(B + C + "  └────────────────────────────────────────────────────────┘" + RST);

    uint32_t t0 = millis();
    int last_sec = 4;
    bool force_warm = false;

    while (millis() - t0 < 3000) {
      int sec_left = 3 - (int)((millis() - t0) / 1000);
      if (sec_left != last_sec && sec_left > 0) {
        Serial.print("  Auto-starting Live Monitoring in " + String(sec_left) + "... \r");
        last_sec = sec_left;
      }
      if (Serial.available()) {
        char ch = Serial.read();
        while (Serial.available()) Serial.read(); // flush remaining
        if (ch == 'w' || ch == 'W') {
          force_warm = true;
          Serial.println("\n  >> ผู้ใช้เลือก [w]: บังคับเริ่มการวอร์มใหม่อีกครั้ง...\n");
          break;
        } else if (ch == 'c' || ch == 'C') {
          prefs.putBool("warmed", false);
          force_warm = true;
          Serial.println("\n  >> ผู้ใช้เลือก [c]: ล้างประวัติการวอร์มแล้ว เริ่มวอร์มใหม่...\n");
          break;
        }
      }
      delay(50);
    }

    if (!force_warm) {
      for (int i = 0; i < NUM_SENSORS; i++) {
        if (sensors[i].found) sensors[i].ready = true;
      }
      Serial.println("\n  >> ข้ามการรอวอร์มเรียบร้อย! เริ่มการอ่านค่าเซนเซอร์แบบ Realtime...\n");
      prefs.end();
      delay(800);
      currentPhase = PHASE_RUNNING;
      return;
    }
  } else {
    Serial.println(B + G + "  All devices OK — ตรวจพบเป็นการเปิดเครื่องครั้งแรก (เริ่มวอร์มเซนเซอร์)" + RST);
    Serial.println(GR + "  (เคล็ดลับ: พิมพ์ 's' + Enter ที่ Serial Monitor เพื่อข้ามการวอร์มได้ทุกเมื่อ)" + RST + "\n");
    delay(1200);
  }
  prefs.end();
  currentPhase = PHASE_WARMUP;
}

// ═══════════════════════════════════════════════════════
// PHASE 2 — WARM-UP
// ═══════════════════════════════════════════════════════

const int WARMUP_LINES = NUM_SENSORS + 8;
bool warmup_first = true;

void start_warmup() {
  uint32_t now = millis();
  for (int i = 0; i < NUM_SENSORS; i++) {
    sensors[i].startedAt = now;
    sensors[i].ready = (sensors[i].warmupSec == 0);
  }
}

bool all_ready() {
  for (int i = 0; i < NUM_SENSORS; i++)
    if (sensors[i].found && !sensors[i].ready) return false;
  return true;
}

void print_warmup_table(bool first_time) {
#if USE_ANSI
  if (first_time) {
    Serial.print(CLR_SCREEN);
  } else {
    Serial.print("\033[H");
  }

  uint32_t total_sec = (millis() - sensors[0].startedAt) / 1000;
  char hdr[10];
  snprintf(hdr, sizeof(hdr), "%02lu:%02lu", total_sec / 60, total_sec % 60);

  // Header (5 lines)
  Serial.println(CLR_LINE + B + C + "╔══════════════════════════════════════════════════════╗" + RST);
  Serial.print  (CLR_LINE + B + C + "║  WARM-UP STATUS   " + RST);
  Serial.println(W + B + String(hdr) + C + "                              ║" + RST);
  Serial.println(CLR_LINE + B + C + "╠═══════════════╦═══════╦══════════════════╦═══════════╣" + RST);
  Serial.println(CLR_LINE + GR + "  Sensor          Status  Progress           Time      " + RST);
  Serial.println(CLR_LINE + B + C + "╠═══════════════╬═══════╬══════════════════╬═══════════╣" + RST);

  // Sensor rows (NUM_SENSORS lines)
  String waiting_list = "";
  for (int i = 0; i < NUM_SENSORS; i++) {
    uint32_t elapsed = 0;
    String status_str, status_col, time_str;

    if (!sensors[i].found) {
      status_str = "SKIP "; status_col = GR; time_str = "  N/A    ";
    } else if (sensors[i].warmupSec == 0 || sensors[i].ready) {
      elapsed = sensors[i].warmupSec;
      sensors[i].ready = true;
      status_str = "READY"; status_col = G; time_str = "  DONE   ";
    } else {
      elapsed = min((millis() - sensors[i].startedAt) / 1000, sensors[i].warmupSec);
      if (elapsed >= sensors[i].warmupSec) {
        sensors[i].ready = true;
        status_str = "READY"; status_col = G; time_str = "  DONE   ";
      } else {
        uint32_t remaining = sensors[i].warmupSec - elapsed;
        status_str = "WARM "; status_col = Y;
        time_str = fmt_time(elapsed) + "/" + fmt_time(sensors[i].warmupSec);
        waiting_list += String(sensors[i].name) + "(" + fmt_time(remaining) + ") ";
      }
    }

    char row[20];
    snprintf(row, sizeof(row), "  %-14s", sensors[i].name);
    Serial.print(CLR_LINE + String(row));
    Serial.print("  " + status_col + B + status_str + RST + "  ");
    Serial.print(progress_bar(elapsed, sensors[i].warmupSec));
    Serial.println("  " + status_col + time_str + RST);
  }

  // Footer (1 line) + waiting (1 line) + hint (1 line) = 3 lines
  Serial.println(CLR_LINE + B + C + "╚═══════════════╩═══════╩══════════════════╩═══════════╝" + RST);
  if (waiting_list.length() > 0) {
    String msg = "  Waiting: " + waiting_list;
    if (msg.length() > 65) msg = msg.substring(0, 65) + "...";
    Serial.println(CLR_LINE + Y + msg + RST);
    Serial.println(CLR_LINE + GR + "  [พิมพ์ 's' + Enter เพื่อ SKIP ข้ามการวอร์มทันที]" + RST);
  } else {
    Serial.println(CLR_LINE + G + B + "  All sensors ready!                                  " + RST);
    Serial.println(CLR_LINE + "");
  }
  Serial.print("\033[J"); // Clear any leftover content below
#else
  // USE_ANSI == 0: Plain text mode (สะอาดตา ไม่รก ไม่ปริ้นท์รหัส [16A)
  uint32_t total_sec = (millis() - sensors[0].startedAt) / 1000;
  String waiting_list = "";
  int ready_cnt = 0;
  int total_cnt = 0;

  for (int i = 0; i < NUM_SENSORS; i++) {
    if (!sensors[i].found) continue;
    total_cnt++;
    uint32_t elapsed = min((millis() - sensors[i].startedAt) / 1000, sensors[i].warmupSec);
    if (sensors[i].warmupSec == 0 || elapsed >= sensors[i].warmupSec || sensors[i].ready) {
      sensors[i].ready = true;
      ready_cnt++;
    } else {
      uint32_t rem = sensors[i].warmupSec - elapsed;
      waiting_list += String(sensors[i].name) + ":" + fmt_time(rem) + " ";
    }
  }

  if (first_time) {
    Serial.println(F("\n========================================================"));
    Serial.println(F("  WARM-UP IN PROGRESS (กำลังวอร์มเซนเซอร์)"));
    Serial.println(F("  เคล็ดลับ: พิมพ์ 's' + Enter เพื่อข้ามการวอร์มได้ตลอดเวลา"));
    Serial.println(F("========================================================"));
  }

  Serial.print(F("[Warm-up "));
  Serial.print(fmt_time(total_sec));
  Serial.print(F("] พร้อมแล้ว: "));
  Serial.print(ready_cnt);
  Serial.print(F("/"));
  Serial.print(total_cnt);
  if (waiting_list.length() > 0) {
    Serial.print(F(" | รอ: "));
    Serial.print(waiting_list);
  }
  Serial.println(F(" | [ส่ง 's' เพื่อข้าม]"));
#endif
}

// ═══════════════════════════════════════════════════════
// PHASE 3 — RUNNING
// ═══════════════════════════════════════════════════════

// ── PMS5003 Parser ─────────────────────────────────────
PMS_Data read_pms() {
  PMS_Data r = {0, 0, 0, false};
  if (!pmsSerial.available()) return r;
  uint8_t buf[32];
  uint32_t t0 = millis();
  while (millis() - t0 < 800) {
    if (pmsSerial.available() >= 2) {
      if (pmsSerial.read() == 0x42 && pmsSerial.peek() == 0x4D) {
        pmsSerial.read(); // consume 0x4D
        buf[0] = 0x42; buf[1] = 0x4D;
        for (int i = 2; i < 32; i++) {
          while (!pmsSerial.available() && millis() - t0 < 800);
          buf[i] = pmsSerial.read();
        }
        // Checksum verify
        uint16_t sum = 0;
        for (int i = 0; i < 30; i++) sum += buf[i];
        uint16_t chk = ((uint16_t)buf[30] << 8) | buf[31];
        if (sum == chk) {
          r.pm1   = ((uint16_t)buf[10] << 8) | buf[11];
          r.pm25  = ((uint16_t)buf[12] << 8) | buf[13];
          r.pm10  = ((uint16_t)buf[14] << 8) | buf[15];
          r.valid = true;
        }
        break;
      }
    }
  }
  return r;
}

// ── Read All Sensors ────────────────────────────────────
void read_all_sensors() {
  // DHT22
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) data.temp     = t;
  if (!isnan(h)) data.humidity = h;

  // CCS811
  if (sensors[2].found && ccs.available() && !ccs.readData()) {
    data.eco2 = ccs.geteCO2();
    data.tvoc = ccs.getTVOC();
    
    // ส่งค่าชดเชยอุณหภูมิ/ความชื้นทุกๆ 60 วินาที (ไม่ส่งทุกวิ เพื่อป้องกันชิปรีเซ็ตการคำนวณ)
    static uint32_t last_env_update = 0;
    if (millis() - last_env_update >= 60000 && !isnan(data.temp) && !isnan(data.humidity)) {
      last_env_update = millis();
      ccs.setEnvironmentalData((uint8_t)data.humidity, data.temp);
    }
  }

  // ADS1115 → MiCS-6814
  if (sensors[3].found) {
    data.co_mv  = ads.computeVolts(ads.readADC_SingleEnded(0)) * 1000.0f;
    data.no2_mv = ads.computeVolts(ads.readADC_SingleEnded(1)) * 1000.0f;
    data.nh3_mv = ads.computeVolts(ads.readADC_SingleEnded(2)) * 1000.0f;
  }

  // PMS5003
  if (sensors[1].found) {
    PMS_Data pms = read_pms();
    if (pms.valid) {
      data.pm1  = pms.pm1;
      data.pm25 = pms.pm25;
      data.pm10 = pms.pm10;
    }
  }

  // MQ (raw ADC)
  data.mq2   = analogRead(PIN_MQ2_ADC);
  data.mq3   = analogRead(PIN_MQ3_ADC);
  data.mq8   = analogRead(PIN_MQ8_ADC);
  data.mq135 = analogRead(PIN_MQ135_ADC);
}

// ── Running Display ─────────────────────────────────────
const int RUNNING_LINES = 22;
bool running_first = true;

void print_row(const char* label, String value, const char* unit, String col = "") {
  if (col == "") col = W;
  char lbl[22];
  snprintf(lbl, sizeof(lbl), "  %-18s", label);
  Serial.print(CLR_LINE + GR + String(lbl) + RST);
  Serial.print(col + B + value + RST);
  Serial.println(GR + String("  ") + String(unit) + RST);
}

void print_sep() {
  Serial.println(CLR_LINE + GR + "  ──────────────────────────────────────────────" + RST);
}

void print_running_display() {
#if USE_ANSI
  if (running_first) {
    Serial.print(CLR_SCREEN);
    running_first = false;
  } else {
    Serial.print("\033[H");
  }

  uint32_t up = millis() / 1000;
  char ts[10];
  snprintf(ts, sizeof(ts), "%02lu:%02lu:%02lu", up / 3600, (up % 3600) / 60, up % 60);

  // Header (3 lines)
  Serial.println(CLR_LINE + B + C + "╔═══════════════════════════════════════════════════╗" + RST);
  if (baseline.calibrated) {
    Serial.print  (CLR_LINE + B + C + "║  AIR QUALITY MONITOR [" + G + "CALIBRATED" + C + "] " + RST);
    Serial.println(G + B + String(ts) + C + "      ║" + RST);
  } else {
    Serial.print  (CLR_LINE + B + C + "║  AIR QUALITY MONITOR  LIVE  " + RST);
    Serial.println(G + B + String(ts) + C + "              ║" + RST);
  }
  Serial.println(CLR_LINE + B + C + "╠═══════════════════════════════════════════════════╣" + RST);

  // Wireless Antenna
  if (WiFi.status() == WL_CONNECTED) {
    String sig = String(WiFi.RSSI()) + " dBm";
    print_row("Antenna (WiFi)", "ONLINE", sig.c_str(), G);
  } else {
    print_row("Antenna (WiFi)", "CONNECTING", "...", Y);
  }
  print_sep();

  // DHT22 (2 rows + sep)
  print_row("Temperature",  isnan(data.temp)     ? "---" : String(data.temp,     1), "°C",  (!isnan(data.temp) && data.temp > 35) ? R : G);
  print_row("Humidity",     isnan(data.humidity) ? "---" : String(data.humidity, 1), "%RH", W);
  print_sep();

  // CCS811 (2 rows + sep)
  bool ccs_has_reading = (data.eco2 >= 400);
  print_row("eCO2 (CCS811)", ccs_has_reading ? String(data.eco2) : "warming...", "ppm",
            data.eco2 > 1000 ? R : data.eco2 > 600 ? Y : G);
  print_row("TVOC (CCS811)", ccs_has_reading ? String(data.tvoc) : "warming...", "ppb", W);
  print_sep();

  // MiCS-6814 (3 rows + sep)
  if (baseline.calibrated && baseline.co_r0 > 0) {
    float r_co  = data.co_mv  / baseline.co_r0;
    float r_no2 = data.no2_mv / baseline.no2_r0;
    float r_nh3 = data.nh3_mv / baseline.nh3_r0;
    char v_co[24], v_no2[24], v_nh3[24];
    snprintf(v_co,  sizeof(v_co),  "%.0f (%0.2fx)", data.co_mv,  r_co);
    snprintf(v_no2, sizeof(v_no2), "%.0f (%0.2fx)", data.no2_mv, r_no2);
    snprintf(v_nh3, sizeof(v_nh3), "%.0f (%0.2fx)", data.nh3_mv, r_nh3);
    print_row("CO   (MiCS-6814)", String(v_co),  "mV (Rs/R0)", (r_co > 1.3f) ? Y : W);
    print_row("NO2  (MiCS-6814)", String(v_no2), "mV (Rs/R0)", (r_no2 > 1.3f) ? Y : W);
    print_row("NH3  (MiCS-6814)", String(v_nh3), "mV (Rs/R0)", (r_nh3 > 1.3f) ? Y : W);
  } else {
    print_row("CO   (MiCS-6814)", String(data.co_mv,  0), "mV raw", W);
    print_row("NO2  (MiCS-6814)", String(data.no2_mv, 0), "mV raw", W);
    print_row("NH3  (MiCS-6814)", String(data.nh3_mv, 0), "mV raw", W);
  }
  print_sep();

  // PMS5003 (3 rows + sep)
  print_row("PM 1.0",  String(data.pm1),  "ug/m3", W);
  print_row("PM 2.5",  String(data.pm25), "ug/m3", data.pm25 > 35 ? R : data.pm25 > 12 ? Y : G);
  print_row("PM 10",   String(data.pm10), "ug/m3", W);
  print_sep();

  // MQ sensors (4 rows)
  if (baseline.calibrated && baseline.mq2_r0 > 0) {
    float r_mq2   = (float)data.mq2   / baseline.mq2_r0;
    float r_mq3   = (float)data.mq3   / baseline.mq3_r0;
    float r_mq8   = (float)data.mq8   / baseline.mq8_r0;
    float r_mq135 = (float)data.mq135 / baseline.mq135_r0;
    char v2[24], v3[24], v8[24], v135[24];
    snprintf(v2,   sizeof(v2),   "%d (%0.2fx)", data.mq2,   r_mq2);
    snprintf(v3,   sizeof(v3),   "%d (%0.2fx)", data.mq3,   r_mq3);
    snprintf(v8,   sizeof(v8),   "%d (%0.2fx)", data.mq8,   r_mq8);
    snprintf(v135, sizeof(v135), "%d (%0.2fx)", data.mq135, r_mq135);
    print_row("MQ-2  (Smoke)",   String(v2),   "ADC (Rs/R0)", (r_mq2 > 1.3f) ? R : W);
    print_row("MQ-3  (Alcohol)", String(v3),   "ADC (Rs/R0)", (r_mq3 > 1.3f) ? R : W);
    print_row("MQ-8  (H2)",      String(v8),   "ADC (Rs/R0)", (r_mq8 > 1.3f) ? R : W);
    print_row("MQ-135 (AirQ)",   String(v135), "ADC (Rs/R0)", (r_mq135 > 1.3f) ? R : W);
  } else {
    print_row("MQ-2  (Smoke)",   String(data.mq2),   "ADC raw", W);
    print_row("MQ-3  (Alcohol)", String(data.mq3),   "ADC raw", W);
    print_row("MQ-8  (H2)",      String(data.mq8),   "ADC raw", W);
    print_row("MQ-135 (AirQ)",   String(data.mq135), "ADC raw", W);
  }

  // Footer (2 lines)
  Serial.println(CLR_LINE + B + C + "╚═══════════════════════════════════════════════════╝" + RST);
  Serial.println(CLR_LINE + GR + "  Update: 1s | 'b':Calib R0 | 'w':re-warm | 'c':clear mem" + RST);
  Serial.print("\033[J"); // Clear below
#else
  // USE_ANSI == 0: Plain text format
  uint32_t up = millis() / 1000;
  char ts[10];
  snprintf(ts, sizeof(ts), "%02lu:%02lu:%02lu", up / 3600, (up % 3600) / 60, up % 60);

  Serial.println(F("---------------------------------------------------------"));
  Serial.print(F("[LIVE ")); Serial.print(ts);
  if (baseline.calibrated) Serial.print(F(" CALIBRATED"));
  Serial.println(F("]"));

  // DHT
  Serial.print(F("  DHT22:    Temp="));
  if (isnan(data.temp)) Serial.print(F("---")); else Serial.print(data.temp, 1);
  Serial.print(F(" C, Hum="));
  if (isnan(data.humidity)) Serial.print(F("---")); else Serial.print(data.humidity, 1);
  Serial.println(F(" %RH"));

  // CCS811
  Serial.print(F("  CCS811:   eCO2=")); Serial.print(data.eco2);
  Serial.print(F(" ppm, TVOC=")); Serial.print(data.tvoc); Serial.println(F(" ppb"));

  // PMS5003
  Serial.print(F("  PMS5003:  PM1.0=")); Serial.print(data.pm1);
  Serial.print(F(" | PM2.5=")); Serial.print(data.pm25);
  Serial.print(F(" | PM10=")); Serial.print(data.pm10); Serial.println(F(" ug/m3"));

  // MiCS-6814
  Serial.print(F("  MiCS6814: CO=")); Serial.print(data.co_mv, 0);
  Serial.print(F(" mV, NO2=")); Serial.print(data.no2_mv, 0);
  Serial.print(F(" mV, NH3=")); Serial.print(data.nh3_mv, 0); Serial.println(F(" mV"));

  // MQ
  Serial.print(F("  MQ-ADC:   MQ2=")); Serial.print(data.mq2);
  Serial.print(F(" | MQ3=")); Serial.print(data.mq3);
  Serial.print(F(" | MQ8=")); Serial.print(data.mq8);
  Serial.print(F(" | MQ135=")); Serial.println(data.mq135);
  Serial.println(F("  [คำสั่ง: 'b' = Calib R0, 'w' = วอร์มใหม่, 'c' = ล้าง Flash]"));
#endif
}

// ═══════════════════════════════════════════════════════
// CLEAN AIR BASELINE (R0) FUNCTIONS
// ═══════════════════════════════════════════════════════
const int CALIB_SAMPLES = 30; // เก็บตัวอย่าง 30 วินาที
int calib_index = 0;
float calib_mq2_sum = 0, calib_mq3_sum = 0, calib_mq8_sum = 0, calib_mq135_sum = 0;
float calib_co_sum = 0, calib_no2_sum = 0, calib_nh3_sum = 0;

void load_baseline() {
  prefs.begin("airmon", true);
  baseline.calibrated = prefs.getBool("calib", false);
  if (baseline.calibrated) {
    baseline.mq2_r0   = prefs.getFloat("mq2_r0", 0);
    baseline.mq3_r0   = prefs.getFloat("mq3_r0", 0);
    baseline.mq8_r0   = prefs.getFloat("mq8_r0", 0);
    baseline.mq135_r0 = prefs.getFloat("mq135_r0", 0);
    baseline.co_r0    = prefs.getFloat("co_r0", 0);
    baseline.no2_r0   = prefs.getFloat("no2_r0", 0);
    baseline.nh3_r0   = prefs.getFloat("nh3_r0", 0);
  }
  prefs.end();
}

void save_baseline() {
  prefs.begin("airmon", false);
  prefs.putBool("calib", true);
  prefs.putFloat("mq2_r0",   baseline.mq2_r0);
  prefs.putFloat("mq3_r0",   baseline.mq3_r0);
  prefs.putFloat("mq8_r0",   baseline.mq8_r0);
  prefs.putFloat("mq135_r0", baseline.mq135_r0);
  prefs.putFloat("co_r0",    baseline.co_r0);
  prefs.putFloat("no2_r0",   baseline.no2_r0);
  prefs.putFloat("nh3_r0",   baseline.nh3_r0);
  prefs.end();
}

void start_calibration() {
  calib_index = 0;
  calib_mq2_sum = calib_mq3_sum = calib_mq8_sum = calib_mq135_sum = 0;
  calib_co_sum = calib_no2_sum = calib_nh3_sum = 0;
  #if USE_ANSI
  Serial.print(CLR_SCREEN);
  #endif
}

void print_calibration_screen() {
#if USE_ANSI
  Serial.print("\033[H");
  Serial.println(CLR_LINE + B + C + "╔═══════════════════════════════════════════════════╗" + RST);
  Serial.println(CLR_LINE + B + C + "║  CLEAN AIR BASELINE CALIBRATION (R0)              ║" + RST);
  Serial.println(CLR_LINE + B + C + "╠═══════════════════════════════════════════════════╣" + RST);
  Serial.println(CLR_LINE + W     + "  วางกล่องไว้ในอากาศบริสุทธิ์เพื่อตั้งจุดอ้างอิง        " + RST);

  int pct = (calib_index * 100) / CALIB_SAMPLES;
  String bar = progress_bar(calib_index, CALIB_SAMPLES);
  Serial.println(CLR_LINE + "  Progress: " + bar + " " + G + B + String(pct) + "%" + RST + " (" + String(CALIB_SAMPLES - calib_index) + "s left)");
  Serial.println(CLR_LINE + GR    + "  ──────────────────────────────────────────────" + RST);

  float a_mq2   = calib_index > 0 ? (calib_mq2_sum / calib_index) : data.mq2;
  float a_mq3   = calib_index > 0 ? (calib_mq3_sum / calib_index) : data.mq3;
  float a_mq8   = calib_index > 0 ? (calib_mq8_sum / calib_index) : data.mq8;
  float a_mq135 = calib_index > 0 ? (calib_mq135_sum / calib_index) : data.mq135;
  float a_co    = calib_index > 0 ? (calib_co_sum / calib_index) : data.co_mv;
  float a_no2   = calib_index > 0 ? (calib_no2_sum / calib_index) : data.no2_mv;
  float a_nh3   = calib_index > 0 ? (calib_nh3_sum / calib_index) : data.nh3_mv;

  char b1[48], b2[48], b3[48], b4[48], b5[48], b6[48], b7[48];
  snprintf(b1, sizeof(b1), "  MQ-2   (Smoke)   Avg: %4.0f ADC", a_mq2);
  snprintf(b2, sizeof(b2), "  MQ-3   (Alcohol) Avg: %4.0f ADC", a_mq3);
  snprintf(b3, sizeof(b3), "  MQ-8   (H2)      Avg: %4.0f ADC", a_mq8);
  snprintf(b4, sizeof(b4), "  MQ-135 (AirQ)    Avg: %4.0f ADC", a_mq135);
  snprintf(b5, sizeof(b5), "  MiCS   (CO)      Avg: %4.0f mV", a_co);
  snprintf(b6, sizeof(b6), "  MiCS   (NO2)     Avg: %4.0f mV", a_no2);
  snprintf(b7, sizeof(b7), "  MiCS   (NH3)     Avg: %4.0f mV", a_nh3);

  Serial.println(CLR_LINE + W + String(b1) + RST);
  Serial.println(CLR_LINE + W + String(b2) + RST);
  Serial.println(CLR_LINE + W + String(b3) + RST);
  Serial.println(CLR_LINE + W + String(b4) + RST);
  Serial.println(CLR_LINE + GR + "  ──────────────────────────────────────────────" + RST);
  Serial.println(CLR_LINE + W + String(b5) + RST);
  Serial.println(CLR_LINE + W + String(b6) + RST);
  Serial.println(CLR_LINE + W + String(b7) + RST);
  Serial.println(CLR_LINE + B + C + "╚═══════════════════════════════════════════════════╝" + RST);
  Serial.println(CLR_LINE + GR + "  กำลังเฉลี่ยค่า 30 วินาที... บันทึกลง Flash อัตโนมัติ" + RST);
  Serial.print("\033[J");
#else
  Serial.print(F("[CALIBRATING Baseline] "));
  Serial.print(calib_index);
  Serial.print(F("/"));
  Serial.print(CALIB_SAMPLES);
  Serial.print(F(" | MQ2=")); Serial.print(data.mq2);
  Serial.print(F(" MQ3=")); Serial.print(data.mq3);
  Serial.print(F(" CO=")); Serial.print(data.co_mv, 0);
  Serial.println(F(" mV"));
#endif
}

// ═══════════════════════════════════════════════════════
// WIRELESS (ANTENNA) TRANSMISSION
// ═══════════════════════════════════════════════════════

void init_wifi() {
  Serial.println(B + C + "\n╔═══════════════════════════════════════════════════╗" + RST);
  Serial.println(B + C + "║  CONNECTING TO 2.4GHz WIRELESS NETWORK (ANTENNA)  ║" + RST);
  Serial.println(B + C + "╚═══════════════════════════════════════════════════╝" + RST);
  Serial.print(F("  >> SSID   : ")); Serial.println(WIFI_SSID);
  Serial.print(F("  >> Target : ")); Serial.println(API_URL);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 8000) {
    delay(400);
    Serial.print(F("."));
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(B + G + "\n  [WiFi OK] เชื่อมต่อสำเร็จผ่านเสาอากาศ!" + RST);
    Serial.print(F("  [WiFi] ESP32 IP : ")); Serial.println(WiFi.localIP());
    Serial.print(F("  [WiFi] Signal   : ")); Serial.print(WiFi.RSSI()); Serial.println(F(" dBm"));
  } else {
    Serial.println(B + Y + "\n  [WiFi] ยังเชื่อมต่อไม่สำเร็จ (จะลองใหม่อัตโนมัติในพื้นหลัง)" + RST);
  }
  delay(1000);
}

void send_data_wifi() {
  static uint32_t last_wifi_post = 0;
  if (millis() - last_wifi_post < 2000) return; // ส่งขึ้นเว็บทุก 2 วินาที
  last_wifi_post = millis();

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(1500);

  JsonDocument doc;
  doc["box_id"] = BOX_ID;
  if (!isnan(data.temp))     doc["temp"] = round(data.temp * 10.0f) / 10.0f;
  if (!isnan(data.humidity)) doc["rh"]   = round(data.humidity * 10.0f) / 10.0f;
  doc["pm25"] = data.pm25;

  if (data.eco2 >= 400) {
    doc["eco2"] = data.eco2;
    doc["tvoc"] = data.tvoc;
  } else {
    doc["eco2"] = 400;
    doc["tvoc"] = 0;
  }

  doc["mq2"]   = data.mq2;
  doc["mq3"]   = data.mq3;
  doc["mq135"] = data.mq135;
  doc["mq8"]   = data.mq8;

  doc["mics_co"] = (int)round(data.co_mv);
  doc["no2"]     = (int)round(data.no2_mv);
  doc["nh3"]     = (int)round(data.nh3_mv);

  String payload;
  serializeJson(doc, payload);

  http.POST(payload);
  http.end();
}

// ═══════════════════════════════════════════════════════
// SETUP & LOOP
// ═══════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(1000);
  while (!Serial && millis() < 3000);
  delay(500);

  // Relay OFF by default
  pinMode(PIN_RELAY_IN1, OUTPUT); digitalWrite(PIN_RELAY_IN1, LOW);
  pinMode(PIN_RELAY_IN2, OUTPUT); digitalWrite(PIN_RELAY_IN2, LOW);

  // โหลดค่า Clean Air Baseline (R0) จาก Flash ถ้าเคย Calibrate ไว้
  load_baseline();

  run_device_check();

  // เชื่อมต่อ WiFi สำหรับเสาอากาศ
  init_wifi();
}

void loop() {
  static uint32_t last_update = 0;

  switch (currentPhase) {

    // ── WARM-UP ──────────────────────────────────────
    case PHASE_WARMUP: {
      // ฟังคำสั่งจาก Serial (เช่น ผู้ใช้พิมพ์ 's' เพื่อข้ามการวอร์ม)
      if (Serial.available()) {
        char ch = Serial.read();
        while (Serial.available()) Serial.read(); // flush
        if (ch == 's' || ch == 'S' || ch == '\n' || ch == '\r') {
          Serial.println(B + Y + "\n\n  >> [SKIP] ข้ามการวอร์มตามคำสั่งผู้ใช้! บันทึกลง Flash NVS..." + RST);
          prefs.begin("airmon", false);
          prefs.putBool("warmed", true);
          prefs.end();

          for (int i = 0; i < NUM_SENSORS; i++) {
            if (sensors[i].found) sensors[i].ready = true;
          }
          delay(800);
          #if USE_ANSI
          Serial.print(CLR_SCREEN);
          #endif
          Serial.println(B + G + "  บันทึกเรียบร้อย! ครั้งหน้าเปิดเครื่องจะข้ามการวอร์มให้อัตโนมัติ\n" + RST);
          delay(1000);
          currentPhase = PHASE_RUNNING;
          break;
        } else if (ch == 'c' || ch == 'C') {
          prefs.begin("airmon", false);
          prefs.putBool("warmed", false);
          prefs.putBool("calib", false);
          prefs.end();
          baseline.calibrated = false;
          Serial.println(B + Y + "\n  >> ล้างประวัติการวอร์มและค่า Calibrate ใน Flash เรียบร้อย" + RST);
        }
      }

      if (warmup_first) {
        start_warmup();
        #if USE_ANSI
        Serial.print(CLR_SCREEN);
        #endif
        warmup_first = false;
        print_warmup_table(true);
      }

      #if USE_ANSI
      const uint32_t WARMUP_INTERVAL = 1000;
      #else
      const uint32_t WARMUP_INTERVAL = 3000;
      #endif

      if (millis() - last_update >= WARMUP_INTERVAL) {
        last_update = millis();
        print_warmup_table(false);
        if (all_ready()) {
          // วอร์มเสร็จตามเวลาธรรมชาติ -> บันทึกลง Flash
          prefs.begin("airmon", false);
          prefs.putBool("warmed", true);
          prefs.end();

          delay(800);
          #if USE_ANSI
          Serial.print(CLR_SCREEN);
          #endif
          Serial.println(B + G + "\n  ALL SENSORS READY & SAVED! เริ่มต้นการอ่านค่าแบบ Realtime...\n" + RST);
          delay(1200);
          currentPhase = PHASE_RUNNING;
        }
      }
      break;
    }

    // ── RUNNING ──────────────────────────────────────
    case PHASE_RUNNING: {
      // ฟังคำสั่ง Serial ระหว่างอ่านค่า
      if (Serial.available()) {
        char ch = Serial.read();
        while (Serial.available()) Serial.read(); // flush
        if (ch == 'b' || ch == 'B') {
          Serial.println(B + Y + "\n  >> เริ่มต้นกระบวนการ Calibrate Clean Air Baseline (R0)..." + RST);
          start_calibration();
          currentPhase = PHASE_CALIBRATE;
          break;
        } else if (ch == 'w' || ch == 'W') {
          Serial.println(B + Y + "\n  >> ผู้ใช้สั่งบังคับวอร์มเซนเซอร์ใหม่..." + RST);
          warmup_first = true;
          running_first = true;
          currentPhase = PHASE_WARMUP;
          break;
        } else if (ch == 'c' || ch == 'C') {
          prefs.begin("airmon", false);
          prefs.putBool("warmed", false);
          prefs.putBool("calib", false);
          prefs.end();
          baseline.calibrated = false;
          Serial.println(B + Y + "\n  >> ล้างประวัติการวอร์มและค่า Calibrate R0 ใน Flash เรียบร้อย" + RST);
        } else if (ch == 'r' || ch == 'R') {
          Serial.println("\n  >> สั่งรีสตาร์ท ESP32...");
          delay(500);
          ESP.restart();
        } else if (ch == '?' || ch == 'h' || ch == 'H') {
          Serial.println(GR + "\n  [คำสั่ง] 'b' = Calibrate R0 | 'w' = วอร์มใหม่ | 'c' = ล้าง Flash | 'r' = รีสตาร์ท" + RST);
        }
      }

      #if USE_ANSI
      const uint32_t RUN_INTERVAL = 1000;
      #else
      const uint32_t RUN_INTERVAL = 2000;
      #endif

      if (millis() - last_update >= RUN_INTERVAL) {
        last_update = millis();
        read_all_sensors();
        send_data_wifi();
        print_running_display();
      }
      break;
    }

    // ── CALIBRATION ──────────────────────────────────
    case PHASE_CALIBRATE: {
      if (millis() - last_update >= 1000) {
        last_update = millis();
        read_all_sensors();
        calib_mq2_sum   += data.mq2;
        calib_mq3_sum   += data.mq3;
        calib_mq8_sum   += data.mq8;
        calib_mq135_sum += data.mq135;
        calib_co_sum    += data.co_mv;
        calib_no2_sum   += data.no2_mv;
        calib_nh3_sum   += data.nh3_mv;
        calib_index++;

        print_calibration_screen();

        if (calib_index >= CALIB_SAMPLES) {
          baseline.calibrated = true;
          baseline.mq2_r0   = calib_mq2_sum   / CALIB_SAMPLES;
          baseline.mq3_r0   = calib_mq3_sum   / CALIB_SAMPLES;
          baseline.mq8_r0   = calib_mq8_sum   / CALIB_SAMPLES;
          baseline.mq135_r0 = calib_mq135_sum / CALIB_SAMPLES;
          baseline.co_r0    = calib_co_sum    / CALIB_SAMPLES;
          baseline.no2_r0   = calib_no2_sum   / CALIB_SAMPLES;
          baseline.nh3_r0   = calib_nh3_sum   / CALIB_SAMPLES;
          save_baseline();

          delay(800);
          #if USE_ANSI
          Serial.print(CLR_SCREEN);
          #endif
          Serial.println(B + G + "\n  [CALIBRATED & SAVED TO FLASH!] บันทึก Clean Air Baseline สำเร็จ!\n" + RST);
          delay(1500);
          running_first = true;
          currentPhase = PHASE_RUNNING;
        }
      }
      break;
    }

    // ── ERROR ────────────────────────────────────────
    case PHASE_ERROR: {
      if (millis() - last_update >= 3000) {
        last_update = millis();
        Serial.println(R + B + "  [HALTED] Fix wiring and press RST." + RST);
      }
      break;
    }

    default:
      break;
  }
}
