import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colors = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'bg-blue-500', text: 'text-blue-600' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'bg-green-500', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'bg-yellow-500', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'bg-purple-500', text: 'text-purple-600' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'bg-red-500', text: 'text-red-600' },
  };

  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('rounded-xl p-6 border border-gray-200 dark:border-gray-700', c.bg)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={clsx('text-xs font-medium mt-2', trend > 0 ? 'text-green-600' : 'text-red-600')}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-3 rounded-xl', c.icon)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;