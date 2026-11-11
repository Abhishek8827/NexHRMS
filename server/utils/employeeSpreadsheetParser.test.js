import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import ApiError from './ApiError.js';
import { parseEmployeeSpreadsheet } from './employeeSpreadsheetParser.js';

test('parses UTF-8 CSV with quoted commas, escaped quotes, and source row numbers', async () => {
  const content = '\uFEFFEmployee ID,First Name,Designation\r\nE-100,"Asha, \"\"AJ\"\"",Engineer\r\n\r\nE-101,Dev,Designer';
  const rows = await parseEmployeeSpreadsheet(Buffer.from(content), 'staff.csv');
  assert.equal(rows.length, 3);
  assert.equal(rows[1].rowNumber, 2);
  assert.equal(rows[1].values[1], 'Asha, "AJ"');
  assert.equal(rows[2].rowNumber, 4);
});

test('rejects malformed CSV and unsupported file types', async () => {
  await assert.rejects(
    parseEmployeeSpreadsheet(Buffer.from('Employee ID,First Name\nE-1,"broken'), 'staff.csv'),
    (error) => error instanceof ApiError && /unterminated/.test(error.message),
  );
  await assert.rejects(
    parseEmployeeSpreadsheet(Buffer.from('data'), 'staff.xls'),
    (error) => error instanceof ApiError && /\.xlsx or \.csv/.test(error.message),
  );
});

test('reads XLSX values and rejects formula cells', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Employees');
  sheet.addRow(['Employee ID', 'First Name', 'Joining Date']);
  sheet.addRow(['E-102', 'Maya', new Date('2025-03-04T00:00:00.000Z')]);
  const content = await workbook.xlsx.writeBuffer();
  const parsed = await parseEmployeeSpreadsheet(Buffer.from(content), 'staff.xlsx');
  assert.equal(parsed[1].values[0], 'E-102');
  assert.equal(parsed[1].values[1], 'Maya');
  assert.ok(parsed[1].values[2] instanceof Date);

  const formulaBook = new ExcelJS.Workbook();
  const formulaSheet = formulaBook.addWorksheet('Employees');
  formulaSheet.addRow(['Employee ID', 'First Name']);
  formulaSheet.addRow(['E-103', { formula: '"Maya"' }]);
  const formulaBuffer = await formulaBook.xlsx.writeBuffer();
  await assert.rejects(
    parseEmployeeSpreadsheet(Buffer.from(formulaBuffer), 'formula.xlsx'),
    (error) => error instanceof ApiError && /Formula cells/.test(error.message),
  );
});
