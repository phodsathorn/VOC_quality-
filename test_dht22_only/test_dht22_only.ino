#include <DHT.h>

#define DHTPIN 27     // ขา DATA ของ DHT22 ต่อเข้า GPIO 27
#define DHTTYPE DHT22   // ชนิดเซ็นเซอร์คือ DHT22 (ตัวสีขาว)

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n========================================");
  Serial.println("  เริ่มการทดสอบ DHT22 อย่างเดียว");
  Serial.printf("  ขา DATA ต่อเข้ากับ GPIO %d\n", DHTPIN);
  Serial.println("========================================");
  
  dht.begin();
}

void loop() {
  // รอ 2 วินาทีระหว่างการอ่านแต่ละครั้ง (DHT22 อ่านได้เร็วสุดทุก 2 วินาที)
  delay(2000);

  // อ่านค่าความชื้น
  float h = dht.readHumidity();
  // อ่านค่าอุณหภูมิเป็นองศาเซลเซียส (ค่าเริ่มต้น)
  float t = dht.readTemperature();

  // ตรวจสอบว่าอ่านค่าสำเร็จหรือไม่
  if (isnan(h) || isnan(t)) {
    Serial.println("❌ ล้มเหลว: อ่านค่าจาก DHT22 ไม่ได้!");
    Serial.println("  - เช็คสาย VCC ว่าต่อเข้า 3.3V แล้วใช่ไหม?");
    Serial.println("  - เช็คสาย GND ว่าต่อแน่นไหม?");
    Serial.printf("  - เช็คสาย DATA ว่าต่อเข้าพิน G%d หรือไม่?\n", DHTPIN);
    Serial.println("  - หากใช้เซ็นเซอร์เปล่าๆ 4 ขา อย่าลืมใส่ตัวต้านทาน 4.7k - 10k คล่อมระหว่าง VCC กับ DATA ด้วย");
    Serial.println("----------------------------------------");
    return;
  }

  // พิมพ์ค่าที่อ่านได้
  Serial.print("✅ สำเร็จ! อุณหภูมิ: ");
  Serial.print(t);
  Serial.print(" °C\t");
  Serial.print("ความชื้น: ");
  Serial.print(h);
  Serial.println(" %");
}
