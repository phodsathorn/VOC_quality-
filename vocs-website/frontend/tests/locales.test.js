import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/locales/index.js';

const th = translations.TH;
const en = translations.EN;

function getLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getLeafKeys(v, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

describe('Locales Parity Unit Tests', () => {
  it('both Thai and English dictionaries are populated', () => {
    assert.ok(th && typeof th === 'object');
    assert.ok(en && typeof en === 'object');
    assert.ok(Object.keys(th).length > 0);
    assert.ok(Object.keys(en).length > 0);
  });

  it('all top-level sections match between TH and EN', () => {
    const thSections = Object.keys(th).sort();
    const enSections = Object.keys(en).sort();
    assert.deepEqual(thSections, enSections, 'Top level locale sections must be identical');
  });

  it('no leaf keys are missing between TH and EN', () => {
    const thKeys = new Set(getLeafKeys(th));
    const enKeys = new Set(getLeafKeys(en));

    const missingInEn = [...thKeys].filter((k) => !enKeys.has(k));
    const missingInTh = [...enKeys].filter((k) => !thKeys.has(k));

    assert.deepEqual(
      missingInEn,
      [],
      `Keys present in TH but missing in EN: ${missingInEn.join(', ')}`
    );
    assert.deepEqual(
      missingInTh,
      [],
      `Keys present in EN but missing in TH: ${missingInTh.join(', ')}`
    );
  });

  it('no leaf values are undefined or null', () => {
    for (const key of getLeafKeys(th)) {
      const parts = key.split('.');
      let val = th;
      for (const p of parts) val = val[p];
      assert.notEqual(val, undefined, `TH value at ${key} is undefined`);
      assert.notEqual(val, null, `TH value at ${key} is null`);
    }

    for (const key of getLeafKeys(en)) {
      const parts = key.split('.');
      let val = en;
      for (const p of parts) val = val[p];
      assert.notEqual(val, undefined, `EN value at ${key} is undefined`);
      assert.notEqual(val, null, `EN value at ${key} is null`);
    }
  });
});
