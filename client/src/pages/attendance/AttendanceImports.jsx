import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, FileUp, RotateCw, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { MONTHS } from '../../utils/constants';
import { formatMinutesToHours } from '../../utils/helpers';

const getCurrentPeriod = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const countWarnings = (records = []) => records.reduce((sum, record) => sum + (record.warnings?.length || 0), 0);
const countErrors = (records = []) => records.reduce((sum, record) => sum + (record.errors?.length || 0), 0);

const AttendanceImports = () => {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  const validRecords = useMemo(
    () => (preview?.records || []).filter((record) => !record.errors?.length && record.employee),
    [preview],
  );
  const rejectedRecords = (preview?.records || []).length - validRecords.length;
  const warningCount = countWarnings(preview?.records);
  const errorCount = countErrors(preview?.records);

  const loadHistory = useCallback(async () => {
    try {
      const response = await api.get('/attendance/imports');
      setHistory(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load import history.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/attendance/imports')
      .then((response) => {
        if (active) setHistory(response.data.data || []);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Unable to load import history.');
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => { active = false; };
  }, []);

  const handlePreview = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error('Choose the monthly attendance PDF first.');
      return;
    }
    setPreviewing(true);
    setPreview(null);
    setShowAllRows(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', String(period.month));
      formData.append('year', String(period.year));
      const response = await api.post('/attendance/imports/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(response.data.data);
      toast.success('PDF preview is ready. Nothing has been imported yet.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to preview this PDF.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview?._id || validRecords.length === 0) return;
    const approved = window.confirm(
      `Import ${validRecords.length} valid employee records for ${MONTHS[preview.month - 1]} ${preview.year}? ${rejectedRecords} sections with errors will be skipped. Existing monthly records will not be overwritten.`,
    );
    if (!approved) return;

    setConfirming(true);
    try {
      const response = await api.post(`/attendance/imports/${preview._id}/confirm`, { confirm: true });
      toast.success(`${response.data.data.importedRecordCount} employee records imported; none were finalized.`);
      setPreview(null);
      setFile(null);
      await loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to confirm this import.');
    } finally {
      setConfirming(false);
    }
  };

  const downloadOriginal = async (importId, fileName) => {
    try {
      const response = await api.get(`/attendance/imports/${importId}/original`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || 'attendance-report.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to download the source PDF.');
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Monthly Attendance PDF Import</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload, inspect, then explicitly confirm. A preview never changes attendance records.</p>
      </header>

      <form onSubmit={handlePreview} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Report month
            <div className="mt-1 flex gap-2">
              <select
                value={period.month}
                onChange={(event) => setPeriod((current) => ({ ...current, month: Number(event.target.value) }))}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900"
              >
                {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
              </select>
              <input
                type="number"
                min="2000"
                max="2200"
                value={period.year}
                onChange={(event) => setPeriod((current) => ({ ...current, year: Number(event.target.value) }))}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900"
                aria-label="Report year"
              />
            </div>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Attendance PDF (max 8 MB)
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setPreview(null);
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 dark:border-gray-600 dark:bg-gray-900 dark:file:bg-gray-700"
            />
          </label>
          <Button type="submit" loading={previewing} disabled={!file || previewing}>
            <FileUp className="h-4 w-4" /> Preview PDF
          </Button>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          The PDF report month must match the selected month. The original file is retained with its import record. Employee matching uses Attendance Code first or the exact HRMS Employee ID; names are not used to match accounts.
        </p>
      </form>

      {preview && (
        <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview: {preview.reportMonthLabel}</h2>
              <p className="mt-1 text-sm text-gray-500">{preview.fileName} · {preview.pageCount} pages · {preview.records.length} employee sections</p>
            </div>
            <Badge color={rejectedRecords ? 'yellow' : 'green'}>{rejectedRecords ? `${rejectedRecords} need correction` : 'Ready to import'}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ['Can import', validRecords.length],
              ['Rejected sections', rejectedRecords],
              ['Validation errors', errorCount],
              ['Warnings', warningCount],
              ['Active employees missing', preview.missingEmployeeCodes?.length || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Summary discrepancies are warnings for review. Blank or “--:--” times are kept as missing times; absence is determined only from the Status code.</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="min-w-[1000px] w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
                <tr>{['PDF Employee Code', 'PDF name', 'Matched HRMS profile', 'Present / WO / HL / LV / Absent', 'Errors', 'Warnings'].map((heading) => (
                  <th key={heading} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(showAllRows ? preview.records : preview.records.slice(0, 10)).map((record, index) => {
                  const matchedName = record.employee
                    ? `${record.employee.firstName} ${record.employee.lastName} (${record.employee.employeeId})`
                    : 'No exact code match';
                  const summaries = record.summary || {};
                  return (
                    <tr key={`${record.employeeCode}-${index}`} className={record.errors?.length ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                      <td className="px-3 py-3 font-mono text-sm text-gray-700 dark:text-gray-200">{record.employeeCode}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">{record.employeeName}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">{matchedName}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {summaries.present ?? '—'} / {summaries.weeklyOff ?? '—'} / {summaries.holiday ?? '—'} / {summaries.leave ?? '—'} / {summaries.absent ?? '—'}
                        <span className="block mt-1">Work + OT: {summaries.workPlusOvertimeMinutes == null ? '—' : formatMinutesToHours(summaries.workPlusOvertimeMinutes)}</span>
                      </td>
                      <td className="max-w-[250px] px-3 py-3 text-xs text-red-700 dark:text-red-300">{record.errors?.length ? record.errors.join(' ') : '—'}</td>
                      <td className="max-w-[300px] px-3 py-3 text-xs text-amber-700 dark:text-amber-300">{record.warnings?.length ? record.warnings.join(' ') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {preview.records.length > 10 && (
              <button type="button" onClick={() => setShowAllRows((shown) => !shown)} className="w-full border-t border-gray-200 px-4 py-3 text-sm font-medium text-primary-600 dark:border-gray-700">
                {showAllRows ? 'Show first 10' : `Show all ${preview.records.length} employee sections`}
              </button>
            )}
          </div>

          {!!preview.missingEmployeeCodes?.length && (
            <details className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
              <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-200">Active HRMS employees not present in this PDF ({preview.missingEmployeeCodes.length})</summary>
              <p className="mt-2 break-words text-xs text-gray-500">{preview.missingEmployeeCodes.join(', ')}</p>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-200 pt-4 dark:border-blue-900">
            <p className="text-xs text-gray-500">Importing saves monthly attendance only. Salary is not calculated, reviewed, or finalized by this action.</p>
            <Button onClick={handleConfirm} loading={confirming} disabled={!validRecords.length || confirming}>
              <ShieldCheck className="h-4 w-4" /> Confirm import of {validRecords.length} records
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Import history</h2>
            <p className="mt-1 text-xs text-gray-500">Original monthly PDFs remain available for reference.</p>
          </div>
          <button type="button" onClick={() => { setLoadingHistory(true); loadHistory(); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <RotateCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        {loadingHistory ? <div className="flex justify-center py-8"><Spinner /></div> : history.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No attendance PDFs imported yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {history.map((item) => (
              <article key={item._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.reportMonthLabel} · {item.fileName}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.importedRecordCount} imported · {item.records?.length || 0} sections · {countErrors(item.records)} errors · {countWarnings(item.records)} warnings · {item.status}</p>
                </div>
                <button type="button" onClick={() => downloadOriginal(item._id, item.fileName)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <Download className="h-4 w-4" /> Original PDF
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AttendanceImports;
