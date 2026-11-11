import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateAttendanceSeedRows } from './attendanceSeedValidation.js';

const rows = JSON.parse(await readFile(new URL('../scripts/attendanceEmployees.seed.json', import.meta.url), 'utf8'));

test('validates the PDF employee seed data without a database', () => {
  assert.deepEqual(validateAttendanceSeedRows(rows), {
    rowCount: 44,
    uniqueCodes: 44,
    uniqueNames: 44,
  });
});

test('rejects duplicate codes and names before any database connection', () => {
  assert.throws(
    () => validateAttendanceSeedRows([{ employeeCode: '0001', name: 'Asha Patil' }, { employeeCode: '0001', name: 'Dev Shah' }]),
    /Duplicate employee code/,
  );
  assert.throws(
    () => validateAttendanceSeedRows([{ employeeCode: '0001', name: 'Asha Patil' }, { employeeCode: '0002', name: 'ASHA PATIL' }]),
    /Duplicate normalized employee name/,
  );
});

test('requires codes to remain strings so leading zeroes are preserved', () => {
  assert.throws(
    () => validateAttendanceSeedRows([{ employeeCode: 1, name: 'Asha Patil' }]),
    /employeeCode string/,
  );
});
