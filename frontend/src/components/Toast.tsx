import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? (
        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
      ) : (
        <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
      )}
      <span>{message}</span>
    </div>
  );
};
