# 2026-10-27 — GitLab Merge Conflict Resolution

## สรุป

ปรับ source branch ของ Merge Request ให้มีฐานเป็น GitLab `main` และใช้ snapshot จาก local เพื่อแก้ merge conflict โดยไม่เขียนทับ protected branch

## สิ่งที่เปลี่ยน

- อัปเดต branch `sync-local-main` เป็น commit `0b2ff2c`
- snapshot ลบ 2,680 paths ที่ไม่มีใน local และเพิ่มหรือแก้ 374 paths
- ลบ `test_1st_air_quality_box/secrets.h` ออกจาก tree ปัจจุบัน

## เหตุผลและผลกระทบ

- GitLab ปฏิเสธ merge เพราะ source branch มีประวัติแยกจาก target และพบ merge conflicts
- source branch ใหม่มี parent เป็น GitLab `main` ทำให้สามารถรวมการเปลี่ยนแปลงจาก snapshot local ได้โดยไม่ force push target branch
- ไฟล์ credential ถูกลบจาก tree ปัจจุบัน แต่ยังอยู่ในประวัติเดิมของ GitLab `main`

## การตรวจสอบ

- ยืนยัน GitLab `main` อยู่ที่ `1a20ee5` และ `sync-local-main` อยู่ที่ `0b2ff2c`
- ยืนยัน `origin/main` เป็น ancestor ของ source branch
- ตรวจ tree ของ source branch ว่าไม่มี `secrets.h`

## การตัดสินใจ/ข้อสมมติ

- ใช้ local snapshot เป็นเนื้อหาปลายทางตามคำขอของผู้ใช้
- ไม่เขียนทับ protected GitLab `main` โดยตรง

## งานค้างและขั้นตอนถัดไป

1. รอ GitLab ประเมิน merge checks และ auto-merge ของ MR
2. จัดการ credential ที่อยู่ในประวัติเดิมของ GitLab แยกต่างหาก หากยังใช้งานอยู่ให้เปลี่ยนค่า
