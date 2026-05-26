import { MessageSquare, Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['harassment', 'discrimination', 'workplace-safety', 'payroll', 'policy-violation', 'manager-behavior', 'other'];
const statusColor = { open: 'red', 'under-review': 'yellow', resolved: 'green', closed: 'gray' };

const Complaints = () => {
  const [showModal, setShowModal] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data) => {
    setComplaints(prev => [{
      ...data, _id: Date.now(),
      status: 'open',
      createdAt: new Date().toISOString()
    }, ...prev]);
    toast.success('Complaint submitted successfully.');
    setShowModal(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complaints</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Raise and track workplace concerns</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Raise Complaint
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: complaints.filter(c => c.status === 'open').length, color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
          { label: 'Under Review', value: complaints.filter(c => c.status === 'under-review').length, color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {complaints.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 dark:text-gray-400">No complaints raised yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {complaints.map((c) => (
              <div key={c._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded capitalize">{c.category}</span>
                      <Badge color={statusColor[c.status]}>{c.status}</Badge>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">{c.subject}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Raise a Complaint">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category <span className="text-red-500">*</span></label>
            <select {...register('category', { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.replace('-', ' ')}</option>)}
            </select>
          </div>
          <Input label="Subject" required placeholder="Brief subject of complaint" {...register('subject', { required: true })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea {...register('description', { required: true })} rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="anon" {...register('isAnonymous')} className="rounded" />
            <label htmlFor="anon" className="text-sm text-gray-700 dark:text-gray-300">Submit anonymously</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Submit Complaint</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Complaints;