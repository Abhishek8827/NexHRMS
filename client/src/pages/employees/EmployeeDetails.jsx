import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, UserRound } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';

const valueOrDash = (value) => value || '—';

const EmployeeDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/employees/${id}`)
      .then(({ data }) => {
        if (active) setEmployee(data.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load this employee profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (error || !employee) {
    return (
      <section className="space-y-4">
        <Link to="/employees" className="inline-flex items-center gap-2 text-sm text-primary-600"><ArrowLeft className="h-4 w-4" /> Back to employees</Link>
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Employee not found.'}</p>
      </section>
    );
  }

  const groups = [
    {
      title: 'Employment',
      fields: [
        ['Employee ID', employee.employeeId],
        ['Attendance Code', employee.attendanceCode],
        ['Department', employee.department?.name],
        ['Designation', employee.designation],
        ['Role', employee.role],
        ['Status', employee.status],
        ['Joining date', employee.joiningDate ? formatDate(employee.joiningDate) : '—'],
        ['Manager', employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—'],
      ],
    },
    {
      title: 'Contact and personal details',
      fields: [
        ['Email', employee.email],
        ['Phone', employee.phone],
        ['Date of birth', employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '—'],
        ['Gender', employee.gender],
        ['Address', [employee.address?.street, employee.address?.city, employee.address?.state, employee.address?.pincode].filter(Boolean).join(', ')],
      ],
    },
    {
      title: 'Emergency contact',
      fields: [
        ['Name', employee.emergencyContact?.name],
        ['Relationship', employee.emergencyContact?.relationship],
        ['Phone', employee.emergencyContact?.phone],
      ],
    },
  ];

  return (
    <section className="space-y-5">
      <Link to="/employees" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"><ArrowLeft className="h-4 w-4" /> Back to employees</Link>
      <header className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"><UserRound className="h-7 w-7" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</h1>
          <p className="mt-1 text-sm text-gray-500">{employee.designation || 'Employee'}{employee.department?.name ? ` · ${employee.department.name}` : ''}</p>
        </div>
        <Badge color={employee.status === 'active' ? 'green' : 'gray'}>{employee.status}</Badge>
        <div className="flex w-full flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-300 sm:w-auto">
          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{employee.email}</span>
          {employee.phone && <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{employee.phone}</span>}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 border-b border-gray-100 pb-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">{group.title}</h2>
            <dl className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              {group.fields.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium capitalize text-gray-800 dark:text-gray-200">{valueOrDash(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
};

export default EmployeeDetails;
