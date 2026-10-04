/**
 * ============================================================
 *  E-Nose AQM — Debug Diagnostic (อัพเดทขาใหม่ล่าสุด)
 * ============================================================
 *  โค้ดนี้จะใช้ตรวจสอบความถูกต้องของ Hardware ด้วยขาที่ปลอดภัยแล้ว:
 *  - I2C (ADS1115 & CCS811) รวมอยู่ที่ GPIO 21, 22
 *  - DHT22 ย้ายมาใช้ GPIO 27
 *  - PMS5003 ใช้ UART2 (RX=16, TX=17) แบบไขว้สาย
 * ============================================================
 */

#include <Wire.h>
#include <DHT.h>

// ══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println();
  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║  🔧 Debug Diagnostic (เวอร์ชั่นขาใหม่) ║");
  Serial.println("╚══════════════════════════════════════╝");

  // ────────────────────────────────────────────────────────
  // TEST 1: สแกน I2C Bus หลัก (GPIO 21, 22)
  // ────────────────────────────────────────────────────────
  Serial.println();
  Serial.println("══════════════════════════════════════");
  Serial.println("  TEST 1: สแกนหาอุปกรณ์ I2C");
  Serial.println("══════════════════════════════════════");

  Wire.begin(21, 22);
  Serial.println("  📡 Bus 0 (Wire0) — GPIO 21 (SDA), 22 (SCL):");
  scanI2C(Wire);

  // ────────────────────────────────────────────────────────
  // TEST 2: ทดสอบ DHT22 ที่ขา 27
  // ────────────────────────────────────────────────────────
  Serial.println();
  Serial.println("══════════════════════════════════════");
  Serial.println("  TEST 2: ทดสอบ DHT22 (ขาปลอดภัย)");
  Serial.println("══════════════════════════════════════");
  testDHT(27);

  // ────────────────────────────────────────────────────────
  // TEST 3: ทดสอบ PMS5003 UART แบบดิบ
  // ────────────────────────────────────────────────────────
  Serial.println();
  Serial.println("══════════════════════════════════════");
  Serial.println("  TEST 3: ทดสอบ PMS5003 (UART ดิบ)");
  Serial.println("══════════════════════════════════════");

  // เปิดขา SET ให้ PMS ทำงาน
  pinMode(23, OUTPUT);
  digitalWrite(23, HIGH);

  Serial.println("  🔍 ทดสอบ: RX=16, TX=17");
  testPMS(16, 17);

  // ลบ TEST 4 ออกตามคำแนะนำของ QA เพื่อไม่ให้เปลี่ยน State ของ GPIO ที่ใช้สื่อสาร
  Serial.println();
  Serial.println("══════════════════════════════════════");
  Serial.println("  🏁 การทดสอบเสร็จสิ้น");
  Serial.println("══════════════════════════════════════");
}

void loop() {
  delay(10000);
}

// ══════════════════════════════════════════════════════════
//  Helper Functions
// ══════════════════════════════════════════════════════════

void scanI2C(TwoWire &bus) {
  int found = 0;
  bool found_ads = false;
  bool found_ccs = false;

  for (byte addr = 1; addr < 127; addr++) {
    bus.beginTransmission(addr);
    byte error = bus.endTransmission();
    if (error == 0) {
      Serial.printf("    ✅ พบอุปกรณ์ที่ Address: 0x%02X", addr);
      if (addr == 0x48) { Serial.print(" → ADS1115"); found_ads = true; }
      else if (addr == 0x5A) { Serial.print(" → CCS811"); found_ccs = true; }
      Serial.println();
      found++;
    }
  }
  
  if (!found_ads) Serial.println("    ❌ ไม่พบ ADS1115 (0x48)");
  if (!found_ccs) Serial.println("    ❌ ไม่พบ CCS811 (0x5A)");
  
  if (found == 0) {
    Serial.println("    ❌ ไม่พบอุปกรณ์ I2C ใดๆ เลย!");
  } else {
    Serial.printf("    รวม: พบ %d อุปกรณ์\n", found);
  }
}

void testDHT(int pin) {
  Serial.printf("\n  🌡️  ทดสอบ DHT22 ที่ GPIO %d:\n", pin);
  DHT testDht(pin, DHT22);
  testDht.begin();
  delay(2500);

  float t = testDht.readTemperature();
  float h = testDht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    Serial.printf("    ✅ สำเร็จ! Temp=%.1f°C  Hum=%.1f%%\n", t, h);
  } else {
    Serial.printf("    ❌ อ่านไม่ได้จาก GPIO %d\n", pin);
  }
}

void testPMS(int rxPin, int txPin) {
  HardwareSerial testSerial(2);
  testSerial.begin(9600, SERIAL_8N1, rxPin, txPin);
  delay(1000);

  Serial.printf("    รอข้อมูลจาก PMS5003 5 วินาที...\n");
  unsigned long start = millis();
  bool foundHeader = false;

  while (millis() - start < 5000) {
    if (testSerial.available()) {
      byte b = testSerial.read();
      if (b == 0x42) {
        // รอให้ไบต์ที่สองมาถึง
        unsigned long wait_b2 = millis();
        while(!testSerial.available() && millis() - wait_b2 < 100);
        
        if (testSerial.available()) {
          byte b2 = testSerial.read();
          if (b2 == 0x4D) {
            foundHeader = true;
            Serial.println("    ✅ พบ Header 0x42 0x4D");
            
            // อ่านให้ครบ 32 ไบต์
            byte buf[32];
            buf[0] = 0x42;
            buf[1] = 0x4D;
            int read = 2;
            unsigned long t = millis();
            
            while (read < 32 && millis() - t < 1000) {
              if (testSerial.available()) {
                buf[read++] = testSerial.read();
              }
            }
            
            if (read == 32) {
              int frameLen = (buf[2] << 8) | buf[3];
              if (frameLen == 28) {
                // คำนวณ Checksum
                uint16_t checksum = 0;
                for (int i = 0; i < 30; i++) checksum += buf[i];
                uint16_t expected_checksum = (buf[30] << 8) | buf[31];
                
                if (checksum == expected_checksum) {
                   Serial.println("    ✅ Frame Length 28 และ Checksum ถูกต้อง!");
                } else {
                   Serial.printf("    ❌ Checksum ผิดพลาด (คำนวณได้ %d, ได้รับ %d)\n", checksum, expected_checksum);
                }
              } else {
                 Serial.printf("    ❌ Frame Length ผิดพลาด (คาดหวัง 28, ได้รับ %d)\n", frameLen);
              }
            } else {
               Serial.println("    ❌ ได้รับข้อมูลไม่ครบ 32 ไบต์");
            }
            break;
          }
        }
      }
    }
  }

  if (!foundHeader) {
    Serial.println("    ❌ ไม่ได้รับข้อมูล หรือ Header ผิดพลาด");
  }
  testSerial.end();
}
