import { useEffect } from 'react';

function StatusMessage({ message, type, onDismiss }) {
  useEffect(() => {
    if (message && type !== 'info') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, type, onDismiss]);

  if (!message) return null;

  const bgColor = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }[type] || 'bg-gray-50 border-gray-200 text-gray-800';

  return (
    <div className={`
      fixed bottom-4 left-1/2 transform -translate-x-1/2
      px-6 py-3 rounded-lg border shadow-lg
      ${bgColor}
      z-50 max-w-md
      flex items-center justify-between gap-4
    `}>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        className="text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>
    </div>
  );
}

export default StatusMessage;
