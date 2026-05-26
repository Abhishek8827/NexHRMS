import { clsx } from 'clsx';

const Spinner = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className={clsx(
      'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
      sizes[size]
    )} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;