# 2026-11-03 — จัดระเบียบโฟลเดอร์หน้าหลักและ State ย่อยจาก Stitch AI

## สรุป
ทำการจัดหมวดหมู่โฟลเดอร์ UI ที่ได้จากการออกแบบและ Export บน Stitch AI (`stitch_air_quality_minimal_dashboard/`) โดยแยกเป็น 2 หมวดหมู่อย่างเป็นระเบียบ:
1. `main_pages/` สำหรับหน้าหลักตาม Route
2. `sub_states/` สำหรับ State ย่อยที่ต้องพัฒนาเป็น Component เสริม (เช่น Drawer, Modal, Expanded Table, Dropdown)

## สิ่งที่เปลี่ยน
- จัดระเบียบโฟลเดอร์ใน `stitch_air_quality_minimal_dashboard/`:
  - สร้าง `main_pages/` และย้าย 12 หน้าหลักเข้าสู่โฟลเดอร์:
    - `dashboard` (จาก `dashboard_1`)
    - `kiosk`
    - `alerts`
    - `airflow`
    - `devices`
    - `history`
    - `emissions_report`
    - `maintenance`
    - `data_collection`
    - `settings`
    - `air_quality_guide`
    - `login`
  - สร้าง `sub_states/` โดยจัดกลุ่มตามหน้าที่เป็นเจ้าของ Component:
    - `dashboard/dashboard_drawer_telemetry_modal_radar`
    - `kiosk/kiosk_multi_state_4_gauges`
    - `alerts/alerts_incident_detail_with_sla_owner`
    - `airflow/airflow_telemetry_drawer_pathway_details`
    - `devices/devices_esp32_node_01_drawer` และ `devices_node_01_drawer_ota_modal`
    - `history/history_custom_range_expanded_telemetry_table`
    - `emissions_report/emissions_report_solvent_breakdown_pcd_audit`
    - `maintenance/maintenance_table_columns_add_log_drawer`
    - `data_collection/data_collection_dropdown_open_past_sessions_table_stop_state`
    - `settings/settings_notifications_users_tabs`
    - `air_quality_guide/air_quality_guide_level_detail_modal`
  - ย้าย `atmospheric_intelligence` เข้าสู่ `design_system/atmospheric_intelligence`
  - สร้างไฟล์ `stitch_air_quality_minimal_dashboard/README.md` สรุปแผนผังโครงสร้างของไฟล์ทั้งหมด

## เหตุผลและผลกระทบ
- หน้าที่มีชื่อยาว ๆ เป็น State เพิ่มเติมของหน้าหลัก (Interactive overlays / Modals / Drawers) ไม่ใช่หน้า Route ใหม่ การแยกแบบนี้ทำให้สถาปัตยกรรมโค้ดและการนำไปแปลงเป็น React Component เป็นไปอย่างเป็นระบบ ไม่สับสนระหว่างหน้ากับชิ้นส่วนประกอบ

## การตรวจสอบ
- ตรวจสอบโครงสร้างไดเรกทอรีด้วยคำสั่ง find
- ครบถ้วนทุกไฟล์ (`code.html` และ `screen.png`) โดยไม่มีไฟล์หรือโฟลเดอร์สูญหาย

## การตัดสินใจ/ข้อสมมติ
- `dashboard_1` ถูกจัดเป็นหน้าหลัก `/` (`main_pages/dashboard`) ส่วน `dashboard_2` ที่มี Drawer และ 8-channel radar modal เปิดค้างไว้ ถูกจัดเป็น `sub_states/dashboard/dashboard_drawer_telemetry_modal_radar`

## งานค้างและขั้นตอนถัดไป
- นำ Design Tokens และ CSS Components จาก `code.html` ของแต่ละหน้าไปทยอยอัปเกรดหน้าจริงใน `vocs-website/frontend/`

