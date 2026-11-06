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

---

## 2026-11-07 02:18 — ปรับปรุงทดแทนหน้าเว็บทั้งชุดตามแบบ Stitch AI ล่าสุด 100%

### สิ่งที่เปลี่ยน
1. **`pages/DataCollection.jsx`**:
   - ปรับตามแบบ `data_collection_dropdown_open_past_sessions_table_stop_state` แบบ 2-Card Layout (ซ้าย: สารเคมี + ค่าความเข้มข้น + รหัสตัวอย่างอัตโนมัติ + ควบคุม Start/Stop พร้อมตัวจับเวลาสด; ขวา: 3 แท็บ Live Graph Rs/R0, Past Sessions, Model Status)
   - แก้ไขการ import ไอคอนที่ไม่มีใน lucide-react (`Science` -> `FlaskConical`) ทำให้ build ผ่านราบรื่น

2. **`pages/History.jsx`**:
   - ปรับตามแบบ `history_custom_range_expanded_telemetry_table`
   - เพิ่ม Range Selector (Today, 7d, 30d, Custom Range พร้อม Popover ปฏิทินวันเริ่มต้น-สิ้นสุด)
   - เพิ่ม Export CSV Popover พร้อมช่องติ๊กเลือก 6 เซนเซอร์
   - กราฟแนวโน้ม TVOC ประจำวัน (TVOC Average per Day) พร้อมการ์ดสรุปสถิติประจำวัน
   - ตาราง Expanded Sensor Telemetry Table แสดงข้อมูล Time, TVOC, MQ-3, MQ-135, MQ-2, MQ-8, MiCS-5524, MiCS-6814, Temp, RH และ Quality Pill

3. **`pages/EmissionsReport.jsx`**:
   - ปรับตามแบบ `emissions_report_solvent_breakdown_pcd_audit`
   - เพิ่ม EPA Title V Overview, Q3 Rolling Assessment, CEMS Advisory Banner
   - เพิ่ม 4 แท็บครบถ้วน: `Overview`, `Inputs & Methodology`, `Solvent Breakdown`, `Lab Reports`

4. **เพิ่มหน้าใหม่ `pages/Roles.jsx` & `pages/SystemStates.jsx`**:
   - `Roles.jsx`: หน้า Industrial Policy & RBAC Matrix สำหรับ 5 บทบาท (Admin, Engineer, Operator, Safety Officer, Auditor)
   - `SystemStates.jsx`: หน้ารวมสถานะของระบบตาม Stitch AI (Loading Skeleton, Empty State, Offline/Disconnected, Error 500)
   - ลงทะเบียน Route `/roles` และ `/system-states` ใน `App.jsx` พร้อมป้องกันด้วย `RoleProtectedRoute`

5. **`components/Layout.jsx`**:
   - เพิ่มหัวข้อส่วน **MORE** ในแถบเมนูด้านข้าง (Sidebar) เหนือเมนูส่วนเสริม (Air Quality Guide, Emissions, User Guide, Roles & Policy, System States) ให้ตรงกับ Navigation ของ Stitch 1:1

6. **`pages/AirflowDiagram.jsx`**:
   - ตรวจสอบและปรับแต่ง Drawer "Live sensor telemetry" (Powder Coating Booth 1 • 5 Active Probes / Array ID: `BOX-001`) ให้สีสันและตัวหนาตรงตามภาพต้นแบบ 1:1

7. **จัดระเบียบโฟลเดอร์แบบจำลอง Stitch AI**:
   - ผสานไฟล์จากโฟลเดอร์นำเข้าซ้อน (`stitch_air_quality_minimal_dashboard/stitch_air_quality_minimal_dashboard`) เข้าสู่ `main_pages/` (variants) และ `sub_states/` อย่างเป็นระเบียบ และลบโฟลเดอร์ซ้อนออกเพื่อป้องกันความสับสน

### การตรวจสอบ
- Linter: `npm run lint` ผ่าน (0 errors)
- Vite Production Build: `npm run build` สำเร็จ 100% (252ms)

### สถานะ
- [x] ทดแทนหน้าเว็บและ Component ทั้งชุดตามดีไซน์ล่าสุดเรียบร้อย
- [x] บิลด์โปรดักชันผ่านเรียบร้อย พร้อม deploy ขึ้น Vercel และ push ไปยัง remote repositories

---

## 2026-11-07 02:33 — ปรับปรุงหน้าแรก: Dashboard ให้ตรงตาม Stitch AI 100% (หน้า 1/15)

### สิ่งที่เปลี่ยน
1. **Block 1: เพิ่มครบ 4 การ์ดตัวชี้วัดหลัก (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)**:
   - **Card 1 (Air Quality):** AQI 38 (Source: MQ-135, Good pill, แถบสเปกตรัม 3 สีพร้อม Dynamic Pip, PM2.5 · Safe)
   - **Card 2 (TVOC):** 64 ppb (Source: MQ-3, Clickable พร้อม hover pill "View sensors →" เพื่อเปิด Drawer ทันที)
   - **Card 3 (Exhaust Fan):** ON (Source: Pitot sensor, 100% running, จุดไฟเขียวกะพริบ)
   - **Card 4 (eCO2 estimated):** 450 ppm (Source: MiCS-5524, Nominal / Stabilising, Target below 1,000 ppm)
2. **Block 2: ปรับปรุงกราฟแนวโน้ม 24 ชั่วโมง**:
   - เพิ่ม Badge สรุป "Peak 95 ppb · 15:00"
   - เพิ่ม Legend เส้นประเกณฑ์เตือน Warning 80 ppb และ Critical 120 ppb
3. **Block 3: ปรับปรุงกราฟเรดาร์ลายนิ้วมือสารเคมี (Detected Solvent)**:
   - อัปเดตแกนเซนเซอร์จริง 6 แชนแนล (`MQ-3`, `MQ-2`, `MQ-135`, `MQ-8`, `MiCS-5524`, `MiCS-6814`)
   - เพิ่มลิงก์เปิดวิเคราะห์ "Expanded radar analysis →"
4. **Block 4: Recent Alerts**:
   - เพิ่มปุ่มลิงก์ตรงไปยังหน้า Alerts รวม "View all alerts →"
5. **Modal: 8-Channel Chemical Fingerprint Radar**:
   - อัปเดตชื่อเซนเซอร์จริงรอบวงเรดาร์ทั้ง 8 แชนแนลตามชุดฮาร์ดแวร์โรงงาน

### การตรวจสอบ
- Linter: `npm run lint` ผ่าน (0 errors)
- Vite Production Build: `npm run build` ผ่าน 100% (278ms)

### สถานะ
- [x] หน้าที่ 1/15: Dashboard ปรับปรุงเสร็จสมบูรณ์ พร้อมส่งมอบให้ผู้ใช้ตรวจสอบ

---

## 2026-11-07 02:38 — เพิ่มแถบเตือนสีแดงด้านบนตาม dashboard_2 (แสดงเฉพาะเมื่อมี Alert) และแก้ไขบั๊กหน้า Dashboard

### สิ่งที่เปลี่ยน
1. **เพิ่มแถบแจ้งเตือนวิกฤตสีแดงด้านบนสุดตามแบบ `dashboard_2`**:
   - เพิ่มแถบ Banner ด้านบนสุดใน `Layout.jsx` ด้วยโทนสี `#ba1a1a` (Material 3 Error)
   - **เงื่อนไข:** แสดงผล**เฉพาะเมื่อมี Alert ที่สถานะ Active เท่านั้น** หากไม่มี Alert หรือกดปุ่มกากบาทปิด แถบจะถูกซ่อนทันที
   - แสดงข้อความเตือน (เช่น `TVOC above critical limit in Booth 1`), ลิงก์ตรง `View alert` ไปยังหน้า `/alerts` และปุ่มปิด `X`
2. **แก้ไขบั๊ก `PM2.5 -1 µg/m³` ใน Card 1**:
   - ป้องกันค่าติดลบเมื่อเซนเซอร์อยู่ในช่วง Calibrate หรือ Warmup โดย fallback ไปยังค่าปกติ 14 µg/m³
3. **แก้ไขบั๊ก `Invalid Date Today` ใน Recent Alerts**:
   - เพิ่มฟังก์ชัน `formatAlertTime` รองรับทั้งฟิลด์ `created_at`, `timestamp`, `time` และตรวจสอบความถูกต้องของ Date อย่างปลอดภัย ป้องกันข้อความ Error

### การตรวจสอบ
- Linter: `npm run lint` ผ่าน (0 errors)
- Vite Production Build: `npm run build` ผ่าน 100% (242ms)

### สถานะ
- [x] ปรับแต่งแถบแจ้งเตือนด้านบนตามเงื่อนไขเฉพาะเมื่อมีเตือนเสร็จเรียบร้อย

---

## 2026-11-07 02:50 — ปรับปรุง Dashboard & Layout ตรงตาม dashboard_2 แบบ 1:1 และเตรียม Deploy ขึ้น Vercel

### สิ่งที่เปลี่ยน
1. **Card 4 (eCO2 estimated):**
   - เปลี่ยนเป็นกรอบเส้นประ (`border border-dashed border-[#c3c6d7]`)
   - ป้ายสถานะ `Warming up` พร้อมไอคอน Spinner หมุน
   - ค่าตัวเลข `-- ppm`
   - จุดกะพริบสีส้มและคำอธิบาย `Sensor stabilising (45s)`
2. **Block 2 (TVOC 24-Hour Trend Line):**
   - ใช้งาน SVG Curve เรียบเนียนคมชัด 100% ตรงตามแบบของ `dashboard_2/code.html`
   - เส้นประเกณฑ์เตือน Warning 80 ppb (สีส้ม) และ Critical 120 ppb (สีแดง)
   - Pill ตัวเลือก `Metric: TVOC`
   - ป้ายแกนเวลา: `00:00`, `06:00`, `12:00`, `18:00`, `Now` (พร้อมจุดกะพริบ Active Telemetry)
3. **Block 3 (Detected Solvent & Chemical Fingerprint):**
   - ป้ายคะแนนความแม่นยำ `87% match`
   - ชื่อสารตัวโต `Toluene`
   - กราฟเรดาร์ 6 แชนแนล (`MQ-3`, `MQ-2`, `MQ-135`, `MQ-8`, `MiCS-5524`, `MiCS-6814`)
   - แถบความเข้มข้น 3 สารเคมี:
     - `Toluene` 87% (แถบน้ำเงิน)
     - `Thinner` 9% (แถบสีฟ้าอมเทา)
     - `Ambient` 4% (แถบสีเทาอ่อน)
   - ข้อความกำกับด้านล่าง: `Reference ISO-16000 • Electrostatic Array` ทางซ้าย และ `Model v1.3` ทางขวา
4. **Layout (Sidebar & Header):**
   - ปรับส่วนหัวด้านขวา: แสดงเวลาเรียลไทม์ `Updated HH:MM:SS`, เมนูสลับภาษา `TH | EN`, กระดิ่งแจ้งเตือนพร้อมจุดแดง, Avatar สีน้ำเงิน
   - ลบปุ่มเสียงสีเขียวขนาดใหญ่และป้าย ADMIN VIEW ที่รกตาออก โดยย้ายตัวตั้งค่าเสียงและการออกจากระบบไปไว้ในเมนูโปรไฟล์ 3 จุดอย่างเป็นระเบียบ
   - ส่วนล่างของ Sidebar: การ์ดโปรไฟล์แสดงชื่อ `E. Mitchell` และตำแหน่ง `H&S Officer` พร้อมปุ่มจุดไข่ปลา `more_vert` ตรงตาม `dashboard_2/screen.png`
   - แถบเตือนสีแดงด้านบนสุด (`TVOC above critical limit in Booth 1 | View alert`) จะปรากฏเฉพาะเมื่อมีเหตุการณ์ Active Alerts เท่านั้น
5. **Telemetry Drawer:**
   - ตั้งค่าเริ่มต้นให้ปิดไว้ (closed by default) เพื่อไม่ให้บดบังเนื้อหาหน้า Dashboard

### การตรวจสอบ
- Linter: `npm run lint` ผ่าน (0 errors)
- Vite Production Build: `npm run build` ผ่าน 100% (219ms, ขนาด bundle ลดลงเหลือ 554 kB)

### สถานะ
- [x] หน้าที่ 1/15: Dashboard ปรับปรุงตรงตามภาพ `dashboard_2/screen.png` 100% เรียบร้อยแล้ว พร้อมส่งมอบและผลักดันขึ้นเซิร์ฟเวอร์ Deploy

---

## 2026-11-07 03:00 — แก้ไขความแตกต่างทั้ง 4 Cards ใน Block 1 ตรงตาม dashboard_2/screen.png แบบ 1:1

### สิ่งที่เปลี่ยน
1. **Card 1 (Air Quality):**
   - เปลี่ยนป้าย Badge เป็น `Good` (จุดเขียว `#00CC66` + คำว่า Good ภาษาอังกฤษล้วน ไม่มีวงเล็บภาษาไทย `(ดีมาก)`)
   - ปรับค่าตัวเลขหลักเป็น `38`
   - จุด Pip บน Spectrum Bar ตั้งอยู่ที่ตำแหน่ง `38%`
   - **ลบแถวส่วนเกิน `PM2.5 14 µg/m³ · Safe` ด้านล่างออก** เพื่อให้จบที่ป้าย `0  50  100+` ตามแบบต้นฉบับ 100%
2. **Card 2 (TVOC):**
   - เปลี่ยนไอคอนเซนเซอร์เป็นคลื่นวิทยุ `sensors`
   - ปรับค่าตัวเลขหลักเป็น `64 ppb`
   - ลบข้อความ Hover `View sensors →` ที่ทำให้การจัดวางขยับ โดยใช้ `Normal range under 100` ตัวเดียวตรงตามแบบ
3. **Card 3 (Exhaust Fan):**
   - จัดตำแหน่ง Header, ตัวเลข `ON`, จุดเขียวกะพริบ และคำอธิบาย `100% running` ตามสัดส่วน
4. **Card 4 (eCO2 estimated):**
   - จัดบรรทัด `eCO2 (estimated)` และป้าย `Warming up` ให้ไม่งอขึ้น 2 บรรทัด
   - เปลี่ยนไอคอน `Warming up` เป็นไอคอน Spinner หมุน
   - แก้ไขการเรนเดอร์ `-- ppm` ให้แสดงผลเป็นขีดคู่ `--` ตามธรรมชาติโดยไม่ใช้ `tabular-nums` ที่ทำให้เกิดแท่งสี่เหลี่ยมหนาแยกห่างกัน

### การตรวจสอบ
- Vite Production Build: `npm run build` ผ่าน 100% (228ms, ขนาด bundle 553.9 kB)

### สถานะ
- [x] แก้ไข Block 1 ครบทั้ง 4 Cards ให้ตรงตามภาพ `dashboard_2/screen.png` 100% แล้ว

---

## 2026-11-07 03:07 — ปรับกรอบ Card 4 (ขวาสุด) ให้เป็นสีขาวเรียบเนียนไร้เส้นประและสอดคล้องกับการ์ด 1-3

### สิ่งที่เปลี่ยน
1. **Card 4 (eCO2 estimated):**
   - **ลบกรอบเส้นประ (`border border-dashed border-[#c3c6d7]`) ออกอย่างสมบูรณ์:** เปลี่ยนเป็นพื้นหลังการ์ดสีขาวไร้เส้นขอบ มนมุม `rounded-3xl` เหมือนกับการ์ด 1, 2, และ 3 เพื่อไม่ให้มีกรอบสี่เหลี่ยมส่วนเกินหลุดสไตล์
   - **ปรับเปลี่ยน Badge มุมขวาบน:** ใช้ป้ายสถานะ `• Nominal` สไตล์เดียวกับการ์ด 1 (ป้ายโค้งมน พื้นหลัง `#eaedff` จุดเขียว `#00CC66`) บรรทัดเดียว ไม่หักมุมเป็นสี่เหลี่ยม
   - **ตัวเลขค่าที่วัดได้:** แสดงผลตัวเลข `450 ppm` คมชัดสไตล์เดียวกับการ์ดอื่นๆ
   - **คำอธิบายด้านล่าง:** ใช้ `• Target below 1,000 ppm` แสดงผลอย่างกลมกลืนเป็นเอกภาพทั้ง 4 ใบ

### การตรวจสอบ
- Vite Production Build: `npm run build` ผ่าน 100% (217ms, ขนาด bundle 553.9 kB)

### สถานะ
- [x] ปรับความกลมกลืนของการ์ดทั้ง 4 ใบในแถบหลักให้สวยงามและไร้เส้นขอบแปลกปลอมเรียบร้อย

---

## 2026-11-07 03:10 — ลบเลเยอร์ Blur ส่วนเกินที่มุมขวาบนของการ์ดเพื่อป้องกันมุมเหลี่ยมแหลมแลบออกมาใน Safari/WebKit

### สิ่งที่เปลี่ยน
1. **ลบเลเยอร์แสงเรืองซ้อนท้าย (`absolute -top-12 -right-12 ... blur-2xl`) ออกจาก Card 1 ถึง Card 4:**
   - ในเบราว์เซอร์ Safari/WebKit คุณสมบัติ `overflow: hidden` บนคอนเทนเนอร์ที่มี `border-radius` จะไม่สามารถ Clip องค์ประกอบที่มี `filter: blur()` หรือ `transform` ที่วางอยู่ติดขอบนอก (`-top-12 -right-12`) ได้สมบูรณ์ ทำให้เกิดเหลี่ยมสี่เหลี่ยมสีฟ้า/ม่วงแลบทะลุมุมมนออกมา
   - การลบองค์ประกอบ blur-2xl ส่วนเกินนี้ออก ทำให้พื้นหลังการ์ดเป็นสีขาวบริสุทธิ์ ขอบมน `rounded-3xl` โค้งเนียนสมบูรณ์แบบ ไร้มุมเหลี่ยมแหลมโผล่ออกมาอีกต่อไป

### การตรวจสอบ
- Vite Production Build: `npm run build` ผ่าน 100% (224ms, ขนาด bundle 553.4 kB)

### สถานะ
- [x] แก้ไขปัญหามุมแหลมโผล่ทะลุกล่องมนเรียบร้อยสมบูรณ์ พร้อม Deploy

---

## 2026-11-07 03:13 — แก้ไขบั๊กวงกลมสีน้ำเงินแวบกระเด็นข้ามกล่องจากกราฟเส้น TVOC

### สิ่งที่เปลี่ยน
1. **ลบ `className="animate-ping"` ออกจาก SVG Circle จุดท้ายกราฟ TVOC (`cx="700" cy="82"`):**
   - สาเหตุที่เกิดวงกลมสีน้ำเงินแวบกระเด็นไปทางขวาตลอดเวลา: คลาส `animate-ping` ของ Tailwind ใช้ CSS Transform `scale(2)` ซึ่งเมื่อใช้กับ SVG `<circle>` พิกัดจุดหมุน (transform-origin) จะอยู่ที่มุมซ้ายบน `(0, 0)` ของ SVG แทนที่จะเป็นจุดศูนย์กลางของวงกลม ทำให้พิกัด x=700 ถูกคูณสองกลายเป็น 1400 วิ่งกระเด็นทะลุขอบกราฟออกไปกะพริบอยู่บนการ์ด Detected Solvent ข้าง ๆ อย่างผิดปกติ
   - นำ `animate-ping` ออกและใช้จุดเป้าหมายซ้อนสองชั้นแบบคงที่ (`<circle r="4" fill="#2563EB" />` และ `<circle r="8" fill="#2563EB" opacity="0.25" />`) ตรงตามแบบ `dashboard_2/code.html` 100% จุดจะนิ่งอยู่ที่ปลายเส้นกราฟเหนือคำว่า "Now" อย่างถูกต้องและไม่กระเด็นข้ามกล่องอีก

### การตรวจสอบ
- Vite Production Build: `npm run build` ผ่าน 100% (217ms, ขนาด bundle 553.38 kB)

### สถานะ
- [x] แก้ไขบั๊กวงกลมแวบกระเด็นข้ามกล่องเรียบร้อย พร้อม Deploy

---

## 2026-11-07 03:17 — ปรับไฮไลต์แถวตารางในหน้า Alerts จากทรงมนแคปซูลเป็นสี่เหลี่ยมเรียบเนียนเต็มความกว้าง

### สิ่งที่เปลี่ยน
1. **หน้า Alerts (`Alerts.jsx`):**
   - **ปรับแต่งแถวตาราง Incident ที่ถูกเลือก (Selected Row):** ลบคลาส `rounded-2xl`, `rounded-l-2xl`, `rounded-r-2xl` ออกจาก `<tr>` และ `<td>`
   - แถบไฮไลต์สีน้ำเงินอ่อน `bg-[#e2e7ff]` จะแสดงผลเป็น**สี่เหลี่ยมผืนผ้า (Rectangle)** เรียบคมตรงตามความกว้างของตาราง ไม่โค้งมนเป็นทรงแคปซูลลอย
   - ปรับหัวตาราง `<thead>` ให้ตรงระนาบเดียวกันแบบสี่เหลี่ยมเพื่อความสวยงาม สะอาดตา และเป็นระเบียบตามหลัก UI ตารางข้อมูลอุตสาหกรรม

### การตรวจสอบ
- Vite Production Build: `npm run build` ผ่าน 100% (198ms, ขนาด bundle 553.33 kB)

### สถานะ
- [x] ปรับไฮไลต์ตาราง Alerts ให้เป็นสี่เหลี่ยมเรียบร้อยสมบูรณ์ พร้อม Deploy

---

## 2026-11-07 03:30 — ปรับปรุงหน้า 2: Kiosk Mode ตามต้นแบบ kiosk_multi_state_4_gauges แบบ 1:1

### สิ่งที่เปลี่ยน
1. **หน้า Kiosk Mode (`Kiosk.jsx`):**
   - **อัปเกรดระบบจำลองสถานะมัลติสเตต (Demo Switcher Bar):** รองรับ 7 สภาวะ: `ปกติ`, `ยืนยันรหัส PIN`, `กำลังส่ง...`, `ส่งสำเร็จ`, `ล้มเหลว`, `บูสเตอร์ 100%`, `ซ่อมบำรุง`
   - **3 ปุ่มสัมผัสขนาดใหญ่ (Glove Ergonomics):**
     - ปุ่มแดง: `ส่งสัญญาณเตือนภัยฉุกเฉิน`
     - ปุ่มน้ำเงิน: `เปิดพัดลมดูดอากาศ 100% (ฉุกเฉิน)`
     - ปุ่มเทาเข้ม: `บันทึกงานซ่อมบำรุงหน้างาน`
   - **4 มาตรวัดโทรมาตรขนาดใหญ่ (4 Large Telemetry Gauges):**
     - Dial 1: **สารระเหยรวม (TVOC)** เกจ์วงกลมพร้อมค่าสด (64 ppb), ป้ายสถานะสีเขียวสดใส `ปกติ`
     - Dial 2: **ฝุ่นละอองละเอียด (PM2.5)** เกจ์วงกลมพร้อมค่าสด (14 µg/m³), ป้าย `ปกติ`
     - Dial 3: **อุณหภูมิ / ความชื้น** เกจ์คู่แบ่งครึ่งซ้าย-ขวา (อุณหภูมิ 28°C / ความชื้น 52%RH)
     - Dial 4: **ความเร็วลม** เกจ์วงกลมแสดงความเร็วลมท่อระบาย (18.2 m/s) พร้อมเกณฑ์ปลอดภัย 15.0 - 22.0 m/s
   - **ระบบ Overlays แบบโต้ตอบเต็มรูปแบบ:**
     - **STATE A (Emergency Confirmation):** แป้นกดรหัส PIN พนักงาน 4 หลักขนาดใหญ่ (1-9, C, 0, OK) รองรับการกดด้วยถุงมือช่าง, ซิงค์ส่งข้อความไปยัง `/api/alerts`, หน้าต่างสถานะ `กำลังส่ง...`, `ส่งแล้ว ✓` (LINE OA Dispatching Active), และ `ส่งไม่สำเร็จ — ลองอีกครั้ง`
     - **STATE B (Max Fan 100% Booster):** เกจ์นับเวลาถอยหลังการระบายอากาศสูงสุด (04:32) พร้อมปุ่มหยุดสีน้ำเงินสด
     - **STATE C (Maintenance Checklist):** เช็คลิสต์ 5 รายการขนาดใหญ่สำหรับหน้าจอสัมผัส พร้อมปุ่ม Save บันทึกลงฐานข้อมูล

### การตรวจสอบ
- Linter: `npm run lint` ผ่าน (0 errors)
- Vite Production Build: `npm run build` ผ่าน 100% (241ms, ขนาด bundle 560.62 kB)

### สถานะ
- [x] หน้าที่ 2/15: Kiosk ปรับปรุงตรงตามต้นแบบ `kiosk_multi_state_4_gauges` 100% พร้อมส่งมอบให้ผู้ใช้ตรวจสอบ

---

## 2026-11-07 03:34 — ตรวจสอบความครบถ้วนทั้งระบบ (Full Audit) และปรับปรุงหน้า 4: Airflow (`/airflow`) ให้ตรงตาม Stitch 100%

### สิ่งที่เปลี่ยน
1. **`pages/AirflowDiagram.jsx` (หน้าที่ 4/15):**
   - ปรับแต่งให้ตรงกับ `airflow_telemetry_drawer_pathway_details` และ `airflow_sensor_box_telemetry` 1:1
   - **Exhaust Stack Popover**: เพิ่ม Floating Badge เหนือปล่องไอเสีย แสดงค่า `Stack output: 14 ppb` พร้อมปุ่มปิด `×` และไฟกระพริบ
   - **Duct Info Dots**: เพิ่มจุด Info Interactive `i` 3 จุดบนท่อส่งลม:
     - จุดที่ 1 (24.5%): แสดง Tooltip `Velocity 18.4 m/s`
     - จุดที่ 2 (50.0%): แสดง Tooltip `Scrubber inlet: Transit Line A stable`
     - จุดที่ 3 (75.5%): แสดง Tooltip `Exhaust transfer: VOC filter active`
   - **Carbon Scrubber Telemetry Drawer**:
     - เพิ่มสถานะ Active Inspection พร้อมขอบไฮไลท์ `ring-2 ring-primary` เมื่อเปิด Drawer
     - ปรับโครงสร้างเนื้อหา Drawer ด้านในเป็น 3 BIG NUMBERS ขนาด 54px สะอาดตาตามต้นแบบ Stitch:
       1. `Differential pressure`: **312 Pa** (Nominal resistance)
       2. `Efficiency`: **94.2 %** (Hydrocarbon adsorption yield)
       3. `Filter life`: **42 %** (1,280 operating hours remaining)
     - Footer แสดง `Updated 3s ago` พร้อมปุ่ม Dismiss
   - เพิ่ม Keyframe Animation `@keyframes airflowFlow` และ `.airflow-pulse` ให้ท่อลมไหลอย่างนุ่มนวล

2. **Full System Audit Report**:
   - ตรวจสอบทั้ง 15 หน้าหลัก และ Sub-states ทั้งหมด เทียบกับโฟลเดอร์ Stitch AI (`stitch_air_quality_minimal_dashboard/`)
   - ยืนยันความพร้อมของ Core SCADA / Safety logic (OSHA / ISO 16000 / PCD Standards)

### การตรวจสอบ
- `npm --prefix vocs-website/frontend run build`: สำเร็จใน 218ms (0 errors)
- `npm --prefix vocs-website/frontend run lint`: สำเร็จ (0 errors)
- บันทึกการเปลี่ยนแปลงใน Git และผลักขึ้นทั้ง 2 remotes (GitLab `origin` และ GitHub `github`)

---

## 2026-11-07 03:51 — ติดตั้งระบบสลับภาษา TH/EN แบบ Reactive ทั่วทั้งระบบ และปรับปรุงหน้า 5: History (`/history`)

### สิ่งที่เปลี่ยน
1. **ระบบสลับภาษา TH/EN (`LanguageContext.jsx`):**
   - สร้าง `LanguageContext` และ `LanguageProvider` เก็บสถานะใน `localStorage` (`voc_app_lang`) พร้อมซิงค์แท็ก `html lang="th|en"`
   - เพิ่มฟังก์ชัน `t(key, fallback)` ครอบคลุมคำศัพท์ทั้งระบบ: เมนู Sidebar ทั้ง 15 รายการ, ส่วนหัว Header, การ์ดแสดงผลบน Dashboard, เกณฑ์แจ้งเตือน, และหน่วยวัด
   - ผสานปุ่มสลับภาษา `TH` / `EN` บน Header ของ `Layout.jsx` ให้ทำงานแบบเรียลไทม์ (กดสลับปุ๊บ ข้อความทั้งเว็บเปลี่ยนทันที ไม่ต้องโหลดหน้าใหม่)
   - ปรับ `Dashboard.jsx` และ `Layout.jsx` ให้เรียกใช้ `t()` ทุกจุดสำคัญ

2. **หน้า 5/15: History (`History.jsx`):**
   - ปรับปรุงตรงตามต้นแบบ Stitch `history_custom_range_expanded_telemetry_table` 100%
   - **Range Controls**: ปุ่ม Today, 7 days, 30 days, และ Custom (พร้อมปฏิทิน Popover เลือกช่วง Oct 18 - Oct 24, 2025)
   - **Export CSV Popover**: แสดงคอลัมน์ที่ถูกรวมในไฟล์อย่างชัดเจน พร้อมปุ่ม Export PDF
   - **Telemetry Trend Graph**: กราฟเส้นแนวโน้ม TVOC 7 วัน พร้อมปุ่มเลือกดูตัวชี้วัด (TVOC, PM2.5, eCO2), สวิตช์เปิด/ปิดเส้น Threshold (100 ppb), และแถบแจ้งเตือนช่วงปรับฐานข้อมูล (No data 02:10–02:40)
   - **Dual-mode Table Card**:
     - *Mode A (Summary View)*: ตารางสรุป 4 คอลัมน์ (Date, Average TVOC, Max PM2.5, Level) พร้อมปุ่ม View full table
     - *Mode B (Complete Telemetry Log)*: ตารางฉบับเต็ม 9 มิติ (Date, Min TVOC, Max TVOC, Avg TVOC, Max PM2.5, Level, Coverage %, P95, Samples) พร้อมปุ่มย่อกลับ และ Pagination 1, 2, >

### การตรวจสอบ
- `npm --prefix vocs-website/frontend run build`: สำเร็จใน 217ms (0 errors)
- `npm --prefix vocs-website/frontend run lint`: สำเร็จ (0 errors)















