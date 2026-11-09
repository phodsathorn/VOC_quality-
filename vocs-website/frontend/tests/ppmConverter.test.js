import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertTvocToPpm,
  convertAllToPpm,
  MQ_CURVES,
  MICS_CURVES,
} from '../src/utils/ppmConverter.js';

describe('PPM Converter Unit Tests', () => {
  describe('convertTvocToPpm', () => {
    it('returns null for null, undefined, or NaN inputs', () => {
      assert.equal(convertTvocToPpm(null), null);
      assert.equal(convertTvocToPpm(undefined), null);
      assert.equal(convertTvocToPpm(NaN), null);
    });

    it('converts 0 ppb to 0 ppm', () => {
      assert.equal(convertTvocToPpm(0), 0);
    });

    it('correctly divides ppb by 1000 into ppm', () => {
      assert.equal(convertTvocToPpm(500), 0.5);
      assert.equal(convertTvocToPpm(1000), 1.0);
      assert.equal(convertTvocToPpm(2850), 2.85);
    });
  });

  describe('MQ and MiCS Curves Configuration', () => {
    it('contains all required gas sensors: mq2, mq3, mq8, mq135', () => {
      const required = ['mq2', 'mq3', 'mq8', 'mq135'];
      for (const k of required) {
        assert.ok(MQ_CURVES[k], `Missing curve config for ${k}`);
        assert.ok(MQ_CURVES[k].a > 0, `${k} parameter a must be positive`);
        assert.ok(MQ_CURVES[k].b < 0, `${k} parameter b must be negative (power law inverse)`);
        assert.ok(MQ_CURVES[k].cleanRatio > 0, `${k} cleanRatio must be positive`);
        assert.ok(MQ_CURVES[k].maxPpm > 0, `${k} maxPpm must be positive`);
      }
    });

    it('contains all 3 MiCS-6814 channels: mics_co, no2, nh3', () => {
      assert.ok(MICS_CURVES.mics_co);
      assert.ok(MICS_CURVES.no2);
      assert.ok(MICS_CURVES.nh3);
      assert.equal(MICS_CURVES.mics_co.channel, 'CO');
      assert.equal(MICS_CURVES.no2.channel, 'NO₂');
      assert.equal(MICS_CURVES.nh3.channel, 'NH₃');
    });
  });

  describe('convertAllToPpm', () => {
    it('returns empty object if input sensors is null/undefined', () => {
      assert.deepEqual(convertAllToPpm(null), {});
      assert.deepEqual(convertAllToPpm(undefined), {});
    });

    it('computes realistic gas ppm outputs for typical factory readings', () => {
      const sample = {
        mq2: 2400,
        mq3: 3100,
        mq8: 1800,
        mq135: 2200,
        mics_co: 1200,
        no2: 450,
        nh3: 700,
      };
      const res = convertAllToPpm(sample);
      assert.ok(res.mq2, 'mq2 result present');
      assert.ok(res.mq3, 'mq3 result present');
      assert.ok(res.mq8, 'mq8 result present');
      assert.ok(res.mq135, 'mq135 result present');
      assert.ok(res.mics_co, 'mics_co result present');
      assert.ok(res.no2, 'no2 result present');
      assert.ok(res.nh3, 'nh3 result present');

      // Check numeric bounds
      assert.ok(typeof res.mq2.ppm === 'number' && res.mq2.ppm >= 0);
      assert.ok(typeof res.mq3.ppm === 'number' && res.mq3.ppm >= 0);
      assert.ok(res.mq3.unit === 'ppm');
    });
  });
});
