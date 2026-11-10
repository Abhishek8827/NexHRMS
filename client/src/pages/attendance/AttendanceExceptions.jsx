import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { formatDate, formatTime } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

const getCurrentPeriod = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

const AttendanceExceptions = () => {
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [records, setRecords] = useState([]);
  const [showReviewed, setShowReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [punchOut, setPunchOut] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const [yearText, monthText] = period.split('-');
  const month = Number(monthText);
  const year = Number(yearText);

  useEffect(() => {
    let active = true;

    api.get('/attendance/exceptions', {
      params: { month, year, includeResolved: showReviewed },
    })
      .then((response) => {
        if (active) setRecords(response.data.data);
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || 'Unable to load punch exceptions.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [month, year, refreshToken, showReviewed]);

  const openReview = (record, selectedAction) => {
    setSelected(record);
    setAction(selectedAction);
    setReason('');
    setPunchOut('');
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (reason.trim().length < 5) {
      toast.error('Enter a review reason of at least 5 characters.');
      return;
    }

    const payload = { action, reason: reason.trim() };
    if (action === 'corrected-punch-out') {
      if (!punchOut) {
        toast.error('Enter the corrected punch-out time.');
        return;
      }
      payload.punchOut = new Date(punchOut).toISOString();
    }

    setSaving(true);
    try {
      await api.patch(`/attendance/${selected._id}/review`, payload);
      toast.success('Punch exception reviewed.');
      setSelected(null);
      setLoading(true);
      setRefreshToken((version) => version + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save the review.');
    } finally {
      setSaving(false);
    }
  };

  const selectedEmployee = selected?.employee;
  const employeeName = selectedEmployee
    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
    : 'Employee';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {showReviewed ? 'Reviewed punch exceptions' : 'Punch exceptions'}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {showReviewed
              ? 'Audit trail for half-day confirmations and corrected punch-out times.'
              : 'Review previous workdays with a punch-in but no punch-out. Today’s active shifts are excluded.'}
          </p>
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

      <div className="flex gap-2" role="tablist" aria-label="Punch exception status">
        {[false, true].map((reviewed) => (
          <button
            key={String(reviewed)}
            type="button"
            role="tab"
            aria-selected={showReviewed === reviewed}
            onClick={() => {
              setLoading(true);
              setShowReviewed(reviewed);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${showReviewed === reviewed
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            {reviewed ? 'Reviewed history' : 'Needs review'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
          <CalendarClock className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <p className="font-medium text-gray-900 dark:text-white">
            {showReviewed ? 'No reviewed exceptions in this month' : 'No open punch exceptions'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {showReviewed
              ? 'Reviews you complete will appear here with their reason and audit details.'
              : 'No previous workday in this month needs review.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const employee = record.employee;
            const name = employee
              ? `${employee.firstName} ${employee.lastName}`
              : 'Employee record unavailable';
            const latestReview = record.punchReviewHistory?.[
              record.punchReviewHistory.length - 1
            ];

            return (
              <article
                key={record._id}
                className={`flex flex-col gap-4 rounded-xl border bg-white p-4 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between ${showReviewed
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-amber-200 dark:border-amber-900/60'}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${showReviewed ? 'text-gray-400' : 'text-amber-500'}`} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
                      {employee?.employeeId && (
                        <span className="text-xs text-gray-500">{employee.employeeId}</span>
                      )}
                      <Badge color={showReviewed ? 'green' : 'yellow'}>
                        {showReviewed ? 'Reviewed' : 'Punch-out missing'}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="h-4 w-4" />
                      {formatDate(record.date)} · Punch-in {formatTime(record.punchIn)}
                      {record.punchOut && ` · Punch-out ${formatTime(record.punchOut)}`}
                    </p>
                    {showReviewed && latestReview ? (
                      <p className="mt-2 max-w-2xl text-xs text-gray-500 dark:text-gray-400">
                        {latestReview.action === 'confirmed-half-day'
                          ? 'Confirmed half-day'
                          : 'Corrected punch-out'}
                        {latestReview.reviewedBy && ` by ${latestReview.reviewedBy.firstName} ${latestReview.reviewedBy.lastName}`}
                        {` on ${formatDate(latestReview.reviewedAt)}: ${latestReview.reason}`}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        {isAdmin
                          ? 'Decide whether this was a half-day or enter the verified punch-out time. A reason is recorded in the review history.'
                          : 'This exception is waiting for an Admin review.'}
                      </p>
                    )}
                  </div>
                </div>
                {!showReviewed && isAdmin && (
                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    <Button variant="secondary" onClick={() => openReview(record, 'confirmed-half-day')}>
                      Confirm half-day
                    </Button>
                    <Button onClick={() => openReview(record, 'corrected-punch-out')}>
                      Correct punch-out
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => !saving && setSelected(null)}
        title={action === 'confirmed-half-day' ? 'Confirm half-day' : 'Correct missing punch-out'}
        size="md"
      >
        {selected && (
          <form onSubmit={submitReview} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {employeeName} · {formatDate(selected.date)} · In {formatTime(selected.punchIn)}
            </p>
            {action === 'corrected-punch-out' && (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verified punch-out time
                <input
                  type="datetime-local"
                  required
                  value={punchOut}
                  onChange={(event) => setPunchOut(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </label>
            )}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Review reason
              <textarea
                required
                minLength={5}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Record how the half-day or corrected time was verified"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={saving} onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save review
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
};

export default AttendanceExceptions;
