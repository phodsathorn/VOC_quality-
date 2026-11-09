# 2026-11-09 — Frontend Architecture Modularization & Reusability Refactor

## สรุป
ทำการจัดระเบียบโค้ดส่วน Frontend ทั้งระบบตามคำสั่งผู้ใช้ โดยขจัด Dead Code (~950 บรรทัด), สกัด Shared UI & Centralized Services, นำ Route-Level Lazy Loading มาใช้เพื่อลดขนาด Main Bundle จาก 770 kB เหลือ 270 kB, และแตก Page Monoliths ขนาดใหญ่ (Settings, Maintenance, Devices, Alerts, Dashboard, Airflow, Layout) ออกเป็น Sub-components ย่อยที่นำกลับมาใช้ซ้ำได้ โดยรักษาฟังก์ชันการทำงาน สเปก และลอจิกเดิมครบถ้วน 100%

## สิ่งที่เปลี่ยน
1. **ลบ Dead Code**:
   - ลบ `vocs-website/frontend/src/mockApi.js` (522 บรรทัด - โค้ด mock fetch ที่ไม่ได้เรียกใช้)
   - ลบ `vocs-website/frontend/src/components/LoginModal.jsx` (429 บรรทัด - โค้ดเก่าที่ถูกแทนที่ด้วย `LoginPage.jsx`)
2. **แยกพจนานุกรมภาษา (Localization Decoupling)**:
   - สกัดพจนานุกรมคำแปล TH และ EN ขนาด 1,300 บรรทัดออกจาก `LanguageContext.jsx` ไปยัง `src/locales/th.js` และ `src/locales/en.js`
   - ลดขนาด `LanguageContext.jsx` จาก 1,312 เหลือ 45 บรรทัด
3. **สร้าง Centralized Services & Shared Components**:
   - `src/services/apiClient.js`: API Client กลางรองรับ Auth Bearer injection, AbortController timeout, and standard REST methods
   - `src/hooks/usePolling.js`: Hook กลางสำหรับจัดการ Data Polling + LocalStorage Caching
   - `src/components/ui/StatusBadge.jsx`: ป้ายสถานะจุดสัญญาณไฟมาตรฐาน (Online/Offline/Active/Resolved)
   - `src/components/ui/Tabs.jsx`: แท็บสลับหน้าจอมาตรฐาน (Pills & Underline)
   - `src/components/ui/ConfirmModal.jsx`: Modal ยืนยันการกระทำ (Reboot, Delete, Acknowledge)
4. **แตก Sub-components ของ Pages ยักษ์**:
   - `Settings.jsx` (1,327 ➔ 339 บรรทัด): แตกเป็น `ThresholdsTab`, `NotificationsTab`, `SlaTab`, `UsersTab`, `GeneralTab`, `UserModals`
   - `Maintenance.jsx` (1,139 ➔ 496 บรรทัด): แตกเป็น `SensorsTab`, `WorkOrdersTab`, `LogDrawer`, `WorkOrderDrawer`, `HistoryDrawer`, `CalibrationModal`
   - `Devices.jsx` (955 ➔ 418 บรรทัด): แตกเป็น `DeviceDrawer`, `DeviceTokenModal`, `DiagnosticsModal`, `OtaModal`
   - `Alerts.jsx` (865 ➔ 616 บรรทัด): แตกเป็น `IncidentDrawer`
   - `Dashboard.jsx` (1,072 ➔ 826 บรรทัด): แตกเป็น `TelemetryDrawer`, `SolventRadarModal`
   - `AirflowDiagram.jsx` (935 ➔ 741 บรรทัด): แตกเป็น `CarbonScrubberDrawer`, `SensorBoxTelemetryDrawer`
   - `Layout.jsx` (506 ➔ 256 บรรทัด): แตกเป็น `SidebarNav`, `HeaderBar`, `AlertBanner`
5. **Route Code Splitting (Vite Bundle Optimization)**:
   - นำ `React.lazy()` และ `<Suspense fallback={<DashboardSkeleton />}>` มาใช้ใน `App.jsx`
   - ลดขนาด Initial JavaScript Bundle จาก **770.51 kB เหลือ 270.52 kB** (ลดลง 65%)

## เหตุผลและผลกระทบ
- **เหตุผล**: โค้ดเดิมกระจุกตัวเป็น Monolithic ไฟล์ละ 1,000+ บรรทัด มีโค้ดที่ไม่ได้ใช้งานปะปน และไม่มีการแยก Shared Component ทำให้แก้ไขยาก โหลดช้า และเสี่ยงต่อบั๊ก
- **ผลกระทบ**: หน้าเว็บโหลดเร็วขึ้นมาก โค้ดมีความเป็นโมดูลสูง อ่านง่าย แยกหน้าที่ชัดเจน (Single Responsibility Principle) โดยที่ URL Routes, State, ลอจิกการทำงาน, และหน้าตา UI ทั้งหมดยังคงตรงตามสเปกเดิม 100%

## การตรวจสอบ
- `npm run build`: ผ่านฉลุย 100% ไม่มี Chunk Size Warning อีกต่อไป (Build time ~180ms)
- `oxlint`: ผ่านการตรวจไวยากรณ์ (0 Errors)

## การตัดสินใจ/ข้อสมมติ
- เก็บ State การเชื่อมต่อและ Callback หลักไว้ที่ระดับ Page เพื่อไม่ให้กระทบ Flow การส่งข้อมูลระหว่าง Components
- ใช้ `apiClient` ควบคู่กับการเรียก API เพื่อความปลอดภัยและยืดหยุ่น

## งานค้างและขั้นตอนถัดไป
- หากต้องการทำ Backend ต่อ: แตก `backend/main.py` (4,790 บรรทัด) ออกเป็น `APIRouter` แยกไฟล์ตามหมวดหมู่

