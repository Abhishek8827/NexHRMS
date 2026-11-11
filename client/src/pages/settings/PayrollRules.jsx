import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const DAYS = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];
const getEffectivePeriod = () => {
  const now = new Date();
  return { effectiveMonth: now.getMonth() + 1, effectiveYear: now.getFullYear() };
};
const blankComponent = () => ({ name: '', type: 'earning', method: 'fixed', value: 0, prorateWithAttendance: true });
const freshForm = () => ({
  ...getEffectivePeriod(),
  attendance: {
    workingDays: [1, 2, 3, 4, 5],
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    standardHours: 8,
    gracePeriodMinutes: 15,
    halfDayThresholdPercent: 50,
    lateComingBands: [
      { minimum: 2, maximum: 4, lopDays: 0.5 },
      { minimum: 5, maximum: 7, lopDays: 1 },
      { minimum: 8, maximum: 10, lopDays: 1.5 },
      { minimum: 11, maximum: 13, lopDays: 2 },
    ],
  },
  salary: {
    absentLopDays: '',
    halfDayLopDays: '',
    unpaidLeaveLopDays: '',
    leaveTreatment: 'manual-review',
    components: [],
  },
  holidays: [],
  notes: '',
});

const PayrollRules = () => {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(freshForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      const response = await api.get('/payroll-rules');
      setRules(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load salary rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadRules, 0);
    return () => window.clearTimeout(timer);
  }, [loadRules]);

  const activeRule = useMemo(() => rules.find((rule) => rule.status === 'active'), [rules]);
  const patchAttendance = (key, value) => setForm((current) => ({
    ...current,
    attendance: { ...current.attendance, [key]: value },
  }));
  const patchSalary = (key, value) => setForm((current) => ({
    ...current,
    salary: { ...current.salary, [key]: value },
  }));

  const toggleWorkingDay = (day) => {
    const workingDays = form.attendance.workingDays.includes(day)
      ? form.attendance.workingDays.filter((value) => value !== day)
      : [...form.attendance.workingDays, day].sort((a, b) => a - b);
    patchAttendance('workingDays', workingDays);
  };

  const addHoliday = () => setForm((current) => ({
    ...current,
    holidays: [...current.holidays, { date: '', name: '', paid: true }],
  }));
  const patchHoliday = (index, key, value) => setForm((current) => ({
    ...current,
    holidays: current.holidays.map((holiday, row) => row === index ? { ...holiday, [key]: value } : holiday),
  }));
  const removeHoliday = (index) => setForm((current) => ({
    ...current,
    holidays: current.holidays.filter((_, row) => row !== index),
  }));

  const patchLateBand = (index, key, value) => patchAttendance('lateComingBands', form.attendance.lateComingBands.map((band, row) => (
    row === index ? { ...band, [key]: Number(value) } : band
  )));
  const addLateBand = () => {
    const lastMaximum = Math.max(0, ...form.attendance.lateComingBands.map((band) => band.maximum));
    if (lastMaximum >= 13) return;
    patchAttendance('lateComingBands', [...form.attendance.lateComingBands, {
      minimum: lastMaximum + 1,
      maximum: lastMaximum + 1,
      lopDays: 0,
    }]);
  };
  const removeLateBand = (index) => patchAttendance('lateComingBands', form.attendance.lateComingBands.filter((_, row) => row !== index));
  const addComponent = () => patchSalary('components', [...form.salary.components, blankComponent()]);
  const patchComponent = (index, key, value) => patchSalary('components', form.salary.components.map((component, row) => (
    row === index ? { ...component, [key]: value } : component
  )));
  const removeComponent = (index) => patchSalary('components', form.salary.components.filter((_, row) => row !== index));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.attendance.workingDays.length) {
      toast.error('Select at least one scheduled working day.');
      return;
    }
    if (form.holidays.some((holiday) => !holiday.date || !holiday.name.trim())) {
      toast.error('Complete or remove each holiday row before saving.');
      return;
    }
    if ([form.salary.absentLopDays, form.salary.halfDayLopDays, form.salary.unpaidLeaveLopDays]
      .some((value) => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1)) {
      toast.error('Enter explicit LOP weights from 0 to 1 for absence, half-day, and unpaid leave.');
      return;
    }
    if (form.salary.components.some((component) => !component.name.trim())) {
      toast.error('Name each salary earning or deduction, or remove the empty row.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/payroll-rules', form);
      toast.success(`Salary rule version ${response.data.data.version} saved. Earlier rules remain in history.`);
      setForm(freshForm());
      await loadRules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save salary rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Salary Rules & Holidays</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create an effective-dated, versioned policy. New rules do not alter previously generated salaries.</p>
      </header>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        The PDF employees’ basic salary is set to ₹20,000 by the seed script. Configure the attendance schedule, holidays, leave treatment, and any pay components here before generating salary drafts. Overtime minutes are retained for review but are not automatically paid.
      </div>

      {activeRule && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/20 dark:text-green-200">
          Active policy: <strong>Version {activeRule.version}</strong>, effective {String(activeRule.effectiveMonth).padStart(2, '0')}/{activeRule.effectiveYear}.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Schedule, timing & relaxation</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-gray-600 dark:text-gray-300">Effective month
              <select value={form.effectiveMonth} onChange={(event) => setForm({ ...form, effectiveMonth: Number(event.target.value) })} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900">
                {Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>{new Date(2000, index, 1).toLocaleString('en', { month: 'long' })}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">Effective year
              <input type="number" min="2000" max="2200" value={form.effectiveYear} onChange={(event) => setForm({ ...form, effectiveYear: Number(event.target.value) })} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">Shift start
              <input type="time" value={form.attendance.shiftStartTime} onChange={(event) => patchAttendance('shiftStartTime', event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">Shift end
              <input type="time" value={form.attendance.shiftEndTime} onChange={(event) => patchAttendance('shiftEndTime', event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">Standard hours per day
              <input type="number" min="0.25" max="24" step="0.25" value={form.attendance.standardHours} onChange={(event) => patchAttendance('standardHours', Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">Late grace / relaxation (minutes)
              <input type="number" min="0" max="180" value={form.attendance.gracePeriodMinutes} onChange={(event) => patchAttendance('gracePeriodMinutes', Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">Half-day work threshold (%)
              <input type="number" min="0" max="100" step="1" value={form.attendance.halfDayThresholdPercent} onChange={(event) => patchAttendance('halfDayThresholdPercent', Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled working days</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button key={day.value} type="button" onClick={() => toggleWorkingDay(day.value)} className={`rounded-lg border px-3 py-2 text-sm ${form.attendance.workingDays.includes(day.value) ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-gray-300 text-gray-500 dark:border-gray-600'}`}>{day.label}</button>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 overflow-x-auto">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Late-coming LOP bands (counts above 13 require manual review)</span>
              <Button type="button" variant="secondary" size="sm" onClick={addLateBand} disabled={Math.max(0, ...form.attendance.lateComingBands.map((band) => band.maximum)) >= 13}><Plus className="h-4 w-4" /> Add band</Button>
            </div>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="text-xs uppercase text-gray-500"><th className="py-2">From late marks</th><th>To</th><th>LOP days</th><th>Remove</th></tr></thead>
              <tbody>{form.attendance.lateComingBands.map((band, index) => (
                <tr key={`${band.minimum}-${index}`} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2"><input type="number" min="1" max="13" value={band.minimum} onChange={(event) => patchLateBand(index, 'minimum', event.target.value)} className="w-24 rounded border border-gray-300 bg-transparent px-2 py-1 dark:border-gray-600" /></td>
                  <td><input type="number" min="1" max="13" value={band.maximum} onChange={(event) => patchLateBand(index, 'maximum', event.target.value)} className="w-24 rounded border border-gray-300 bg-transparent px-2 py-1 dark:border-gray-600" /></td>
                  <td><input type="number" min="0" max="31" step="0.5" value={band.lopDays} onChange={(event) => patchLateBand(index, 'lopDays', event.target.value)} className="w-24 rounded border border-gray-300 bg-transparent px-2 py-1 dark:border-gray-600" /></td>
                  <td><button type="button" onClick={() => removeLateBand(index)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" aria-label="Remove late band"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Salary attendance treatment</h2>
          </div>
          <p className="mb-4 text-xs text-gray-500">Salary is prorated across scheduled workdays. These editable LOP weights apply only to the generated draft for this policy version.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-gray-600 dark:text-gray-300">LOP days per A (absent)
              <input type="number" min="0" max="1" step="0.25" value={form.salary.absentLopDays} onChange={(event) => patchSalary('absentLopDays', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">LOP days per P/2 (half-day)
              <input type="number" min="0" max="1" step="0.25" value={form.salary.halfDayLopDays} onChange={(event) => patchSalary('halfDayLopDays', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">LOP days per unpaid LV
              <input type="number" min="0" max="1" step="0.25" value={form.salary.unpaidLeaveLopDays} onChange={(event) => patchSalary('unpaidLeaveLopDays', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="text-sm text-gray-600 dark:text-gray-300">LV treatment
              <select value={form.salary.leaveTreatment} onChange={(event) => patchSalary('leaveTreatment', event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900">
                <option value="manual-review">Manual review (block salary draft)</option>
                <option value="paid">Treat PDF LV as paid</option>
                <option value="unpaid">Treat PDF LV as unpaid</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary-600" /><h2 className="font-semibold text-gray-900 dark:text-white">Holiday calendar</h2></div>
            <Button type="button" variant="secondary" size="sm" onClick={addHoliday}><Plus className="h-4 w-4" /> Add holiday</Button>
          </div>
          <p className="mb-3 text-xs text-gray-500">No holiday list is assumed. Add the dates that apply to this effective policy; select whether each is paid.</p>
          {form.holidays.length === 0 ? <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-900">No holidays added to this rule version.</p> : form.holidays.map((holiday, index) => (
            <div key={`holiday-${index}`} className="mb-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end">
              <label className="text-xs text-gray-500">Date<input type="date" value={holiday.date} onChange={(event) => patchHoliday(index, 'date', event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /></label>
              <label className="text-xs text-gray-500">Holiday name<input value={holiday.name} onChange={(event) => patchHoliday(index, 'name', event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /></label>
              <label className="flex items-center gap-2 pb-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={holiday.paid} onChange={(event) => patchHoliday(index, 'paid', event.target.checked)} /> Paid holiday</label>
              <button type="button" onClick={() => removeHoliday(index)} className="mb-1 rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" aria-label="Remove holiday"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="font-semibold text-gray-900 dark:text-white">Earnings & deductions</h2><p className="mt-1 text-xs text-gray-500">No allowance or statutory formula is assumed. Add only the components confirmed for your company.</p></div>
            <Button type="button" variant="secondary" size="sm" onClick={addComponent}><Plus className="h-4 w-4" /> Add component</Button>
          </div>
          {form.salary.components.length === 0 ? <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-900">No extra earnings or deductions. Salary draft will use basic pay and configured attendance LOP only.</p> : form.salary.components.map((component, index) => (
            <div key={`component-${index}`} className="mb-3 grid gap-2 rounded-lg border border-gray-100 p-3 dark:border-gray-700 sm:grid-cols-[1.3fr_1fr_1fr_1fr_auto] sm:items-end">
              <label className="text-xs text-gray-500">Name<input value={component.name} onChange={(event) => patchComponent(index, 'name', event.target.value)} placeholder="Company component" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /></label>
              <label className="text-xs text-gray-500">Type<select value={component.type} onChange={(event) => patchComponent(index, 'type', event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"><option value="earning">Earning</option><option value="deduction">Deduction</option></select></label>
              <label className="text-xs text-gray-500">Method<select value={component.method} onChange={(event) => patchComponent(index, 'method', event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"><option value="fixed">Fixed ₹</option><option value="percent-of-basic">% of basic</option></select></label>
              <label className="text-xs text-gray-500">Value<input type="number" min="0" step="0.01" value={component.value} onChange={(event) => patchComponent(index, 'value', Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /></label>
              <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs text-gray-500"><input type="checkbox" checked={component.prorateWithAttendance} onChange={(event) => patchComponent(index, 'prorateWithAttendance', event.target.checked)} /> Prorate</label><button type="button" onClick={() => removeComponent(index)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" aria-label="Remove component"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <label className="block text-sm text-gray-600 dark:text-gray-300">Version notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="2" maxLength="1000" placeholder="Reason for creating this version" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" />
          </label>
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">OT pay stays disabled. OT minutes are recorded in the salary calculation snapshot for Admin review.</p>
          <Button type="submit" loading={saving} disabled={saving} className="mt-4"><Save className="h-4 w-4" /> Save new rule version</Button>
        </section>
      </form>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Version history</h2>
        {loading ? <div className="flex justify-center py-6"><Spinner /></div> : rules.length === 0 ? <p className="py-5 text-center text-sm text-gray-500">No salary rules saved. Salary draft generation remains locked until Admin saves a policy version.</p> : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {rules.map((rule) => <article key={rule._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-medium text-gray-900 dark:text-white">Version {rule.version} · effective {String(rule.effectiveMonth).padStart(2, '0')}/{rule.effectiveYear}</p><p className="mt-1 text-xs text-gray-500">{rule.attendance.workingDays.length} working weekdays · {rule.holidays.length} holidays · {rule.attendance.lateComingBands.length} late bands · {rule.salary.components.length} salary components</p></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{rule.status}</span>
            </article>)}
          </div>
        )}
      </section>
    </div>
  );
};

export default PayrollRules;
