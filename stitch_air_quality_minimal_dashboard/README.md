# VOC / E-Nose UI Specification (Stitch AI Export)

โครงสร้างโฟลเดอร์สำหรับระบบ UI ถูกแบ่งออกเป็น **หน้าหลัก (Main Pages / Routes)** และ **State ย่อย (Sub-states / Components)** ตามสถาปัตยกรรม Component-driven development สอดคล้องกับชุดออกแบบล่าสุดจาก Stitch AI:

```
stitch_air_quality_minimal_dashboard/
├── DESIGN.md                      # Design Tokens, Color Palette, Typography & Radius
├── design_system/                 # Atmospheric Intelligence Design Specs
│   └── atmospheric_intelligence/
│
├── main_pages/                    # หน้าหลักตาม Route การทำงาน
│   ├── dashboard/                 # / (Main Real-time Telemetry Dashboard)
│   ├── kiosk/                     # /kiosk (Touchscreen Emergency & Checklist View)
│   ├── alerts/                    # /alerts (Incident Response Center & SLA)
│   ├── airflow/                   # /airflow (Plant Ventilation & Scrubber Schematic)
│   ├── devices/                   # /devices (ESP32 Nodes & Gateway Grid)
│   ├── history/                   # /history (Air Quality Historical Telemetry)
│   ├── emissions_report/          # /emissions (Regulatory Factory Compliance & Stack Audit)
│   ├── maintenance/               # /maintenance (Consumables Health & Calibration Log)
│   ├── data_collection/           # /data-collection (E-Nose Dataset Sampling & Labeling)
│   ├── settings/                  # /settings (5 Tabs: Thresholds, SLA, LINE, Messaging API, General)
│   ├── air_quality_guide/         # /air-quality-guide (OSHA / ISO 16000 Chemical Safety Reference)
│   ├── air_quality_index/         # /aqi-info (Air Quality Index Calculation & Category View)
│   ├── login/                     # /login (Clean Minimal Sign-in Portal)
│   ├── user_guide/                # /guide (User Guide: Sensor Wiring & Safety Protocol)
│   ├── roles/                     # /roles (Industrial Policy & Access Permissions Matrix)
│   └── system_states/             # /system-states (UI Component States & Fallback Patterns)
│
└── sub_states/                    # State ย่อยที่ต้องแยกทำเป็น Component (Drawer, Modal, Dropdown)
    ├── dashboard/
    │   └── dashboard_drawer_telemetry_modal_radar/  # Drawer live telemetry (520px) & 8-channel radar modal
    ├── kiosk/
    │   └── kiosk_multi_state_4_gauges/              # Modal ยืนยันเหตุฉุกเฉิน, ตัวนับถอยหลังเร่งพัดลม 5 นาที, Checklist กะ
    ├── alerts/
    │   └── alerts_incident_detail_with_sla_owner/   # Side panel รายละเอียด Incident และบันทึก SLA
    ├── airflow/
    │   ├── airflow_telemetry_drawer_pathway_details/# Drawer แสดงค่าละเอียดท่อลมและตัวกรองถ่านกัมมันต์
    │   └── airflow_sensor_box_telemetry/            # Overlay / Drawer ตรวจสอบกล่องเซนเซอร์ประจำทางเดินลม
    ├── devices/
    │   ├── devices_esp32_node_01_drawer/            # Drawer ตรวจสอบสถานะบอร์ด ESP32 / RSSI / Sensors
    │   ├── devices_node_01_drawer_ota_modal/        # Modal อัปเดตเฟิร์มแวร์ Over-The-Air (OTA)
    │   └── devices_esp32_node_01_drawer_diagnostics/# Drawer วินิจฉัยฮาร์ดแวร์ / ADC noise / I2C bus health
    ├── history/
    │   └── history_custom_range_expanded_telemetry_table/ # ตารางขยายผลลัพธ์การกรองช่วงวันแบบละเอียด
    ├── emissions_report/
    │   └── emissions_report_solvent_breakdown_pcd_audit/  # Modal / Drawer แจกแจงชนิดตัวทำละลายและหลักฐาน Audit
    ├── maintenance/
    │   └── maintenance_table_columns_add_log_drawer/# Drawer บันทึกใบงานเปลี่ยนไส้กรองและสอบเทียบ
    ├── data_collection/
    │   └── data_collection_dropdown_open_past_sessions_table_stop_state/ # Dropdown เลือกสารเคมี & ตารางเซสชันในอดีต
    ├── settings/
    │   ├── settings_notifications_users_tabs/       # แท็บสลับการตั้งค่าแจ้งเตือน และจัดการสิทธิ์ผู้ใช้งาน
    │   └── settings_5_tabs_sla_line_messaging_api_general/ # แผงตั้งค่า 5 แท็บ: Thresholds, SLA, LINE, API, General
    ├── air_quality_guide/
    │   ├── air_quality_guide_level_detail_modal_1/  # Modal แสดงข้อแนะนำสุขภาพและการใช้อุปกรณ์ PPE ประจำระดับสี (Reference)
    │   ├── air_quality_guide_level_detail_modal_2/  # Modal แสดงข้อแนะนำสุขภาพและการปฏิบัติตามเกณฑ์ AQI
    │   ├── air_quality_guide_calculator_modal/      # Modal เครื่องคำนวณและแปลงค่าความเข้มข้นสารเคมี
    │   └── air_quality_guide_calculation_modal/     # Modal แสดงสมการและวิธีการคำนวณดัชนี
    └── login/
        └── login_2_interactive_states/              # หน้า Sign-in พร้อม State Switcher Pills (Default, Error, Loading, Locked)
```
