# 2026-11-07 — อัปเดตและจัดระเบียบชุดดีไซน์ Stitch AI ใหม่จาก Downloads

## สรุป
ทำการนำเข้าชุดดีไซน์ล่าสุดจากโฟลเดอร์ดาวน์โหลด (`~/Downloads/stitch_air_quality_minimal_dashboard-2.zip` / `~/Downloads/stitch_air_quality_minimal_dashboard`) ทั้งหมด 35 โฟลเดอร์หน้าจอ เข้าสู่โครงสร้างของโปรเจกต์ใน [`stitch_air_quality_minimal_dashboard/`](../stitch_air_quality_minimal_dashboard/README.md) โดยจัดหมวดหมู่อย่างเป็นระบบแยกเป็น **หน้าหลัก (`main_pages/`)**, **State ย่อย (`sub_states/`)**, และ **ระบบดีไซน์ (`design_system/`)** พร้อมอัปเดตไฟล์ต้นฉบับ `code.html`, `screen.png`, `DESIGN.md`, และเอกสารกำกับโครงสร้าง `README.md`

## สิ่งที่เปลี่ยน
1. **จัดระเบียบหน้าหลัก (`main_pages/`):**
   - อัปเดตโค้ดและภาพของหน้าเดิม: `dashboard`, `kiosk`, `alerts`, `airflow`, `devices`, `history`, `emissions_report`, `maintenance`, `data_collection`, `settings`, `air_quality_guide`, `login`
   - เพิ่มหน้าหลักใหม่จาก Stitch:
     - `main_pages/air_quality_index`: หน้าแสดงดัชนีคุณภาพอากาศ AQI พร้อมการจัดระดับสี
     - `main_pages/user_guide`: คู่มือฮาร์ดแวร์ แผนผังการต่อสาย และขั้นตอนความปลอดภัย
     - `main_pages/roles`: หน้านโยบายความปลอดภัยและเมทริกซ์สิทธิ์การใช้งาน (Industrial Policy Matrix)
     - `main_pages/system_states`: หน้ารวบรวมสถานะระบบและ UI Fallback Patterns
2. **จัดระเบียบ State ย่อยตามหน้าหลัก (`sub_states/`):**
   - `sub_states/airflow/airflow_sensor_box_telemetry`: Drawer แสดงค่าเซนเซอร์ประจำทางเดินลม
   - `sub_states/devices/devices_esp32_node_01_drawer_diagnostics`: Drawer วินิจฉัยฮาร์ดแวร์ ตรวจสอบสัญญาณรบกวน ADC และ I2C Bus
   - `sub_states/settings/settings_5_tabs_sla_line_messaging_api_general`: การตั้งค่าแบบ 5 แท็บสมบูรณ์ (Thresholds, SLA, LINE, Messaging API, General)
   - `sub_states/air_quality_guide/air_quality_guide_calculator_modal` และ `air_quality_guide_calculation_modal`: Modal เครื่องคำนวณและแสดงสมการแปลงหน่วยก๊าซ
   - `sub_states/air_quality_guide/air_quality_guide_level_detail_modal_1` และ `..._modal_2`: Modal รายละเอียดสุขภาพและเกณฑ์ความปลอดภัย
   - `sub_states/login/login_2_interactive_states`: หน้าล็อกอินพร้อม State Switcher Pills (Default, Error, Loading, Locked)
   - คง State ย่อยเดิมและอัปเดตโค้ด `code.html` ให้เป็นเวอร์ชันล่าสุด
3. **อัปเดตเอกสารโครงสร้าง:**
   - ปรับปรุง [`stitch_air_quality_minimal_dashboard/README.md`](../stitch_air_quality_minimal_dashboard/README.md) บันทึกแผนผังโฟลเดอร์ของทุกหน้าและทุก Sub-state ครบถ้วน

## เหตุผลและผลกระทบ
- รองรับงานดีไซน์ล่าสุดที่ผู้ใช้ Export ออกมาจาก Stitch AI โดยไม่ทิ้งโครงสร้างไฟล์แบบแบน (Flat directory) ที่ทำให้สับสน
- แยกหน้าที่ (Separation of Concerns) ชัดเจนระหว่าง Route หน้าหลัก และ Component ย่อย (Modals/Drawers)
- โค้ดโปรดักชันหลักใน `vocs-website/` ยังทำงานได้ปกติอย่างต่อเนื่อง

## การตรวจสอบ
- ตรวจสอบความครบถ้วนของทั้ง 35 โฟลเดอร์ต้นฉบับ ถูกแยกจัดวางครบ 100%
- ทดสอบคอมไพล์โค้ดเว็บ `npm --prefix vocs-website/frontend run build` ผ่าน 100% (248ms)

## งานค้างและขั้นตอนถัดไป
- [x] นำ Component ใหม่ๆ จาก Sub-states (เช่น Diagnostics Drawer, 5-Tabs Settings, Calculator Modal) ไปทยอยผสานลงใน React components ใน `vocs-website/frontend/`
- ตรวจสอบการใช้งานจริงในสภาพแวดล้อม Production บน Vercel

---

## 2026-11-07 01:58 — ปรับปรุงหน้าจอเว็บให้ตรงตามต้นแบบ Stitch AI 100%

### สิ่งที่เปลี่ยน
1. **`pages/Dashboard.jsx`**:
   - แก้ไขปัญหาตารางทางขวาหาย: เปิด Right-side Drawer "Live sensor telemetry" เป็นค่าเริ่มต้น (`true`) ตามต้นแบบ Stitch พร้อมจัดเก็บสถานะใน `localStorage`
   - ป้องกันอาการจอขาว (Blank Screen / Infinite Loop) ในฟังก์ชัน `fetchAll` โดยใช้ `dataRef.current` ตัด dependency loop
   - ปรับแต่งปุ่มและไอคอนใน Drawer และการแสดงผลเซนเซอร์ครบถ้วน

2. **`pages/Alerts.jsx`**:
   - ปรับให้ตรงตามต้นแบบ `alerts_incident_detail_with_sla_owner` 1:1
   - เพิ่ม Search Bar ("Search condition, owner or rule...") พร้อมตัวกรอง Date และ Severity
   - เพิ่มคอลัมน์ `Rule` (เงื่อนไขการเตือน เช่น `TVOC > 200 ppb for 2 min`)
   - Drawer ฝั่งขวา: เพิ่มการ์ด SLA Response (6m/10m target พร้อมสถานะ Escalation), กราฟ Sparkline "30 minutes around the event" แสดง Peak 218 ppb และเส้น Limit 200 ppb, และ "Incident Timeline" (Created → Acknowledged → In progress → Resolved)
   - เพิ่มระบบแบ่งหน้า (Pagination) ด้านล่างตาราง

3. **`pages/Maintenance.jsx`**:
   - ปรับโครงสร้างหน้าให้ตรงตาม `maintenance_table_columns_add_log_drawer` 1:1
   - เพิ่ม Header Actions 3 ปุ่ม: `+ Add log`, `Calibration History`, `Add work order`
   - เพิ่มแท็บสลับ `Sensors & Filters` และ `Work orders (4)`
   - แสดงตาราง 6 เซนเซอร์โรงงานจริง: `MQ-3 (Alcohol)`, `MQ-2 (Combustibles)`, `MQ-135 (Fumes)`, `MQ-8 (H2)`, `MiCS-5524 (CO)`, `MiCS-6814 (NO2)` พร้อมคอลัมน์ Serial No., Calibrated by, Drift % (info icon), Next due, Certificate PDF badge, และ Status pill
   - รองรับ Row Expand แสดงข้อมูล Span Gas Conc., Calibrate now และ History
   - เพิ่ม Drawers: `Add Maintenance Log`, `Calibration History` (พร้อมดาวน์โหลด PDF), `Add Work Order`, และ Modal `Confirm Sensor Calibration`

4. **`pages/AirflowDiagram.jsx`**:
   - เพิ่ม Toggle ด้านบนสลับระหว่าง `Factory ventilation` (ระบบท่อหลัก 4 สเตจ) และ `Sensor box` (วงจรนิวเมติกส์ 5 สเตจ: Intake, HEPA Pre-Filter, Sensor Chamber พร้อมชิปเซนเซอร์, Microcontroller ESP32, Exhaust)
   - เพิ่มการ์ด 3 ตัวชี้วัดสำหรับ Sensor Box: Fan Speed (2,400 RPM), Chamber Temp (24.2 °C), HEPA ΔP (45 Pa)
   - เพิ่ม Drawer "Live sensor telemetry" (Powder Coating Booth 1 • 5 Active Probes) พร้อมตารางเซนเซอร์ Array ID: `BOX-001`

5. **`pages/AirQualityGuide.jsx`**:
   - เพิ่มปุ่มและ Modal "How it is calculated" (สูตร Piecewise linear interpolation)
   - เพิ่มปุ่มและ Modal "AQI Calculator" (คำนวณแบบอินเทอร์แอคทีฟพร้อมปุ่มดึงค่าเซนเซอร์สด)

6. **`pages/Settings.jsx` & `pages/Guide.jsx`**:
   - ผสาน 5-Tabs Settings (Thresholds, Notifications/LINE, SLA, Users, General)
   - ปรับหน้าคู่มือความปลอดภัยและ Pinout แผนผังสายไฟ ESP32-S3

### การตรวจสอบ
- ตรวจสอบ linter: `npm run lint` ผ่าน (0 errors)
- คอมไพล์โปรดักชัน: `npm run build` ผ่าน 100% (241ms)


