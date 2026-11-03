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

