# 📦 E-Nose AQM Enclosure — Concept Design Gallery

> ออกแบบอิงจากสไตล์ J-Rat Techworks Air Quality Monitor  
> ปรับใช้ Shelf Layout + Active Airflow + Thermal Barrier

---

## มุมมองภายนอก (Closed — Isometric View)

![ภาพจำลองกล่อง E-NOSE AQM v1.0 ปิดฝา — เห็นพัดลม 2 ตัว, DC Jack, Switch, เสา SMA](../images/enclosure_closed_view.jpg)

**จุดสังเกต:**
- ฝาบนปั๊มข้อความ **"E-NOSE AQM v1.0"**
- น็อตทองเหลือง (Brass Insert) M3 ที่มุมทั้ง 4
- พัดลม 40mm ติดผนังซ้าย (Intake) และขวา (Exhaust)
- Vent Slots ข้างพัดลมทั้งสองด้าน
- ด้านหน้า: DC Jack + Toggle Switch + SMA Antenna

---

## มุมมองภายใน (Open — Top-Down View)

![ภาพจำลองภายในกล่อง เปิดฝา เห็นการจัดวางแบบใหม่ — Air Chamber (MQ + Environment) กว้างๆ ไร้กำแพงทึบกั้น เพื่อรับลมจากพัดลมทั้ง 2 ตัวเต็มที่ และมีกำแพงทึบกั้น Electronics ไว้ล่างสุด](../images/enclosure_open_view.jpg)

**จุดสังเกต:**

| แถว | อุปกรณ์ | สิ่งที่เห็น |
|---|---|---|
| **Row 1 (บน)** | พัดลม ×2 + MQ-2 + MQ-135 + MQ-3 | อุโมงค์ลมปิด ลมเป่าผ่าน MQ ทุกตัว |
| **Row 2 (กลาง)** | DHT22 (ห้องแยก) + PMS5003 + MiCS-6814 + CCS811 | DHT22 มีห้องเล็กแยกมีช่อง vent เฉพาะ |
| **Row 3 (ล่าง)** | ESP32 + Relay 2-CH + Buck ×2 | DC Jack + Switch ติดผนังด้านล่าง |

---

## ขนาดกล่อง

```
ภายนอก:  220 × 150 × 40 mm
ภายใน:   214 × 144 × 34 mm
วัสดุ:    3D Print PETG หรือ ABS
ฝาปิด:    แบน 220 × 150 × 3 mm (พิมพ์แยกชิ้น)
น็อต:     Brass Insert M3 × 4 + สกรู M3×8mm × 4

✅ พิมพ์ได้บน Build Plate 220×220mm สูง 250mm
```
