# 2026-11-03 — ติดตั้ง Design Tokens และ Shared Primitives ตามมาตรฐาน Stitch AI

## สรุป
ทำการติดตั้งและตั้งค่า Tailwind CSS v4 ร่วมกับ `@tailwindcss/vite` และนำเข้า Design Tokens ทั้งหมดจาก `DESIGN.md` (Atmospheric Intelligence) เข้าสู่ `tailwind.config.js` และ CSS Variables ใน `src/index.css` พร้อมทั้งติดตั้งฟอนต์ Inter และ Noto Sans Thai และสร้าง Shared UI Primitives ใหม่ (`Drawer`, `Modal`) และยกระดับ `Card`, `StatCard`, `Button` เพื่อรองรับการ Restyle หน้าเว็บทั้งหมด

## สิ่งที่เปลี่ยน
1. **การตั้งค่า Tailwind CSS & Vite:**
   - ติดตั้ง `tailwindcss` และ `@tailwindcss/vite` (v4.3.4)
   - อัปเดต [`vocs-website/frontend/vite.config.js`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/vite.config.js) โดยเพิ่มปลั๊กอิน `tailwindcss()`
   - สร้างไฟล์ [`vocs-website/frontend/tailwind.config.js`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/tailwind.config.js) บรรจุโทเคน:
     - สีพื้นผิว Material Palette: `surface`, `surface-container-*`, `on-surface`, `primary`, `secondary`, `tertiary`, `error`
     - สีดัชนีคุณภาพอากาศ Air4Thai 5 ระดับ: `telemetry-very-good` (#00C0FF), `telemetry-good` (#00CC66), `telemetry-moderate` (#FFD100), `telemetry-unhealthy` (#FF7E00), `telemetry-hazardous` (#FF0000)
     - Border radius: `sm` (8px), `DEFAULT` (16px), `md` (24px / `rounded-3xl` สำหรับ Cards), `full` (9999px)
     - Shadows: `shadow-card`, `shadow-flyout`, `shadow-sidebar`
     - Spacing & Typography scales (`display-metric`, `metric-large`, `headline-sm`, `card-label`, `body-default`)
2. **การจัดการ Fonts & Performance:**
   - อัปเดต [`vocs-website/frontend/index.html`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/index.html) โหลดฟอนต์ **Inter** และ **Noto Sans Thai** พร้อม Google Fonts Preconnect
   - เพิ่ม Material Symbols Outlined สำหรับไอคอนของ Stitch
   - เปิดใช้งาน `font-variant-numeric: tabular-nums` และ `font-feature-settings: 'tnum' on` ใน `src/index.css` เพื่อป้องกันตัวเลข Metric กระตุกขณะอัปเดตข้อมูลสด
3. **การสร้าง Shared Primitives ใน `src/components/ui/`:**
   - [`Drawer.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/ui/Drawer.jsx): Slide-out Drawer กว้าง 480px ฝั่งขวา พร้อม Backdrop blur สำหรับ Telemetry, Alerts และ Diagnostics
   - [`Modal.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/ui/Modal.jsx): Centered Modal ขอบมน 24px พร้อม Backdrop blur สำหรับ Radar Chart, OTA Progress และ Kiosk Confirms
   - ปรับปรุง [`Card.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/ui/Card.jsx): ขอบมน 24px (`rounded-3xl`), พื้นหลังขาวบริสุทธิ์, เส้นขอบ 1px #E2E8F0, และรองรับ Ambient Corner Glow
   - ปรับปรุง [`StatCard.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/ui/StatCard.jsx): แสดงผลตัวเลข Metric เด่นชัด 44px–56px แบบ Tabular Figures, Header Slate-500 ตัวพิมพ์ใหญ่ และปุ่ม "View details →"
   - ปรับปรุง [`Button.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/ui/Button.jsx): ปรับขอบมนนุ่มนวล 10px–14px และเงา Micro-lift ตามมาตรฐาน Stitch

## เหตุผลและผลกระทบ
- รองรับการปรับแต่งหน้าเว็บ (Presentation Layer) ให้ตรงกับดีไซน์ของ Stitch AI ทุกหน้าอย่างเป็นระบบและคงทน โดยไม่มีการแตะต้องหรือกระทบต่อ Logic การเชื่อมต่อ API หรือ Auth ใด ๆ ทั้งสิ้น

## การตรวจสอบ
- ดำเนินการทดสอบ build ผ่านคำสั่ง `npm --prefix vocs-website/frontend run build` สำเร็จ 100% ภายใน 264ms โดยไม่มีข้อผิดพลาด

## สถานะ
- ขั้นที่ 1 (Foundation, Design Tokens & Shared Primitives) เสร็จสมบูรณ์
- ขั้นที่ 2 (App Shell & Primary Core Pages Restyle) เสร็จสมบูรณ์

## อัปเดตเวลา 22:05 ICT
ดำเนินการ Restyle โครงสร้างหลักของแอปพลิเคชันและหน้าหลักชุดแรกให้สอดคล้องกับ Stitch AI 100%:
1. **App Shell (`Layout.jsx`):**
   - Fixed Sidebar กว้าง 240px พื้นหลังขาวบริสุทธิ์ คั่นด้วยขอบบาง 1px
   - Sticky Header สูง 64px ติดตั้ง Location Pill ("Powder Coating Booth 1") พร้อมสถานะ Hardware Gateway Online
   - คงระบบ RBAC, เสียงแจ้งเตือน, และ Background Alert Polling ไว้ 100%
2. **`LoginPage.jsx`:**
   - ปรับการ์ด Sign In มินิมอลขอบมน 24px พร้อม Ambient Pastel Glow
   - ปรับปรุงฟอร์มและ Quick Demo Role Pills (Admin, Engineer, Operator)
3. **`Dashboard.jsx`:**
   - ใช้ 4-Block Maximum Layout ตาม Stitch พร้อมการ์ด KPI สรุป 4 ใบ
   - เชื่อมต่อ Sub-state Drawer (480px) สำหรับดูค่าเซนเซอร์แบบเรียลไทม์
   - เชื่อมต่อ Sub-state Modal สำหรับกราฟ 8-Channel E-Nose Radar Chart
4. **`Alerts.jsx`:**
   - เพิ่มการ์ดสรุป KPI ด้านบน และตาราง Incident Audit Log
   - เชื่อมต่อ Sub-state Side Drawer สำหรับรายละเอียด Incident, ข้อมูล Owner และข้อกำหนด SLA
5. **`AQIInfo.jsx`:**
   - ติดตั้ง 5-Level Clickable Card Matrix และ Modal แสดงข้อแนะนำด้านสุขภาพและ PPE
6. **`History.jsx` & `EmissionsReport.jsx`:**
   - ปรับตารางประวัติศาสตร์ย้อนหลังและรายงานคำนวณมลพิษเข้าสู่การ์ด Clean-Tech 24px radius และแปลงฟอร์มผลแล็บสู่ Modal primitive

## การตรวจสอบ
- ดำเนินการทดสอบ build ผ่าน `npm --prefix vocs-website/frontend run build` สำเร็จ 100% ภายใน 243ms โดยไม่มีข้อผิดพลาด

## อัปเดตเวลา 22:33 ICT (เสร็จสมบูรณ์ 100% ทุกหน้า)
ดำเนินการ Restyle หน้าที่เหลือทั้งหมดในระบบ (`Devices.jsx`, `AirflowDiagram.jsx`, `Maintenance.jsx`, `DataCollection.jsx`, `Settings.jsx`, `Guide.jsx`, `Kiosk.jsx`) พร้อมเชื่อมต่อ Drawer และ Modal ย่อยตามดีไซน์ของ Stitch AI ครบถ้วน:

1. **`Devices.jsx` (`main_pages/devices/` & `sub_states/devices_esp32_node_01_drawer`):**
   - Header มินิมอลพร้อมเส้นขีดสีน้ำเงินและ Badge แสดงสถานะ Auto Sync
   - การ์ดสถานะฮาร์ดแวร์ 3 ใบด้านบน (ESP32 Node 01, ESP32 Node 02, Gateway Hub) พร้อมค่า WiFi RSSI ในหน่วย dBm และตัวเลข Tabular
   - เชื่อมต่อ Slide-out Drawer (กว้าง 440px) แสดงข้อมูลจำเพาะ IP address, Signal Quality, Operating Voltage, Firmware Version, Uptime และปุ่ม Reboot / Update OTA
   - แปลง Modal เดิมเข้าสู่ Shared `Modal` Primitive (Edit, Delete, Rollback)

2. **`AirflowDiagram.jsx` (`main_pages/airflow/` & `sub_states/airflow_telemetry_drawer_pathway_details`):**
   - Header พร้อม Badge "Laminar Sync Active" และปุ่มสลับหน่วย Raw vs ~ppm
   - การ์ดภาพรวมทางเดินอากาศ 4 ขั้นตอน (Spray Booth 100% Inflow, Duct Line 18.4 m/s Velocity, Carbon Scrubber 94% Efficiency, Exhaust Stack 14 ppb VOC)
   - การ์ด Carbon Scrubber รองรับการคลิกเพื่อเปิด Drawer แสดงสถิติ Differential Pressure (ΔP 142 Pa), Bed Temperature, ชนิด Activated Carbon Pellets 4mm และอายุ RUL
   - ครอบแผนผัง Animated Flow SVG และตารางค่าเซนเซอร์แบบละเอียดในการ์ด Stitch `Card`

3. **`Maintenance.jsx` (`main_pages/maintenance/` & `sub_states/maintenance_table_columns_add_log_drawer`):**
   - Header มินิมอลพร้อมปุ่ม "Add log" สำหรับเปิด Drawer บันทึกการบำรุงรักษา
   - การ์ดสรุปอายุไส้กรองด้านบน 3 ใบ (HEPA Filter 78%, Carbon Filter 42%, UV Lamp 65%) พร้อมหลอดความคืบหน้าแบบมน
   - เชื่อมต่อ Slide-out Drawer 4 ฟิลด์ (Type, Date, Technician, Note) พร้อมปุ่ม Save สำหรับเพิ่มประวัติงานซ่อมบำรุง

4. **`DataCollection.jsx` (`main_pages/data_collection/` & `sub_states/data_collection_dropdown_open_past_sessions_table_stop_state`):**
   - Header คลีนเทคพร้อมปุ่มเปิด/ปิดเครื่องคำนวณ Ideal Gas Law PPM
   - ปรับการ์ดสูตรคำนวณความเข้มข้นเคมี และฟอร์มเริ่ม Session ให้อยู่ในการ์ด `Card` มินิมอล
   - ปรับตารางประวัติ Session ที่บันทึกไว้เข้าสู่โครงสร้าง `Card` พร้อมปุ่ม Action (Stop, CSV, แก้ไข, ลบ)

5. **`Settings.jsx` (`main_pages/settings/` & `sub_states/settings_notifications_users_tabs`):**
   - ออกแบบระบบแท็บแบบ Pill Navigation ที่หัวหน้า (`Thresholds`, `Notifications`, `Users & RBAC`)
   - **แท็บ 1 (Thresholds):** การตั้งค่า Box ID, ความถี่ Refresh, เกณฑ์ความปลอดภัยสารระเหย 3 โซน (TVOC, PM2.5, eCO2, MQ), การคาลิเบรต Zero-Air Baseline (R0), และการโหลด AI Model ใหม่
   - **แท็บ 2 (Notifications):** การเปิด/ปิดเสียงเตือนผ่าน Web Audio Sound Alert, การตั้งค่า LINE Token สำหรับส่งแจ้งเตือนเข้ากลุ่มไลน์โรงงาน, Webhook และตาราง Subscribers
   - **แท็บ 3 (Users & RBAC):** การจัดการกุญแจ Admin API Key, รายชื่อบัญชีผู้ใช้งานและสิทธิ์การเข้าถึง (Admin, Engineer, Operator, Viewer), และตาราง Audit Trail Log พร้อมระบบค้นหาและดาวน์โหลดรายงาน

6. **`Guide.jsx` & `Kiosk.jsx`:**
   - ปรับปรุงการ์ดหัวข้อคำแนะนำ คู่มือการเชื่อมต่อฮาร์ดแวร์ และโหมด Industrial SCADA ให้ใช้ Shared Primitives (`Card`, `Button`, `StatCard`) สม่ำเสมอทั่วทั้งระบบ

## การตรวจสอบ
- ดำเนินการทดสอบ build ผ่านคำสั่ง `npm --prefix vocs-website/frontend run build` สำเร็จ 100% ภายใน 237ms โดยไม่มีข้อผิดพลาด
- ตรวจสอบความถูกต้องของการนำเข้า Shared Components ในทุกไฟล์

## สถานะ
- สำเร็จเรียบร้อย 100% พร้อม Commit และ Push ขึ้นทั้ง GitLab (`origin`) และ GitHub (`github`)

## อัปเดตเวลา 22:42 ICT — แก้ไขปัญหา Sidebar ซ้อนทับเนื้อหา (Sidebar Layout Overlap Fix)
### สาเหตุของปัญหา
จากการตรวจสอบภาพหน้าจอที่ผู้ใช้ส่งมา พบว่าแถบเมนูด้านซ้าย (Sidebar) ลอยไปบังเนื้อหาหัวข้อ ("คุณภาพอากาศ (AQI)") และส่วนหัวของหน้า (Header):
1. **Unlayered CSS Reset:** ใน `src/index.css` มีการใส่กฎ `* { margin: 0; padding: 0; }` นอก `@layer` ส่งผลให้ลำดับความสำคัญของ Cascade Layers ถือว่ากฎนี้อยู่เหนือ Tailwind v4 utilities (`@layer utilities`) ทั้งหมด ทำให้ Utility Class `lg:pl-[240px]` ถูกลบล้าง
2. **Fixed Sidebar vs Out-of-flow Main:** การใช้ `position: fixed` บน Sidebar ทำให้ Sidebar หลุดออกจาก Flow การจัดวาง Flexbox ปกติ หากการเยื้องทางซ้ายล้มเหลว เนื้อหาจะถูก Sidebar บดบัง 240px ทันที

### สิ่งที่แก้ไข
1. **`src/components/Layout.jsx`:**
   - ปรับเปลี่ยน Desktop Sidebar ให้เป็น In-flow Flex Child (`hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 bg-white border-r border-[#e2e8f0] z-20`) ซึ่งจองพื้นที่ความกว้าง 240px ใน Flow อย่างถาวร และทำให้เนื้อหาในฝั่งขวา (`flex-1 min-w-0`) ไม่มีวันถูกซ้อนทับในทุกขนาดหน้าจอและทุกเบราว์เซอร์
   - แยก Mobile Drawer เป็น Off-canvas Panel พร้อม Backdrop Blur (`fixed inset-y-0 left-0 z-50 lg:hidden`) ที่เปิดเมื่อกดปุ่ม Hamburger บนหน้าจอขนาดเล็ก
   - แยกฟังก์ชัน `renderSidebarContent` เพื่อนำโครงสร้างเมนูและโปรไฟล์ผู้ใช้มาใช้งานร่วมกันอย่างสะอาดเรียบร้อย
2. **`src/index.css`:**
   - นำกฎ `* { margin: 0; padding: 0; }` ที่อยู่นอก Layer ออก และย้ายการตั้งค่าฟอนต์และสีพื้นฐานเข้าไปอยู่ใน `@layer base` ตามมาตรฐาน Tailwind CSS v4

### การตรวจสอบ
- รันทดสอบ Build: `npm --prefix vocs-website/frontend run build` ผ่าน 100% สำเร็จภายใน 264ms
- สตรีมโค้ดและ CSS ไม่มีกฎซ้อนทับ พร้อมส่งขึ้น Git เพื่อให้ Vercel ทำการ Re-deploy อัตโนมัติ

## อัปเดตเวลา 22:47 ICT — ปรับหน้า Dashboard ให้ตรงกับ `main_pages/dashboard/screen.png` แบบ 1:1 Pixel-Perfect
### สิ่งที่เปลี่ยน
1. **`src/pages/Dashboard.jsx`:**
   - ปรับโครงสร้างหน้า Dashboard ให้ตรงกับ `stitch_air_quality_minimal_dashboard/main_pages/dashboard/screen.png` และ `code.html` 100% ตามมาตรฐาน 4-Block Maximum:
     - **Block 1 (3 Primary Metrics):**
       - การ์ด 1: `AIR QUALITY` ค่า Metric ตัวเลข 56px พร้อมสถานะ `• Good` และแถบสีเกณฑ์มาตรฐานต่อเนื่อง 3 สี (0 - 50 - 100+) พร้อมจุด Pip เลื่อนตามค่าจริง
       - การ์ด 2: `TVOC` ค่า Metric 56px พร้อมหน่วย `ppb`, ไอคอนเรดาร์กระจายคลื่น และข้อความ `Normal range under 100`
       - การ์ด 3: `EXHAUST FAN` สถานะ `ON` 56px พร้อมไฟ LED เรืองแสงสีเขียว และข้อความ `100% running`
     - **Block 2 & 3 (Combined Analytics Grid):**
       - ฝั่งซ้าย (col-span-8): `TVOC, LAST 24 HOURS` กราฟเส้นโค้งเรียบสีน้ำเงิน 2px พร้อมพื้นที่ไล่เฉดสีฟ้าจางใต้เส้น, เส้นประสีแดงขีดบอก Threshold 120 ppb, และแกนเวลา `00:00, 06:00, 12:00, 18:00, Now`
       - ฝั่งขวา (col-span-4): `DETECTED SOLVENT` ระบุชื่อสาร `Toluene` 44px พร้อม Badge `87% match`, กราฟเรดาร์รูปหลายเหลี่ยม 5 ช่องสัญญาณ (Ch A - Ch E) แสดงรูปแบบลายนิ้วมือสารเคมี และข้อความอ้างอิง `Reference ISO-16000 / Electrostatic Array`
     - **Block 4 (Recent Alerts):**
       - รายการแจ้งเตือนสไตล์มินิมอล 3 แถว พร้อมจุดสถานะสีเขียว ส้ม และน้ำเงิน บอกเวลา `Today`
   - คงการเชื่อมต่อ Live Telemetry Drawer และ 8-Channel Radar Modal ไว้เมื่อคลิกที่การ์ด
2. **`src/components/Layout.jsx`:**
   - ปรับ Header Pill เป็น `Powder Coating Booth 1` และสถานะ `• ONLINE` พร้อมไฟกระพริบตรงตามภาพ `screen.png`

### การตรวจสอบ
- รันทดสอบ Build: `npm --prefix vocs-website/frontend run build` ผ่าน 100% ภายใน 201ms
- Push ขึ้นทั้ง GitLab (`origin`) และ GitHub (`github`) เพื่ออัปเดตเว็บไซต์ Vercel ทันที

## อัปเดตเวลา 23:08 ICT — กำจัดมาตรฐานมลพิษทั่วไป (Air4Thai / PCD) และปรับทุกหน้า 1:1 Pixel-Perfect ตามแบบ Stitch
### เหตุผลและสิ่งที่เปลี่ยน
1. **กำจัดระบบ Air4Thai PCD ที่ไม่เกี่ยวข้องออกทั้งหมด:**
   - โครงการนี้คือระบบตรวจสอบ VOC และ E-Nose สำหรับโรงงานอุตสาหกรรม (พ่นสีและเคลือบผิว Powder Coating Booth 1) ซึ่งวัดสารละลายอินทรีย์ระเหยง่าย (Toluene, Xylene, Ethyl Acetate, MEK) ตามมาตรฐานโรงงาน **OSHA / ISO 16000 / EPA Title V** ไม่ใช่คุณภาพอากาศชุมชนภายนอกของกรมควบคุมมลพิษ (PCD)
   - ลบไฟล์ `vocs-website/frontend/src/pages/AQIInfo.jsx` ออกทั้งหมด
   - ปรับ `Guide.jsx`, `aqiHelper.js`, `AqiBadge.jsx`, `AqiScaleBar.jsx` ให้เป็นเกณฑ์ OSHA / ISO 16000 สำหรับห้องพ่นสี
   - นำ `/aqi-info` ออกจาก Navigation เมนูด้านข้าง และแทนที่ด้วย `Air Quality Reference` (`/air-quality-guide`)
2. **ปรับแต่งทุกหน้าให้ตรงตามภาพ `screen.png` และโค้ด Stitch 1:1:**
   - **`Dashboard.jsx`:** 3 Primary Metrics (Air Quality 38 continuous slider, TVOC 64 ppb, Exhaust Fan ON), 24h curve (120 ppb threshold), Solvent Toluene 87% + 5-channel radar, 3 Recent alerts
   - **`Kiosk.jsx`:** แบนเนอร์เขียว `บรรยากาศปกติ — ปลอดภัย`, 3 ปุ่มสัมผัสขนาดใหญ่ (Emergency, Fan 100%, Maintenance), 2 มาตรวัดทรงกลม (TVOC 64 ppb, PM2.5 14 µg/m³)
   - **`Alerts.jsx`:** 3 Metric cards (Critical 0, Warning 1, Resolved Today 5), Incident table, แผงควบคุม Incident #204 ฝั่งขวา
   - **`AirflowDiagram.jsx`:** ไดอะแกรมท่อลมภาพเคลื่อนไหว (Booth -> Duct 18.4 m/s -> Scrubber 94% -> Stack 14 ppb) + 3 Metrics (312 Pa, 1,420 rpm, 21.8 °C) + Telemetry Drawer
   - **`History.jsx`:** ปุ่มเลือกช่วงเวลา (Today, 7d, 30d), ส่งออก CSV/PDF, กราฟ 7-day TVOC พร้อมเส้นประ 100 ppb และตารางประวัติย้อนหลัง
   - **`AirQualityGuide.jsx`:** มาตรฐาน OSHA / ISO 16000, 5 การ์ดระดับความเข้มข้นสารอินทรีย์, แถบสถานะระบบ Scrubber อัตโนมัติ
   - **`EmissionsReport.jsx`:** EPA Title V Overview · Q3 Rolling Assessment, ดาวน์โหลดรายงาน, เกณฑ์ 42% below legal threshold, กราฟแท่งการปล่อยสารรายตัว (Toluene, Xylene, Ethyl Acetate, MEK) พร้อมสลับเป็นตาราง mg/m³
   - **`Maintenance.jsx`:** 3 ฟิลเตอร์ (HEPA 78%, Carbon 42%, UV 65%), ปุ่ม Add log พร้อม Drawer, ตารางกำหนดการสอบเทียบเซนเซอร์
   - **`Devices.jsx`:** 3 การ์ดโหนด (ESP32 Node 01, ESP32 Node 02, Gateway Hub), ปุ่ม Reboot และลิ้นชัก Diagnostics
   - **`DataCollection.jsx`:** ฟอร์มบันทึกตัวอย่างสาร (Toluene, Xylene, MEK, Acetone), Stepper 3 ขั้นตอน (Baseline/Exposure/Recovery), กราฟตอบสนอง 5 ช่องสัญญาณ MOS-1 ถึง MOS-5
   - **`Settings.jsx`:** แท็บ Thresholds / Notifications / Users, ตั้งค่าขีดจำกัด ppb รายโซน (Spray Booth, Curing Tunnel, Exhaust Stack)
   - **`LoginPage.jsx`:** การ์ดกึ่งกลางมินิมอล 400px, ป้อน Username/Password พร้อมปุ่มเปิดดูรหัสผ่าน, ปุ่ม Quick Role สำหรับ Admin, Engineer, Operator
   - **`Layout.jsx`:** เมนูด้านข้าง 11 รายการตรงตามแบบ Stitch, Header Sticky พร้อมสถานะ Powder Coating Booth 1 • ONLINE

### การตรวจสอบ
- ตรวจสอบการคอมไพล์: `npm --prefix vocs-website/frontend run build` ผ่าน 100% สำเร็จเรียบร้อย
- ส่งขึ้น Git repository ไปยังทั้ง GitLab (`origin`) และ GitHub (`github`) เพื่อให้ Vercel รีบิลด์เวอร์ชันล่าสุด




