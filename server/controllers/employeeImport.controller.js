import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import Department from '../models/Department.model.js';
import EmployeeImport from '../models/EmployeeImport.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parseEmployeeSpreadsheet } from '../utils/employeeSpreadsheetParser.js';

const MAX_ROWS = 1000;
const safeFileName = (name) => String(name || 'employee-import')
  .replaceAll('\\', '/')
  .split('/')
  .pop()
  .replace(/[";\r\n\u0000-\u001f]/g, '')
  .slice(0, 150) || 'employee-import';
const cleanText = (value) => String(value ?? '').trim();
const normalizeHeader = (value) => cleanText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeDepartment = (value) => cleanText(value).toLowerCase();
const FIELD_ALIASES = {
  employeeid: 'employeeId',
  hrmsemployeeid: 'employeeId',
  employeecode: 'attendanceCode',
  attendancecode: 'attendanceCode',
  firstname: 'firstName',
  lastname: 'lastName',
  phone: 'phone',
  phonenumber: 'phone',
  designation: 'designation',
  jobtitle: 'designation',
  department: 'department',
  joiningdate: 'joiningDate',
  basicsalary: 'basicSalary',
};
const FIELD_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  phone: 'Phone',
  designation: 'Designation',
  department: 'Department',
  joiningDate: 'Joining date',
  basicSalary: 'Basic salary',
};
const UPDATE_FIELDS = Object.keys(FIELD_LABELS);

const dateForUpdate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())).toISOString();
  }
  const text = cleanText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text ? date.toISOString() : null;
};

const displayValue = (field, value) => {
  if (value === undefined || value === null || value === '') return '—';
  if (field === 'department') return String(value.name || value);
  if (field === 'joiningDate') return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  if (field === 'basicSalary') return Number(value);
  return String(value);
};

const snapshotValue = (field, value) => {
  if (field === 'department') return value ? String(value._id || value) : null;
  if (field === 'joiningDate') return value ? new Date(value).toISOString() : null;
  if (field === 'basicSalary') return Number(value || 0);
  return value === undefined || value === null ? '' : String(value);
};

const currentValue = (employee, field) => snapshotValue(field, employee[field]);
const sameValue = (left, right) => String(left ?? '') === String(right ?? '');

const parseRecords = async (rows) => {
  if (rows.length < 2) throw new ApiError(400, 'Spreadsheet needs a header and at least one employee row.');
  if (rows.length - 1 > MAX_ROWS) throw new ApiError(400, `Spreadsheet cannot contain more than ${MAX_ROWS} data rows.`);

  const headers = rows[0].values.map((value) => normalizeHeader(value));
  const mappedHeaders = headers.map((header) => FIELD_ALIASES[header] || null);
  const seenHeaders = new Set();
  mappedHeaders.forEach((field) => {
    if (!field) return;
    if (seenHeaders.has(field)) throw new ApiError(400, `Spreadsheet has more than one column for ${FIELD_LABELS[field] || field}.`);
    seenHeaders.add(field);
  });
  if (!seenHeaders.has('employeeId') && !seenHeaders.has('attendanceCode')) {
    throw new ApiError(400, 'Add an Employee ID or Attendance Code column for exact account matching.');
  }
  if (!mappedHeaders.some(Boolean)) throw new ApiError(400, 'Spreadsheet does not contain any supported columns.');

  const [users, departments] = await Promise.all([
    User.find({ role: { $ne: 'admin' } })
      .select('_id employeeId attendanceCode firstName lastName role department phone designation joiningDate basicSalary')
      .populate('department', 'name'),
    Department.find().select('_id name'),
  ]);

  const identityOwners = new Map();
  users.forEach((user) => {
    for (const value of [user.employeeId, user.attendanceCode]) {
      const identifier = cleanText(value);
      if (!identifier) continue;
      const candidates = identityOwners.get(identifier) || [];
      if (!candidates.some((candidate) => String(candidate._id) === String(user._id))) candidates.push(user);
      identityOwners.set(identifier, candidates);
    }
  });
  const departmentByName = new Map(departments.map((department) => [normalizeDepartment(department.name), department]));
  const records = [];

  for (const { rowNumber, values } of rows.slice(1)) {
    const errors = [];
    const warnings = [];
    const rowData = Object.fromEntries(mappedHeaders.map((field, index) => [field || `ignored_${index}`, values[index] ?? '']));
    const employeeId = cleanText(rowData.employeeId);
    const attendanceCode = cleanText(rowData.attendanceCode);
    if (!employeeId && !attendanceCode) errors.push('Employee ID or Attendance Code is required; rows are never matched by name.');

    const matchingIds = [];
    for (const code of [employeeId, attendanceCode].filter(Boolean)) {
      const owners = identityOwners.get(code) || [];
      if (owners.length > 1) errors.push(`Identifier ${code} is assigned to more than one HRMS profile.`);
      else if (!owners.length) errors.push(`Identifier ${code} does not match an existing HRMS Employee ID or Attendance Code.`);
      else matchingIds.push(owners[0]);
    }
    const uniqueMatches = [...new Map(matchingIds.map((user) => [String(user._id), user])).values()];
    if (uniqueMatches.length > 1) errors.push('Employee ID and Attendance Code match different HRMS profiles.');
    const employee = uniqueMatches.length === 1 ? uniqueMatches[0] : null;

    const changes = {};
    const before = {};
    const diff = [];
    if (employee) {
      for (const field of UPDATE_FIELDS) {
        const columnIndex = mappedHeaders.indexOf(field);
        if (columnIndex === -1) continue;
        const input = values[columnIndex];
        if (input === undefined || input === null || input === '' || (typeof input === 'string' && !input.trim())) continue;

        let nextValue;
        if (field === 'department') {
          const department = departmentByName.get(normalizeDepartment(input));
          if (!department) {
            errors.push(`Department “${cleanText(input)}” does not match an existing department.`);
            continue;
          }
          nextValue = String(department._id);
        } else if (field === 'joiningDate') {
          nextValue = dateForUpdate(input);
          if (!nextValue) {
            errors.push('Joining date must be an Excel date or an unambiguous YYYY-MM-DD value.');
            continue;
          }
        } else if (field === 'basicSalary') {
          const numeric = typeof input === 'number' ? input : Number(cleanText(input).replace(/,/g, ''));
          if (!Number.isFinite(numeric) || numeric < 0) {
            errors.push('Basic salary must be a non-negative number.');
            continue;
          }
          nextValue = numeric;
        } else {
          nextValue = cleanText(input);
          if (!nextValue) continue;
        }

        const prior = employee[field];
        const priorSnapshot = snapshotValue(field, prior);
        if (sameValue(priorSnapshot, nextValue)) continue;
        before[field] = priorSnapshot;
        changes[field] = nextValue;
        diff.push({
          field,
          label: FIELD_LABELS[field],
          before: displayValue(field, field === 'department' ? prior?.name || prior : prior),
          after: displayValue(field, field === 'department'
            ? departments.find((department) => String(department._id) === nextValue)?.name || nextValue
            : nextValue),
        });
      }
    }

    const unknownColumns = headers.filter((header, index) => header && !mappedHeaders[index]);
    if (unknownColumns.length) warnings.push(`Ignored unsupported column(s): ${unknownColumns.join(', ')}.`);
    if (seenHeaders.has('employeeId') || seenHeaders.has('attendanceCode')) {
      const submittedEmail = headers.some((header) => header === 'email');
      if (submittedEmail) warnings.push('Email is ignored and is never used to match or change an account.');
    }
    if (employee && diff.length === 0 && errors.length === 0) errors.push('No supported changes were provided in this row.');

    records.push({
      rowNumber,
      employee: employee?._id || null,
      employeeLabel: employee ? `${employee.firstName} ${employee.lastName} (${employee.employeeId || employee.attendanceCode})` : '',
      identifier: employeeId || attendanceCode,
      before,
      changes,
      diff,
      errors,
      warnings,
    });
  }

  const rowCounts = new Map();
  records.forEach((record) => {
    if (!record.employee) return;
    const key = String(record.employee);
    rowCounts.set(key, (rowCounts.get(key) || 0) + 1);
  });
  records.forEach((record) => {
    if (record.employee && rowCounts.get(String(record.employee)) > 1) {
      record.errors.push('This HRMS employee appears more than once in the spreadsheet. Remove duplicate rows before importing.');
    }
  });
  return records;
};

const publicBatch = (batch) => ({
  _id: batch._id,
  fileName: batch.fileName,
  status: batch.status,
  records: batch.records.map((record) => ({
    rowNumber: record.rowNumber,
    employee: record.employee,
    employeeLabel: record.employeeLabel,
    identifier: record.identifier,
    diff: record.diff,
    errors: record.errors,
    warnings: record.warnings,
  })),
  importedRecordCount: batch.importedRecordCount,
  createdAt: batch.createdAt,
  importedBy: batch.importedBy,
  confirmedBy: batch.confirmedBy,
  confirmedAt: batch.confirmedAt,
});

export const listEmployeeSpreadsheetImports = asyncHandler(async (req, res) => {
  const imports = await EmployeeImport.find()
    .select('fileName status importedRecordCount createdAt importedBy confirmedBy confirmedAt records')
    .populate('importedBy', 'firstName lastName')
    .populate('confirmedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(50);
  const history = imports.map((batch) => ({
    _id: batch._id,
    fileName: batch.fileName,
    status: batch.status,
    rowCount: batch.records.length,
    importedRecordCount: batch.importedRecordCount,
    createdAt: batch.createdAt,
    importedBy: batch.importedBy,
    confirmedBy: batch.confirmedBy,
    confirmedAt: batch.confirmedAt,
  }));
  return res.status(200).json(new ApiResponse(200, history, 'Employee spreadsheet import history fetched'));
});

export const previewEmployeeSpreadsheetImport = asyncHandler(async (req, res) => {
  const rows = await parseEmployeeSpreadsheet(req.file.buffer, req.file.originalname);
  const records = await parseRecords(rows);
  const fileHash = createHash('sha256').update(req.file.buffer).digest('hex');
  const duplicate = await EmployeeImport.findOne({ fileHash, status: 'imported' }).select('_id');
  if (duplicate) throw new ApiError(409, 'This exact spreadsheet was already imported. Review the previous import instead of uploading it again.');

  const batch = await EmployeeImport.create({
    fileName: safeFileName(req.file.originalname),
    fileHash,
    sourceFile: req.file.buffer,
    records,
    importedBy: req.user._id,
  });
  return res.status(201).json(new ApiResponse(201, publicBatch(batch), 'Spreadsheet parsed. Review every proposed change before confirming.'));
});

export const confirmEmployeeSpreadsheetImport = asyncHandler(async (req, res) => {
  if (req.body.confirm !== true) throw new ApiError(400, 'Explicitly confirm the reviewed employee spreadsheet import.');
  const session = await mongoose.startSession();
  let summary;
  try {
    await session.withTransaction(async () => {
      const batch = await EmployeeImport.findById(req.params.id).session(session);
      if (!batch) throw new ApiError(404, 'Employee import preview not found.');
      if (batch.status !== 'previewed') throw new ApiError(409, 'This employee import has already been confirmed.');

      const readyRows = batch.records.filter((record) => !record.errors.length && record.employee && Object.keys(record.changes || {}).length);
      if (!readyRows.length) throw new ApiError(409, 'No valid changes are ready to import. Correct the reported rows and preview the spreadsheet again.');

      const users = await User.find({ _id: { $in: readyRows.map((record) => record.employee) } })
        .select('_id firstName lastName employeeId attendanceCode role department phone designation joiningDate basicSalary')
        .session(session);
      const usersById = new Map(users.map((employee) => [String(employee._id), employee]));

      for (const row of readyRows) {
        const employee = usersById.get(String(row.employee));
        if (!employee) throw new ApiError(409, `Row ${row.rowNumber}: the matched HRMS profile no longer exists. Preview the spreadsheet again.`);
        for (const [field, prior] of Object.entries(row.before || {})) {
          if (!sameValue(currentValue(employee, field), prior)) {
            throw new ApiError(409, `Row ${row.rowNumber}: ${FIELD_LABELS[field] || field} changed after preview. No rows were updated; preview the spreadsheet again.`);
          }
        }
      }

      for (const row of readyRows) {
        const result = await User.updateOne(
          { _id: row.employee },
          { $set: row.changes },
          { runValidators: true, session },
        );
        if (result.matchedCount !== 1) throw new ApiError(409, `Row ${row.rowNumber}: the matched profile changed during confirmation. No rows were updated.`);
      }

      batch.status = 'imported';
      batch.confirmedBy = req.user._id;
      batch.confirmedAt = new Date();
      batch.importedRecordCount = readyRows.length;
      await batch.save({ session });
      summary = {
        importId: batch._id,
        importedRecordCount: readyRows.length,
        skippedRecordCount: batch.records.length - readyRows.length,
      };
    });
  } catch (error) {
    if (error.message?.includes('Transaction numbers are only allowed')) {
      throw new ApiError(503, 'Employee spreadsheet confirmation requires MongoDB transactions. Configure MongoDB as a replica set or sharded cluster.');
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return res.status(200).json(new ApiResponse(200, summary, 'Employee spreadsheet import confirmed. Existing accounts were updated; no accounts were created.'));
});

export const getEmployeeSpreadsheetOriginal = asyncHandler(async (req, res) => {
  const batch = await EmployeeImport.findById(req.params.id).select('+sourceFile fileName');
  if (!batch) throw new ApiError(404, 'Employee import preview not found.');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(batch.fileName)}"`);
  return res.status(200).send(batch.sourceFile);
});
