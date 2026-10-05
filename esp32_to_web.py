#!/usr/bin/env python3
"""
ESP32 -> Web Platform Realtime Ingestion Bridge
================================================
อ่านค่าเซนเซอร์จริงจากบอร์ด ESP32 ผ่าน USB Serial (/dev/cu.usbserial-0001)
แล้วส่ง HTTP POST JSON ไปยัง FastAPI Backend (http://localhost:8000/api/ingest)
เพื่อให้หน้า Dashboard ของเว็บอัปเดตแบบ Realtime ทุกวินาที
"""

import sys
import os
import time
import re
import json
import threading
from datetime import datetime
import serial
import serial.tools.list_ports
import requests

API_URL = os.getenv("API_URL", "http://localhost:8000/api/ingest")
BOX_ID  = os.getenv("BOX_ID", "BOX-001")
BAUD_RATE = 115200

# Regular expressions สำหรับดึงตัวเลขจาก Serial
RE_TEMP  = re.compile(r"Temperature\s+([\d\.\-]+)")
RE_HUM   = re.compile(r"Humidity\s+([\d\.\-]+)")
RE_ECO2  = re.compile(r"eCO2\s*\(CCS811\)\s+(\d+)")
RE_TVOC  = re.compile(r"TVOC\s*\(CCS811\)\s+(\d+)")
RE_CO    = re.compile(r"CO\s*\(MiCS-6814\)\s+([\d\.]+)")
RE_NO2   = re.compile(r"NO2\s*\(MiCS-6814\)\s+([\d\.]+)")
RE_NH3   = re.compile(r"NH3\s*\(MiCS-6814\)\s+([\d\.]+)")
RE_PM1   = re.compile(r"PM\s*1\.0\s+(\d+)")
RE_PM25  = re.compile(r"PM\s*2\.5\s+(\d+)")
RE_PM10  = re.compile(r"PM\s*10\s+(\d+)")
RE_MQ2   = re.compile(r"MQ-2\s*\(Smoke\)\s+(\d+)")
RE_MQ3   = re.compile(r"MQ-3\s*\(Alcohol\)\s+(\d+)")
RE_MQ8   = re.compile(r"MQ-8\s*\(H2\)\s+(\d+)")
RE_MQ135 = re.compile(r"MQ-135\s*\(AirQ\)\s+(\d+)")

def find_esp32_port():
    ports = serial.tools.list_ports.comports()
    for p in ports:
        dev = p.device
        desc = p.description or ""
        if any(kw in dev.lower() or kw in desc.lower() for kw in ["usbserial", "wchusb", "cp210", "ch34"]):
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

    print(f"\n=======================================================")
    print(f"🚀 ESP32 -> Web Platform Realtime Ingestion Bridge")
    print(f"🔌 Serial Port : {port} ({BAUD_RATE} baud)")
    print(f"🌐 Backend API : {API_URL}")
    print(f"📦 Box ID      : {BOX_ID}")
    running = True

    # Dictionary เก็บค่าเซนเซอร์ล่าสุด
    cur_data = {
        "box_id": BOX_ID,
        "temp": None,
        "rh": None,
        "pm25": None,
        "tvoc": 0.0,
        "eco2": 400.0,
        "mq2": None,
        "mq3": None,
        "mq135": None,
        "mq8": None,
        "mics_co": None,
        "no2": None,
        "nh3": None,
    }

    last_post_time = 0
    post_interval = 1.0  # ส่งขึ้นเว็บทุก 1 วินาที
    sent_count = 0

    while running:
        port = find_esp32_port()
        if not port:
            print("⏳ กำลังค้นหาพอร์ต ESP32...", end="\r")
            time.sleep(1)
            continue

        try:
            ser = serial.Serial(port, BAUD_RATE, timeout=0.5)
            print(f"\n🔌 เชื่อมต่อ {port} สำเร็จ! กำลังสตรีมข้อมูลขึ้นเว็บ...")
        except Exception as e:
            print(f"⚠️ ไม่สามารถเปิดพอร์ต {port}: {e} (รอ 2 วินาที...)")
            time.sleep(2)
            continue

        try:
            while running:
                line_bytes = ser.readline()
                if not line_bytes:
                    continue

                try:
                    raw_line = line_bytes.decode('utf-8', errors='replace')
                except Exception:
                    continue

                clean_line = strip_ansi(raw_line).strip()
                if not clean_line:
                    continue

                # ตรวจจับข้อความและอัปเดตตัวเลข
                m = RE_TEMP.search(clean_line)
                if m:
                    try: cur_data["temp"] = float(m.group(1))
                    except ValueError: pass

                m = RE_HUM.search(clean_line)
                if m:
                    try: cur_data["rh"] = float(m.group(1))
                    except ValueError: pass

                m = RE_ECO2.search(clean_line)
                if m:
                    try: cur_data["eco2"] = float(m.group(1))
                    except ValueError: pass

                m = RE_TVOC.search(clean_line)
                if m:
                    try: cur_data["tvoc"] = float(m.group(1))
                    except ValueError: pass

                m = RE_PM25.search(clean_line)
                if m:
                    try: cur_data["pm25"] = float(m.group(1))
                    except ValueError: pass

                m = RE_MQ2.search(clean_line)
                if m:
                    try: cur_data["mq2"] = int(m.group(1))
                    except ValueError: pass

                m = RE_MQ3.search(clean_line)
                if m:
                    try: cur_data["mq3"] = int(m.group(1))
                    except ValueError: pass

                m = RE_MQ8.search(clean_line)
                if m:
                    try: cur_data["mq8"] = int(m.group(1))
                    except ValueError: pass

                m = RE_MQ135.search(clean_line)
                if m:
                    try: cur_data["mq135"] = int(m.group(1))
                    except ValueError: pass

                m = RE_CO.search(clean_line)
                if m:
                    try: cur_data["mics_co"] = int(round(float(m.group(1))))
                    except ValueError: pass

                m = RE_NO2.search(clean_line)
                if m:
                    try: cur_data["no2"] = int(round(float(m.group(1))))
                    except ValueError: pass

                m = RE_NH3.search(clean_line)
                if m:
                    try: cur_data["nh3"] = int(round(float(m.group(1))))
                    except ValueError: pass

                # ส่งข้อมูลขึ้นเว็บเมื่อมีข้อมูลเซนเซอร์
                now = time.time()
                if (now - last_post_time >= post_interval) and (cur_data["temp"] is not None or cur_data["mq3"] is not None):
                    last_post_time = now
                    try:
                        res = requests.post(API_URL, json=cur_data, timeout=2.0)
                        if res.status_code == 200:
                            sent_count += 1
                            res_json = res.json()
                            ai_pred = res_json.get("ai", {}).get("prediction", "N/A")
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ ส่งข้อมูลสำเร็จ (#{sent_count}) | "
                                  f"Temp={cur_data['temp']}°C, RH={cur_data['rh']}%, "
                                  f"TVOC={cur_data['tvoc']}ppb, eCO2={cur_data['eco2']}ppm, "
                                  f"PM2.5={cur_data['pm25']} | MQ3={cur_data['mq3']}, MQ135={cur_data['mq135']} | AI={ai_pred}")
                        else:
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠️ Server {res.status_code}: {res.text}")
                    except Exception as ex:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ ไม่สามารถส่งข้อมูลไปยัง Backend: {ex}")

        except (serial.SerialException, OSError) as e:
            print(f"\n⚠️ ขาดการเชื่อมต่อกับ Serial: {e} (กำลังลองเชื่อมต่อใหม่...)")
            try: ser.close()
            except Exception: pass
            time.sleep(1.5)


if __name__ == "__main__":
    main()
