/**
 * E-Nose AQM -- Real-time monitor (prototype relay circuit)
 *
 * Pin map
 *   ADS1115 + CCS811 : SDA=21, SCL=22 (Wire0)
 *   DHT22   : GPIO 27
 *   PMS5003 : RX/TX/SET = 16/17/23
 *   MQ      : 33/36/34/39
 *   Relays  : intake/exhaust = 25/26 (active LOW)
 *
 * Serial Monitor: 115200 baud. A human-readable report is printed every 2 seconds.
 */

#include <Adafruit_ADS1X15.h>
#include <Adafruit_CCS811.h>
#include <DHT.h>
#include <WiFi.h>
#include <Wire.h>

#include "secrets.h"

// -----------------------------------------------------------------------------
// Pin assignments
// -----------------------------------------------------------------------------

constexpr uint8_t DHT_PIN = 27;

constexpr uint8_t MQ2_PIN = 33;
constexpr uint8_t MQ3_PIN = 36;
constexpr uint8_t MQ8_PIN = 34;
constexpr uint8_t MQ135_PIN = 39;

constexpr uint8_t RELAY_INTAKE = 25;
constexpr uint8_t RELAY_EXHAUST = 26;

constexpr uint8_t PMS_SET = 23;
constexpr uint8_t PMS_RX = 16;
constexpr uint8_t PMS_TX = 17;

constexpr uint8_t ADS_SDA_PIN = 21;
constexpr uint8_t ADS_SCL_PIN = 22;

// The 2-channel prototype relay module is active LOW.
constexpr uint8_t RELAY_ON = LOW;
constexpr uint8_t RELAY_OFF = HIGH;

// -----------------------------------------------------------------------------
// Timing configuration
// -----------------------------------------------------------------------------

constexpr uint32_t DHT_READ_INTERVAL_MS = 2000;
constexpr uint32_t ADC_READ_INTERVAL_MS = 1000;
constexpr uint32_t REPORT_INTERVAL_MS = 2000;
constexpr uint32_t WIFI_RETRY_INTERVAL_MS = 15000;
constexpr uint32_t I2C_RETRY_INTERVAL_MS = 30000;
constexpr uint32_t STALE_TIMEOUT_MS = 15000;

constexpr uint32_t CCS_RUN_IN_MS = 20UL * 60UL * 1000UL;
constexpr uint32_t MICS_WARMUP_MS = 2UL * 60UL * 60UL * 1000UL;
constexpr uint32_t MQ_WARMUP_MS = 24UL * 60UL * 60UL * 1000UL;

// -----------------------------------------------------------------------------
// Hardware instances and runtime state
// -----------------------------------------------------------------------------

DHT dht(DHT_PIN, DHT22);
Adafruit_CCS811 ccs;
Adafruit_ADS1115 ads;
HardwareSerial pmsSerial(2);

struct SensorState {
  bool valid = false;
  uint32_t lastGoodMs = 0;
  uint32_t errorCount = 0;
};

SensorState dhtState;
SensorState ccsState;
SensorState adsState;
SensorState pmsState;

bool ccsFound = false;
bool adsFound = false;
bool fansOn = true;

uint32_t bootAtMs = 0;
uint32_t lastDhtReadMs = 0;
uint32_t lastAdcReadMs = 0;
uint32_t lastReportMs = 0;
uint32_t lastWifiAttemptMs = 0;
uint32_t lastI2cAttemptMs = 0;

float temperatureC = NAN;
float humidityPct = NAN;
float micsCoV = NAN;
float micsNo2V = NAN;
float micsNh3V = NAN;

uint16_t eco2Ppm = 0;
uint16_t tvocPpb = 0;

int16_t micsCoRaw = 0;
int16_t micsNo2Raw = 0;
int16_t micsNh3Raw = 0;

uint16_t mq2Raw = 0;
uint16_t mq3Raw = 0;
uint16_t mq8Raw = 0;
uint16_t mq135Raw = 0;

uint32_t mq2mV = 0;
uint32_t mq3mV = 0;
uint32_t mq8mV = 0;
uint32_t mq135mV = 0;

uint16_t pm1 = 0;
uint16_t pm25 = 0;
uint16_t pm10 = 0;

// PMS5003 sends a 32-byte frame. This buffer lets us parse it without a
// blocking readUntil() call.
uint8_t pmsFrame[32];
uint8_t pmsFrameIndex = 0;
uint32_t pmsChecksumErrors = 0;

// -----------------------------------------------------------------------------
// General helpers
// -----------------------------------------------------------------------------

bool isDue(uint32_t now, uint32_t &last, uint32_t interval) {
  if (now - last < interval) return false;
  last = now;
  return true;
}

bool isFresh(const SensorState &state, uint32_t now) {
  return state.valid && (now - state.lastGoodMs <= STALE_TIMEOUT_MS);
}

const char *sensorStatus(const SensorState &state, uint32_t now) {
  if (!state.valid) return "NO_DATA";
  return isFresh(state, now) ? "OK" : "STALE";
}

bool isWarmingUp(uint32_t now, uint32_t durationMs) {
  return now - bootAtMs < durationMs;
}

// -----------------------------------------------------------------------------
// Fan and Wi-Fi control
// -----------------------------------------------------------------------------

void setFans(bool enabled) {
  fansOn = enabled;
  digitalWrite(RELAY_INTAKE, enabled ? RELAY_ON : RELAY_OFF);
  digitalWrite(RELAY_EXHAUST, enabled ? RELAY_ON : RELAY_OFF);
}

void startWiFi() {
  if (strlen(WIFI_SSID) == 0) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiAttemptMs = millis();
}

void maintainWiFi(uint32_t now) {
  if (WiFi.status() != WL_CONNECTED &&
      now - lastWifiAttemptMs >= WIFI_RETRY_INTERVAL_MS) {
    startWiFi();
  }
}

// -----------------------------------------------------------------------------
// Sensor initialisation and reads
// -----------------------------------------------------------------------------

void scanCcsI2cBus() {
  uint8_t deviceCount = 0;

  Serial.println("Scanning shared I2C bus (Wire0, SDA21/SCL22)...");

  for (uint8_t address = 0x08; address < 0x78; ++address) {
    Wire.beginTransmission(address);
    const uint8_t result = Wire.endTransmission();

    if (result == 0) {
      Serial.printf("  I2C device found at 0x%02X", address);
      if (address == 0x5A) Serial.print("  (expected CCS811 address)");
      if (address == 0x5B) Serial.print("  (alternate CCS811 address)");
      Serial.println();
      deviceCount++;
    }
  }

  if (deviceCount == 0) {
    Serial.println("  No I2C device found on Wire0.");
  }
}

void initialiseI2cSensors(uint32_t now) {
  lastI2cAttemptMs = now;

  if (!adsFound && (adsFound = ads.begin(0x48, &Wire))) {
    ads.setGain(GAIN_ONE);
    Serial.println("ADS1115 detected");
  }

  if (!ccsFound && (ccsFound = ccs.begin(0x5A, &Wire))) {
    Serial.println("CCS811 detected");
  }
}

uint16_t averageRawAdc(uint8_t pin) {
  constexpr uint8_t SAMPLE_COUNT = 8;
  uint32_t total = 0;

  for (uint8_t i = 0; i < SAMPLE_COUNT; ++i) total += analogRead(pin);
  return total / SAMPLE_COUNT;
}

uint32_t averageMilliVolts(uint8_t pin) {
  constexpr uint8_t SAMPLE_COUNT = 8;
  uint32_t total = 0;

  for (uint8_t i = 0; i < SAMPLE_COUNT; ++i) {
    total += analogReadMilliVolts(pin);
  }
  return total / SAMPLE_COUNT;
}

void readDht(uint32_t now) {
  temperatureC = dht.readTemperature();
  humidityPct = dht.readHumidity();

  if (isnan(temperatureC) || isnan(humidityPct)) {
    dhtState.errorCount++;
    return;
  }

  dhtState.valid = true;
  dhtState.lastGoodMs = now;
}

void readMqSensors() {
  mq2Raw = averageRawAdc(MQ2_PIN);
  mq2mV = averageMilliVolts(MQ2_PIN);

  mq3Raw = averageRawAdc(MQ3_PIN);
  mq3mV = averageMilliVolts(MQ3_PIN);

  mq8Raw = averageRawAdc(MQ8_PIN);
  mq8mV = averageMilliVolts(MQ8_PIN);

  mq135Raw = averageRawAdc(MQ135_PIN);
  mq135mV = averageMilliVolts(MQ135_PIN);
}

void readAds(uint32_t now) {
  if (!adsFound) return;

  micsCoRaw = ads.readADC_SingleEnded(0);
  micsNo2Raw = ads.readADC_SingleEnded(1);
  micsNh3Raw = ads.readADC_SingleEnded(2);

  micsCoV = ads.computeVolts(micsCoRaw);
  micsNo2V = ads.computeVolts(micsNo2Raw);
  micsNh3V = ads.computeVolts(micsNh3Raw);

  adsState.valid = true;
  adsState.lastGoodMs = now;
}

void readCcs(uint32_t now) {
  if (!ccsFound || !ccs.available()) return;

  if (ccs.readData()) {
    ccsState.errorCount++;
    return;
  }

  eco2Ppm = ccs.geteCO2();
  tvocPpb = ccs.getTVOC();
  ccsState.valid = true;
  ccsState.lastGoodMs = now;
}

// -----------------------------------------------------------------------------
// PMS5003 non-blocking frame parser
// -----------------------------------------------------------------------------

uint16_t readBigEndian16(uint8_t index) {
  return (uint16_t(pmsFrame[index]) << 8) | pmsFrame[index + 1];
}

void acceptPmsFrame(uint32_t now) {
  uint16_t checksum = 0;
  for (uint8_t i = 0; i < 30; ++i) checksum += pmsFrame[i];

  if (checksum != readBigEndian16(30)) {
    pmsChecksumErrors++;
    pmsState.errorCount++;
    return;
  }

  // Atmospheric-environment concentration fields, in µg/m³.
  pm1 = readBigEndian16(10);
  pm25 = readBigEndian16(12);
  pm10 = readBigEndian16(14);

  pmsState.valid = true;
  pmsState.lastGoodMs = now;
}

void pollPms(uint32_t now) {
  while (pmsSerial.available()) {
    const uint8_t byteRead = pmsSerial.read();

    if (pmsFrameIndex == 0) {
      if (byteRead == 0x42) pmsFrame[pmsFrameIndex++] = byteRead;
      continue;
    }

    if (pmsFrameIndex == 1) {
      if (byteRead == 0x4D) {
        pmsFrame[pmsFrameIndex++] = byteRead;
      } else {
        pmsFrameIndex = (byteRead == 0x42) ? 1 : 0;
      }
      continue;
    }

    pmsFrame[pmsFrameIndex++] = byteRead;

    if (pmsFrameIndex == sizeof(pmsFrame)) {
      if (readBigEndian16(2) == 28) {
        acceptPmsFrame(now);
      } else {
        pmsState.errorCount++;
      }
      pmsFrameIndex = 0;
    }
  }
}

// -----------------------------------------------------------------------------
// Human-readable Serial report
// -----------------------------------------------------------------------------

void printReport(uint32_t now) {
  Serial.println();
  Serial.println("================ E-Nose live readings ================");
  Serial.printf("Uptime: %lu s\n", now / 1000);

  Serial.print("Wi-Fi     [ESP32]                 : ");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("CONNECTED  RSSI: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("DISCONNECTED");
  }

  Serial.printf("Fans      [Relay GPIO 25 / 26]    : Intake=%s, Exhaust=%s\n",
                fansOn ? "ON (commanded)" : "OFF (commanded)",
                fansOn ? "ON (commanded)" : "OFF (commanded)");

  Serial.printf("DHT22     [GPIO 27]               : %s", sensorStatus(dhtState, now));
  if (dhtState.valid) {
    Serial.printf("  Temperature=%.1f C, Humidity=%.1f %%\n", temperatureC,
                  humidityPct);
  } else {
    Serial.println("  Temperature/Humidity unavailable");
  }

  Serial.printf("CCS811    [I2C Wire0: SDA21/SCL22]: %s", sensorStatus(ccsState, now));
  if (ccsState.valid) {
    Serial.printf("  eCO2=%u ppm, TVOC=%u ppb", eco2Ppm, tvocPpb);
  } else {
    Serial.print("  eCO2/TVOC unavailable");
  }
  Serial.println(isWarmingUp(now, CCS_RUN_IN_MS) ? "  (warming up)" : "");

  Serial.printf("MiCS-6814 [ADS1115 A0/A1/A2]       : %s", sensorStatus(adsState, now));
  if (adsState.valid) {
    Serial.printf("  CO(A0)=%.3f V, NO2(A1)=%.3f V, NH3(A2)=%.3f V", micsCoV,
                  micsNo2V, micsNh3V);
  } else {
    Serial.print("  channel voltages unavailable");
  }
  Serial.println(isWarmingUp(now, MICS_WARMUP_MS) ? "  (warming up)" : "");

  Serial.println("MQ sensors [ESP32 ADC1, after voltage divider]:");
  Serial.printf("  MQ-2   GPIO 33  Smoke / combustible gas : raw=%u, %lu mV\n", mq2Raw,
                mq2mV);
  Serial.printf("  MQ-3   GPIO 36  Alcohol                 : raw=%u, %lu mV\n", mq3Raw,
                mq3mV);
  Serial.printf("  MQ-8   GPIO 34  Hydrogen                : raw=%u, %lu mV\n", mq8Raw,
                mq8mV);
  Serial.printf("  MQ-135 GPIO 39  Air-quality / ammonia   : raw=%u, %lu mV%s\n", mq135Raw,
                mq135mV, isWarmingUp(now, MQ_WARMUP_MS) ? "  (warming up)" : "");

  Serial.printf("PMS5003  [UART2: RX16/TX17]        : %s", sensorStatus(pmsState, now));
  if (pmsState.valid) {
    Serial.printf("  PM1.0=%u, PM2.5=%u, PM10=%u ug/m3", pm1, pm25, pm10);
  } else {
    Serial.print("  PM values unavailable");
  }
  Serial.printf("  checksum errors=%lu\n", pmsChecksumErrors);

  Serial.println("Note: MQ and MiCS values are raw voltage/ADC readings, not ppm.");
  Serial.println("========================================================");
}

// -----------------------------------------------------------------------------
// Arduino entry points
// -----------------------------------------------------------------------------

void setup() {
  Serial.begin(115200);
  bootAtMs = millis();
  Serial.println("E-Nose AQM real-time monitor starting");

  // Keep relays OFF during GPIO initialisation, then start both fans.
  pinMode(RELAY_INTAKE, OUTPUT);
  digitalWrite(RELAY_INTAKE, RELAY_OFF);
  pinMode(RELAY_EXHAUST, OUTPUT);
  digitalWrite(RELAY_EXHAUST, RELAY_OFF);
  setFans(true);

  pinMode(PMS_SET, OUTPUT);
  digitalWrite(PMS_SET, HIGH);  // PMS5003 awake

  analogReadResolution(12);
  analogSetPinAttenuation(MQ2_PIN, ADC_11db);
  analogSetPinAttenuation(MQ3_PIN, ADC_11db);
  analogSetPinAttenuation(MQ8_PIN, ADC_11db);
  analogSetPinAttenuation(MQ135_PIN, ADC_11db);

  dht.begin();
  Wire.begin(ADS_SDA_PIN, ADS_SCL_PIN);
  pmsSerial.begin(9600, SERIAL_8N1, PMS_RX, PMS_TX);

  scanCcsI2cBus();
  initialiseI2cSensors(millis());
  startWiFi();
}

void loop() {
  const uint32_t now = millis();

  pollPms(now);
  maintainWiFi(now);

  if ((!adsFound || !ccsFound) &&
      now - lastI2cAttemptMs >= I2C_RETRY_INTERVAL_MS) {
    initialiseI2cSensors(now);
  }

  if (isDue(now, lastDhtReadMs, DHT_READ_INTERVAL_MS)) readDht(now);

  if (isDue(now, lastAdcReadMs, ADC_READ_INTERVAL_MS)) {
    readMqSensors();
    readAds(now);
    readCcs(now);
  }

  if (isDue(now, lastReportMs, REPORT_INTERVAL_MS)) printReport(now);
}
