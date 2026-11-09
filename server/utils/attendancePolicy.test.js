import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHalfDayThresholdMinutes,
  getLateComingConversion,
} from './attendancePolicy.js';

test('late-coming conversion follows the monthly bands supplied by HR', () => {
  assert.deepEqual(getLateComingConversion(0), {
    count: 0,
    convertedDays: 0,
    needsPolicyReview: false,
  });
  assert.equal(getLateComingConversion(1).convertedDays, 0);
  assert.equal(getLateComingConversion(2).convertedDays, 0.5);
  assert.equal(getLateComingConversion(4).convertedDays, 0.5);
  assert.equal(getLateComingConversion(5).convertedDays, 1);
  assert.equal(getLateComingConversion(8).convertedDays, 1.5);
  assert.equal(getLateComingConversion(11).convertedDays, 2);
});

test('late counts outside the supplied bands are flagged for policy review', () => {
  assert.deepEqual(getLateComingConversion(14), {
    count: 14,
    convertedDays: null,
    needsPolicyReview: true,
  });
});

test('half-day threshold is based on the schedule standard hours', () => {
  assert.equal(getHalfDayThresholdMinutes({ standardHours: 6.5 }), 195);
  assert.equal(getHalfDayThresholdMinutes({ standardHours: 7, thresholdPercent: 40 }), 168);
});

test('invalid policy inputs are rejected', () => {
  assert.throws(() => getLateComingConversion(-1), RangeError);
  assert.throws(
    () => getHalfDayThresholdMinutes({ standardHours: 8, thresholdPercent: 101 }),
    RangeError,
  );
});
