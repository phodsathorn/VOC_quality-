import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePm25Aqi,
  getAqiCategory,
  AQI_LEVELS,
} from '../src/utils/aqiHelper.js';

describe('AQI Helper Unit Tests', () => {
  describe('AQI_LEVELS specification', () => {
    it('defines 5 standard industrial air quality tiers', () => {
      assert.equal(AQI_LEVELS.length, 5);
      assert.deepEqual(
        AQI_LEVELS.map((l) => l.labelEn),
        ['Good', 'Moderate', 'Sensitive Alert', 'Unhealthy', 'Hazardous']
      );
    });

    it('has valid hex color codes for each tier', () => {
      for (const level of AQI_LEVELS) {
        assert.match(level.color, /^#[0-9A-Fa-f]{6}$/);
        assert.ok(level.labelTh, 'Thai label defined');
        assert.ok(level.descriptionTh, 'Thai description defined');
      }
    });
  });

  describe('calculatePm25Aqi', () => {
    it('handles zero or negative inputs cleanly', () => {
      assert.equal(calculatePm25Aqi(0), 0);
      assert.equal(calculatePm25Aqi(-10), 0);
      assert.equal(calculatePm25Aqi(null), 0);
    });

    it('correctly maps PM2.5 breakpoints to AQI ranges', () => {
      // 0–15 ug/m3 -> 0–50 AQI
      assert.equal(calculatePm25Aqi(15), 50);

      // 15–35 ug/m3 -> 50–100 AQI
      assert.equal(calculatePm25Aqi(35), 100);

      // 35–75 ug/m3 -> 100–150 AQI
      assert.equal(calculatePm25Aqi(75), 150);

      // 75–150 ug/m3 -> 150–200 AQI
      assert.equal(calculatePm25Aqi(150), 200);

      // >150 ug/m3 capped at 300 AQI
      assert.equal(calculatePm25Aqi(250), 300);
    });
  });

  describe('getAqiCategory', () => {
    it('correctly classifies AQI values into the appropriate tier', () => {
      assert.equal(getAqiCategory(25).labelEn, 'Good');
      assert.equal(getAqiCategory(50).labelEn, 'Good');
      assert.equal(getAqiCategory(51).labelEn, 'Moderate');
      assert.equal(getAqiCategory(100).labelEn, 'Moderate');
      assert.equal(getAqiCategory(101).labelEn, 'Sensitive Alert');
      assert.equal(getAqiCategory(150).labelEn, 'Sensitive Alert');
      assert.equal(getAqiCategory(151).labelEn, 'Unhealthy');
      assert.equal(getAqiCategory(200).labelEn, 'Unhealthy');
      assert.equal(getAqiCategory(201).labelEn, 'Hazardous');
      assert.equal(getAqiCategory(500).labelEn, 'Hazardous');
    });
  });
});
