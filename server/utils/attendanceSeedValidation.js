const normalizeName = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/gi, ' ')
  .trim()
  .toLowerCase();

export const validateAttendanceSeedRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Seed data must be a non-empty array.');
  }

  const codes = new Set();
  const names = new Set();
  rows.forEach((row, index) => {
    const line = index + 1;
    if (typeof row?.employeeCode !== 'string' || !row.employeeCode.trim()) {
      throw new Error(`Seed row ${line} must contain an employeeCode string; preserve leading zeroes.`);
    }
    if (typeof row?.name !== 'string' || !normalizeName(row.name)) {
      throw new Error(`Seed row ${line} must contain a valid employee name.`);
    }

    const code = row.employeeCode.trim();
    const name = normalizeName(row.name);
    if (codes.has(code)) throw new Error(`Duplicate employee code in seed data: ${code}.`);
    if (names.has(name)) throw new Error(`Duplicate normalized employee name in seed data: ${row.name}.`);
    codes.add(code);
    names.add(name);
  });

  return { rowCount: rows.length, uniqueCodes: codes.size, uniqueNames: names.size };
};
