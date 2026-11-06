import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  TH: {
    // Navigation
    dashboard: 'แผงควบคุม',
    kiosk: 'โหมดคีออสก์',
    alerts: 'การแจ้งเตือน',
    airflow: 'แผนผังการไหลของลม',
    history: 'ประวัติข้อมูลย้อนหลัง',
    maintenance: 'ซ่อมบำรุง',
    devices: 'อุปกรณ์และโหนด',
    dataCollection: 'บันทึกตัวอย่างก๊าซ',
    settings: 'ตั้งค่าระบบ',
    airQualityGuide: 'คู่มือคุณภาพอากาศ',
    emissions: 'รายงานการปล่อยไอเสีย',
    userGuide: 'คู่มือการใช้งาน',
    roles: 'สิทธิ์และนโยบาย',
    systemStates: 'สถานะระบบ',
    more: 'เมนูเพิ่มเติม',

    // Header & Common
    location: 'ห้องพ่นสีที่ 1',
    online: 'ออนไลน์',
    offline: 'ออฟไลน์',
    updated: 'อัปเดตล่าสุด',
    notifications: 'การแจ้งเตือน',
    soundNotifications: 'เสียงแจ้งเตือน',
    logout: 'ออกจากระบบ',
    dismiss: 'ปิด',
    viewDetails: 'ดูรายละเอียด',
    today: 'วันนี้',
    nominal: 'ปกติ',
    normal: 'ปกติ',
    warning: 'เฝ้าระวัง',
    critical: 'วิกฤต',
    safe: 'ปลอดภัย',

    // Roles
    adminView: 'สิทธิ์ผู้ดูแลระบบ',
    engineerView: 'สิทธิ์วิศวกร',
    operatorView: 'สิทธิ์ผู้ควบคุมงาน',
    viewerView: 'สิทธิ์ผู้ตรวจดู',

    // Dashboard
    airQuality: 'คุณภาพอากาศ',
    tvoc: 'สารระเหยรวม (TVOC)',
    exhaustFan: 'พัดลมระบายอากาศ',
    eco2: 'ก๊าซคาร์บอนไดออกไซด์โดยประมาณ',
    good: 'ดีมาก',
    running: 'กำลังทำงาน',
    normalUnder100: 'เกณฑ์ปกติไม่เกิน 100 ppb',
    targetBelow1000: 'เป้าหมายต่ำกว่า 1,000 ppm',
    tvocLast24h: 'TVOC ในรอบ 24 ชั่วโมงที่ผ่านมา',
    detectedSolvent: 'สารระเหยเด่นที่ตรวจพบ',
    recentAlerts: 'รายการเตือนภัยล่าสุด',
    viewAllAlerts: 'ดูทั้งหมด',

    // Airflow
    airflowTelemetry: 'โทรมาตรการไหลเวียนอากาศ',
    factoryVentilation: 'ระบบระบายอากาศโรงงาน',
    sensorBox: 'วงจรนิวเมติกส์เซนเซอร์',
    laminarSyncActive: 'ระบบไหลแบบราบเรียบทำงานปกติ',
    airstreamPathway: 'เส้นทางการระบายไอระเหย',
    sprayBooth: 'ห้องพ่นสี',
    duct: 'ท่อส่งลมไอเสีย',
    carbonScrubber: 'ชุดถ่านกัมมันต์ดูดซับ',
    exhaustStack: 'ปล่องระบายอากาศ',
    inflowCapture: 'การดักจับอากาศเข้า',
    airflowVelocity: 'ความเร็วลมระบาย',
    efficiency: 'ประสิทธิภาพการดูดซับ',
    residualVoc: 'สารระเหยตกค้าง',
    filterPressure: 'แรงดันตกคร่อมฟิลเตอร์',
    fanRpm: 'รอบหมุนพัดลมดูดอากาศ',
    bedTemperature: 'อุณหภูมิชั้นถ่านกัมมันต์',

    // Kiosk
    emergencyAlert: 'ส่งสัญญาณเตือนภัยฉุกเฉิน',
    fanBooster: 'เปิดพัดลมดูดอากาศ 100% (ฉุกเฉิน)',
    maintenanceLog: 'บันทึกงานซ่อมบำรุงหน้างาน',
    kioskSafeTitle: 'บรรยากาศปกติ — ปลอดภัย',
    kioskSubTitle: 'ระบบระบายอากาศทำงานเต็มประสิทธิภาพ ทุกค่าโทรมาตรอยู่ในเกณฑ์ปลอดภัย',
    enterPin: 'กรุณากรอกรหัส PIN ประจำตัว 4 หลัก',
    sendingEmergency: 'กำลังส่งสัญญาณแจ้งเตือนภัย...',
    sentSuccess: 'ส่งสัญญาณแจ้งเตือนภัยเรียบร้อยแล้ว',
    sentFailed: 'ส่งสัญญาณไม่สำเร็จ — กรุณาลองอีกครั้ง',

    // History
    historyTitle: 'ประวัติข้อมูลโทรมาตรย้อนหลัง',
    dailyTvocAverage: 'ค่าเฉลี่ย TVOC ประจำวัน',
    exportCsv: 'ส่งออก CSV',
    customRange: 'กำหนดช่วงเวลา',
    time: 'เวลา',
    status: 'สถานะ',
  },
  EN: {
    // Navigation
    dashboard: 'Dashboard',
    kiosk: 'Kiosk',
    alerts: 'Alerts',
    airflow: 'Airflow',
    history: 'History',
    maintenance: 'Maintenance',
    devices: 'Devices',
    dataCollection: 'Data Collection',
    settings: 'Settings',
    airQualityGuide: 'Air Quality Guide',
    emissions: 'Emissions',
    userGuide: 'User Guide',
    roles: 'Roles & Policy',
    systemStates: 'System States',
    more: 'More',

    // Header & Common
    location: 'Powder Coating Booth 1',
    online: 'ONLINE',
    offline: 'OFFLINE',
    updated: 'Updated',
    notifications: 'Notifications',
    soundNotifications: 'Sound Notifications',
    logout: 'Log out',
    dismiss: 'Dismiss',
    viewDetails: 'View details',
    today: 'Today',
    nominal: 'Nominal',
    normal: 'Normal',
    warning: 'Warning',
    critical: 'Critical',
    safe: 'Safe',

    // Roles
    adminView: 'ADMIN VIEW',
    engineerView: 'ENGINEER VIEW',
    operatorView: 'OPERATOR VIEW',
    viewerView: 'VIEWER VIEW',

    // Dashboard
    airQuality: 'Air Quality',
    tvoc: 'TVOC',
    exhaustFan: 'Exhaust Fan',
    eco2: 'eCO2 (Estimated)',
    good: 'Good',
    running: 'running',
    normalUnder100: 'Normal range under 100',
    targetBelow1000: 'Target below 1,000 ppm',
    tvocLast24h: 'TVOC, Last 24 Hours',
    detectedSolvent: 'Detected Solvent',
    recentAlerts: 'Recent alerts',
    viewAllAlerts: 'View all alerts',

    // Airflow
    airflowTelemetry: 'Airflow Telemetry',
    factoryVentilation: 'Factory ventilation',
    sensorBox: 'Sensor box',
    laminarSyncActive: 'Laminar Sync Active',
    airstreamPathway: 'Airstream Pathway',
    sprayBooth: 'Spray Booth',
    duct: 'Duct',
    carbonScrubber: 'Carbon Scrubber',
    exhaustStack: 'Exhaust Stack',
    inflowCapture: 'Inflow capture',
    airflowVelocity: 'Airflow velocity',
    efficiency: 'Efficiency',
    residualVoc: 'Residual VOC',
    filterPressure: 'Filter Pressure',
    fanRpm: 'Fan RPM',
    bedTemperature: 'Bed Temperature',

    // Kiosk
    emergencyAlert: 'Emergency Alert',
    fanBooster: '100% Exhaust Booster',
    maintenanceLog: 'Maintenance Log',
    kioskSafeTitle: 'Normal Atmosphere — Safe',
    kioskSubTitle: 'Exhaust ventilation operating at nominal laminar airflow. All chemical sensors within safety envelope.',
    enterPin: 'Enter 4-digit operator PIN',
    sendingEmergency: 'Broadcasting emergency alert...',
    sentSuccess: 'Emergency broadcast sent successfully',
    sentFailed: 'Broadcast failed — please retry',

    // History
    historyTitle: 'Historical Telemetry Logs',
    dailyTvocAverage: 'Daily TVOC Average',
    exportCsv: 'Export CSV',
    customRange: 'Custom Range',
    time: 'Time',
    status: 'Status',
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('voc_app_lang') || 'EN';
  });

  const setLang = (newLang) => {
    const validLang = newLang === 'TH' ? 'TH' : 'EN';
    setLangState(validLang);
    localStorage.setItem('voc_app_lang', validLang);
    document.documentElement.lang = validLang.toLowerCase();
  };

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase();
  }, [lang]);

  const t = (key, fallback = '') => {
    return translations[lang]?.[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isThai: lang === 'TH' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: 'EN',
      setLang: () => {},
      t: (key, fallback = '') => fallback || key,
      isThai: false,
    };
  }
  return context;
}
