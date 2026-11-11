import ExcelJS from 'exceljs';
import ApiError from './ApiError.js';

const MAX_ROWS = 1000;
const MAX_COLUMNS = 20;
const MAX_CELL_LENGTH = 500;

const parseCsv = (buffer) => {
  const input = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  let lineNumber = 1;
  let rowStart = 1;

  const pushRow = () => {
    row.push(value);
    if (row.some((cell) => String(cell).trim())) rows.push({ rowNumber: rowStart, values: row });
    row = [];
    value = '';
    rowStart = lineNumber + 1;
    if (rows.length > MAX_ROWS + 1) throw new ApiError(400, `Spreadsheet cannot contain more than ${MAX_ROWS} data rows.`);
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (inQuotes) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        value += character;
        if (character === '\n') lineNumber += 1;
      }
    } else if (character === '"') {
      if (value.length) throw new ApiError(400, 'CSV contains a quote in an unquoted cell.');
      inQuotes = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      pushRow();
      lineNumber += 1;
      rowStart = lineNumber;
    } else {
      value += character;
    }
    if (value.length > MAX_CELL_LENGTH) throw new ApiError(400, `A spreadsheet cell exceeds ${MAX_CELL_LENGTH} characters.`);
  }

  if (inQuotes) throw new ApiError(400, 'CSV has an unterminated quoted cell.');
  if (value.length || row.length) pushRow();
  if (!rows.length) throw new ApiError(400, 'Spreadsheet is empty. Add a header row and employee records.');
  if (rows.some(({ values }) => values.length > MAX_COLUMNS)) {
    throw new ApiError(400, `Spreadsheet cannot contain more than ${MAX_COLUMNS} columns.`);
  }
  return rows;
};

const cellValue = (cell) => {
  if (cell.type === ExcelJS.ValueType.Formula
      || (cell.value && typeof cell.value === 'object' && 'formula' in cell.value)) {
    throw new ApiError(400, 'Formula cells are not supported. Replace formulas with reviewed values and upload again.');
  }
  if (cell.value instanceof Date) return cell.value;
  const text = cell.text ?? '';
  if (String(text).length > MAX_CELL_LENGTH) {
    throw new ApiError(400, `A spreadsheet cell exceeds ${MAX_CELL_LENGTH} characters.`);
  }
  return String(text).trim();
};

const parseXlsx = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ApiError(400, 'Could not read the Excel workbook. Save it as a valid .xlsx file and try again.');
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ApiError(400, 'Excel workbook does not contain a worksheet.');
  if (sheet.rowCount > MAX_ROWS + 1 || sheet.columnCount > MAX_COLUMNS) {
    throw new ApiError(400, `Spreadsheet cannot exceed ${MAX_ROWS} data rows or ${MAX_COLUMNS} columns.`);
  }
  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
    const values = [];
    excelRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      if (columnNumber > MAX_COLUMNS) throw new ApiError(400, `Spreadsheet cannot contain more than ${MAX_COLUMNS} columns.`);
      values[columnNumber - 1] = cellValue(cell);
    });
    if (values.some((value) => value instanceof Date || String(value ?? '').trim())) {
      rows.push({ rowNumber, values });
    }
  });
  if (!rows.length) throw new ApiError(400, 'Spreadsheet is empty. Add a header row and employee records.');
  return rows;
};

export const parseEmployeeSpreadsheet = async (buffer, fileName) => {
  const extension = String(fileName || '').toLowerCase().split('.').pop();
  if (extension === 'csv') return parseCsv(buffer);
  if (extension === 'xlsx') return parseXlsx(buffer);
  throw new ApiError(400, 'Use a .xlsx or .csv spreadsheet. Legacy .xls files are not supported.');
};

export const EMPLOYEE_SPREADSHEET_MAX_ROWS = MAX_ROWS;
