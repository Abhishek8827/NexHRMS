import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.model.js';
import { validateAttendanceSeedRows } from '../utils/attendanceSeedValidation.js';

const DEFAULT_MONTHLY_SALARY = 20000;
const dryRun = process.argv.includes('--dry-run');
const validateOnly = process.argv.includes('--validate-only');
const seedUrl = new URL('./attendanceEmployees.seed.json', import.meta.url);
const seedRows = JSON.parse(await readFile(seedUrl, 'utf8'));
const validation = validateAttendanceSeedRows(seedRows);
if (validateOnly) {
  console.log('VALIDATION ONLY — no database connection or changes made');
  console.log(`Seed rows: ${validation.rowCount}; unique codes: ${validation.uniqueCodes}; unique names: ${validation.uniqueNames}`);
  process.exit(0);
}
await connectDB();

const normalizeName = (value = '') => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/gi, ' ')
  .trim()
  .toLowerCase();

const employees = await User.find({ role: 'employee' })
  .select('firstName lastName employeeId attendanceCode basicSalary email');
const issues = [];
let updated = 0;
let alreadyMapped = 0;
const mappings = [];

try {
  for (const row of seedRows) {
    const byCode = employees.filter((employee) =>
      employee.attendanceCode === row.employeeCode || employee.employeeId === row.employeeCode,
    );
    const byName = employees.filter((employee) =>
      normalizeName(`${employee.firstName} ${employee.lastName}`) === normalizeName(row.name),
    );
    if (byCode.length === 1 && byName.length === 1
        && String(byCode[0]._id) !== String(byName[0]._id)) {
      issues.push({
        code: row.employeeCode,
        name: row.name,
        issue: 'Employee Code and exact name match different HRMS profiles; no update made.',
        codeMatchedEmployeeId: byCode[0].employeeId,
        nameMatchedEmployeeId: byName[0].employeeId,
      });
      continue;
    }
    const matches = byCode.length ? byCode : byName;

    if (matches.length !== 1) {
      issues.push({
        code: row.employeeCode,
        name: row.name,
        issue: matches.length ? 'More than one HRMS employee matched; no update made.' : 'No existing employee matched; no account was created.',
        matchedEmployeeIds: matches.map((employee) => employee.employeeId),
      });
      continue;
    }

    const employee = matches[0];
    const otherOwner = employees.find((candidate) =>
      String(candidate._id) !== String(employee._id)
      && candidate.attendanceCode === row.employeeCode,
    );
    if (otherOwner) {
      issues.push({
        code: row.employeeCode,
        name: row.name,
        issue: `Attendance code already belongs to ${otherOwner.employeeId || otherOwner.email}; no update made.`,
      });
      continue;
    }

    if (employee.attendanceCode && employee.attendanceCode !== row.employeeCode) {
      issues.push({
        code: row.employeeCode,
        name: row.name,
        issue: `Matched employee ${employee.employeeId || employee.email} already has attendance code ${employee.attendanceCode}; no update made.`,
      });
      continue;
    }

    if (employee.attendanceCode === row.employeeCode && employee.basicSalary === DEFAULT_MONTHLY_SALARY) {
      alreadyMapped += 1;
      mappings.push({ code: row.employeeCode, pdfName: row.name, hrmsEmployeeId: employee.employeeId, basicSalary: employee.basicSalary, result: 'already mapped' });
      continue;
    }

    mappings.push({ code: row.employeeCode, pdfName: row.name, hrmsEmployeeId: employee.employeeId, previousBasicSalary: employee.basicSalary, basicSalary: DEFAULT_MONTHLY_SALARY, result: dryRun ? 'would update' : 'updated' });
    if (!dryRun) {
      await User.updateOne(
        { _id: employee._id },
        { $set: { attendanceCode: row.employeeCode, basicSalary: DEFAULT_MONTHLY_SALARY } },
        { runValidators: true },
      );
    }
    updated += 1;
  }

  console.log(`${dryRun ? 'DRY RUN — no database changes made' : 'Seed complete'}`);
  console.log(`PDF rows: ${seedRows.length}; ${dryRun ? 'would update' : 'updated'}: ${updated}; already mapped: ${alreadyMapped}; unresolved/conflicting: ${issues.length}`);
  if (mappings.length) console.table(mappings);
  if (issues.length) console.table(issues);
  if (issues.length) process.exitCode = 2;
} finally {
  await mongoose.disconnect();
}
