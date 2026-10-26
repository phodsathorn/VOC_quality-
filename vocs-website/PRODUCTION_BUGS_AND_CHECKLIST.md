# 📋 รายงานการตรวจสอบระบบเว็บ VOC / E-Nose (Production Readiness & Bug Report)
> **วันที่ตรวจสอบ:** 5 ตุลาคม 2026  
> **วัตถุประสงค์:** สรุปรายการบัค ข้อผิดพลาด และสิ่งที่ต้องปรับปรุงเพื่อให้โปรเจกต์ `vocs-website` สามารถนำไปติดตั้งใช้งานจริง (Production-Ready) ในระดับองค์กร/โรงงานได้อย่างสมบูรณ์

---

## 🔴 หมวดที่ 1: บัคระดับวิกฤต (Critical Bugs — ต้องแก้ทันที)

### 1. Hardcoded API URL ใน Frontend ทุกหน้า
- **ตำแหน่งไฟล์:**
  - `frontend/src/pages/Dashboard.jsx` (Line 6)
  - `frontend/src/pages/Devices.jsx` (Line 4)
  - `frontend/src/pages/DataCollection.jsx` (Line 4)
  - `frontend/src/pages/AirflowDiagram.jsx` (Line 5)
  - `frontend/src/pages/Alerts.jsx` (Line 4)
  - `frontend/src/pages/Settings.jsx` (Line 35)
- **ปัญหา:** ทุกไฟล์เขียน `const API = 'http://localhost:8000';` แบบ Hardcoded
  - เมื่อเปิดเว็บผ่านมือถือ แท็บเล็ต หรือเครื่องอื่นในวง LAN เบราว์เซอร์ของมือถือจะพยายามยิงไปที่ `localhost` ของตัวมือถือเอง ทำให้โหลดข้อมูลไม่ขึ้นและเกิด Error
  - ใน Production เมื่อรันผ่าน Nginx บนพอร์ต 80 หน้าเว็บจะข้าม Nginx Reverse Proxy ไปเรียกพอร์ต 8000 โดยตรง ซึ่งอาจติด Firewall
- **วิธีแก้:**
  - สร้างไฟล์กลาง `frontend/src/services/api.js` หรือเปลี่ยนไปใช้ Relative URL `""` (เมื่อมี Nginx Proxy) หรือใช้ตัวแปร Environment:
    ```javascript
    const API = import.meta.env.VITE_API_URL || '';
    ```

---

### 2. ไฟล์ `backend/init.sql` ตกหล่นหลาย Table และ Column
- **ตำแหน่งไฟล์:** `backend/init.sql`
- **ปัญหา:** 
  1. ในตาราง `sensor_readings` ไม่มีคอลัมน์ `mq2 INTEGER` และ `session_id BIGINT`
  2. ไม่มีคำสั่งสร้างตาราง `training_sessions`
- **ผลกระทบ:** หาก Deploy บน Server ใหม่หรือลบ Docker Volume เพื่อเริ่มระบบใหม่ Backend จะแครชทันทีด้วย error:
  `asyncpg.exceptions.UndefinedColumnError: column "mq2" does not exist` หรือ `relation "training_sessions" does not exist`
- **วิธีแก้:** นำคำสั่งจาก `migrate_add_training.sql` และเพิ่ม `mq2` ผนวกรวมเข้าไว้ใน `backend/init.sql` ให้สมบูรณ์ตั้งแต่ขั้นตอน Initial Schema

---

### 3. ลบอุปกรณ์ไม่ได้ ติด Foreign Key Constraint
- **ตำแหน่งไฟล์:** `backend/main.py` (`DELETE /api/devices/{box_id}`)
- **ปัญหา:** ตาราง `sensor_readings`, `ai_predictions`, `alerts` อ้างอิง `box_id` ไปที่ตาราง `devices` โดย**ไม่มี `ON DELETE CASCADE`**
- **ผลกระทบ:** หากกดปุ่ม "ลบอุปกรณ์" บนหน้าเว็บ (`/devices`) ขณะที่อุปกรณ์นั้นเคยส่งค่าเซนเซอร์เข้ามาแล้ว Backend จะตอบกลับเป็น `500 Internal Server Error` เพราะติด Foreign Key Constraint ใน PostgreSQL
- **วิธีแก้:** เพิ่ม `ON DELETE CASCADE` ใน Foreign Key ของ `init.sql`:
  ```sql
  ALTER TABLE sensor_readings
    DROP CONSTRAINT IF EXISTS sensor_readings_box_id_fkey,
    ADD CONSTRAINT sensor_readings_box_id_fkey FOREIGN KEY (box_id) REFERENCES devices(box_id) ON DELETE CASCADE;
  ```

---

### 4. การ Export CSV แครช (404) ถ้ายังไม่ได้ผูก Training Session
- **ตำแหน่งไฟล์:** `backend/main.py` (`GET /api/export/csv`)
- **ปัญหา:** Query ใช้วิธี `JOIN training_sessions ts ON ts.id = sr.session_id` แบบ `INNER JOIN`
- **ผลกระทบ:** หากผู้ใช้เปิดกล่องเก็บค่าเซนเซอร์ทั่วไปโดยไม่ได้สร้าง Training Session ค่า `session_id` จะเป็น `NULL` เมื่อกดปุ่มดาวน์โหลด CSV ระบบจะหาข้อมูลไม่เจอและแจ้งเตือน `404: No labeled data found`
- **วิธีแก้:**
  - เปลี่ยนเป็น `LEFT JOIN training_sessions ts ON ts.id = sr.session_id`
  - หาก `ts.label IS NULL` ให้ใส่ค่า Default เป็น `'UNLABELED'` หรือ `'AMBIENT'` เพื่อให้ผู้ใช้งานสามารถดึงข้อมูลดิบย้อนหลังทั้งหมดออกมาทำ EDA หรือสถิติได้ตลอดเวลา

---

### 5. Rate Limiter จำกัดตาม IP แทนที่จะจำกัดตาม Device (Box ID)
- **ตำแหน่งไฟล์:** `backend/main.py` (ฟังก์ชัน `_check_rate_limit`)
- **ปัญหา:** คำนวณ Token Bucket โดยใช้ `request.client.host` (IP ของ Client)
- **ผลกระทบ:** หากในโรงงานมีกล่องเซนเซอร์ 5-10 กล่อง เชื่อมต่อผ่าน WiFi Router หรือ Hotspot วงเดียวกัน ทุกกล่องจะมี Public IP หรือ Gateway IP เดียวกัน ทำให้แย่งโควต้า Rate Limit กันเอง จนบอร์ดบางตัวโดนบล็อก `429 Too Many Requests`
- **วิธีแก้:** เปลี่ยน Key ของ Rate Limiter ให้ใช้ `payload.box_id`:
  ```python
  rate_key = f"{client_ip}_{payload.box_id}"
  ```

---

### 6. หน่วยและเกณฑ์ของ MiCS-6814 ใน `AirflowDiagram.jsx` ไม่ตรงกับฮาร์ดแวร์จริง
- **ตำแหน่งไฟล์:** `frontend/src/pages/AirflowDiagram.jsx` (Lines 19-21)
- **ปัญหา:** 
  ```javascript
  mics_co: { warn: 1500, crit: 2500, unit: 'ADC', label: 'MICS (CO)' },
  no2:     { warn: 1000, crit: 1800, unit: 'ADC', label: 'NO₂' },
  nh3:     { warn: 1500, crit: 2500, unit: 'ADC', label: 'NH₃' },
  ```
  ในฮาร์ดแวร์จริง เซนเซอร์ MiCS-6814 อ่านผ่านชิป ADS1115 และส่งค่าออกมาเป็นหน่วย **มิลลิโวลต์ (mV)** ซึ่งในอากาศสะอาดจะมีค่าอยู่ระหว่าง **250 - 500 mV** การตั้งเกณฑ์เตือนที่ 1500 - 2500 ADC จะทำให้สถานะบนหน้า Airflow Diagram ไม่ตรงกับความจริง
- **วิธีแก้:** ปรับหน่วยเป็น `mV` และตั้งเกณฑ์ `warn` / `crit` ให้สอดคล้องกับค่าจริงของ ADS1115

---

## 🟡 หมวดที่ 2: การปรับปรุงฟังก์ชันให้เป็นโปรดักจริง (Product Features)

### 1. การสลับโหมด Mock API อัตโนมัติ (Environment-driven Mock)
- **ตำแหน่งไฟล์:** `frontend/src/main.jsx`
- **ปัญหาเดิม:** โค้ดเดิมเขียน `import './mockApi.js'` ฝังไว้ ทำให้หน้าเว็บดักจับและจำลองข้อมูลตลอดเวลา หากต้องการใช้ข้อมูลจริงต้องมาคอย Comment out บรรทัดนี้ในโค้ด
- **วิธีปรับปรุง:** ใช้ตัวแปร Environment ควบคุม:
  ```javascript
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await import('./mockApi.js');
  }
  ```

---

### 2. เพิ่มระบบอัปโหลดไฟล์โมเดล AI ผ่านหน้าเว็บ (`Settings.jsx`)
- **ปัญหาปัจจุบัน:** มีปุ่มกด "Reload Model" แต่ไม่มีปุ่มให้อัปโหลดไฟล์ `voc_model.pkl` ใหม่ผ่านหน้าเว็บ ทำให้ช่างหรือ Data Scientist ต้อง Remote เข้า Server หรือใช้คำสั่ง Docker cp เพื่อวางไฟล์โมเดล
- **สิ่งที่ควรเพิ่ม:**
  1. สร้าง Endpoint `POST /api/model/upload` รับไฟล์ `.pkl`
  2. เพิ่มปุ่ม "เลือกไฟล์โมเดล (.pkl) และอัปโหลด" ในหน้า `Settings.jsx` พร้อมเรียก reload อัตโนมัติ

---

### 3. Sync ค่า Threshold จาก Server สู่ทุกหน้าเว็บ
- **ปัญหาปัจจุบัน:** หน้า `Dashboard.jsx` และ `AirflowDiagram.jsx` อ่านค่า Thresholds จาก `localStorage` ของเบราว์เซอร์เครื่องนั้นๆ ทำให้เมื่อผู้ดูแลระบบตั้งค่า Threshold ใหม่ในหน้า Settings บนเครื่องหนึ่ง เครื่องอื่นจะไม่ได้รับการอัปเดตตาม
- **สิ่งที่ควรเพิ่ม:** ให้หน้า Dashboard และ Airflow Diagram ดึงค่าจาก `GET /api/thresholds` จากฐานข้อมูล Backend เสมอ

---

### 4. รองรับการดึง Active Session บนเฟิร์มแวร์ ESP32
- **การทำงาน:** บนหน้าเว็บมีระบบ Data Collection กด "เริ่มบันทึกสาร (เช่น THINNER)"
- **สิ่งที่เฟิร์มแวร์ต้องรองรับ:** ให้ ESP32 ยิง `GET /api/active-session?box_id=BOX-001` ทุก 10 วินาที เพื่อดูว่าเว็บกำลังสั่งเก็บข้อมูลสารอะไรอยู่ หากมี `session_id` ให้แนบไปกับ `POST /api/ingest` เพื่อให้ข้อมูลถูก Tag Label เข้าชุดเทรนโมเดลโดยอัตโนมัติ

---

## 🟢 หมวดที่ 3: การปรับปรุงฝั่ง Firmware (`voc_esp32.ino`)

ไฟล์ firmware รุ่นปัจจุบันอยู่ที่ `firmware/voc_esp32/voc_esp32.ino` ส่วน `../../experimental/legacy-firmware/air_quality_monitor/air_quality_monitor.ino` เป็นรุ่นเก่าที่เก็บไว้ใช้อ้างอิงเท่านั้น หากจะนำแนวคิดจากรุ่นเก่ามาใช้ ต้อง review และทดสอบกับ hardware จริงก่อน ดังนี้:

1. **ระบบ NVS Flash Warm-up Bypass:** จดจำประวัติการวอร์มเซนเซอร์ลงบน Flash Memory เพื่อให้เวลาปิด-เปิดเครื่องใหม่ไม่ต้องรอวอร์ม 20 นาทีซ้ำซ้อน
2. **ระบบ Clean Air Baseline Calibration ($R_0$):** ฟังก์ชันกด Calibrate อากาศบริสุทธิ์เพื่อหาค่า $R_0$ และคำนวณอัตราส่วนสัมพัทธ์ ($R_s/R_0$) แก้ปัญหา Sensor Drift
3. **การชะลอการส่ง Environmental Compensation ให้ CCS811:** ไม่ส่งค่า Temp/RH อัปเดตใส่ CCS811 ถี่เกินไป (ส่งทุก 60 วินาที) เพื่อป้องกันไม่ให้ชิปรีเซ็ต Baseline ภายใน
4. **Fault-Tolerant Device Check:** เมื่อเปิดเครื่อง หากมีเซนเซอร์บางตัวสายหลุดหรือตอบสนองช้า (เช่น DHT22) ให้แจ้งเตือน Warning แล้วทำงานต่อ ไม่ค้างระบบ (Halt) จนส่ง WiFi ไม่ได้
5. **ระบบ Auto-Reconnect WiFi:** ตรวจสอบสถานะการเชื่อมต่อเสาสัญญาณ หากหลุดให้ต่อใหม่อัตโนมัติในพื้นหลังโดยไม่กระทบการอ่านค่าเซนเซอร์

---

## 🔵 หมวดที่ 4: Docker & Deployment Checklist สำหรับ Production

| รายการ | สถานะปัจจุบัน | สิ่งที่ต้องแก้ไขเพื่อขึ้น Production |
| :--- | :---: | :--- |
| **Database Auto-init ใน Prod** | ⚠️ ขาดไฟล์ | เพิ่ม `- ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql` ใน `docker-compose.prod.yml` |
| **CORS Whitelist** | ⚠️ อนุญาต `*` | เปลี่ยนจาก `allow_origins=["*"]` เป็นระบุ Domain จริงขององค์กร |
| **Default Password ใน .env** | ⚠️ ใช้ค่า default | เปลี่ยน `voc_password` ให้เป็นรหัสผ่านที่มีความปลอดภัยสูง (Strong Password) |
| **Database Backup** | ❌ ยังไม่มี | เพิ่ม Cron Job ทำ `pg_dump` สำรองข้อมูลรายวันลง Volume หรือ Cloud Storage |
| **HTTPS / SSL** | ❌ เป็น HTTP | ติดตั้ง Let's Encrypt หรือ Reverse Proxy (Traefik / Nginx Proxy Manager) จัดการ SSL Cert |
| **Auto-restart Policy** | ⚠️ ขาดในบาง Service | ใส่ `restart: always` ในทุกคอนเทนเนอร์เพื่อให้ระบบทำงานต่อทันทีเมื่อ Server ไฟดับแล้วติดใหม่ |

---

## 🟣 หมวดที่ 5: การปรับปรุง UI/UX หน้า Dashboard เพื่อให้ผู้ใช้งานทั่วไปอ่านเข้าใจได้ทันที (User-Friendly UI)

### 1. ปัญหาหน้า Dashboard เดิม
- เดิมทีบนหน้า Dashboard แสดงชื่อเซนเซอร์เป็นภาษาเทคนิคล้วนๆ เช่น `TVOC`, `eCO2`, `MQ2`, `MQ3`, `MQ135`, `MQ8`, `MICS_CO`, `NO2`, `NH3` และแสดงตัวเลขดิบโดยไม่มีคำอธิบาย
- **ผลกระทบ:** ช่างหน้างาน ผู้ควบคุมโรงงาน หรืออาจารย์ที่มาตรวจงานจะไม่เข้าใจว่าตัวเลขแต่ละตัวหมายถึงอะไร ก๊าซอะไรกำลังรั่วไหล หรือค่าไหนที่ต้องระวัง

### 2. ตารางเทียบคำอธิบายเซนเซอร์ที่ต้องระบุบนหน้า Dashboard

| รหัสเซนเซอร์ | ก๊าซเป้าหมายที่ตรวจจับ | คำอธิบายภาษาไทยที่ต้องแสดง | หน่วยที่แสดง |
| :--- | :--- | :--- | :---: |
| **Temperature** | อุณหภูมิห้อง | สภาวะความร้อนภายในห้องพ่นสี | `°C` |
| **Humidity** | ความชื้นสัมพัทธ์ | ปริมาณความชื้นในบรรยากาศ (มีผลต่อการแห้งของสี) | `%RH` |
| **PM2.5** | ฝุ่นละอองขนาดเล็ก | ฝุ่นละอองขนาดเล็กและละอองผงสีที่ฟุ้งกระจาย | `µg/m³` |
| **TVOC (CCS811)** | สารอินทรีย์ระเหยรวม | ไอกลิ่นสารเคมีรวม เช่น ทินเนอร์ แล็กเกอร์ กาว สารทำละลาย | `ppb` |
| **eCO₂ (CCS811)** | คาร์บอนไดออกไซด์เทียบเท่า | ก๊าซจากการหายใจ/การถ่ายเทและระบายอากาศในห้อง | `ppm` |
| **MQ-2** | ควันและก๊าซไวไฟ | ควันไฟ ก๊าซ LPG โพรเพน และก๊าซติดไฟ | `ADC` |
| **MQ-3** | แอลกอฮอล์และทินเนอร์ | ไอสารระเหยแอลกอฮอล์และตัวทำละลายอินทรีย์ | `ADC` |
| **MQ-135** | คุณภาพอากาศรวม / เบนซีน | ก๊าซมลพิษทั่วไป เบนซีน แอมโมเนีย และสารก่อกลิ่น | `ADC` |
| **MQ-8** | ก๊าซไฮโดรเจน | ก๊าซไฮโดรเจน (H₂) ที่อาจเกิดจากปฏิกิริยาเคมี | `ADC` |
| **MiCS-6814 (CO)** | คาร์บอนมอนอกไซด์ | ก๊าซพิษจากการเผาไหม้ไม่สมบูรณ์ (เตาอบสี/ฮีตเตอร์) | `mV` |
| **MiCS-6814 (NO₂)** | ไนโตรเจนไดออกไซด์ | ก๊าซไอเสียจากการสันดาปและเตาอบอุณหภูมิสูง | `mV` |
| **MiCS-6814 (NH₃)** | แอมโมเนีย | ก๊าซแอมโมเนีย กลิ่นฉุนรุนแรง และสารเคมีกัดกร่อน | `mV` |

### 3. แนวทาง UI ที่ได้อัปเดตลงใน `frontend/src/pages/Dashboard.jsx` แล้ว:
1. **แบ่งหมวดหมู่ชัดเจน:**
   - **หมวดสภาพแวดล้อมทั่วไป (Environment):** สำหรับดูภาพรวมอากาศในห้อง (Temp, RH, PM2.5, TVOC, eCO₂)
   - **หมวดโครงข่ายจมูกอิเล็กทรอนิกส์ (E-Nose Sensor Array):** แสดงการ์ดเซนเซอร์แต่ละตัว พร้อมระบุชื่อก๊าซที่ตรวจจับชัดเจน
2. **มีป้ายกำกับหน่วยกำกับทุกใบ:** (`°C`, `%RH`, `µg/m³`, `ppb`, `ppm`, `ADC`, `mV`)
3. **รองรับ Responsive บนจอมือถือ:** ปรับ Layout การ์ดเป็น Auto-fit เพื่อให้ช่างสามารถเปิดดูบนสมาร์ทโฟนหน้างานได้สะดวก

---

### สรุปขั้นตอนส่งต่อให้เพื่อน:
1. ส่งไฟล์นี้ให้เพื่อนร่วมทีมที่ดูแลเว็บและฐานข้อมูล
2. เพื่อนสามารถตรวจสอบและแก้ไขตามหัวข้อใน **หมวดที่ 1 (Critical Bugs)** ก่อนเป็นลำดับแรก
3. รันคำสั่งทดสอบระบบแบบไร้สายร่วมกับบอร์ด ESP32 เพื่อยืนยันว่าการส่งข้อมูล ข้อมูลแจ้งเตือน และการ Export CSV ทำงานได้อย่างราบรื่น
