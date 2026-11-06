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
- นำ Component ใหม่ๆ จาก Sub-states (เช่น Diagnostics Drawer, 5-Tabs Settings, Calculator Modal) ไปทยอยผสานลงใน React components ใน `vocs-website/frontend/`
