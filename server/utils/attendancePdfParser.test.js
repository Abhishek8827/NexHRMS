import test from 'node:test';
import assert from 'node:assert/strict';
import PDFDocument from 'pdfkit';
import { parseAttendancePdf } from './attendancePdfParser.js';

const createSamplePdf = async () => {
  const document = new PDFDocument({ size: [842, 595], margin: 0 });
  const chunks = [];
  document.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    document.on('end', resolve);
    document.on('error', reject);
  });
  document.font('Helvetica').fontSize(8);

  let textRun = 0;
  const write = (text, x, baselineY) => {
    document.fontSize(8 + (textRun % 20) / 1000);
    textRun += 1;
    document.text(String(text), x, 595 - baselineY - 8, { lineBreak: false, continued: false });
  };
  const writeRow = (label, values, baselineY) => {
    write(label, 48, baselineY);
    values.forEach((value, index) => write(value, 83.8 + index * 23.184, baselineY));
  };

  write('Dept. Name', 44.5, 542.2);
  write('Default', 99.7, 542.2);
  write('Report Month', 665.5, 542.2);
  write('October-2026', 726.5, 542.2);
  write('Empcode', 44.5, 526.5);
  write('0001', 99.7, 526.5);
  write('Name', 169.3, 526.5);
  write('Sample Employee', 215.8, 526.5);
  write('Present', 331.9, 526.5);
  write('1.5', 378.3, 526.5);
  write('WO', 404.2, 526.5);
  write('1', 432, 526.5);
  write('HL', 452.2, 526.5);
  write('0', 478.5, 526.5);
  write('LV', 498.9, 526.5);
  write('0', 524.9, 526.5);
  write('Absent', 548.5, 526.5);
  write('28.5', 592.4, 526.5);
  write('Tot. Work+OT', 612.7, 527.3);
  write('00:00', 668.1, 526.5);
  write('Total OT', 709, 526.5);
  write('0:00', 763.2, 526.5);

  Array.from({ length: 31 }, (_, index) => write(index + 1, 83.8 + index * 23.184, 510.9));
  const codes = ['P', 'P/2', 'WO', ...Array(28).fill('A')];
  writeRow('IN', Array(31).fill('--:--'), 479.9);
  writeRow('OUT', Array(31).fill('--:--'), 464.3);
  writeRow('WORK', Array(31).fill('00:00'), 448.6);
  writeRow('Break', Array(31).fill('00:00'), 432.9);
  writeRow('OT', Array(31).fill('00:00'), 417.3);
  writeRow('Status', codes, 401.6);
  document.end();
  await finished;
  return Buffer.concat(chunks);
};

test('parses employee identity, report period, daily status and summaries from a text PDF', async () => {
  const parsed = await parseAttendancePdf(await createSamplePdf());
  assert.deepEqual(parsed.period, { month: 10, year: 2026, label: 'October-2026' });
  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].employeeCode, '0001');
  assert.equal(parsed.records[0].employeeName, 'Sample Employee');
  assert.equal(parsed.records[0].days.length, 31);
  assert.equal(parsed.records[0].days[0].status, 'present');
  assert.equal(parsed.records[0].days[1].status, 'half-day');
  assert.equal(parsed.records[0].days[2].status, 'weekly-off');
  assert.equal(parsed.records[0].days[3].status, 'absent');
  assert.deepEqual(parsed.records[0].errors, []);
  assert.deepEqual(parsed.records[0].warnings, []);
});

test('rejects content that is not a PDF', async () => {
  await assert.rejects(() => parseAttendancePdf(Buffer.from('not a PDF')), /not a valid PDF/);
});
