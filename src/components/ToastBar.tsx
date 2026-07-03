import React, { useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    type: ToastType;
    isLeaving: boolean;
}

const ToastBar: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [toastIdCounter, setToastIdCounter] = useState(0);

    const showToast = (type: ToastType) => {
        const id = toastIdCounter;
        setToastIdCounter(prev => prev + 1);
        setToasts(prev => [...prev, { id, type, isLeaving: false }]);

        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, isLeaving: true } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, 4000);
    };

    const getToastDetails = (type: ToastType) => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check_circle',
                    bg: '#3ea751',
                    textColor: '#ffffff',
                    title: 'Payment Sent Successfully',
                    message: 'PHP 5,000 transferred to Juan Dela Cruz.'
                };
            case 'error':
                return {
                    icon: 'cancel',
                    bg: '#d94141',
                    textColor: '#ffffff',
                    title: 'Transaction Failed',
                    message: 'Connection timeout. Please try again.'
                };
            case 'info':
                return {
                    icon: 'local_shipping',
                    bg: '#3c82f6',
                    textColor: '#ffffff',
                    title: 'Order Dispatching',
                    message: 'Order #DEL-7890 is being prepared for delivery.'
                };
            case 'warning':
                return {
                    icon: 'warning',
                    bg: '#fbbc05',
                    textColor: '#1a1a1a',
                    title: 'Low Balance Alert',
                    message: 'Your account balance is below PHP 1,000.'
                };
            default:
                return { icon: '', bg: '', textColor: '', title: '', message: '' };
        }
    };

    return (
        <>
            <style>
                {`
                    .tb-toast-wrapper {
                        position: fixed;
                        top: 24px;
                        right: 24px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        z-index: 50;
                    }
                    .tb-toast-item {
                        position: relative;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 16px 20px;
                        padding-right: 40px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        min-width: 340px;
                        max-width: 400px;
                        font-family: 'Inter', sans-serif;
                    }
                    .tb-toast-icon {
                        font-family: 'Material Symbols Outlined', 'tabler-icons';
                        font-variation-settings: 'FILL' 0, 'wght' 300;
                        font-size: 32px;
                        opacity: 0.9;
                    }
                    .tb-toast-content {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        flex-grow: 1;
                    }
                    .tb-toast-title {
                        font-size: 16px;
                        font-weight: 600;
                        margin: 0;
                        line-height: 1.2;
                    }
                    .tb-toast-msg {
                        font-size: 14px;
                        line-height: 1.4;
                        opacity: 0.9;
                        margin: 0;
                    }
                    .tb-toast-close {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        cursor: pointer;
                        font-family: 'Material Symbols Outlined', sans-serif;
                        font-size: 18px;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    }
                    .tb-toast-close:hover {
                        opacity: 1;
                    }
                    .tb-toast-enter {
                        animation: slideInRight 0.3s ease-out forwards;
                    }
                    .tb-toast-leave {
                        animation: fadeOut 0.3s ease-in forwards;
                    }
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; transform: translateY(0); }
                        to { opacity: 0; transform: translateY(-10px); }
                    }
                    
                    /* Container Styles for Buttons */
                    .tb-btn-row {
                        display: flex;
                        flex-direction: row;
                        gap: 24px;
                    }
                    .tb-btn {
                        padding: 8px 24px;
                        border-radius: 4px;
                        font-family: 'Inter', sans-serif;
                        font-size: 12px;
                        line-height: 16px;
                        letter-spacing: 0.05em;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #ffffff;
                        cursor: pointer;
                        border: none;
                        transition: opacity 0.2s;
                    }
                    .tb-btn:hover {
                        opacity: 0.9;
                    }
                    .tb-btn-success { background: #3ea751; }
                    .tb-btn-error { background: #d94141; }
                    .tb-btn-info { background: #3c82f6; }
                    .tb-btn-warning { background: #fbbc05; color: #1a1a1a; }
                `}
            </style>

            {/* Toast Container */}
            <div className="tb-toast-wrapper">
                {toasts.map(toast => {
                    const details = getToastDetails(toast.type);
                    return (
                        <div
                            key={toast.id}
                            className={`tb-toast-item ${toast.isLeaving ? 'tb-toast-leave' : 'tb-toast-enter'}`}
                            style={{ background: details.bg, color: details.textColor }}
                        >
                            <span className="tb-toast-icon">
                                {details.icon === 'check_circle' ? '✔' : 
                                 details.icon === 'cancel' ? '✖' : 
                                 details.icon === 'local_shipping' ? '🚚' : '⚠'}
                            </span>
                            <div className="tb-toast-content">
                                <h4 className="tb-toast-title">{details.title}</h4>
                                <p className="tb-toast-msg">{details.message}</p>
                            </div>
                            <span className="tb-toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                                ✕
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Buttons Container */}
            <div className="tb-btn-row">
                <button className="tb-btn tb-btn-success" onClick={() => showToast('success')}>Success</button>
                <button className="tb-btn tb-btn-error" onClick={() => showToast('error')}>Error</button>
                <button className="tb-btn tb-btn-info" onClick={() => showToast('info')}>Information</button>
                <button className="tb-btn tb-btn-warning" onClick={() => showToast('warning')}>Warning</button>
            </div>
        </>
    );
};

export default ToastBar;