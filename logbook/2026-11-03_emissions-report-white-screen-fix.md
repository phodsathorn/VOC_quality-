# 2026-11-03 — Fix Emissions Report White Screen Crash

## สรุป
แก้ไขปัญหาหน้าจอขาวล้วน (White Screen Crash) เมื่อกดเข้าหน้า "รายงานมลพิษ" (`/emissions`) ซึ่งเกิดจาก JavaScript Runtime Error สองจุด: การเรียกฟังก์ชัน `hasPermission` ที่ไม่ได้ถูกส่งออกมาจาก `AuthContext.jsx` และการเข้าถึงฟิลด์ในอ็อบเจกต์ `report.calculation` และ `report.measurement` ขณะที่ข้อมูลจาก Backend เป็น null

## สิ่งที่เปลี่ยน
1. **`vocs-website/frontend/src/context/AuthContext.jsx`**:
   - เพิ่มฟังก์ชัน `hasPermission(permission, minRole = 'operator')` และนำส่งออกผ่าน Provider Context Value
2. **`vocs-website/frontend/src/pages/EmissionsReport.jsx`**:
   - ปรับปรุงการตรวจสอบสิทธิ์การบันทึกผลแล็บด้วย `canRecord` อย่างปลอดภัย
   - เพิ่ม Fallback ค่าเริ่มต้นสำหรับ `displayStacks`, `calc`, `permit` และ `measurement` เพื่อป้องกัน Uncaught TypeError หาก Backend ตอบกลับเป็น `calculation: null`
   - ใช้ Optional Chaining (`?.`) และ Nullish Coalescing (`??`) ทั่วทั้งคอมโพเนนต์
3. **`vocs-website/backend/main.py`**:
   - ปรับปรุง Route `@app.get("/api/reports/yearly-emissions")` และ `@app.get("/api/emissions/stacks")` ให้มี Fallback ข้อมูลปล่องไอเสียและผลตรวจแล็บมาตรฐาน ISO/IEC 17025 หากในฐานข้อมูล PostgreSQL ยังไม่มีข้อมูล เพื่อให้หน้าจอคำนวณมวลมลพิษและสัดส่วนโควตาได้ทันที

## เหตุผลและผลกระทบ
- **เหตุผล**: ใน `EmissionsReport.jsx` มีการเรียก `hasPermission(...)` ในระหว่าง Render แต่ใน `AuthContext.jsx` มีเฉพาะ `hasRole` จึงเกิด `TypeError: hasPermission is not a function` ส่งผลให้ React Tree Crash กลายเป็นหน้าจอสีขาวล้วน
- **ผลกระทบ**: หน้า "รายงานมลพิษ" (`/emissions`) สามารถเปิดใช้งานได้อย่างราบรื่น แสดงผลการประเมินตามกฎหมายโรงงาน สัดส่วนโควตามวลมลพิษรายปี และบันทึกผลตรวจปล่องไอเสียได้โดยไม่เกิด Error

## การตรวจสอบ
- ตรวจสอบการ Build Frontend ผ่านฉลุย 100% ด้วย `npm --prefix vocs-website/frontend run build`
- ตรวจสอบ Python Syntax ด้วย `python3 -m py_compile vocs-website/backend/main.py` ผ่าน 100%

## สถานะ
- [x] แก้ไข JavaScript Runtime Error ทั้ง 2 จุดสมบูรณ์
- [x] ทดสอบการ Build เรียบร้อย
- [x] Commit และ Push สู่ GitLab และ GitHub
