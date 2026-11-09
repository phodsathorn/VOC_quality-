# 2026-11-09 — ปรับ Dashboard ตาม Stitch และอัปเดตระบบขึ้น Git

## สรุป
ปรับหน้า Dashboard ในโค้ดให้ใกล้กับภาพ Stitch รุ่น dashboard_2 และทดสอบการทำงานของเว็บเซิร์ฟเวอร์ พร้อมนำโค้ดและเอกสารล่าสุดขึ้น Git Remote Repository (`origin/main`)

## สิ่งที่เปลี่ยน
- **Dashboard UI (`vocs-website/frontend/src/pages/Dashboard.jsx`):**
  - ขยายพื้นที่การ์ดและกราฟบนจอกว้าง ให้การ์ดเรียงสี่ สอง หรือหนึ่งคอลัมน์ตามขนาดจออย่างยืดหยุ่น (`2xl:rounded-[2rem]`, `min-h-[210px]`)
  - ปรับปรุงข้อความ Recent Alerts ให้ขึ้นบรรทัดใหม่ได้ (`wrap-anywhere`)
  - ปรับปรุงการตรวจสอบและแสดงสถานะ eCO₂: แสดงค่าจริงเมื่อมีข้อมูล และแสดงขีด (`--`) พร้อมสถานะ No reading เมื่อไม่มีข้อมูล
  - ปรับขนาดความสูงกราฟแนวโน้ม TVOC 24 ชม. ให้เหมาะสมกับขนาดจอขนาดใหญ่ (`lg:h-56 2xl:h-64`)
- **การตั้งค่า `.gitignore`:**
  - เพิ่ม `tmp/` และ `output/` เข้าสู่ `.gitignore` เพื่อป้องกันไม่ให้ไฟล์ชั่วคราวและไฟล์พรีวิวสไลด์ถูกติดตามเข้า Git
- **เอกสารและฮาร์ดแวร์คงค้าง:**
  - รวบรวมวงจร ESP32-WROOM-32 (`hardware/current_wroom32/`, `hardware/production_modules/`), เอกสารสไลด์นำเสนอ (`docs/SENIOR_PROJECT_SLIDE_CONTENT_TH.md`, `docs/system_architecture_line_oa.png`) และ Logbook

## เหตุผลและผลกระทบ
- ให้ลำดับข้อมูลและสัดส่วนของแดชบอร์ดตรงตามแบบ Stitch AI (`dashboard_2`) และแยกกรณีไม่มีค่า eCO₂ ออกจากสถานะปกติอย่างชัดเจน
- บันทึกและรักษาเวอร์ชันของโค้ดและเอกสารล่าสุดทั้งหมดใน Git Repository เพื่อความปลอดภัยและพร้อมนำไปใช้งานต่อ

## การตรวจสอบ
- `npm.cmd --prefix vocs-website/frontend run build`: คอมไพล์ผ่านสมบูรณ์ 100% (`built in 1.90s`, 0 errors)
- `npm.cmd --prefix vocs-website/frontend run lint`: ผ่านสมบูรณ์ (0 errors, 76 warnings)
- `npm.cmd --prefix vocs-website/frontend run dev -- --host`: รัน Vite Web Server สำเร็จที่ `http://localhost:5173/`
- ตรวจสอบ `git diff --check` ผ่าน ไม่มี trailing whitespace หรือ conflict

## สถานะ
- [x] ตรวจสอบความถูกต้องของโค้ดและการทำงานของเว็บ Dashboard
- [x] ทดสอบการ Build และ Lint ผ่าน
- [x] เริ่มทำงาน Local Dev Server
- [x] จัดเตรียม Commit และ Push โค้ดทั้งหมดขึ้น GitLab (`origin/main`)

