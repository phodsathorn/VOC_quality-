# Sensor validation rules

## MQ-3 (alcohol)

The system treats MQ-3 as a screening sensor, not an analytical ethanol meter.
The manufacturer specifies a **25–500 ppm alcohol** detection range, a 5.0 V
heater supply, and a preheat time of **more than 48 hours** for the specified
test condition.  It also states that the sensor can be affected by gasoline,
smoke and vapour.  Therefore an AI label of `ALCOHOL` alone is not sufficient
to create an alarm.

Implementation rules:

- Firmware reports the median of 9 ADC readings and the sample spread.
- Backend rejects ADC values outside the ESP32 12-bit range (0–4095), and
  treats values within 5 counts of either rail as a wiring/saturation fault.
- An alcohol alert requires MQ-3's 48-hour preheat flag, sample spread no
  greater than 150 ADC counts, at least 80% AI confidence, and three
  consecutive qualifying classifications.
- The UI never displays an extrapolated MQ-3 concentration above 500 ppm as
  a valid measurement; its `~ppm` value remains an estimate based on the
  per-device clean-air baseline.

Before relying on alerts, power the MQ-3 continuously for at least 48 hours in
clean air, then use **Settings → R0 baseline** to capture the stable clean-air
baseline for that exact module and voltage-divider circuit.  Do not use
training data recorded before the conditioning period; retrain the model after
collecting clean-air samples and alcohol samples with the revised firmware.

## References

- [Winsen MQ-3B official product page](https://www.winsen-sensor.com/product/mq-3b.html)
- [Winsen MQ-3/MQ-3B manual](https://www.cnwinsen.com/wp-content/uploads/2021/08/MQ-3B-ver1.5-Manual.pdf)
- [ams CCS811 datasheet](https://cdn.sparkfun.com/assets/learn_tutorials/1/4/3/CCS811_Datasheet-DS000459.pdf)

The CCS811 checks already in the firmware use the manufacturer's output limits:
TVOC 0–1187 ppb and eCO2 400–8192 ppm.  `eCO2` is an equivalent calculated
value, not a direct CO2 measurement.

## System-wide audit and live monitoring

The web **Settings** page now calls the ESP32 to capture baseline values rather
than merely copying an old database row.  The device polls for the command,
captures its current sensor values and reports them back.  The server stores
the request/result permanently.  A capture is marked **REJECTED** when MQ-3
has not completed its 48-hour conditioning period.

The same page shows a live health card for every data channel.  It checks
physical output/interface limits and the standard deviation of the twelve most
recent readings.  A `FAULT` indicates an impossible/rail value or missing
signal; `WARNING` indicates unusually noisy data.  It does not claim that a
gas concentration is accurate: MOS sensor concentration still requires a
traceable calibration gas and the exact module load-resistor circuit.

| Hardware | What is checked online | Datasheet condition that requires hardware verification |
| --- | --- | --- |
| DHT22 | −40–80 °C, 0–100 %RH outputs | Sensor placement and condensation |
| CCS811 | TVOC 0–1187 ppb, eCO₂ 400–8192 ppm | 20-minute conditioning, temperature/RH compensation |
| PMS5003 | non-negative PM2.5, bounded output | Clean fan/optics and a co-location check against a reference monitor |
| MQ-2 / MQ-3 / MQ-8 / MQ-135 | ESP32 ADC rail/fault and noise, clean-air baseline | 5.0 V heater, correct divider to protect the 3.3 V ESP32 ADC, >48 h preheat, calibration gas |
| MiCS-6814 | ADS1115 mV range/noise | 5 V supply and the manufacturer-recommended three heater voltages/resistors |

Additional primary references:

- [Winsen MQ-2 official page](https://www.winsen-sensor.com/sensors/combustible-sensor/mq2.html)
- [Winsen MQ series official catalogue (MQ-8 and MQ-135)](https://www.winsen-sensor.com/mq-sensor.html)
- [SGX Sensortech MiCS-6814 official product page](https://www.sgxsensortech.com/sensor/mics-6814)
- [SGX MiCS-6814 rev. 8 datasheet](https://www.sgxsensortech.com/content/uploads/2015/02/1143_Datasheet-MiCS-6814-rev-8.pdf)
- [Plantower official product catalogue](https://www.plantower.com/en/products_31/)

## Status log and operating-hour records

Each telemetry packet now includes the ESP32 monotonic `device_uptime_sec`.
The backend keeps `sensor_runtime` counters separately for DHT22, CCS811,
PMS5003, each MQ sensor, and MiCS-6814.  Only elapsed uptime while a sensor
has valid fields is added; a reboot is detected when uptime decreases.  A
single gap is capped at 120 seconds so a long loss of connectivity cannot be
counted as fictitious operation.

`sensor_status_logs` stores a JSON snapshot of each sensor's online/offline
state at most once per minute.  Use `GET /api/sensor-runtime?box_id=BOX-001`
for maintenance/export tooling.  The Settings page shows the same accumulated
hours and latest stored-log time.
