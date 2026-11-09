"""Generate an editable EasyEDA Standard exchange schematic and SVG preview.
Import the JSON into EasyEDA Pro via File > Import > EasyEDA(Standard).
Connector numbers specify our carrier harness, not arbitrary module pin order.
"""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from collections import defaultdict

OUT = Path(__file__).resolve().parent
shapes, svg, parts, nets = [], [], [], defaultdict(list)
counter = 0
def uid():
    global counter
    counter += 1
    return 'gge' + str(counter)
def text(x,y,s,size=12,color='#24344b',bold=False,target=None):
    item=f'T~L~{x}~{y}~0~{color}~Arial~{size}pt~{"bold" if bold else ""}~normal~~comment~{s}~1~start~{uid()}~0'
    (shapes if target is None else target).append(item)
    svg.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="Arial,sans-serif" font-size="{size*1.2}" font-weight="{"bold" if bold else "normal"}">{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#8b2635',target=None,width=1.5):
    (shapes if target is None else target).append(f'PL~{x1} {y1} {x2} {y2}~{color}~{width}~0~none~{uid()}~0')
    svg.append(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{color}" stroke-width="{width}" fill="none"/>')
def rect(x,y,w,h,color='#8b2635',target=None,fill='none'):
    (shapes if target is None else target).append(f'R~{x}~{y}~~~{w}~{h}~{color}~1~0~{fill}~{uid()}~0')
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{color}"/>')
def wire(x1,y1,x2,y2):
    shapes.append(f'W~{x1} {y1} {x2} {y2}~#16803b~1~0~none~{uid()}~0')
    svg.append(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="#16803b" stroke-width="1.5" fill="none"/>')
def label(x,y,name,anchor='start'):
    shapes.append(f'N~{x}~{y}~0~#16803b~{name}~{uid()}~{anchor}~{x}~{y-4}~Arial~9pt~0')
    svg.append(f'<text x="{x}" y="{y-4}" text-anchor="{anchor}" fill="#16803b" font-family="Arial" font-size="11">{escape(name)}</text>')
def pin(x,y,num,name,direction,target):
    dx=20 if direction=='left' else -20
    anchor='start' if dx>0 else 'end'
    target.append(f'P~show~0~{num}~{x}~{y}~{180 if dx>0 else 0}~{uid()}~0^^{x}~{y}^^M {x} {y} h {dx}~#8b2635^^1~{x+dx+(5 if dx>0 else -5)}~{y+4}~0~{name}~{anchor}~Arial~9pt^^1~{x+dx/2}~{y-5}~0~{num}~middle~Arial~7pt^^0~{x+dx}~{y}^^0~M {x+dx} {y}')
    svg.append(f'<path d="M{x},{y} h{dx}" stroke="#8b2635"/><text x="{x+dx+(5 if dx>0 else -5)}" y="{y+4}" text-anchor="{anchor}" font-size="11" fill="#8b2635">{escape(name)}</text>')
def lib(ref,value,x,y,body,connections,kind='module'):
    attrs='name`'+value+'`pre`'+ref+'`package``BOM_Scope`'+kind
    body.insert(0,f'T~P~{x}~{y-30}~0~#24344b~Arial~11pt~bold~normal~~comment~{ref}~1~start~{uid()}~0')
    body.insert(1,f'T~N~{x}~{y-13}~0~#24344b~Arial~10pt~~normal~~comment~{value}~1~start~{uid()}~0')
    svg.append(f'<text x="{x}" y="{y-30}" font-size="14" font-weight="bold" fill="#24344b">{escape(ref)}</text><text x="{x}" y="{y-13}" font-size="12" fill="#24344b">{escape(value)}</text>')
    shapes.append(f'LIB~{x}~{y}~{attrs}~0~0~{uid()}~0#@$'+'#@$'.join(body))
    parts.append({'reference':ref,'value':value,'scope':kind,'pins':connections})
    for num,name,net in connections:
        if net: nets[net].append(f'{ref}.{num} ({name})')
def module(ref,value,x,y,pins,w=220):
    body=[]; h=30+len(pins)*30
    rect(x,y,w,h,target=body)
    for i,(num,name,net) in enumerate(pins):
        py=y+30+i*30
        pin(x-20,py,num,name,'left',body)
        if net:
            wire(x-120,py,x-20,py); label(x-120,py,net)
        else:
            shapes.append(f'O~{x-20}~{py}~{uid()}~M{x-24},{py-4} L{x-16},{py+4} M{x-16},{py-4} L{x-24},{py+4}~#8b2635~0')
    lib(ref,value,x,y,body,pins)
def passive(ref,value,x,y,n1,n2,kind='R'):
    b=[]
    # Pin names and numbers are hidden for conventional two-terminal parts.
    for px,num,dx in [(x-40,1,20),(x+40,2,-20)]:
        b.append(f'P~show~0~{num}~{px}~{y}~{180 if dx>0 else 0}~{uid()}~0^^{px}~{y}^^M {px} {y} h {dx}~#8b2635^^0~{px}~{y}~0~{num}~start~Arial~9pt^^0~{px}~{y}~0~{num}~start~Arial~7pt^^0~{px+dx}~{y}^^0~M {px+dx} {y}')
        svg.append(f'<path d="M{px},{y} h{dx}" stroke="#8b2635"/>')
    if kind in ('R','F'):
        rect(x-20,y-7,40,14,target=b)
    elif kind=='C':
        line(x-20,y,x-5,y,target=b); line(x+5,y,x+20,y,target=b)
        line(x-5,y-12,x-5,y+12,target=b); line(x+5,y-12,x+5,y+12,target=b)
    elif kind=='SW':
        line(x-20,y,x+15,y-12,target=b); line(x+15,y,x+20,y,target=b)
    elif kind=='D':
        # 1 = anode, 2 = cathode.
        line(x-20,y,x-10,y,target=b); line(x+10,y,x+20,y,target=b)
        for a in [(x-10,y-10,x-10,y+10),(x-10,y-10,x+10,y),(x-10,y+10,x+10,y),(x+10,y-12,x+10,y+12)]: line(*a,target=b)
    wire(x-75,y,x-40,y); label(x-75,y,n1,'end')
    wire(x+40,y,x+75,y); label(x+75,y,n2)
    lib(ref,value,x-18,y-7,b,[(1,'A' if kind=='D' else '1',n1),(2,'K' if kind=='D' else '2',n2)],'carrier')
def zone(x,y,w,h,title):
    rect(x,y,w,h,color='#9aafc4'); text(x+20,y+30,title,16,bold=True)

text(40,48,'VOC / E-NOSE - PRODUCTION MODULE CARRIER',25,bold=True)
text(40,78,'REV A | 2026-10-13 | ESP32-WROOM-32 DevKit | Editable schematic - module interfaces',13)
text(40,104,'Harness pin numbers are carrier-side assignments. Match each purchased module by SIGNAL NAME; footprints pending.',12,'#a34b15')

zone(40,140,730,460,'01  POWER: precision 5V input + 3.3V sensors')
module('J1','5.00V +/-0.10V regulated input',190,225,[(1,'+5V IN','5V_IN'),(2,'GND','GND')],240)
passive('F1','3A fuse - final rating by load',550,245,'5V_IN','5V_FUSED','F')
passive('SW1','Power switch >=3A',550,320,'5V_FUSED','5V_SYS','SW')
module('U2','AP2112K-3.3TRG1',190,395,[(1,'VIN','5V_SYS'),(2,'GND','GND'),(3,'EN','5V_SYS'),(4,'NC',None),(5,'VOUT','3V3_SENS')],225)
passive('C1','100uF / 10V',550,400,'5V_SYS','GND','C')
passive('C2','1uF X7R / 10V (VIN)',550,475,'5V_SYS','GND','C')
passive('C3','4.7uF X7R / 10V (VOUT)',550,550,'3V3_SENS','GND','C')

zone(40,630,730,550,'02  ESP32 controller - logical DevKit interface')
module('U1','ESP32-WROOM-32 DevKit (NOT S3)',230,720,[
    ('VIN','VIN / 5V','5V_SYS'),('GND','GND','GND'),('21','GPIO21 SDA1','I2C1_SDA'),('22','GPIO22 SCL1','I2C1_SCL'),
    ('32','GPIO32 SDA2','I2C2_SDA'),('13','GPIO13 SCL2','I2C2_SCL'),('16','GPIO16 RX2','O3_TX'),('17','GPIO17 TX2','O3_RX'),
    ('18','GPIO18 RX1','CO_TX'),('19','GPIO19 TX1','CO_RX'),('25','GPIO25 OUT','FAN_IN_EN'),('26','GPIO26 OUT','FAN_OUT_EN')],260)
text(520,760,'MCU uses onboard',11); text(520,782,'3.3V regulator.',11)
text(520,820,'Do not join DevKit',11);text(520,842,'3V3 output to LDO.',11)
text(520,880,'UART0 remains USB',11);text(520,902,'programming/debug.',11)
text(520,940,'Header positions vary:',11);text(520,962,'wire by GPIO labels.',11)
text(520,1000,'External power + USB:',11);text(520,1022,'use USB data-only',11);text(520,1044,'or verified isolation.',11)

zone(810,140,710,660,'03  I2C1 sensor modules - GPIO21 / GPIO22')
module('J2','SHT40 module / 0x44',970,225,[(1,'3V3','3V3_SENS'),(2,'GND','GND'),(3,'SDA','I2C1_SDA'),(4,'SCL','I2C1_SCL')],200)
module('J3','SGP41 module / 0x59',970,440,[(1,'3V3','3V3_SENS'),(2,'GND','GND'),(3,'SDA','I2C1_SDA'),(4,'SCL','I2C1_SCL')],200)
module('J4','BME680 module / 0x76',970,650,[(1,'3V3','3V3_SENS'),(2,'GND','GND'),(3,'SDA','I2C1_SDA'),(4,'SCL','I2C1_SCL')],200)
passive('R1','4.7k pull-up (DNP if on modules)',1330,265,'3V3_SENS','I2C1_SDA')
passive('R2','4.7k pull-up (DNP if on modules)',1330,340,'3V3_SENS','I2C1_SCL')
passive('C4','100nF near J2',1330,455,'3V3_SENS','GND','C')
passive('C5','100nF near J3',1330,530,'3V3_SENS','GND','C')
passive('C6','100nF near J4',1330,650,'3V3_SENS','GND','C')
text(1210,717,'BME680: I2C mode',11);text(1210,740,'CSB high, SDO low',11);text(1210,763,'on the module.',11)

zone(1560,140,780,370,'04  SPS30 particulate sensor - isolated I2C2')
module('J5','SPS30 / 0x69 - native pin assignment',1740,235,[(1,'VDD 5V','5V_SYS'),(2,'SDA / RX','I2C2_SDA'),(3,'SCL / TX','I2C2_SCL'),(4,'SEL = I2C','GND'),(5,'GND','GND')],260)
passive('R3','4.7k to 3.3V',2150,270,'3V3_SENS','I2C2_SDA')
passive('R4','4.7k to 3.3V',2150,345,'3V3_SENS','I2C2_SCL')
passive('C7','100nF + local module decoupling',2150,430,'5V_SYS','GND','C')
text(1580,475,'Keep I2C cable <=20cm. Pull-ups to 3.3V only. SEL grounded before power-up.',11)

zone(1560,550,780,540,'05  Dedicated electrochemical UART modules')
module('J6','Winsen ZE03-O3 (range by application)',1740,645,[(1,'VCC 5.0V','5V_SYS'),(2,'GND','GND'),(3,'TXD -> MCU RX2','O3_TX'),(4,'RXD <- MCU TX2','O3_RX')],290)
module('J7','Winsen ZE03-CO (range by application)',1740,860,[(1,'VCC 5.0V','5V_SYS'),(2,'GND','GND'),(3,'TXD -> MCU RX1','CO_TX'),(4,'RXD <- MCU TX1','CO_RX')],290)
passive('C8','100nF near J6',2190,690,'5V_SYS','GND','C')
passive('C9','100nF near J7',2190,905,'5V_SYS','GND','C')
text(1580,1040,'Carrier headers J6/J7 are NOT the ZE03 physical pin order. Use an adapter harness.',11)
text(1580,1065,'ZE03 UART is 3V TTL. Verify RXD 3.3V compatibility on the supplied module revision.',11)

zone(810,840,710,280,'06  External ADC - module on I2C1')
module('J8','ADS1115 module / 0x48',970,925,[(1,'VDD','3V3_SENS'),(2,'GND','GND'),(3,'SDA','I2C1_SDA'),(4,'SCL','I2C1_SCL')],180)
module('J9','ADS1115 analog header',1320,925,[(1,'A0 RED','ADC_RED'),(2,'A1 OX','ADC_OX'),(3,'A2 NH3','ADC_NH3'),(4,'A3 O3 opt.','ADC_MQ131')],170)
text(830,1105,'ADS1115: ADDR -> GND; ALERT unused; onboard decoupling; PGA +/-4.096V.',11)

zone(810,1150,1530,540,'07  MOX array - module interfaces + four protected ADC channels')
module('J10','MiCS-6814 ANALOG module (heater circuit onboard)',980,1230,[(1,'VCC 5V','5V_SYS'),(2,'GND','GND'),(3,'RED / CO','MICS_RED'),(4,'OX / NO2','MICS_OX'),(5,'NH3','MICS_NH3')],380)
module('J11','MQ-131 LOW-CONCENTRATION module (OPTIONAL)',1760,1230,[(1,'VCC 5V','5V_SYS'),(2,'GND','GND'),(3,'AOUT','MQ131_AOUT'),(4,'DOUT unused',None)],430)
text(830,1430,'Use only modules rated for 5V with analog outputs <=5.1V. Do not connect 5V directly to a bare MiCS heater.',11)
for i,(raw,adc,title) in enumerate([('MICS_RED','ADC_RED','RED / CO'),('MICS_OX','ADC_OX','OX / NO2'),('MICS_NH3','ADC_NH3','NH3'),('MQ131_AOUT','ADC_MQ131','MQ131 optional')]):
    xx=990+i*365
    text(xx-150,1480,title,12,bold=True)
    passive(f'R{5+i*2}','10k 1%',xx,1525,raw,adc)
    passive(f'R{6+i*2}','15k 1%',xx,1590,adc,'GND')
    passive(f'C{10+i}','100nF',xx,1655,adc,'GND','C')

zone(40,1220,730,570,'08  Two 5V fan outputs - active HIGH control')
for i,(sig,drain,gate,title) in enumerate([('FAN_IN_EN','FAN_IN_NEG','GATE_IN','INTAKE'),('FAN_OUT_EN','FAN_OUT_NEG','GATE_OUT','EXHAUST')]):
    xx=195+i*365
    text(xx-125,1280,title,12,bold=True)
    module(f'J{12+i}','5V fan / <=0.5A',xx,1320,[(1,'FAN +','5V_SYS'),(2,'FAN -',drain)],170)
    # Conventional NMOS symbol; manufacturer SOT-23: G=1, S=2, D=3.
    b=[]
    for coords in [(xx+20,1465,xx+20,1525),(xx+30,1465,xx+30,1480),(xx+30,1488,xx+30,1502),(xx+30,1510,xx+30,1525),(xx+30,1470,xx+80,1470),(xx+30,1520,xx+80,1520),(xx+80,1470,xx+80,1450),(xx+80,1520,xx+80,1540),(xx+30,1495,xx+80,1495),(xx+80,1495,xx+80,1520),(xx+65,1491,xx+55,1495),(xx+55,1495,xx+65,1499)]:line(*coords,target=b)
    pin(xx,1495,1,'G','left',b)
    for px,py,num,name in [(xx+80,1430,3,'D'),(xx+80,1560,2,'S')]:
        dy=20 if num==3 else -20
        b.append(f'P~show~0~{num}~{px}~{py}~{90 if dy>0 else 270}~{uid()}~0^^{px}~{py}^^M {px} {py} v {dy}~#8b2635^^0~{px}~{py}~0~{name}~start~Arial~9pt^^1~{px+7}~{py+dy}~0~{num}~start~Arial~7pt^^0~{px}~{py+dy}^^0~M {px} {py}')
        svg.append(f'<path d="M{px},{py} v{dy}" stroke="#8b2635"/>')
    wire(xx-110,1495,xx,1495);label(xx-110,1495,gate)
    wire(xx+80,1430,xx+155,1430);label(xx+155,1430,drain)
    wire(xx+80,1560,xx+155,1560);label(xx+155,1560,'GND')
    lib(f'Q{1+i}','AO3400A',xx,1470,b,[(1,'G',gate),(2,'S','GND'),(3,'D',drain)],'carrier')
    passive(f'R{13+i*2}','100R gate series',xx+30,1620,sig,gate)
    passive(f'R{14+i*2}','100k gate pull-down',xx+30,1690,gate,'GND')
    passive(f'D{1+i}','SS14 (K to +5V)',xx+30,1760,drain,'5V_SYS','D')

text(40,1830,'DESIGN NOTES',16,bold=True)
for i,s in enumerate([
    'Module carrier schematic. Final module SKUs, connector footprints and ESP32 header spacing must be confirmed before PCB layout.',
    'Each ADC divider is 0.6 x input: 5.1V -> 3.06V nominal. Include divider loading, resistor tolerance and ADS1115 input impedance in calibration.',
    'Firmware upgrade required: SHT40, SGP41, BME680, SPS30 and dual ZE03 UART drivers; existing firmware targets old sensors.',
    'Collect synchronized raw gas signals + temperature/humidity. ZE03 channels are independent measurements, not automatic certification.',
    'Select a 5V supply with >=3A capacity; verify 4.9-5.1V at ZE03/MiCS under fan start-up load. Keep heater/fan return currents away from ADC ground.',
    'SO2 is not a dedicated measured channel in this revision. Add a ZE03-SO2 plus UART expansion if direct SO2 measurement is required.',
]): text(40,1860+i*25,s,11)

doc={'head':{'docType':'1','editorVersion':'6.5.51','newgId':True,'c_para':{'name':'VOC_Production_Modules_RevA'}},'canvas':'CA~2400~2040~#FFFFFF~yes~#CCCCCC~10~2400~2040~line~10~pixel~5~0~0','shape':shapes,'BBox':{'x':0,'y':0,'width':2400,'height':2040},'colors':{}}
(OUT/'VOC_Production_Modules_RevA.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'VOC_Production_Modules_RevA.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="2040" viewBox="0 0 2400 2040"><rect width="2400" height="2040" fill="#fff"/>'+''.join(svg)+'</svg>',encoding='utf-8')
(OUT/'connections.json').write_text(json.dumps({'parts':parts,'nets':nets},ensure_ascii=False,indent=2),encoding='utf-8')
assert len({p['reference'] for p in parts})==len(parts)
assert all(len(v)>=2 for k,v in nets.items()), {k:v for k,v in nets.items() if len(v)<2}
assert all(s.split('~')[0] in {'LIB','W','N','T','R','O'} for s in shapes)
print(f'Generated {len(parts)} symbols, {len(nets)} named nets, {len(shapes)} schematic objects in {OUT}')
