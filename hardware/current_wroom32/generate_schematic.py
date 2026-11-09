"""Current firmware-aligned harness schematic; no assumed physical module footprints."""
from pathlib import Path
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
# Reuse drawing primitives only, without executing the older revision's design/export.
source = (HERE.parent / 'production_modules/generate_schematic.py').read_text(encoding='utf-8')
exec(compile(source.split("\ntext(40,48,")[0], str(HERE / 'drawing_primitives'), 'exec'))
OUT = HERE
NAME = 'VOC_WROOM32_Current_2026-11-02'
firmware = (ROOT / 'vocs-website/firmware/voc_esp32/voc_esp32.ino').read_text(encoding='utf-8')
expected = {'DHT_PIN':27,'I2C1_SDA':21,'I2C1_SCL':22,'I2C2_SDA':32,'I2C2_SCL':13,'PMS_RX':16,'PMS_TX':17,'PMS_SET_PIN':23,'MQ2_PIN':33,'MQ3_PIN':36,'MQ8_PIN':34,'MQ135_PIN':39,'FAN_INTAKE':25,'FAN_EXHAUST':26}
for key, val in expected.items():
    assert int(re.search(r'^#define\s+'+key+r'\s+(\d+)', firmware, re.M)[1]) == val, key

text(40,45,'VOC QUALITY - CURRENT ESP32-WROOM-32 MODULE WIRING',24,bold=True)
text(40,78,'2026-11-02 | Firmware-aligned design | 38-pin DevKit + IO expansion documented; actual header geometry unverified',13)
text(40,105,'Harness pin numbers below are DESIGN assignments, except PMS5003 native pins. NOT fabrication-ready. Match module SIGNAL labels.',12,'#a34b15')

zone(40,140,880,470,'01 POWER - regulated 5V input; separate sensor 3.3V')
module('J1','5V DC regulated / load budget TBD',190,235,[(1,'5V IN','5V_IN'),(2,'GND','GND')],280)
passive('F1','Fuse: size for wiring + measured load',670,250,'5V_IN','5V_SYS','F')
module('U2','AP2112K-3.3TRG1 / sensor rail',190,400,[(1,'VIN','5V_SYS'),(2,'GND','GND'),(3,'EN','5V_SYS'),(4,'NC',None),(5,'VOUT','3V3_SENS')],280)
for ref,val,x,y,net in [('C1','100uF 10V',670,340,'5V_SYS'),('C2','1uF X7R input',670,430,'5V_SYS'),('C3','4.7uF X7R output',670,520,'3V3_SENS')]:
    passive(ref,val,x,y,net,'GND','C')

zone(40,650,880,720,'02 MCU - GPIO names, NOT header position numbers')
mapping=[('VIN','5V','5V_SYS'),('GND','GND','GND'),('27','DHT_PIN','DHT_DATA'),('21','I2C1_SDA','CCS_SDA'),('22','I2C1_SCL','CCS_SCL'),('32','I2C2_SDA','ADS_SDA'),('13','I2C2_SCL','ADS_SCL'),('16','PMS_RX','PMS_TXD'),('17','PMS_TX','PMS_RXD'),('23','PMS_SET_PIN','PMS_SET'),('33','MQ2_PIN','ADC_MQ2'),('36','MQ3_PIN','ADC_MQ3'),('34','MQ8_PIN','ADC_MQ8'),('39','MQ135_PIN','ADC_MQ135'),('25','FAN_INTAKE','RELAY_IN1'),('26','FAN_EXHAUST','RELAY_IN2')]
module('U1','ESP32-WROOM-32 / 38-pin DevKit',220,755,[(p,k if k in ('5V','GND') else 'GPIO'+p+' '+k,n) for p,k,n in mapping],390)
for i,s in enumerate(['USB: avoid simultaneous external 5V unless power isolation is verified.','Do not join DevKit 3V3 output to the separate 3V3_SENS regulator.','TwoWire(1) is a second HARDWARE I2C controller, not software I2C.']):text(65,1280+i*25,s,11)

zone(960,140,900,660,'03 DIGITAL SENSORS - DHT22 / CCS811')
module('J2','DHT22 module harness',1110,240,[(1,'VCC 3V3','3V3_SENS'),(2,'GND','GND'),(3,'DATA','DHT_DATA')],270)
passive('R1','4.7k (DNP if already fitted)',1620,265,'3V3_SENS','DHT_DATA')
module('J3','CCS811 breakout / 0x5B',1110,480,[(1,'3V3 supply','3V3_SENS'),(2,'GND','GND'),(3,'SDA','CCS_SDA'),(4,'SCL','CCS_SCL'),(5,'nWAKE','GND'),(6,'ADDR HIGH','3V3_SENS'),(7,'nRESET','CCS_RESET'),(8,'nINT unused',None)],285)
passive('R2','4.7k optional pull-up',1620,450,'3V3_SENS','CCS_SDA')
passive('R3','4.7k optional pull-up',1620,535,'3V3_SENS','CCS_SCL')
passive('R4','10k reset pull-up',1620,620,'3V3_SENS','CCS_RESET')
passive('C4','100nF',1620,710,'3V3_SENS','GND','C')

zone(1900,140,1000,510,'04 PMS5003 - native 8-pin assignment / UART2')
module('J4','PMS5003 (native pins)',2060,240,[(1,'VCC 5V','5V_SYS'),(2,'GND','GND'),(3,'SET','PMS_SET'),(4,'RXD <- GPIO17','PMS_RXD'),(5,'TXD -> GPIO16','PMS_TXD'),(6,'RESET','PMS_RESET'),(7,'NC',None),(8,'NC',None)],340)
passive('R5','10k reset pull-up',2650,275,'3V3_SENS','PMS_RESET')
passive('C5','100nF',2650,380,'5V_SYS','GND','C')
passive('C6','10uF 10V',2650,480,'5V_SYS','GND','C')
text(1920,600,'3.3V UART/control levels; SET HIGH = operating. Verify connector orientation.',11)

zone(960,840,900,530,'05 ADS1115 - separate hardware I2C / 0x48')
module('J5','ADS1115 module harness',1110,940,[(1,'VDD','3V3_SENS'),(2,'GND','GND'),(3,'SDA','ADS_SDA'),(4,'SCL','ADS_SCL'),(5,'ADDR','GND'),(6,'A0 CO/RED','ADC_RED'),(7,'A1 NO2/OX','ADC_OX'),(8,'A2 NH3','ADC_NH3'),(9,'A3 unused','GND'),(10,'ALERT unused',None)],295)
passive('R6','4.7k optional pull-up',1630,970,'3V3_SENS','ADS_SDA')
passive('R7','4.7k optional pull-up',1630,1065,'3V3_SENS','ADS_SCL')
passive('C7','100nF',1630,1160,'3V3_SENS','GND','C')
text(980,1325,'Firmware reports divided ADC-node mV; do not silently rescale calibration.',11)

zone(1900,690,1000,680,'06 RELAY MODULE + TWO 5V DC FANS - provisional interface')
module('K1','2PH6391A 2-channel module (logical)',2080,790,[(1,'VCC','5V_SYS'),(2,'GND','GND'),(3,'IN1 - verify 3V3 compatible','RELAY_IN1'),(4,'IN2 - verify 3V3 compatible','RELAY_IN2'),(5,'COM1','5V_SYS'),(6,'NO1','FAN1_POS'),(7,'NC1 unused',None),(8,'COM2','5V_SYS'),(9,'NO2','FAN2_POS'),(10,'NC2 unused',None)],400)
module('J6','Intake 5V DC fan',2660,800,[(1,'+','FAN1_POS'),(2,'-','GND')],190)
module('J7','Exhaust 5V DC fan',2660,1010,[(1,'+','FAN2_POS'),(2,'-','GND')],190)
for i,s in enumerate(['Firmware currently writes HIGH to both relay inputs; active polarity is NOT verified.','Do not connect a module that pulls GPIO to 5V. Add a suitable interface after SKU check.','Contacts shown are logical relay-module terminals, not a bare relay coil pinout.','Fan current, contact rating, suppression and safe boot state require bench validation.']):text(1920,1230+i*25,s,11,'#a34b15')

zone(40,1410,2860,620,'07 ANALOG MODULES - 7 x divider/filter channels; no 5V direct to ADC')
module('J8','MiCS-6814 analog module / onboard heater drive',210,1510,[(1,'5V','5V_SYS'),(2,'GND','GND'),(3,'CO / RED','RAW_RED'),(4,'NO2 / OX','RAW_OX'),(5,'NH3','RAW_NH3')],390)
channels=[('RED','ADC_RED'),('OX','ADC_OX'),('NH3','ADC_NH3'),('MQ2','ADC_MQ2'),('MQ3','ADC_MQ3'),('MQ8','ADC_MQ8'),('MQ135','ADC_MQ135')]
for i,(key,adc) in enumerate(channels):
    x=240+i*400
    if i>=3:
        module('J'+str(i+6),key+' 5V module',x,1510,[(1,'5V','5V_SYS'),(2,'GND','GND'),(3,'AOUT','RAW_'+key),(4,'DOUT unused',None)],235)
    text(x-160,1750,key+' -> '+adc,12,bold=True)
    passive('R'+str(8+i*2),'10k 1%',x,1800,'RAW_'+key,adc)
    passive('R'+str(9+i*2),'15k 1%',x,1880,adc,'GND')
    passive('C'+str(8+i),'100nF',x,1960,adc,'GND','C')
text(40,2075,'DESIGN STATUS / RELEASE GATES',16,bold=True)
for i,s in enumerate(['Based on current voc_esp32.ino pin defines and repository wiring notes; not the proposed SHT40/SGP41/SPS30/ZE03 upgrade.',
'Divider gain = 0.6 nominal. At 5.25V and 1% resistor worst case: <=3.176V. Validate analog output limits, loading, noise and calibration.',
'All modules must be 3.3V-logic compatible. MQ/MiCS heaters and fans use 5V. Do not feed a bare MiCS heater from 5V.',
'Regulator dissipation = (5V - 3.3V) x sensor current: verify thermal budget. Size PSU/fuse/connectors from actual heater/fan start current.',
'Footprints, relay polarity/input interface, expansion-board jumpers and module SKUs remain unverified. No Gerber or production release.']):text(40,2110+i*27,s,12)

assert len({p['reference'] for p in parts})==len(parts)
assert all(len(v)>=2 for v in nets.values()), {k:v for k,v in nets.items() if len(v)<2}
assert 5.25*(15*1.01)/(10*.99+15*1.01)<3.3
doc={'head':{'docType':'1','editorVersion':'6.5.51','newgId':True,'c_para':{'name':NAME}},'canvas':'CA~2960~2280~#FFFFFF~yes~#CCCCCC~10~2960~2280~line~10~pixel~5~0~0','shape':shapes,'BBox':{'x':0,'y':0,'width':2960,'height':2280},'colors':{}}
(OUT/(NAME+'.json')).write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/(NAME+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="2960" height="2280" viewBox="0 0 2960 2280"><rect width="2960" height="2280" fill="#fff"/>'+''.join(svg)+'</svg>',encoding='utf-8')
(OUT/'connections.json').write_text(json.dumps({'parts':parts,'nets':nets,'firmware_pin_defines':expected},ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'verification.json').write_text(json.dumps({'status':'source checks passed; CAD ERC and physical validation pending','components':len(parts),'nets':len(nets),'firmware_pin_defines_checked':len(expected),'divider_worst_case_V':5.25*(15*1.01)/(10*.99+15*1.01)},indent=2),encoding='utf-8')
print(f'{NAME}: {len(parts)} parts, {len(nets)} nets; {len(expected)} firmware pin definitions verified')
