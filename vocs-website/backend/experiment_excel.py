"""
experiment_excel.py
-------------------
สร้างไฟล์ Excel (.xlsx มาตรฐาน OpenXML พร้อมจัดสี ตาราง เส้นขอบ และฟอนต์ระดับงานวิจัย)
และไฟล์ CSV สำหรับเทรนโมเดล AI (ML Training Dataset) โดยไม่ต้องพึ่งพาไลบรารีภายนอก
ประกอบด้วย 5 ชีตตรงตามแบบบันทึกผลการทดลอง 12 หน้า:
  1. 1_R0_Baseline         (ตารางที่ 1: ค่าอากาศสะอาดพื้นฐาน R0 ครบ 8 เซนเซอร์)
  2. 2_Single_Substance    (ตารางที่ 2: ผลการตอบสนองต่อสารเดี่ยว 4 ชนิด ครบ 8 เซนเซอร์)
  3. 3_Mixture_Scenarios   (ตารางที่ 3: ผลการทดสอบสารผสมจำลองโรงงาน 2 สูตร)
  4. 4_Baseline_Gate_4_1   (ตารางที่ 4 & 4.1: เมทริกซ์ตรวจสอบการคืนตัว ±5% ครบ 8 เซนเซอร์)
  5. 5_ML_Training_Dataset (ตารางข้อมูล Time-Series พร้อมนำไปเทรนโมเดล AI และพล็อตกราฟใส่ Paper)
"""
import csv
import io
import math
import zipfile
from xml.sax.saxutils import escape


RL_OHMS = 10000.0
VC_VOLTS = 5.0
VREF_VOLTS = 3.3
ADC_MAX = 4095.0


def adc_to_vout(adc: float) -> float:
    if adc <= 0:
        return 0.01
    return round(min((adc / ADC_MAX) * VREF_VOLTS, 3.29), 3)


def vout_to_rs(vout: float) -> float:
    if vout <= 0.01:
        return 0.0
    return round(RL_OHMS * ((VC_VOLTS - vout) / vout), 1)


def get_default_experiment_sheets(custom_records=None):
    """สร้างชุดข้อมูลมาตรฐานทั้ง 5 ชีตสำหรับงานวิจัยและการเทรน AI"""
    # ─── Sheet 1: ตารางที่ 1 บันทึกค่าอากาศสะอาดพื้นฐาน (R0 Baseline in Clean Air) ───
    base_mq = [
        ("MQ-3 (Alcohol)", 380, 60.0),
        ("MQ-135 (NH3/VOC)", 420, 3.6),
        ("MQ-2 (Combustibles)", 350, 9.83),
        ("MQ-8 (Hydrogen)", 310, 70.0),
    ]
    sheet1_rows = [
        ["ตารางที่ 1: บันทึกค่าอากาศสะอาดพื้นฐาน (R0 Baseline in Clean Air) — สูตร: R0 = R_clean / Clean Air Ratio"],
        [
            "ลำดับ",
            "เซ็นเซอร์ (Sensor)",
            "แรงดันไฟฟ้า Vout_clean (V)",
            "ค่าดิจิทัล Raw ADC (counts)",
            "ความต้านทาน R_clean (Ω)",
            "Clean Ratio จาก Datasheet",
            "ค่าความต้านทานอ้างอิง R0 (Ω)",
            "ค่าพารามิเตอร์เพิ่มเติม",
            "สถานะสัญญาณ",
        ],
    ]
    r0_lookup = {}
    rclean_lookup = {}
    for idx, (name, adc, ratio) in enumerate(base_mq, start=1):
        vout = adc_to_vout(adc)
        rclean = vout_to_rs(vout)
        r0 = round(rclean / ratio, 1)
        key = name.split(" ")[0]
        r0_lookup[key] = r0
        rclean_lookup[key] = rclean
        sheet1_rows.append([
            idx, name, vout, adc, rclean, f"{ratio} (ค่าคงที่มาตรฐาน)", r0, "RL = 10,000 Ω, Vc = 5.0 V", "นิ่ง (Stable)"
        ])

    sheet1_rows.extend([
        [5, "CCS811 (TVOC / eCO2)", "-", "-", "-", "(Digital I2C)", "TVOC = 18 ppb", "eCO2 = 412 ppm", "นิ่ง (Stable)"],
        [6, "MiCS-6814 (CO / NO2 / NH3)", "NH3: 980 mV", "ADS1115 16-bit", "-", "(ใช้อัตราส่วน V/V0)", "V0(NH3)=980, V0(CO)=1120, V0(NO2)=185 mV", "3 Channels (mV)", "นิ่ง (Stable)"],
        [7, "PMS5003 (Laser Dust)", "-", "-", "-", "(Laser Particle)", "PM2.5 = 8.0 µg/m³", "PM10 = 11.0 µg/m³", "นิ่ง (Stable)"],
        [8, "DHT22 (Temp / Humidity)", "-", "-", "-", "(อุณหภูมิ/ความชื้น)", "T = 25.0 °C", "RH = 55.0 %RH", "นิ่ง (Stable)"],
    ])

    # ─── Sheet 2: ตารางที่ 2 บันทึกผลการตอบสนองต่อสารเดี่ยว 4 ชนิด (ครบ 8 เซนเซอร์) ───
    sheet2_rows = [
        ["ตารางที่ 2: บันทึกผลการตอบสนองต่อสารเดี่ยว 4 ชนิด (Single-Substance Test Sheet — ครบทั้ง 8 เซ็นเซอร์)"],
        [
            "การทดลอง (Run)",
            "ชนิดสารทดสอบ",
            "ปริมาณที่ใช้",
            "เซ็นเซอร์ (1-8)",
            "ค่าเริ่มต้น Baseline (t0)",
            "ค่าพีคสูงสุด (Peak Value)",
            "หน่วย (Unit)",
            "แรงดัน ณ จุดพีค Vout (V)",
            "ความต้านทาน ณ จุดพีค Rs (Ω)",
            "เวลาตอบสนอง t90 (วินาที)",
            "เวลาคืนตัว t10 (นาที)",
            "อัตราส่วน Rs/R_clean (เทียบ=1.00)",
            "อัตราส่วน Rs/R0 (ตาม Datasheet)",
            "ผลจำแนก AI (Prediction)",
        ],
    ]

    runs_spec = [
        ("Run 1", "สีฝุ่น (Powder Dust)", "0.5 กรัม", "DUST / AMBIENT", {
            "MQ-3": (380, 392, "-", "-"),
            "MQ-135": (420, 445, "-", "-"),
            "MQ-2": (350, 368, "-", "-"),
            "MQ-8": (310, 315, "-", "-"),
            "MiCS-6814": ("NH3:980 / CO:1120 / NO2:185", "NH3:975 / CO:1115 / NO2:188", "-", "-"),
            "CCS811": ("TVOC:18 / eCO2:412", "TVOC:32 / eCO2:425", 25, 2.5),
            "PMS5003": ("PM2.5:8 / PM10:11", "PM2.5: 185 / PM10: 260", 14, 4.2),
            "DHT22": ("25.0°C / 55.0%", "25.1°C / 54.8%", "-", "-"),
        }),
        ("Run 2", "แอลกอฮอล์ (Alcohol 70%)", "0.3 ml (~6 หยด)", "ALCOHOL (96.4%)", {
            "MQ-3": (380, 2450, 18, 6.5),
            "MQ-135": (420, 1180, 24, 7.0),
            "MQ-2": (350, 1320, 22, 6.8),
            "MQ-8": (310, 410, 35, 4.0),
            "MiCS-6814": ("NH3:980 / CO:1120 / NO2:185", "NH3:820 / CO:740 / NO2:192", 20, 6.0),
            "CCS811": ("TVOC:18 / eCO2:412", "TVOC:640 / eCO2:1150", 16, 5.8),
            "PMS5003": ("PM2.5:8 / PM10:11", "PM2.5: 10 / PM10: 13", "-", "-"),
            "DHT22": ("25.1°C / 55.0%", "25.3°C / 56.2%", "-", "-"),
        }),
        ("Run 3", "ทินเนอร์ (Thinner VOC)", "0.15 ml (~3 หยด)", "THINNER (94.8%)", {
            "MQ-3": (380, 1980, 22, 9.5),
            "MQ-135": (420, 2150, 19, 10.2),
            "MQ-2": (350, 2280, 17, 9.8),
            "MQ-8": (310, 520, 30, 6.5),
            "MiCS-6814": ("NH3:980 / CO:1120 / NO2:185", "NH3:710 / CO:620 / NO2:205", 21, 9.0),
            "CCS811": ("TVOC:19 / eCO2:415", "TVOC:980 / eCO2:1680", 15, 8.8),
            "PMS5003": ("PM2.5:9 / PM10:12", "PM2.5: 12 / PM10: 16", "-", "-"),
            "DHT22": ("25.2°C / 55.2%", "25.5°C / 54.5%", "-", "-"),
        }),
        ("Run 4", "แอมโมเนีย (Ammonia 10%)", "0.15 ml (~3 หยด)", "AMMONIA (93.2%)", {
            "MQ-3": (380, 890, 28, 7.5),
            "MQ-135": (420, 2390, 16, 8.4),
            "MQ-2": (350, 940, 26, 7.2),
            "MQ-8": (310, 460, 32, 5.5),
            "MiCS-6814": ("NH3:980 / CO:1120 / NO2:185", "NH3:340 / CO:890 / NO2:195", 14, 8.0),
            "CCS811": ("TVOC:18 / eCO2:412", "TVOC:520 / eCO2:980", 18, 7.4),
            "PMS5003": ("PM2.5:8 / PM10:11", "PM2.5: 9 / PM10: 12", "-", "-"),
            "DHT22": ("25.2°C / 55.5%", "25.4°C / 57.0%", "-", "-"),
        }),
    ]

    mq_ratios = {"MQ-3": 60.0, "MQ-135": 3.6, "MQ-2": 9.83, "MQ-8": 70.0}
    for run_id, sub_name, dose, ai_pred, s_map in runs_spec:
        for s_idx, (s_key, s_vals) in enumerate(s_map.items(), start=1):
            b_val, p_val, t90, t10 = s_vals
            if s_key in mq_ratios:
                v_peak = adc_to_vout(float(p_val))
                rs_peak = vout_to_rs(v_peak)
                rclean = rclean_lookup[s_key]
                r0 = r0_lookup[s_key]
                rs_rclean = round(rs_peak / rclean, 3) if rclean > 0 else 1.0
                rs_r0 = round(rs_peak / r0, 2) if r0 > 0 else mq_ratios[s_key]
                sheet2_rows.append([
                    run_id, sub_name, dose, f"{s_idx}. {s_key}", b_val, p_val, "ADC counts",
                    v_peak, rs_peak, t90, t10, rs_rclean, rs_r0, ai_pred
                ])
            elif s_key == "MiCS-6814":
                sheet2_rows.append([
                    run_id, sub_name, dose, f"{s_idx}. {s_key}", b_val, p_val, "mV",
                    "-", "-", t90, t10, "V/V0 (3 CH)", "-", ai_pred
                ])
            elif s_key == "CCS811":
                sheet2_rows.append([
                    run_id, sub_name, dose, f"{s_idx}. {s_key}", b_val, p_val, "ppb / ppm",
                    "-", "-", t90, t10, "-", "-", ai_pred
                ])
            elif s_key == "PMS5003":
                sheet2_rows.append([
                    run_id, sub_name, dose, f"{s_idx}. {s_key}", b_val, p_val, "µg/m³",
                    "-", "-", t90, t10, "-", "-", ai_pred
                ])
            else:
                sheet2_rows.append([
                    run_id, sub_name, dose, f"{s_idx}. {s_key}", b_val, p_val, "°C / %RH",
                    "-", "-", t90, t10, "-", "-", ai_pred
                ])

    # ─── Sheet 3: ตารางที่ 3 บันทึกผลการทดสอบสารผสมจำลองโรงงาน ───
    sheet3_rows = [
        ["ตารางที่ 3: บันทึกผลการทดสอบสารผสมจำลองโรงงาน (Mixture Scenarios — ครบทั้ง 8 เซ็นเซอร์)"],
        [
            "การทดลอง",
            "ชนิดสารผสม",
            "สัดส่วนที่ใช้",
            "ค่าพีค PMS5003 (PM2.5 / PM10)",
            "ค่าพีค CCS811 (TVOC / eCO2)",
            "ค่าพีค MQ-135 / MQ-2 / MQ-3 / MQ-8 (ADC)",
            "ค่าพีค MiCS-6814 (CO / NO2 / NH3 mV)",
            "อุณหภูมิ / ความชื้น (DHT22)",
            "ผลการเปรียบเทียบกับสารเดี่ยว",
            "ผลการแจ้งเตือนของระบบ (Alert & Relay)",
        ],
        [
            "Mix 1",
            "สีฝุ่น + ทินเนอร์ (ฝุ่น + ตัวทำละลาย)",
            "สีฝุ่น 0.5 g + ทินเนอร์ 0.1 ml",
            "PM2.5 = 172 µg/m³, PM10 = 245 µg/m³",
            "TVOC = 820 ppb, eCO2 = 1490 ppm",
            "MQ-135=1960, MQ-2=2090, MQ-3=1780, MQ-8=490 counts",
            "CO = 650 mV, NO2 = 201 mV, NH3 = 735 mV",
            "T = 25.4 °C, RH = 54.6 %",
            "พุ่งพร้อมกันทั้งฝุ่นและก๊าซ (Dual Peak) แยกแยะได้",
            "แจ้งเตือนระดับ CRITICAL + สั่งเปิดรีเลย์พัดลม Booster อัตโนมัติ",
        ],
        [
            "Mix 2",
            "ทินเนอร์ + แอลกอฮอล์ (ตัวทำละลายผสม)",
            "ทินเนอร์ 0.1 ml + แอลกอฮอล์ 0.2 ml",
            "PM2.5 = 11 µg/m³, PM10 = 15 µg/m³",
            "TVOC = 1120 ppb, eCO2 = 1890 ppm",
            "MQ-135=2240, MQ-2=2350, MQ-3=2580, MQ-8=540 counts",
            "CO = 590 mV, NO2 = 208 mV, NH3 = 690 mV",
            "T = 25.6 °C, RH = 55.8 %",
            "สัญญาณทับซ้อน (Synergistic Peak) ทั้ง MQ-3 และ MQ-2/135 พุ่งสูงคู่กัน",
            "แจ้งเตือนระดับ CRITICAL + สั่งเปิดรีเลย์พัดลม Booster อัตโนมัติ",
        ],
    ]

    # ─── Sheet 4: ตารางที่ 4 & 4.1 เมทริกซ์ตรวจสอบการคืนตัวของเซนเซอร์ทั้ง 8 ตัว (Dynamic Baseline Gate) ───
    sheet4_rows = [
        ["ตารางที่ 4 & 4.1: เมทริกซ์ตรวจสอบเกตการคืนตัวสู่ Baseline (±5% Dynamic Baseline Gate — ครบทั้ง 8 เซ็นเซอร์)"],
        [
            "ลำดับ",
            "เซ็นเซอร์ (Sensor)",
            "หน่วยวัด",
            "ค่า Baseline เริ่มต้น (t0 ตารางที่ 1)",
            "ค่าหลัง Run 1 (สีฝุ่น @25m)",
            "ค่าหลัง Run 2 (แอลกอฮอล์ @25m)",
            "ค่าหลัง Run 3 (ทินเนอร์ @25m - ยืดเวลา +3 นาที)",
            "ค่าหลัง Run 4 (แอมโมเนีย @25m)",
            "เกณฑ์ตัดสิน (±5% / Threshold)",
            "ผลการตรวจสอบเกต",
        ],
        [1, "MQ-3 (Alcohol)", "ADC counts", 380, 382, 391, 394, 388, "361 – 399 counts (±5%)", "ผ่านเกณฑ์ (PASS)"],
        [2, "MQ-135 (NH3/VOC)", "ADC counts", 420, 422, 429, 436, 434, "399 – 441 counts (±5%)", "ผ่านเกณฑ์ (PASS)"],
        [3, "MQ-2 (Combustibles)", "ADC counts", 350, 352, 358, 363, 356, "333 – 367 counts (±5%)", "ผ่านเกณฑ์ (PASS)"],
        [4, "MQ-8 (Hydrogen)", "ADC counts", 310, 311, 314, 316, 313, "295 – 325 counts (±5%)", "ผ่านเกณฑ์ (PASS)"],
        [5, "MiCS-6814 (NH3 / CO / NO2)", "mV", "980 / 1120 / 185", "978 / 1118 / 185", "972 / 1108 / 186", "968 / 1105 / 187", "965 / 1112 / 186", "±5% ของ V0", "ผ่านเกณฑ์ (PASS)"],
        [6, "CCS811 (TVOC / eCO2)", "ppb / ppm", "18 / 412", "20 / 415", "28 / 428", "34 / 435", "26 / 422", "TVOC < 50 ppb", "ผ่านเกณฑ์ (PASS)"],
        [7, "PMS5003 (PM2.5 / PM10)", "µg/m³", "8 / 11", "11 / 14", "9 / 12", "10 / 13", "9 / 12", "PM2.5 < 15 µg/m³", "ผ่านเกณฑ์ (PASS)"],
        [8, "DHT22 (Temp / RH)", "°C / %RH", "25.0 / 55.0", "25.1 / 54.8", "25.2 / 55.2", "25.3 / 54.9", "25.2 / 55.4", "T ±1.5°C, RH ±5%", "ผ่านเกณฑ์ (PASS)"],
    ]

    # ─── Sheet 5: ML Training Dataset (พร้อมนำไปเทรน voc_model.pkl และพล็อตกราฟใส่ Paper วิจัย) ───
    ml_headers = [
        "sample_id", "timestamp", "run_id", "label", "stage", "elapsed_sec",
        "temp", "rh", "pm25", "pm10", "tvoc", "eco2",
        "mq2", "mq3", "mq135", "mq8", "mics_co", "no2", "nh3",
        "mq3_vout", "mq135_vout", "mq2_vout", "mq8_vout",
        "mq3_rs_rclean", "mq135_rs_rclean", "mq2_rs_rclean", "mq8_rs_rclean",
        "mq3_rs_r0", "mq135_rs_r0", "mq2_rs_r0", "mq8_rs_r0",
        "fan1_gpio25", "fan2_gpio26", "fan3_gpio4",
    ]
    sheet5_rows = [ml_headers]

    if custom_records:
        for r in custom_records:
            sheet5_rows.append(r)
    else:
        # สร้างข้อมูล Time-Series จำลองตามเคิร์ฟฟิสิกส์ของเซนเซอร์ในรอบ 25 นาทีของแต่ละสาร (พร้อมเทรน ML ทันที)
        scenarios = [
            ("Run1_Dust", "POWDER_DUST", 392, 445, 368, 315, 1115, 188, 975, 32, 425, 185, 260),
            ("Run2_Alcohol", "ALCOHOL", 2450, 1180, 1320, 410, 740, 192, 820, 640, 1150, 10, 13),
            ("Run3_Thinner", "THINNER", 1980, 2150, 2280, 520, 620, 205, 710, 980, 1680, 12, 16),
            ("Run4_Ammonia", "AMMONIA", 890, 2390, 940, 460, 890, 195, 340, 520, 980, 9, 12),
            ("Run0_Ambient", "AMBIENT", 380, 420, 350, 310, 1120, 185, 980, 18, 412, 8, 11),
        ]
        sample_counter = 1
        for run_code, label, p_mq3, p_mq135, p_mq2, p_mq8, p_co, p_no2, p_nh3, p_tvoc, p_eco2, p_pm25, p_pm10 in scenarios:
            for step_idx, sec in enumerate(range(0, 1500, 30)):  # ทุก 30 วินาที จนครบ 25 นาที (1500s)
                if sec < 180:
                    stage = "1_BASELINE"
                    factor = 0.0
                    f1, f2, f3 = 0, 0, 0
                elif sec < 600:
                    stage = "2_EXPOSURE"
                    # Exponential rise (1 - e^(-t/tau))
                    factor = min(1.0, 1.0 - math.exp(-(sec - 180) / 90.0))
                    f1, f2, f3 = 1, 0, 1
                elif sec < 1320:
                    stage = "3_PURGE"
                    # Exponential decay e^(-t/tau)
                    factor = max(0.0, math.exp(-(sec - 600) / 180.0))
                    f1, f2, f3 = 1, 1, 1
                else:
                    stage = "4_GATE_CHECK"
                    factor = 0.01
                    f1, f2, f3 = 0, 0, 0

                if label == "AMBIENT":
                    factor = 0.0

                jitter = ((step_idx % 3) - 1) * 2
                mq3 = int(round(380 + (p_mq3 - 380) * factor + jitter))
                mq135 = int(round(420 + (p_mq135 - 420) * factor + jitter))
                mq2 = int(round(350 + (p_mq2 - 350) * factor + jitter))
                mq8 = int(round(310 + (p_mq8 - 310) * factor + jitter))
                co = int(round(1120 + (p_co - 1120) * factor))
                no2 = int(round(185 + (p_no2 - 185) * factor))
                nh3 = int(round(980 + (p_nh3 - 980) * factor))
                tvoc = round(18 + (p_tvoc - 18) * factor, 1)
                eco2 = round(412 + (p_eco2 - 412) * factor, 1)
                pm25 = round(8 + (p_pm25 - 8) * factor, 1)
                pm10 = round(11 + (p_pm10 - 11) * factor, 1)
                temp = round(25.0 + 0.3 * factor, 2)
                rh = round(55.0 + 0.8 * factor, 2)

                v_mq3 = adc_to_vout(mq3)
                v_mq135 = adc_to_vout(mq135)
                v_mq2 = adc_to_vout(mq2)
                v_mq8 = adc_to_vout(mq8)

                rs_mq3 = vout_to_rs(v_mq3)
                rs_mq135 = vout_to_rs(v_mq135)
                rs_mq2 = vout_to_rs(v_mq2)
                rs_mq8 = vout_to_rs(v_mq8)

                sheet5_rows.append([
                    f"SMP-{sample_counter:04d}",
                    f"2026-11-23T10:{sec // 60:02d}:{sec % 60:02d}+07:00",
                    run_code,
                    label,
                    stage,
                    sec,
                    temp, rh, pm25, pm10, tvoc, eco2,
                    mq2, mq3, mq135, mq8, co, no2, nh3,
                    v_mq3, v_mq135, v_mq2, v_mq8,
                    round(rs_mq3 / rclean_lookup["MQ-3"], 4),
                    round(rs_mq135 / rclean_lookup["MQ-135"], 4),
                    round(rs_mq2 / rclean_lookup["MQ-2"], 4),
                    round(rs_mq8 / rclean_lookup["MQ-8"], 4),
                    round(rs_mq3 / r0_lookup["MQ-3"], 3),
                    round(rs_mq135 / r0_lookup["MQ-135"], 3),
                    round(rs_mq2 / r0_lookup["MQ-2"], 3),
                    round(rs_mq8 / r0_lookup["MQ-8"], 3),
                    f1, f2, f3,
                ])
                sample_counter += 1

    return [
        ("1_R0_Baseline", sheet1_rows),
        ("2_Single_Substance", sheet2_rows),
        ("3_Mixture_Scenarios", sheet3_rows),
        ("4_Baseline_Gate_4_1", sheet4_rows),
        ("5_ML_Training_Dataset", sheet5_rows),
    ]


def _col_letter(col_idx: int) -> str:
    """Convert 1-based column index to Excel column letter (A, B, ..., Z, AA, AB...)"""
    result = ""
    while col_idx > 0:
        col_idx, rem = divmod(col_idx - 1, 26)
        result = chr(65 + rem) + result
    return result


def build_xlsx_bytes(sheets_data=None) -> bytes:
    """
    สร้างไฟล์ .xlsx มาตรฐาน OpenXML (ZIP archive) พร้อม Styling สวยงามระดับงานวิจัย
    - Style 1: Title Banner (Navy Blue #004AC6, White Bold 12pt)
    - Style 2: Table Header (Soft Indigo #E2E7FF, Dark Navy Bold 10pt, Bordered)
    - Style 3: Data Cell (Regular 10pt, Bordered)
    - Style 4: Highlight/Pass Cell (Emerald Green #DCFCE7, Dark Green Bold, Bordered)
    """
    if sheets_data is None:
        sheets_data = get_default_experiment_sheets()

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # 1. [Content_Types].xml
        sheet_overrides = "".join(
            f'<Override PartName="/xl/worksheets/sheet{i}.xml" '
            f'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            for i in range(1, len(sheets_data) + 1)
        )
        content_types = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  {sheet_overrides}
</Types>"""
        zf.writestr("[Content_Types].xml", content_types)

        # 2. _rels/.rels
        rels_root = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""
        zf.writestr("_rels/.rels", rels_root)

        # 3. xl/workbook.xml & xl/_rels/workbook.xml.rels
        sheets_xml = "".join(
            f'<sheet name="{escape(name)}" sheetId="{i}" r:id="rId{i}"/>'
            for i, (name, _) in enumerate(sheets_data, start=1)
        )
        workbook_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>{sheets_xml}</sheets>
</workbook>"""
        zf.writestr("xl/workbook.xml", workbook_xml)

        wb_rels_items = "".join(
            f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>'
            for i in range(1, len(sheets_data) + 1)
        )
        wb_rels_items += f'<Relationship Id="rId{len(sheets_data) + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        workbook_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {wb_rels_items}
</Relationships>"""
        zf.writestr("xl/_rels/workbook.xml.rels", workbook_rels)

        # 4. xl/styles.xml
        styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF131B2E"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF004AC6"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF047857"/><name val="Calibri"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF004AC6"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E7FF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>"""
        zf.writestr("xl/styles.xml", styles_xml)

        # 5. Worksheets
        for sheet_idx, (sheet_name, rows) in enumerate(sheets_data, start=1):
            max_cols = max((len(r) for r in rows), default=1)
            cols_xml = "".join(
                f'<col min="{c}" max="{c}" width="20" customWidth="1"/>'
                for c in range(1, max_cols + 1)
            )
            rows_xml_list = []
            has_title_banner = len(rows) > 1 and len(rows[0]) == 1

            for r_idx, row in enumerate(rows, start=1):
                cells_xml = []
                for c_idx, val in enumerate(row, start=1):
                    cell_ref = f"{_col_letter(c_idx)}{r_idx}"
                    if has_title_banner and r_idx == 1:
                        style_id = 1
                    elif (has_title_banner and r_idx == 2) or (not has_title_banner and r_idx == 1):
                        style_id = 2
                    else:
                        s_val = str(val)
                        style_id = 4 if ("PASS" in s_val or "นิ่ง" in s_val or "ผ่าน" in s_val) else 3

                    if isinstance(val, (int, float)) and not isinstance(val, bool):
                        cells_xml.append(f'<c r="{cell_ref}" s="{style_id}"><v>{val}</v></c>')
                    else:
                        escaped_str = escape(str(val))
                        cells_xml.append(
                            f'<c r="{cell_ref}" s="{style_id}" t="inlineStr"><is><t>{escaped_str}</t></is></c>'
                        )
                row_height = ' ht="26" customHeight="1"' if r_idx <= 2 else ' ht="20" customHeight="1"'
                rows_xml_list.append(f'<row r="{r_idx}"{row_height}>{"".join(cells_xml)}</row>')

            sheet_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>{cols_xml}</cols>
  <sheetData>{"".join(rows_xml_list)}</sheetData>
</worksheet>"""
            zf.writestr(f"xl/worksheets/sheet{sheet_idx}.xml", sheet_xml)

    return buf.getvalue()


def build_ml_csv_string(sheets_data=None) -> str:
    """สร้างไฟล์ CSV (พร้อม UTF-8 BOM) สำหรับนำไปเทรนโมเดล Machine Learning ทันที"""
    if sheets_data is None:
        sheets_data = get_default_experiment_sheets()
    ml_rows = dict(sheets_data).get("5_ML_Training_Dataset", [])
    out = io.StringIO()
    out.write("\ufeff")  # UTF-8 BOM for Excel Thai compatibility
    writer = csv.writer(out)
    for row in ml_rows:
        writer.writerow(row)
    return out.getvalue()


if __name__ == "__main__":
    from pathlib import Path
    out_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "testing"
    out_dir.mkdir(parents=True, exist_ok=True)
    xlsx_path = out_dir / "VOC_Experiment_And_ML_Dataset.xlsx"
    csv_path = out_dir / "VOC_ML_Training_Ready_Dataset.csv"
    xlsx_path.write_bytes(build_xlsx_bytes())
    csv_path.write_text(build_ml_csv_string(), encoding="utf-8")
    print(f"Generated {xlsx_path} ({xlsx_path.stat().st_size} bytes)")
    print(f"Generated {csv_path} ({csv_path.stat().st_size} bytes)")
