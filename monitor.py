#!/usr/bin/env python3
"""
Air Quality Monitor — Live Terminal Dashboard & CSV Logger
===========================================================
อ่านค่าจาก ESP32 ผ่าน Serial Port พร้อมแสดงผล Dashboard แบบ In-Place (ตัวเลขเปลี่ยนที่เดิม)

คำสั่งที่รองรับ:
  'b' : สั่ง Calibrate Clean Air Baseline (R0) 30 วินาที บันทึกลง Flash
  'l' : สลับเริ่ม/หยุด บันทึกข้อมูลลงไฟล์ CSV (Toggle Logging)
  's' : ข้ามการวอร์ม (Skip)
  'w' : บังคับวอร์มใหม่ (Force Re-warm)
  'c' : ล้างความจำใน Flash (Clear Memory)
  'r' : รีสตาร์ท ESP32
  Ctrl+C : ออกจากโปรแกรม
"""

import sys
import os
import time
import re
import csv
import threading
from datetime import datetime
import queue
import requests
import serial
import serial.tools.list_ports

API_URL   = os.getenv("API_URL", "http://localhost:8000/api/ingest")
BOX_ID    = os.getenv("BOX_ID", "BOX-001")
BAUD_RATE = 115200

# Regular expressions สำหรับดึงตัวเลขจากหน้าจอไปลง CSV
RE_TEMP = re.compile(r"Temperature\s+([\d\.\-]+)")
RE_HUM  = re.compile(r"Humidity\s+([\d\.\-]+)")
RE_ECO2 = re.compile(r"eCO2\s*\(CCS811\)\s+(\d+)")
RE_TVOC = re.compile(r"TVOC\s*\(CCS811\)\s+(\d+)")
RE_CO   = re.compile(r"CO\s*\(MiCS-6814\)\s+([\d\.]+)")
RE_NO2  = re.compile(r"NO2\s*\(MiCS-6814\)\s+([\d\.]+)")
RE_NH3  = re.compile(r"NH3\s*\(MiCS-6814\)\s+([\d\.]+)")
RE_PM1  = re.compile(r"PM\s*1\.0\s+(\d+)")
RE_PM25 = re.compile(r"PM\s*2\.5\s+(\d+)")
RE_PM10 = re.compile(r"PM\s*10\s+(\d+)")
RE_MQ2  = re.compile(r"MQ-2\s*\(Smoke\)\s+(\d+)")
RE_MQ3  = re.compile(r"MQ-3\s*\(Alcohol\)\s+(\d+)")
RE_MQ8  = re.compile(r"MQ-8\s*\(H2\)\s+(\d+)")
RE_MQ135= re.compile(r"MQ-135\s*\(AirQ\)\s+(\d+)")

def find_esp32_port():
    ports = serial.tools.list_ports.comports()
    for p in ports:
        dev = p.device
        desc = p.description or ""
        if any(keyword in dev.lower() or keyword in desc.lower() for keyword in ["usbserial", "wchusb", "cp210", "ch34"]):
            return dev
    if os.path.exists("/dev/cu.usbserial-0001"):
        return "/dev/cu.usbserial-0001"
    if ports:
        return ports[0].device
    return None

def strip_ansi(text):
    return re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', text)

def main():
    port = find_esp32_port()
    if not port:
        print("\n❌ ไม่พบพอร์ต ESP32 กรุณาตรวจสอบการเสียบสาย USB\n")
        sys.exit(1)

    print(f"\n🔌 กำลังเชื่อมต่อไปยัง ESP32 ที่พอร์ต: {port} ({BAUD_RATE} baud)...")
    print("💡 คำสั่งลัด: 'b'=Calib R0, 'l'=Log CSV, 's'=ข้ามวอร์ม, 'w'=วอร์มใหม่, 'c'=ล้าง Flash, 'r'=รีสตาร์ท, 'Ctrl+C'=ออก\n")
    time.sleep(1)

    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=0.1)
    except serial.SerialException as e:
        print(f"\n❌ ไม่สามารถเปิดพอร์ต {port} ได้: {e}")
        print("💡 หมายเหตุ: กรุณาปิด Serial Monitor ใน Arduino IDE ก่อน เพื่อปลดล็อคพอร์ต USB ครับ\n")
        sys.exit(1)

    # เคลียร์หน้าจอ Terminal เริ่มต้น
    sys.stdout.write("\033[2J\033[H")
    sys.stdout.flush()

    running = True
    logging_active = False
    log_file = None
    csv_writer = None
    log_filename = ""
    logged_rows = 0

    # Thread สำหรับรับการพิมพ์คำสั่งจากคีย์บอร์ด
    def user_input_thread():
        nonlocal logging_active, log_file, csv_writer, log_filename, logged_rows
        while running:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                cmd = line.strip().lower()
                
                # ฟังก์ชันสลับการบันทึก CSV
                if cmd == 'l':
                    if not logging_active:
                        os.makedirs("logs", exist_ok=True)
                        now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                        log_filename = f"logs/air_quality_{now_str}.csv"
                        log_file = open(log_filename, mode='w', newline='', encoding='utf-8')
                        csv_writer = csv.writer(log_file)
                        csv_writer.writerow([
                            "Timestamp", "Temp_C", "Humidity_pct", 
                            "eCO2_ppm", "TVOC_ppb", 
                            "MiCS_CO_mV", "MiCS_NO2_mV", "MiCS_NH3_mV",
                            "PM1_0", "PM2_5", "PM10", 
                            "MQ2_ADC", "MQ3_ADC", "MQ8_ADC", "MQ135_ADC"
                        ])
                        log_file.flush()
                        logging_active = True
                        logged_rows = 0
                        print(f"\n🔴 [RECORDING ON] เริ่มบันทึกข้อมูลลง: {log_filename} (กด 'l' เพื่อหยุด)\n")
                    else:
                        logging_active = False
                        if log_file:
                            log_file.close()
                            log_file = None
                        print(f"\n⏹️ [RECORDING OFF] หยุดบันทึกแล้ว! บันทึกไปทั้งหมด {logged_rows} แถว: {log_filename}\n")
                else:
                    # ส่งคำสั่งอื่นๆ (b, s, w, c, r) ไปยัง ESP32
                    if ser.is_open:
                        ser.write((cmd + "\n").encode('utf-8'))
            except Exception:
                break

    input_thread = threading.Thread(target=user_input_thread, daemon=True)
    input_thread.start()

    web_queue = queue.Queue(maxsize=3)

    def web_sync_worker():
        while running:
            try:
                payload = web_queue.get(timeout=1.0)
            except queue.Empty:
                continue
            try:
                requests.post(API_URL, json=payload, timeout=1.5)
            except Exception:
                pass
            finally:
                web_queue.task_done()

    sync_thread = threading.Thread(target=web_sync_worker, daemon=True)
    sync_thread.start()

    # Buffer สำหรับสะสมข้อความเพื่อ parse
    text_buffer = ""
    last_web_post = 0

    try:
        while True:
            if ser.in_waiting > 0:
                raw_bytes = ser.read(ser.in_waiting)
                chunk = raw_bytes.decode('utf-8', errors='replace')
                sys.stdout.write(chunk)
                sys.stdout.flush()

                text_buffer += strip_ansi(chunk)
                # เมื่อจบรอบ frame (มีเครื่องหมาย ╚ หรือข้อความ Update:)
                if "Update:" in text_buffer or "╚" in text_buffer:
                    # Extract ข้อมูล
                    m_t   = RE_TEMP.search(text_buffer)
                    m_h   = RE_HUM.search(text_buffer)
                    m_co2 = RE_ECO2.search(text_buffer)
                    m_voc = RE_TVOC.search(text_buffer)
                    m_co  = RE_CO.search(text_buffer)
                    m_no2 = RE_NO2.search(text_buffer)
                    m_nh3 = RE_NH3.search(text_buffer)
                    m_pm1 = RE_PM1.search(text_buffer)
                    m_pm25= RE_PM25.search(text_buffer)
                    m_pm10= RE_PM10.search(text_buffer)
                    m_mq2 = RE_MQ2.search(text_buffer)
                    m_mq3 = RE_MQ3.search(text_buffer)
                    m_mq8 = RE_MQ8.search(text_buffer)
                    m_mq135=RE_MQ135.search(text_buffer)

                    if logging_active and m_t and m_mq2 and csv_writer:
                        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        csv_writer.writerow([
                            ts,
                            m_t.group(1), m_h.group(1) if m_h else "",
                            m_co2.group(1) if m_co2 else "", m_voc.group(1) if m_voc else "",
                            m_co.group(1) if m_co else "", m_no2.group(1) if m_no2 else "", m_nh3.group(1) if m_nh3 else "",
                            m_pm1.group(1) if m_pm1 else "", m_pm25.group(1) if m_pm25 else "", m_pm10.group(1) if m_pm10 else "",
                            m_mq2.group(1), m_mq3.group(1) if m_mq3 else "", m_mq8.group(1) if m_mq8 else "", m_mq135.group(1) if m_mq135 else ""
                        ])
                        log_file.flush()
                        logged_rows += 1

                    # ส่งข้อมูลขึ้น Web Dashboard
                    now = time.time()
                    if (now - last_web_post >= 0.8) and (m_t or m_mq2 or m_mq3):
                        last_web_post = now
                        payload = {
                            "box_id": BOX_ID,
                            "temp": float(m_t.group(1)) if m_t else None,
                            "rh": float(m_h.group(1)) if m_h else None,
                            "pm25": float(m_pm25.group(1)) if m_pm25 else 0.0,
                            "tvoc": float(m_voc.group(1)) if m_voc else 0.0,
                            "eco2": float(m_co2.group(1)) if m_co2 else 400.0,
                            "mq2": int(m_mq2.group(1)) if m_mq2 else None,
                            "mq3": int(m_mq3.group(1)) if m_mq3 else None,
                            "mq8": int(m_mq8.group(1)) if m_mq8 else None,
                            "mq135": int(m_mq135.group(1)) if m_mq135 else None,
                            "mics_co": int(round(float(m_co.group(1)))) if m_co else 0,
                            "no2": int(round(float(m_no2.group(1)))) if m_no2 else 0,
                            "nh3": int(round(float(m_nh3.group(1)))) if m_nh3 else 0,
                        }
                        try:
                            if not web_queue.full():
                                web_queue.put_nowait(payload)
                        except Exception:
                            pass

                    # ล้าง buffer หลัง parse จบ frame
                    text_buffer = ""
            time.sleep(0.02)
    except KeyboardInterrupt:
        print("\n\n👋 ปิดการเชื่อมต่อเรียบร้อยครับ\n")
    finally:
        running = False
        if log_file:
            log_file.close()
        if ser.is_open:
            ser.close()

if __name__ == "__main__":
    main()
