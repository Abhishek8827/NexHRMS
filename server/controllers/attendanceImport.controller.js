import { createHash } from 'node:crypto';
import AttendanceImport from '../models/AttendanceImport.model.js';
import Attendance from '../models/Attendance.model.js';
import AttendanceMonth from '../models/AttendanceMonth.model.js';
import User from '../models/User.model.js';
import dayjs from 'dayjs';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parseAttendancePdf } from '../utils/attendancePdfParser.js';

const safeFileName = (name) => String(name || 'attendance.pdf')
  .replaceAll('\\', '/')
  .split('/')
  .pop()
  .replace(/[";\r\n\u0000-\u001f]/g, '')
  .slice(0, 150) || 'attendance.pdf';

const normalizeCode = (value) => String(value || '').trim();

const resolveEmployeeCodes = async (records) => {
  const users = await User.find({ role: { $ne: 'admin' } })
    .select('_id employeeId attendanceCode firstName lastName status department')
    .populate('department', 'name');
  const byCode = new Map();

  for (const user of users) {
    for (const code of new Set([normalizeCode(user.employeeId), normalizeCode(user.attendanceCode)].filter(Boolean))) {
      const owners = byCode.get(code) || [];
      owners.push(user);
      byCode.set(code, owners);
    }
  }

  const recordCounts = new Map();
  for (const record of records) {
    const code = normalizeCode(record.employeeCode);
    recordCounts.set(code, (recordCounts.get(code) || 0) + 1);
  }

  const parsedRecords = records.map((record) => {
    const code = normalizeCode(record.employeeCode);
    const owners = byCode.get(code) || [];
    const errors = [...record.errors];
    let employee = null;

    if ((recordCounts.get(code) || 0) > 1) {
      errors.push(`Employee Code ${code} appears more than once in the PDF.`);
    }
    if (owners.length > 1) {
      errors.push(`Employee Code ${code} is assigned to more than one HRMS profile.`);
    } else if (owners.length === 1) {
      employee = owners[0];
    } else {
      errors.push(`Employee Code ${code} does not match an HRMS Employee ID or attendance code.`);
    }

    return {
      ...record,
      employee: employee?._id || null,
      matchedEmployeeName: employee ? `${employee.firstName} ${employee.lastName}` : '',
      matchedEmployeeId: employee?.employeeId || '',
      matchedDepartment: employee?.department?.name || '',
      errors,
    };
  });

  const includedCodes = new Set(parsedRecords.map((record) => normalizeCode(record.employeeCode)));
  const missingEmployeeCodes = users
    .filter((user) => user.status === 'active')
    .map((user) => normalizeCode(user.attendanceCode || user.employeeId))
    .filter((code) => code && !includedCodes.has(code));

  return { records: parsedRecords, missingEmployeeCodes };
};

const addExistingMonthConflicts = async (records, month, year) => {
  const employeeIds = records.map((record) => record.employee).filter(Boolean);
  const existing = await AttendanceMonth.find({
    employee: { $in: employeeIds },
    month,
    year,
  }).select('employee');
  const existingIds = new Set(existing.map((record) => String(record.employee)));
  const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = dayjs(`${year}-${month}-01`).endOf('month').toDate();
  const legacyExisting = await Attendance.distinct('employee', {
    employee: { $in: employeeIds },
    date: { $gte: startDate, $lte: endDate },
  });
  const legacyIds = new Set(legacyExisting.map(String));

  return records.map((record) => {
    if (record.employee && (existingIds.has(String(record.employee)) || legacyIds.has(String(record.employee)))) {
      return {
        ...record,
        errors: [...record.errors, `An attendance record already exists for this employee in ${month}/${year}. Existing data was not changed.`],
      };
    }
    return record;
  });
};

export const previewAttendancePdfImport = asyncHandler(async (req, res) => {
  let parsed;
  try {
    parsed = await parseAttendancePdf(req.file.buffer);
  } catch (error) {
    throw new ApiError(400, `Could not parse attendance PDF: ${error.message}`);
  }

  const selectedMonth = Number(req.body.month);
  const selectedYear = Number(req.body.year);
  if (!Number.isInteger(selectedMonth) || selectedMonth < 1 || selectedMonth > 12
      || !Number.isInteger(selectedYear) || selectedYear < 2000 || selectedYear > 2200) {
    throw new ApiError(400, 'Select a valid month and year before previewing the PDF.');
  }
  if (!parsed.period || parsed.period.month !== selectedMonth || parsed.period.year !== selectedYear) {
    throw new ApiError(400, `Selected month/year does not match the PDF report month (${parsed.period?.label || 'unreadable'}).`);
  }
  if (parsed.errors.length) throw new ApiError(400, parsed.errors.join(' '));

  const fileHash = createHash('sha256').update(req.file.buffer).digest('hex');
  const priorSameFile = await AttendanceImport.findOne({ fileHash, status: 'imported' }).select('_id');
  if (priorSameFile) {
    throw new ApiError(409, 'This exact PDF was already imported. Open import history instead of uploading it again.');
  }

  const { records: matchedRecords, missingEmployeeCodes } = await resolveEmployeeCodes(parsed.records);
  const records = await addExistingMonthConflicts(matchedRecords, selectedMonth, selectedYear);
  const fileName = safeFileName(req.file.originalname);

  const batch = await AttendanceImport.create({
    fileName,
    fileHash,
    sourcePdf: req.file.buffer,
    reportMonthLabel: parsed.period.label,
    month: selectedMonth,
    year: selectedYear,
    pageCount: parsed.pageCount,
    records,
    missingEmployeeCodes,
    importedBy: req.user._id,
  });

  const preview = await AttendanceImport.findById(batch._id)
    .populate('records.employee', 'firstName lastName employeeId attendanceCode department status')
    .populate('importedBy', 'firstName lastName');

  return res.status(201).json(
    new ApiResponse(201, preview, 'PDF parsed. Review all errors and warnings before confirming the import.'),
  );
});

export const listAttendanceImports = asyncHandler(async (req, res) => {
  const imports = await AttendanceImport.find()
    .select('fileName reportMonthLabel month year pageCount status importedBy confirmedBy confirmedAt importedRecordCount createdAt records.errors records.warnings records.employeeCode missingEmployeeCodes')
    .populate('importedBy', 'firstName lastName')
    .populate('confirmedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(200).json(new ApiResponse(200, imports, 'Attendance import history fetched'));
});

export const confirmAttendancePdfImport = asyncHandler(async (req, res) => {
  if (req.body.confirm !== true) {
    throw new ApiError(400, 'Explicitly confirm the reviewed attendance import.');
  }

  const batch = await AttendanceImport.findById(req.params.id);
  if (!batch) throw new ApiError(404, 'Attendance import preview not found.');
  if (batch.status !== 'previewed') {
    throw new ApiError(409, 'This attendance import has already been confirmed.');
  }

  const validRecords = batch.records.filter((record) => !record.errors.length && record.employee);
  if (validRecords.length === 0) {
    throw new ApiError(409, 'No valid employee sections can be imported. Fix the reported errors and upload a corrected PDF.');
  }

  const employeeIds = validRecords.map((record) => record.employee);
  const existing = await AttendanceMonth.find({
    employee: { $in: employeeIds },
    month: batch.month,
    year: batch.year,
  }).select('employee');
  if (existing.length) {
    throw new ApiError(409, 'Monthly attendance data changed after preview. Preview the PDF again; existing records were not overwritten.');
  }

  const employees = await User.find({ _id: { $in: employeeIds } })
    .select('employeeId firstName lastName department')
    .populate('department', 'name');
  const employeeById = new Map(employees.map((employee) => [String(employee._id), employee]));
  const documents = validRecords.map((record) => {
    const employee = employeeById.get(String(record.employee));
    if (!employee) return null;

    return {
      employee: employee._id,
      employeeCode: record.employeeCode,
      employeeIdSnapshot: employee.employeeId,
      employeeNameSnapshot: `${employee.firstName} ${employee.lastName}`,
      departmentSnapshot: employee.department?.name || record.department || '',
      month: batch.month,
      year: batch.year,
      sourceImport: batch._id,
      sourceSummary: record.summary,
      days: record.days.map((day) => ({
        ...day,
        date: new Date(Date.UTC(batch.year, batch.month - 1, day.day)),
      })),
      reviewStatus: 'pending',
      finalizedAt: null,
    };
  }).filter(Boolean);

  if (documents.length !== validRecords.length) {
    throw new ApiError(409, 'An employee profile was removed while this import was being confirmed. Preview the PDF again.');
  }

  try {
    await AttendanceMonth.insertMany(documents, { ordered: true });
    batch.status = 'imported';
    batch.confirmedBy = req.user._id;
    batch.confirmedAt = new Date();
    batch.importedRecordCount = documents.length;
    await batch.save();
  } catch (error) {
    await AttendanceMonth.deleteMany({ sourceImport: batch._id });
    if (error.code === 11000) {
      throw new ApiError(409, 'Monthly attendance already exists for one or more employees. No existing data was overwritten.');
    }
    throw error;
  }

  return res.status(200).json(
    new ApiResponse(200, {
      importId: batch._id,
      month: batch.month,
      year: batch.year,
      importedRecordCount: batch.importedRecordCount,
      rejectedRecordCount: batch.records.length - validRecords.length,
      missingEmployeeCount: batch.missingEmployeeCodes.length,
    }, 'Attendance import confirmed. Monthly records are saved for Admin review; no salary was calculated or finalized.'),
  );
});

export const downloadAttendanceImportPdf = asyncHandler(async (req, res) => {
  const batch = await AttendanceImport.findById(req.params.id).select('+sourcePdf fileName');
  if (!batch) throw new ApiError(404, 'Attendance import not found.');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', batch.sourcePdf.length);
  res.setHeader('Content-Disposition', `attachment; filename="${safeFileName(batch.fileName)}"`);
  return res.status(200).send(batch.sourcePdf);
});
