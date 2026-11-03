// Copy this file to secrets.h and set local credentials.
// secrets.h is ignored by Git and must not be committed.
#pragma once

#define WIFI_SSID_1 "YOUR_FACTORY_WIFI"
#define WIFI_PASS_1 "CHANGE_ME"
#define WIFI_SSID_2 "OPTIONAL_BACKUP_WIFI"
#define WIFI_PASS_2 "CHANGE_ME"

// Device Ingest & OTA Authentication Token (Phase W1 / H0)
#define DEVICE_TOKEN "CHANGE_TO_UNIQUE_DEVICE_TOKEN"

// Web OTA & ArduinoOTA Credentials
#define OTA_USERNAME "admin"
#define OTA_PASSWORD "CHANGE_TO_STRONG_PASSWORD"
