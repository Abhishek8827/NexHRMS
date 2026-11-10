import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ATTENDANCE_CODES = Object.freeze({
  P: 'present',
  A: 'absent',
  WO: 'weekly-off',
  HL: 'holiday',
  LV: 'on-leave',
  'P/2': 'half-day',
});
const ROW_LABELS = ['IN', 'OUT', 'WORK', 'BREAK', 'OT', 'STATUS'];
const clean = (value) => String(value ?? '').trim();
const isTime = (value) => /^(?:\d{1,2}:\d{2}|--:--)$/.test(value);

const toMinutes = (value) => {
  if (!value || value === '--:--') return null;
  if (!/^\d{1,3}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (minutes > 59) return null;
  return hours * 60 + minutes;
};

const itemsOnRow = (items, anchor, tolerance = 1.25) => items
  .filter((item) => Math.abs(item.y - anchor.y) <= tolerance)
  .sort((left, right) => left.x - right.x);

const findAfterLabel = (items, label, y, minDistance = 2) => {
  const labelItem = items.find((item) => item.y === y && item.text.toLowerCase() === label.toLowerCase());
  if (!labelItem) return null;
  return items
    .filter((item) => Math.abs(item.y - y) <= 1.25 && item.x >= labelItem.x + minDistance)
    .sort((left, right) => left.x - right.x)[0] || null;
};

const parseMonth = (text) => {
  const match = clean(text).match(/^([A-Za-z]+)[-\s]+(\d{4})$/);
  if (!match) return null;
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const monthToken = match[1].toLowerCase();
  const month = monthNames.findIndex((name) => name === monthToken)
    >= 0
    ? monthNames.findIndex((name) => name === monthToken)
    : monthNames.findIndex((name) => name.startsWith(monthToken));
  return month >= 0 ? { month: month + 1, year: Number(match[2]), label: clean(text) } : null;
};

const readCellRow = (items, label) => {
  const anchor = items.find((item) => item.x < 75 && item.text.toUpperCase() === label);
  if (!anchor) return null;
  return items
    .filter((item) => item.x >= 70 && Math.abs(item.y - anchor.y) <= 4)
    .sort((left, right) => left.x - right.x);
};

const parseEmployeeSection = (items, pageNumber, sectionNumber) => {
  const errors = [];
  const warnings = [];
  const monthLabel = items.find((item) => item.text.toLowerCase() === 'report month');
  const monthValue = monthLabel
    ? items.filter((item) => Math.abs(item.y - monthLabel.y) <= 1.25 && item.x > monthLabel.x)
      .sort((left, right) => left.x - right.x)[0]
    : null;
  const reportPeriod = parseMonth(monthValue?.text);
  if (!reportPeriod) errors.push('Could not read the report month and year.');

  const employeeCodeLabel = items.find((item) => item.text.toLowerCase() === 'empcode');
  const employeeCode = employeeCodeLabel
    ? items.filter((item) => Math.abs(item.y - employeeCodeLabel.y) <= 1.25
      && item.x > employeeCodeLabel.x && item.x < 150)
      .sort((left, right) => left.x - right.x)[0]?.text
    : '';
  if (!employeeCode) errors.push('Employee Code is missing.');

  const nameLabel = items.find((item) => item.text.toLowerCase() === 'name');
  const employeeName = nameLabel
    ? items.filter((item) => Math.abs(item.y - nameLabel.y) <= 1.25 && item.x > nameLabel.x + 15)
      .sort((left, right) => left.x - right.x)[0]?.text
    : '';
  if (!employeeName) errors.push('Employee name is missing.');

  const departmentLabel = items.find((item) => item.text.toLowerCase() === 'dept. name');
  const department = departmentLabel
    ? items.filter((item) => Math.abs(item.y - departmentLabel.y) <= 1.25 && item.x > departmentLabel.x)
      .sort((left, right) => left.x - right.x)[0]?.text
    : '';

  const summaryLine = employeeCodeLabel ? itemsOnRow(items, employeeCodeLabel, 1.25) : [];
  const summaryValue = (label) => {
    const labelItem = summaryLine.find((item) => item.text.toLowerCase() === label.toLowerCase());
    if (!labelItem) return null;
    return summaryLine.find((item) => item.x > labelItem.x + labelItem.width - 1) || null;
  };
  const parseCount = (label) => {
    const item = summaryValue(label);
    if (!item || !/^\d+(?:\.\d+)?$/.test(item.text)) return null;
    return Number(item.text);
  };
  const parseDurationSummary = (label) => {
    const item = summaryValue(label);
    return item ? toMinutes(item.text) : null;
  };
  const summary = {
    present: parseCount('Present'),
    weeklyOff: parseCount('WO'),
    holiday: parseCount('HL'),
    leave: parseCount('LV'),
    absent: parseCount('Absent'),
    workPlusOvertimeMinutes: parseDurationSummary('Tot. Work+OT'),
    overtimeMinutes: parseDurationSummary('Total OT'),
  };
  for (const key of ['present', 'weeklyOff', 'holiday', 'leave', 'absent']) {
    if (summary[key] === null) warnings.push(`Monthly summary value “${key}” is missing or unreadable.`);
  }

  const dayRow = items
    .filter((item) => item.x >= 70 && /^\d{1,2}$/.test(item.text))
    .reduce((groups, item) => {
      const group = groups.find((candidate) => Math.abs(candidate.y - item.y) <= 1);
      if (group) group.items.push(item);
      else groups.push({ y: item.y, items: [item] });
      return groups;
    }, [])
    .map((group) => ({ ...group, items: group.items.sort((a, b) => a.x - b.x) }))
    .find((group) => group.items.length === 31
      && group.items.every((item, index) => Number(item.text) === index + 1));
  if (!dayRow) errors.push('Could not locate the 1–31 date columns.');

  const rowValues = {};
  for (const label of ROW_LABELS) {
    const cells = readCellRow(items, label);
    if (!cells || cells.length !== 31) {
      errors.push(`The ${label} row does not contain 31 readable daily cells (found ${cells?.length || 0}).`);
      rowValues[label] = [];
      continue;
    }
    rowValues[label] = cells;
  }

  let totalDays = 31;
  if (reportPeriod) totalDays = new Date(reportPeriod.year, reportPeriod.month, 0).getDate();
  const days = [];
  if (dayRow) {
    for (let index = 0; index < 31; index += 1) {
      const dayNumber = Number(dayRow.items[index].text);
      const cellAt = (label) => rowValues[label]?.[index]?.text ?? '';
      const rawCode = clean(cellAt('STATUS')).toUpperCase();
      const status = ATTENDANCE_CODES[rawCode] || null;
      const inTime = clean(cellAt('IN'));
      const outTime = clean(cellAt('OUT'));
      const workTime = clean(cellAt('WORK'));
      const breakTime = clean(cellAt('BREAK'));
      const overtimeTime = clean(cellAt('OT'));
      const hasAnyValue = [rawCode, inTime, outTime, workTime, breakTime, overtimeTime]
        .some((value) => value && value !== '--:--' && value !== '00:00');

      if (dayNumber > totalDays) {
        if (hasAnyValue) warnings.push(`Day ${dayNumber} contains data outside ${reportPeriod?.label || 'the report month'} and was ignored.`);
        continue;
      }
      if (!status) {
        const message = `Day ${dayNumber} has an empty or unrecognized status code “${rawCode || '(blank)'}”; it will not be treated as an absence.`;
        errors.push(message);
        warnings.push(message);
      }
      for (const [fieldName, value] of [['IN', inTime], ['OUT', outTime], ['WORK', workTime], ['Break', breakTime], ['OT', overtimeTime]]) {
        if (value !== '--:--' && value && toMinutes(value) === null) {
          const message = `Day ${dayNumber} has an invalid ${fieldName} value “${value}”.`;
          errors.push(message);
          warnings.push(message);
        }
      }

      days.push({
        day: dayNumber,
        rawStatus: rawCode || null,
        status,
        inTime: isTime(inTime) && inTime !== '--:--' ? inTime : null,
        outTime: isTime(outTime) && outTime !== '--:--' ? outTime : null,
        workMinutes: toMinutes(workTime),
        breakMinutes: toMinutes(breakTime),
        overtimeMinutes: toMinutes(overtimeTime),
      });
    }
  }

  const countFromDaily = (codes) => days.reduce((total, day) => {
    if (day.rawStatus === 'P/2' && codes.includes('P/2')) return total + 0.5;
    return total + (codes.includes(day.rawStatus) ? 1 : 0);
  }, 0);
  const summaryComparisons = [
    ['present', countFromDaily(['P', 'P/2'])],
    ['weeklyOff', countFromDaily(['WO'])],
    ['holiday', countFromDaily(['HL'])],
    ['leave', countFromDaily(['LV'])],
    ['absent', countFromDaily(['A', 'P/2'])],
  ];
  for (const [key, dailyValue] of summaryComparisons) {
    if (summary[key] !== null && summary[key] !== dailyValue) {
      warnings.push(`Summary “${key}” is ${summary[key]}, while the daily status rows total ${dailyValue}.`);
    }
  }

  const workAndOt = days.reduce((total, day) => total + (day.workMinutes || 0) + (day.overtimeMinutes || 0), 0);
  if (summary.workPlusOvertimeMinutes !== null && workAndOt !== summary.workPlusOvertimeMinutes) {
    warnings.push(`Summary Work + OT is ${summary.workPlusOvertimeMinutes} minutes, while daily WORK + OT totals ${workAndOt} minutes.`);
  }

  return {
    pageNumber,
    sectionNumber,
    reportPeriod,
    employeeCode: clean(employeeCode),
    employeeName: clean(employeeName),
    department: clean(department),
    summary,
    days,
    errors,
    warnings,
  };
};

const readPageItems = async (page) => {
  const content = await page.getTextContent();
  return content.items
    .filter((item) => typeof item.str === 'string' && item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
    }));
};

export const parseAttendancePdf = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 5 || buffer.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error('The uploaded file is not a valid PDF.');
  }

  const document = await getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  try {
    if (document.numPages > 100) {
      throw new Error('Attendance PDF must contain 100 pages or fewer.');
    }
    const records = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const items = await readPageItems(await document.getPage(pageNumber));
      const sectionHeaders = items
        .filter((item) => item.x < 70 && item.text.toLowerCase() === 'dept. name')
        .sort((left, right) => right.y - left.y);
      for (let index = 0; index < sectionHeaders.length; index += 1) {
        const top = sectionHeaders[index].y + 1.5;
        const bottom = index + 1 < sectionHeaders.length
          ? sectionHeaders[index + 1].y + 3
          : -Infinity;
        const sectionItems = items.filter((item) => item.y <= top && item.y > bottom);
        records.push(parseEmployeeSection(sectionItems, pageNumber, index + 1));
      }
    }
    if (records.length === 0) throw new Error('No employee sections were found in the PDF.');

    const period = records.find((record) => record.reportPeriod)?.reportPeriod || null;
    const topErrors = [];
    if (records.some((record) => !record.reportPeriod || record.reportPeriod.month !== period?.month || record.reportPeriod.year !== period?.year)) {
      topErrors.push('Employee sections contain missing or inconsistent report months.');
    }

    return {
      period,
      pageCount: document.numPages,
      records,
      errors: topErrors,
    };
  } finally {
    await document.cleanup();
  }
};
