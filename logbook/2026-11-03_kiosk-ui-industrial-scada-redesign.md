# 2026-11-03 — Kiosk UI Industrial SCADA Redesign & Frontend Polish

## สรุป
ปรับปรุงหน้าจอ Kiosk หน้างาน (`/kiosk`) จากเดิมที่เป็นดีไซน์ม็อคอัพสีดำเข้มติดกรอบที่มีปุ่มและไอคอนอีโมจิแนว AI template ให้กลายเป็นหน้าจอ Industrial SCADA / Shopfloor Operator Terminal มาตรฐานอุตสาหกรรม โดยผสานเข้ากับ Light Industrial Design System ของระบบอย่างไร้รอยต่อ พร้อมทั้งเพิ่มตัวเลือก "โหมดเต็มจอหน้างาน (Fullscreen Terminal)" สำหรับติดตั้งบนแท็บเล็ต/จอทัชสกรีน และปรับปรุงไอคอนและ UI ในหน้า Alerts, Airflow Diagram และ Settings ให้เป็นมืออาชีพ

## สิ่งที่เปลี่ยน
1. **`vocs-website/frontend/src/pages/Kiosk.jsx`**:
   - นำกล่องสีดำ `#090d16` และแถบหัวบนที่ซ้ำซ้อนออก ให้กลมกลืนกับ Layout ของระบบ
   - เพิ่ม **Live Shopfloor Telemetry Strip**: แสดงค่าสถานะ AI Air Status (Ambient/Safe vs Warning), TVOC (ppb), eCO₂ (ppm), PM2.5 (µg/m³), อุณหภูมิ, ความชื้น และระดับพัดลมระบายอากาศ Exhaust แบบเรียลไทม์
   - ปรับปรุง **Industrial Action Controls**: ปุ่มแจ้งเหตุฉุกเฉินสารเคมีรั่วไหล (Crimson), ปุ่มเร่งพัดลมดูดระบายอากาศ Boost 100% (Sky/Blue) พร้อมตัวเลขนับถอยหลัง 5 นาที, และปุ่มเปิดบันทึกตรวจเช็คประจำกะ (Slate) ด้วยการใช้ Lucide SVG icons แทนอีโมจิ
   - ปรับปรุง **Live SLA Response Center**: ปรับแต่งคิวเหตุการณ์และแถบแสดงสถานะ 5 ขั้นตอน (Active -> Acknowledged -> In Progress -> Resolved -> Verified) พร้อมปุ่มกดขนาดใหญ่ที่ชัดเจน
   - เพิ่มฟังก์ชัน **Fullscreen SCADA Terminal Toggle**: สามารถกดขยายเต็มจอ (ซ่อน navigation bar) สำหรับหน้าจอสัมผัสติดผนังโรงงาน โดยสลับเป็นโหมด High-contrast Dark SCADA อย่างสวยงาม
2. **`vocs-website/frontend/src/pages/Alerts.jsx`**:
   - แทนที่อีโมจิ `🚨` และ `⏳` ในตาราง SLA Countdown ด้วย Lucide icons (`AlertOctagon`, `Clock`) และ Badge แบบ Minimal
3. **`vocs-website/frontend/src/pages/AirflowDiagram.jsx`**:
   - ปรับการแสดงผล Legend จากไอคอนอีโมจิ (`🌿`, `🔵`, `🟡`, `🔷`, `🤖`, `⬛`) เป็น Lucide SVG components พร้อมชิปกรอบการ์ดสไตล์อุตสาหกรรม
4. **`vocs-website/frontend/src/pages/Settings.jsx`**:
   - เปลี่ยนหัวข้อเกณฑ์การแจ้งเตือนจากอีโมจิ `🚨` เป็น SVG icon `ShieldAlert`

## เหตุผลและผลกระทบ
- **เหตุผล**: หน้าเดิมดูเป็นเทมเพลต AI ทั่วไปที่มีคอนเทนเนอร์สีดำซ้อนในหน้าเว็บสีสว่าง ขาดการแสดงผลค่าเซนเซอร์จริง และใช้อีโมจิที่ลดทอนความเป็นมืออาชีพของระบบตรวจวัดคุณภาพอากาศโรงงาน
- **ผลกระทบ**: หน้าจอ Kiosk ใช้งานได้จริงบน Touchscreen หน้างาน ควบคุมพัดลมฉุกเฉินได้รวดเร็ว ดูตัวเลขก๊าซ TVOC/eCO₂ ได้ทันที และหน้าเว็บทั้งหมดมีความสอดคล้องด้าน Visual Identity

## การตรวจสอบ
- ตรวจสอบการคอมไพล์ด้วย `npm --prefix vocs-website/frontend run build` ผ่าน 100% ไม่มีข้อผิดพลาด
- ตรวจสอบการแสดงผลทั้งในโหมดปกติ (Light theme ใน app shell) และโหมดเต็มจอ (Fullscreen Terminal)

## สถานะ
- [x] ออกแบบและเขียนโค้ด `Kiosk.jsx` ใหม่สมบูรณ์
- [x] ปรับแก้ไอคอนใน `Alerts.jsx`, `AirflowDiagram.jsx`, `Settings.jsx`
- [x] ทดสอบการ Build ผ่านเรียบร้อย
- [x] เตรียม Commit และ Push ขึ้นทั้ง GitLab และ GitHub
