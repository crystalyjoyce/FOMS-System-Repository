import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerButtons?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerButtons
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus the modal ONLY when it first opens — not on every re-render
  useEffect(() => {
    if (isOpen) {
      // Delay so the modal card is in the DOM first
      const t = setTimeout(() => modalRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [isOpen]); // ← isOpen only, NOT onClose

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="modal-card" 
        ref={modalRef} 
        tabIndex={-1} 
        style={{ outline: 'none' }}
      >
        <div className="modal-hd">
          <h3 id="modal-title" className="modal-hd-title">{title}</h3>
          <button 
            onClick={onClose} 
            className="modal-x-btn" 
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-hd-divider" />
        
        <div className="modal-bd">
          {children}
        </div>

        {footerButtons && (
          <>
            <div className="modal-ft-divider" />
            <div className="modal-ft">
              {footerButtons}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
