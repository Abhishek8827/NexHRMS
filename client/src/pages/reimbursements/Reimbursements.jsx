import { Receipt, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['travel', 'food', 'accommodation', 'medical', 'training', 'equipment', 'other'];
const statusColor = { pending: 'yellow', approved: 'green', rejected: 'red', paid: 'blue' };

const Reimbursements = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    const newRecord = {
      ...data,
      _id: Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setRecords(prev => [newRecord, ...prev]);
    toast.success('Reimbursement request submitted!');
    setShowModal(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reimbursements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit and track expense claims</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: records.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Approved', value: records.filter(r => r.status === 'approved').length, icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Rejected', value: records.filter(r => r.status === 'rejected').length, icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 flex items-center gap-3`}>
            <s.icon className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {records.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 dark:text-gray-400">No reimbursement requests yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                {['Category', 'Amount', 'Date', 'Description', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">{r.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">₹{r.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.expenseDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{r.description}</td>
                  <td className="px-6 py-4"><Badge color={statusColor[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Reimbursement Request">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select {...register('category', { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <Input label="Amount (₹)" type="number" required placeholder="500"
            {...register('amount', { required: true })} />
          <Input label="Expense Date" type="date" required
            {...register('expenseDate', { required: true })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea {...register('description', { required: true })}
              rows={3} placeholder="Describe the expense..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Submit Request</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reimbursements;