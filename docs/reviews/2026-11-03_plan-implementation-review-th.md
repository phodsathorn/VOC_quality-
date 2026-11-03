# รีวิวการทำตามแผน Web/Backend และ Hardware/Firmware

**วันที่ตรวจ:** 3 พฤศจิกายน 2026 (ICT)  
**ขอบเขต:** ตรวจแบบ static review จาก source และเอกสารใน repository ที่ commit `8a8183b` พร้อม worktree ณ เวลาตรวจ  
**ไม่รวม:** การทดสอบระบบ deploy จริง, ฐานข้อมูล Neon จริง, อุปกรณ์จริง, การวัดด้วยมัลติมิเตอร์, การทดสอบ OTA บนกล่อง หรือการตรวจ cloud configuration เพราะไม่มีหลักฐานเหล่านั้นใน source

## บทสรุป

มีการ implement โครงสร้างจำนวนมากจริง: JWT/RBAC เบื้องต้น, audit schema, workflow alert, maintenance work order, rollup tables, export endpoints, LINE adapter, telemetry เพิ่มใน firmware และ MQ-3 quality gate

แต่ **ยังสรุปไม่ได้ว่าแผนเสร็จครบถ้วน หรือพร้อม production/factory pilot**. เอกสารและ log ที่ระบุ `Completed 100%` ไม่สอดคล้องกับ source ปัจจุบันในประเด็นสำคัญด้านความปลอดภัยและความน่าเชื่อถือ โดยเฉพาะ identity, authorization, OTA, mock/demo data และ statutory report fallback

| แผน | ผลตรวจ | ข้อสรุป |
|---|---|---|
| Web/Backend W0–W5 | มีโครงสร้างส่วนใหญ่ | **ทำบางส่วน — ยังไม่ผ่าน release gate** |
| Hardware/Firmware H0–H3 | H1/H2 หลายข้อมีโค้ดรองรับ | **ทำบางส่วน — H0 และการทดสอบจริงยังไม่ผ่าน** |

สถานะที่เหมาะสมก่อนแก้ไขคือ **Research / development environment only** ไม่ใช่ production หรือ factory pilot

## หลักฐานที่ตรวจ

- `vocs-website/WEB_BACKEND_REVIEW_AND_PLAN.md`
- `vocs-website/HARDWARE_FIRMWARE_REVIEW_AND_PLAN.md`
- `vocs-website/backend/main.py`, `init.sql`, `line_adapter.py`, `db.py`
- `vocs-website/firmware/voc_esp32/voc_esp32.ino`, `secrets.example.h`
- `vocs-website/frontend/src/` และ migration ที่มีใน repository

## 1. Web / Backend เทียบกับแผน W0–W5

### สถานะรวมราย phase

| Phase | ผลตรวจ | หลักฐานที่มี | ช่องว่างที่ยังต้องปิด |
|---|---|---|---|
| W0 — Security gate | ❌ ยังไม่ผ่าน | `.gitignore`, env `DATABASE_URL`, CORS allow-list, bcrypt/JWT code | มี development fallback/known seed accounts/default secrets, endpoint สำคัญยังเปิด, ไม่มีหลักฐาน rotation/deployment config |
| W1 — Login/RBAC/Audit | ⚠️ ทำบางส่วน | users, JWT, bcrypt, audit table/trigger, user/device token endpoints | ไม่ default-deny, ไม่ enforce site/assigned_boxes, token ไม่ revoke, rate/body limit ไม่ครบ |
| W2 — Alert/Maintenance/Kiosk | ⚠️ ทำบางส่วน | state fields, SLA task, LINE adapter, work-order schema/UI | action สำคัญรับ anonymous ได้, offline/PIN/SLA retry ยังไม่มีหลักฐาน end-to-end, health fallback เป็น demo |
| W3 — Provenance/Trend/Report | ⚠️ ทำบางส่วน | validity columns, rollup tables/task, export endpoints/hash | raw retention/downsampling policy ไม่ครบ, export/data endpoints ยังไม่คุมสิทธิ์ครบ, PDF/XLSX ต้องยืนยันจริง |
| W4 — OTA/Model governance | ❌ ยังไม่ผ่าน | metadata/registry และ hash/HMAC fields | artifact อยู่ disk Render, HMAC default, firmware ไม่ verify, public download/status, pickle upload ยังมี |
| W5 — Emissions report | ❌ ยังไม่ผ่านเกณฑ์แผน | schema/สูตร/status path มี | fallback สร้าง CEMS/lab/permit ตัวอย่างและอาจคืน `COMPLIANT` โดยไม่มีหลักฐานจริง |

### W0 — Security gate

**ทำแล้ว**

- ใช้ `DATABASE_URL` จาก environment ใน `backend/db.py`
- CORS อ่าน `CORS_ORIGINS` ได้และไม่มี wildcard origin ในค่าตั้งต้น
- มี security headers middleware และปิด auto-purge เป็นค่าเริ่มต้น

**ยังไม่ครบ / ต้องแก้ก่อน production**

1. `main.py` มีค่า fallback สำหรับ JWT secret, device token และ OTA signing key. หาก environment ผิดพลาด ระบบยังเริ่มด้วยความลับที่คาดเดาได้ แทนที่จะ fail closed
2. `init.sql` seed บัญชีตัวอย่างพร้อมรหัสผ่านที่ระบุใน comment และ seed device token hash ที่สัมพันธ์กับ development fallback. ต้องย้าย seed/test fixture ออกจาก production schema และ rotate ทุก credential ที่เคยใช้
3. `ENVIRONMENT` default เป็น `development`; เมื่อ deploy โดยไม่ตั้งค่า, admin guard และ ingest ไม่ fail closed
4. ไม่มี CI workflow หรือหลักฐาน dependency/secret/SAST/container scan ใน repository จึงยังไม่ผ่าน Test / Release Gate
5. `allow_methods=["*"]` และ `allow_headers=["*"]` ไม่ขัดกับ origin allow-list โดยตรง แต่ production ควรจำกัดเป็น method/header ที่ใช้จริง

### W1 — Login, RBAC, audit และ device identity

**ทำแล้ว**

- มี `POST /api/auth/login`, `/me`, user management และ role 4 ระดับ
- password hash ใช้ bcrypt และ token มี expiry
- ตาราง `audit_events` พร้อม trigger ป้องกัน `UPDATE/DELETE` ใน PostgreSQL
- ingest รองรับ `X-Device-Token` และ token ต่อกล่องที่ hash ด้วย bcrypt

**ยังไม่ครบ / ช่องว่างหลัก**

1. **ไม่ default-deny:** หลาย endpoint ไม่มี dependency authentication หรือใช้ `get_current_user_optional` แล้วอนุญาตต่อเมื่อไม่มี token เช่น alert acknowledge/in-progress/resolve/manual, work-order create, device update/delete, calibration request และ export บางชนิด. การไม่มี token ไม่ควรถูกแทนตัวเป็น `operator`.
2. **ไม่มี object-level authorization:** JWT มี `site` และ `assigned_boxes` แต่ไม่มีการตรวจว่า user มีสิทธิ์กับ `box_id` ที่ร้องขอ. จึงยังไม่ทำตาม “ทุก endpoint/ทุก box_id”.
3. **logout ไม่ revoke JWT:** `logout` บันทึก audit เท่านั้น; token เดิมใช้งานได้ถึงเวลา expiry. การ deactivate user ก็ไม่ทำให้ JWT ที่ออกแล้ว invalid ในทันที เพราะ `get_current_user` ไม่ตรวจ `is_active` จาก DB.
4. **device identity ยังไม่สมบูรณ์:** firmware ปัจจุบันไม่ได้ส่ง `X-Device-Token`; และ backend ยอมรับ default token หากตั้ง environment ผิด. endpoint device command, calibration report และ OTA report ต้องมี device authorization/replay protection ด้วย
5. rate limit มีเฉพาะ IP สำหรับ ingest; ยังไม่มี per-user/per-device policy, body size limit, login throttling หรือ pagination ทุก list endpoint
6. audit append-only มีผลเฉพาะ DB trigger. เมื่อ DB ล่ม ระบบ fallback เก็บ event ใน RAM จำกัด 1,000 รายการและหายเมื่อ restart จึงไม่ใช่หลักฐาน audit 5 ปี

### W2 — Alert, kiosk, LINE และ maintenance

**ทำแล้ว**

- มี field/workflow `Active → Acknowledged → In progress → Resolved → Verified`
- มี SLA deadline และ background monitor
- มี LINE adapter, webhook signature path, subscriber schema และ maintenance work order schema

**ยังไม่ครบ / ต้องแก้**

1. state transition ไม่ตรวจ transition ก่อนหน้าอย่างเคร่งครัด (เช่น endpoint update ตาม id โดยตรง) และหลาย action รับ anonymous ตามข้อ W1
2. requirement บอก Warning ต้องมีหลักฐาน แต่ resolve endpoint ยอมให้ note/evidence ว่าง
3. ใน sandbox, `verify_line_signature()` คืน `True` หากไม่มี LINE secret. ห้ามเปิด webhook public ในโหมดนี้
4. `get_real_hardware_health()` คืน runtime/calibration ตัวอย่างเมื่อ DB ไม่มีข้อมูล แต่ยังระบุ `verified_hardware_clock: true`; ต้องแสดง `DEMO/UNAVAILABLE` และห้ามใช้ตัดสิน maintenance
5. offline queue, PIN/badge, auto-logout และ LINE escalation retry ต้องทดสอบกับอุปกรณ์/เครือข่ายจริงก่อนกล่าวว่าเสร็จ; source อย่างเดียวไม่ยืนยันผล

### W3 — provenance, retention, trend และ export

**ทำแล้ว**

- `sensor_readings` มี `is_valid`, `validation_reason`, `calibration_id`, firmware/model version
- มี hourly/daily rollup schema, trend endpoint และ export CSV/XLSX/PDF endpoints
- มี export hash/audit record ใน source

**ยังไม่ครบ / ต้องแก้**

1. raw reading ไม่มี fields `seq_no`, `wifi_rssi`, `free_heap_kb`, `reset_reason` แม้ ingest รับค่าเหล่านี้ จึงไม่สามารถทำ packet-loss/diagnostic history จาก DB ตามแผนได้ครบ
2. retention task/rollup ต้องทดสอบ migration, scheduler, idempotency, restore และปริมาณข้อมูล 5 ปี; ยังไม่มีหลักฐานการทดสอบดังกล่าว
3. หน้า/endpoint หลายส่วนมี fallback mock data. ต้องแยก `DEMO DATA` ชัดเจนหรือปิด production fallback
4. ต้องทดสอบว่า export ทั้งสามชนิดดึง dataset เดียวกัน, enforce role/box scope และบันทึก hash/audit เมื่อ database online จริง

### W4 — OTA และ Model Governance

**สถานะ: ไม่ตรงกับแผน และเป็น blocker สำหรับ production**

1. OTA artifact เก็บที่ `backend/ota_firmware/` บน filesystem ของ Render ไม่ใช่ update service/object storage ที่ durable; Render filesystem โดยทั่วไปเป็น ephemeral จึงไม่ควรใช้เป็น artifact registry
2. `POST /api/ota/upload` รับไฟล์และเขียนลง local disk โดยไม่จำกัดขนาดและใช้ version ต่อ path โดยตรง; endpoint admin guard อาศัย fallback development setting หาก config ผิด
3. เรียกว่า “digital signature” แต่ source ใช้ HMAC-SHA256 ด้วย shared secret และมี default signing key. ไม่มีหลักฐาน private-key signing จาก CI, key management, approval chain หรือ immutable artifact storage
4. firmware ใช้ `WiFiClientSecure.setInsecure()` และ `httpUpdate.update()` โดยไม่ตรวจ SHA-256/signature ที่ backend ส่งมา. จึง **ไม่ทำ** signature verification หรือ secure rollback บนอุปกรณ์จริง
5. `/api/ota/status`, `/download`, `/history`, `/report`, `/verify-signature` ไม่มี device auth ใน source. ต้องออกแบบ device-bound manifest/download หรือ presigned URL อายุสั้นพร้อม device identity
6. model governance registry มี แต่ `POST /api/model/upload` ที่รับ pickle ยังมีอยู่ใน source. จึงไม่ตรงกับนโยบาย “ห้าม raw pickle upload ผ่านเว็บ”
7. metadata fallback แสดง metric/model governance ตัวอย่างที่ไม่ตรงกับ `model_meta.json` ปัจจุบัน; ห้ามใช้เป็นผลวิจัยหรือข้อมูล production

### W5 — รายงานการปล่อยมลพิษ

**ทำแล้ว**

- มี schema stack/permit/measurement, สูตร mass emission และข้อความ caveat ว่า indoor E-Nose ไม่แทน CEMS/lab
- เมื่อมี record จริงที่ไม่ verified มี path `INSUFFICIENT EVIDENCE`

**ยังไม่ครบ / มีความเสี่ยงเชิง compliance**

- เมื่อ DB ว่าง, endpoint สร้าง stack, permit และ measurement ตัวอย่างซึ่งถูกตั้งให้ verified แล้ว สามารถส่งผล `COMPLIANT` ได้. นี่ขัดกับ W5 ที่กำหนดว่าให้ `INSUFFICIENT EVIDENCE` จนกว่าจะมีหลักฐานจริง
- ต้องลบ fallback ทางกฎหมาย, mark seed/demo, บังคับ evidence document/approval และตรวจข้อกำหนดจริงกับผู้เชี่ยวชาญกฎหมาย/สิ่งแวดล้อมก่อนใช้งาน

## 2. Hardware / Firmware เทียบกับ H0–H3

### สถานะรวมราย phase

| Phase | ผลตรวจ | สรุป |
|---|---|---|
| H0 — electrical/cybersecurity | ❌ ไม่ผ่าน | secrets template มี แต่ default credential/TLS insecure/OTA signature/rollback ไม่ครบ; physical electrical check ยังไม่มีหลักฐาน |
| H1 — sensor protocol | ⚠️ ทำบางส่วน | MQ-3 gate/median, CCS compensation/range guard, dual I2C และ calibration report มีใน code; ยังต้อง test hardware/calibration จริง |
| H2 — telemetry/reliability | ⚠️ ทำบางส่วน | firmware ส่ง diagnostics และ backend รับบางส่วน; ยังไม่เก็บ diagnostic ทั้งหมดหรือใช้ตรวจ packet loss end-to-end |
| H3 — statutory boundary | ✅ เอกสารครบ | เอกสารแยก indoor E-Nose ออกจาก stack compliance ถูกต้อง แต่ W5 fallback ต้องแก้ตามส่วน Web |

### H0 — Security และไฟฟ้า

**ทำแล้ว**

- `secrets.h` ถูก ignore และมี `secrets.example.h`
- หน้า Web OTA ใช้ HTTP Basic Auth ใน handler
- firmware ตั้ง ADC resolution/attenuation และเอกสารระบุ voltage divider

**ยังไม่ครบ / ต้องแก้ก่อนติดตั้งจริง**

1. firmware มี fallback `OTA_USERNAME`/`OTA_PASSWORD` ที่ hardcoded. หากไม่พบ `secrets.h` อุปกรณ์ยังเปิด Web OTA ด้วยค่าเดาได้; ต้อง fail build หรือ disable OTA แทน
2. `ArduinoOTA.begin()` ไม่มี `ArduinoOTA.setPassword`/password hash ใน source จึงไม่ควรถือว่า Arduino IDE OTA ได้รับการป้องกัน
3. ทุก cloud HTTPS path ที่ตรวจพบใช้ `client.setInsecure()`, รวม ingest, session/calibration, OTA report และ cloud OTA. จึงไม่ยืนยัน server certificate และเสี่ยง MITM
4. cloud OTA เรียก `httpUpdate.update()` ทันทีจาก URL โดยไม่ตรวจ hash/signature/version policy ใน firmware. “SHA-256, HMAC Signature, 1-click rollback Done” ในตารางจึงไม่เป็นจริงตาม source
5. ไม่มี source evidence ว่า divider, fuse, power budget, chassis earth, SSR/load selection หรือ 72-hour soak ถูกทำ/ทดสอบจริง. หัวข้อ checklist ที่ติ๊กไว้ต้องเปลี่ยนเป็น `ต้องยืนยันด้วยหลักฐานการทดสอบ`

### H1 — Sensor protocol

**ตรงตาม source**

- MQ-3 48-hour readiness flag, 9-sample median และ spread ถูกส่งให้ backend
- backend gate MQ-3 โดยใช้ readiness, ADC range และ max spread ก่อน alcohol-specific handling
- CCS811 ได้ T/RH compensation ทุก 60 วินาที และมี range guard ต่อ raw error frame
- ADS1115 ใช้ I2C bus ที่สอง, PMS5003 ใช้ UART2, command calibration/report มี

**ต้องยืนยันเพิ่ม**

- ประสิทธิผลของ false-alert reduction ต้องพิสูจน์ด้วย before/after dataset และ controlled/reference test ไม่ใช่จาก code
- clean-air baseline ต้องมี protocol, operator identity, condition/evidence และ repeated validation; firmware ส่ง baseline แต่ไม่พิสูจน์ว่าพื้นที่เป็น clean air
- DHT22/CCS811/PMS5003 เป็นชุด sensor เดิม ไม่ใช่ v2 sensor plan; เอกสารต้องระบุว่า firmware นี้ยังไม่รองรับ SHT41/SCD41/SGP41/SPS30/BME690

### H2 — Reliability และ telemetry

**ทำแล้วใน firmware**

- ส่ง `seq_no`, uptime, RSSI, free heap และ reset reason
- ใช้ WiFiMulti และ monotonic uptime สำหรับ runtime

**ช่องว่าง**

- backend รับ diagnostic fields แต่ schema reading ไม่ persist `seq_no`, RSSI, heap และ reset reason; จึงยังไม่มี packet-loss calculation/reboot history ที่ตรวจย้อนหลังได้ครบ
- firmware ไม่ส่ง `X-Device-Token`, จึงใช้งาน ingest auth ใน production ไม่ได้จนกว่าจะเพิ่ม secret/header ที่ rotate ได้
- WiFi failover มีใน code แต่ยังไม่มี test evidence เรื่อง reconnect/backoff/queue/duplicate telemetry

## 3. ลำดับแก้ไขก่อนเปลี่ยนสถานะเป็น Production/Pilot

1. **หยุดใช้ known/default secrets:** บังคับ production env, rotate seed/admin/device/OTA credentials, ลบ password comment/seed ที่ใช้จริง และ fail startup หาก secret ขาด
2. **บังคับ authentication/authorization:** เปลี่ยน optional auth บน write/control endpoint เป็น required; enforce site + assigned box; ตรวจ active user/token revocation; จำกัด request/body/login/device rate
3. **แก้ OTA:** ย้าย artifact ไป private object storage, signed manifest ด้วย asymmetric key, pin CA/public key ใน ESP32, verify hash+signature ก่อน flash, authenticated device download, durable rollback metadata และ report auth
4. **ปิด/mock isolate:** production ต้องไม่ fallback runtime, emissions, model metadata หรือ maintenance health ที่ดูเหมือนข้อมูลจริง
5. **แก้ statutory report:** DB ไม่มี verified evidence ต้องตอบ `INSUFFICIENT EVIDENCE` เสมอ
6. **ทำ telemetry persistence:** เก็บ diagnostics/sequence หรือ aggregate ที่จำเป็น, ตรวจ duplicate/lost/reboot และทำ device-auth header ใน firmware
7. **ทดสอบ release gate:** migration/restore, RBAC per box, audit immutability, OTA interruption/rollback, 72-hour soak, sensor disconnect, network loss, export consistency และ CI security scans

## 4. คำตอบสั้นสำหรับปรับเอกสารแผน

ให้เปลี่ยนคำว่า `Done` / `Completed 100%` เป็นหนึ่งในสามสถานะต่อไปนี้จนกว่าจะมีหลักฐาน:

- **Implemented in source — pending integration/production validation**
- **Design/prototype only — not production approved**
- **Blocked by required configuration, hardware test, or external approval**

แนวทางนี้ทำให้เอกสารตรงกับความจริงและใช้เป็นหลักฐานสอบ/ส่งต่อทีมได้ปลอดภัยกว่า
