import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { formatDate, formatTime, formatMinutesToHours } from '../../utils/helpers';

const getPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const statusColor = {
  present: 'green',
  late: 'yellow',
  'weekly-off': 'gray',
  absent: 'red',
  'half-day': 'yellow',
  'on-leave': 'blue',
  holiday: 'purple',
};

const HRAttendanceOverview = () => {
  const [period, setPeriod] = useState(getPeriod);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorVersion, setErrorVersion] = useState(0);
  const [year, month] = period.split('-').map(Number);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/attendance/all', { params: { month, year } }),
      api.get('/attendance/monthly', { params: { month, year } }),
    ])
      .then(([legacyResponse, monthlyResponse]) => {
        if (!active) return;
        const monthlyRecords = monthlyResponse.data.data || [];
        const importedEmployeeIds = new Set(monthlyRecords.map((record) => String(record.employee?._id || record.employee)));
        const importedDays = monthlyRecords.flatMap((record) => (record.days || []).map((day) => ({
          _id: `${record._id}-${day.day}`,
          employee: record.employee,
          date: day.date,
          punchIn: day.inTime,
          punchOut: day.outTime,
          workingMinutes: day.workMinutes || 0,
          overtimeMinutes: day.overtimeMinutes || 0,
          status: day.status,
        })));
        const legacyRecords = (legacyResponse.data.data || []).filter(
          (record) => !importedEmployeeIds.has(String(record.employee?._id || record.employee)),
        );
        setRecords([...importedDays, ...legacyRecords].sort((left, right) => new Date(right.date) - new Date(left.date)));
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || 'Unable to load monthly attendance.');
          setRecords([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [month, year, errorVersion]);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const employee = record.employee;
      const matchesSearch = !query || [
        employee?.employeeId,
        employee?.firstName,
        employee?.lastName,
        employee?.department?.name,
        employee?.designation,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesSearch && (status === 'all' || record.status === status);
    });
  }, [records, search, status]);

  const statusCounts = useMemo(() => records.reduce((counts, record) => {
    counts[record.status] = (counts[record.status] || 0) + 1;
    return counts;
  }, {}), [records]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Monthly Attendance</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Read-only employee attendance records.</p>
        </div>
        <label className="text-sm text-gray-600 dark:text-gray-300">
          Month
          <input
            type="month"
            value={period}
            onChange={(event) => {
              if (event.target.value) {
                setLoading(true);
                setPeriod(event.target.value);
              }
            }}
            className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['present', 'late', 'half-day', 'absent'].map((key) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xl font-semibold capitalize text-gray-900 dark:text-white">{statusCounts[key] || 0}</p>
            <p className="mt-1 text-xs capitalize text-gray-500">{key.replace('-', ' ')} records</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee, ID, department..."
            className="w-full bg-transparent text-sm text-gray-800 outline-none dark:text-gray-200"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">All statuses</option>
          {Object.keys(statusColor).map((key) => <option key={key} value={key}>{key}</option>)}
        </select>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setErrorVersion((version) => version + 1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>{['Employee', 'ID', 'Department', 'Date', 'In', 'Out', 'Worked', 'Status'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {visibleRecords.map((record) => (
                  <tr key={record._id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Employee unavailable'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-300">{record.employee?.employeeId || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{record.employee?.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(record.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{record.punchIn ? formatTime(record.punchIn) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{record.punchOut ? formatTime(record.punchOut) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatMinutesToHours(record.workingMinutes || 0)}</td>
                    <td className="px-4 py-3"><Badge color={statusColor[record.status] || 'gray'}>{record.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleRecords.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              {records.length ? 'No attendance records match these filters.' : `No attendance records found for ${month}/${year}.`}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default HRAttendanceOverview;
