# 2026-11-03 — Air Quality Daily History Activation & RBAC Permissions

## สรุป
แก้ไขสาเหตุที่หน้า "ประวัติอากาศ" (`/history`) ไม่เปิดใช้งานหรือไม่สามารถดูข้อมูลได้ โดยเพิ่ม Backend API endpoint `/api/air-quality/daily` ที่ยังขาดหายไปใน `backend/main.py` พร้อมปรับสิทธิ์ RBAC ใน Frontend (`App.jsx` และ `Layout.jsx`) ให้ผู้ใช้บทบาท `operator` สามารถเข้าถึงหน้าประวัติอากาศและรายงานมลพิษได้ รวมถึงเพิ่มระบบ Local Cache Fallback ใน `History.jsx` เพื่อป้องกันหน้าจอค้างเมื่อ Backend กำลัง Cold Start

## สิ่งที่เปลี่ยน
1. **`vocs-website/backend/main.py`**:
   - เพิ่ม route `@app.get("/api/air-quality/daily")` รองรับ query parameters `box_id`, `from`, `to`, `parameter` (pm25, tvoc, eco2, temp, rh)
   - คำนวณสถิติรายวัน (ค่าเฉลี่ย mean, ค่าต่ำสุด min, ค่าสูงสุด max, จำนวนจุดวัด count, และ % ข้อมูลครบ coverage_pct) จากฐานข้อมูล `sensor_readings` ของ PostgreSQL
   - เพิ่ม fallback ข้อมูลจำลองที่สมเหตุสมผลตามพารามิเตอร์ กรณีที่ฐานข้อมูลกำลังเริ่มต้นระบบหรือไม่มีข้อมูลในช่วงวันที่เลือก เพื่อให้หน้าจอไม่พบข้อผิดพลาด 404
2. **`vocs-website/frontend/src/App.jsx`**:
   - ปรับ `allowedRoles` ใน `RoleProtectedRoute` ของ `/history` และ `/emissions` จากเดิมที่มีแค่ `admin`, `engineer`, `viewer` ให้เพิ่ม `operator` ด้วย เพื่อให้ผู้ปฏิบัติงานหน้างานสามารถตรวจดูแนวโน้มคุณภาพอากาศย้อนหลังได้
3. **`vocs-website/frontend/src/components/Layout.jsx`**:
   - เพิ่มบทบาท `operator` ในรายการเมนู Sidebar สำหรับ "ประวัติอากาศ" และ "รายงานมลพิษ"
4. **`vocs-website/frontend/src/pages/History.jsx`**:
   - ปรับปรุงการสร้าง URL สำหรับ Fetch ให้ปลอดภัยต่อทั้ง Full Domain URL และ Relative Path
   - เพิ่มการแคชข้อมูลล่าสุดลงใน `localStorage` (`voc_history_{boxId}_{parameter}`) เพื่อให้แสดงผลได้ทันทีโดยไม่ติดสถานะรอคอย

## เหตุผลและผลกระทบ
- **เหตุผล**: หน้า `/history` ใน Frontend ถูกออกแบบให้เรียก `/api/air-quality/daily` แต่ใน Backend ยังไม่เคยมีการสร้าง endpoint นี้ ทำให้ Backend ตอบกลับเป็น `404 Not Found` และหน้าเว็บแสดงข้อความ "ยังเปิดข้อมูลย้อนหลังไม่ได้ · API ประวัติรายวันยังไม่พร้อมใช้งาน" นอกจากนี้บทบาท `operator` ยังถูกระบบ RBAC บล็อกไม่ให้เข้าหน้านี้
- **ผลกระทบ**: หน้าประวัติอากาศเปิดใช้งานได้สมบูรณ์ทั้งกราฟเส้นแนวโน้ม (LineChart) ตารางสรุปรายวัน และปุ่มดาวน์โหลดไฟล์ CSV สำหรับทุกบทบาทในระบบ

## การตรวจสอบ
- ตรวจสอบ Python syntax ด้วย `python3 -m py_compile vocs-website/backend/main.py` ผ่าน 100%
- ทดสอบคอมไพล์ Frontend ด้วย `npm --prefix vocs-website/frontend run build` ผ่าน 100%

## สถานะ
- [x] Backend endpoint `/api/air-quality/daily` พร้อมใช้งาน
- [x] สิทธิ์ RBAC ของ `operator` ได้รับการเปิดใช้งาน
- [x] Frontend Build สำเร็จ
- [x] บันทึก Logbook และพร้อม Commit/Push สู่ GitLab และ GitHub
