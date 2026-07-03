import React, { useState } from 'react';
import Dropdown, { DropdownItem } from './Dropdown';

type ModalType = 'view' | 'edit' | 'archive' | 'delete' | 'create' | null;

const ActionButtons: React.FC = () => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const handleOpenModal = (type: ModalType) => {
        setActiveModal(type);
    };

    const handleCloseModal = () => {
        setActiveModal(null);
    };

    const menuItems: DropdownItem[] = [
        { key: 'view', label: 'View', icon: 'ti-eye', onClick: () => handleOpenModal('view') },
        { key: 'edit', label: 'Edit', icon: 'ti-pencil', onClick: () => handleOpenModal('edit') },
        { key: 'create', label: 'Create', icon: 'ti-plus', onClick: () => handleOpenModal('create') },
        { key: 'archive', label: 'Archive', icon: 'ti-archive', onClick: () => handleOpenModal('archive') },
        { key: 'delete', label: 'Delete', icon: 'ti-trash', onClick: () => handleOpenModal('delete'), variant: 'danger' }
    ];

    // Helper to render form groups
    const renderInput = (label: string, value: string, readOnly: boolean = false, type: string = 'text') => (
        <div className="ab-form-group">
            <label className="ab-label">{label}</label>
            <input
                type={type}
                className={`ab-input ${readOnly ? 'ab-input-readonly' : ''}`}
                defaultValue={value}
                readOnly={readOnly}
            />
        </div>
    );

    return (
        <>
            <style>
                {`
                    /* Modals and internal styling */

                    /* Custom Dropdown Icon Colors */
                    .dd-item .ti-eye { color: #3b82f6; }
                    .dd-item .ti-pencil { color: #64748b; }
                    .dd-item .ti-plus { color: #10b981; }
                    .dd-item .ti-archive { color: #f59e0b; }
                    .dd-item.dd-item--danger .ti-trash { color: #ef4444; }

                    /* Modal Overlay */
                    .ab-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(15, 23, 42, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 100;
                        backdrop-filter: blur(2px);
                    }

                    /* Modal Card */
                    .ab-modal {
                        background: #ffffff;
                        border-radius: 12px;
                        padding: 24px;
                        width: 360px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                        font-family: 'Inter', sans-serif;
                        position: relative;
                        animation: abModalEnter 0.2s ease-out;
                    }

                    @keyframes abModalEnter {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    /* Modal Header */
                    .ab-modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 20px;
                    }
                    .ab-modal-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #0f172a;
                        margin: 0 0 4px 0;
                    }
                    .ab-modal-subtitle {
                        font-size: 13px;
                        color: #64748b;
                        margin: 0;
                    }
                    .ab-modal-close {
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #64748b;
                        font-size: 20px;
                        line-height: 1;
                        padding: 4px;
                        border-radius: 4px;
                        transition: background 0.2s;
                    }
                    .ab-modal-close:hover {
                        background: #f1f5f9;
                        color: #0f172a;
                    }

                    /* Forms & Inputs */
                    .ab-form-row {
                        display: flex;
                        gap: 16px;
                        margin-bottom: 16px;
                    }
                    .ab-form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        flex: 1;
                        margin-bottom: 16px;
                    }
                    .ab-label {
                        font-size: 12px;
                        font-weight: 600;
                        color: #334155;
                    }
                    .ab-input {
                        padding: 10px 12px;
                        border-radius: 6px;
                        border: 1px solid #e2e8f0;
                        font-size: 14px;
                        color: #0f172a;
                        outline: none;
                        transition: border-color 0.2s;
                        background: #ffffff;
                    }
                    .ab-input:focus {
                        border-color: #3b82f6;
                    }
                    .ab-input-readonly {
                        background: #f8fafc;
                        color: #475569;
                        border-color: transparent;
                    }
                    .ab-select {
                        appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 12px center;
                        background-size: 16px;
                        padding-right: 36px;
                    }
                    
                    /* Custom Readonly Badge (for Status) */
                    .ab-status-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 10px 12px;
                        background: #f8fafc;
                        border-radius: 6px;
                        font-size: 14px;
                        color: #0f172a;
                    }
                    .ab-status-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #10b981;
                    }

                    /* Modal Footer (Buttons) */
                    .ab-modal-footer {
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        margin-top: 24px;
                        padding-top: 20px;
                        border-top: 1px solid #f1f5f9;
                    }
                    .ab-btn {
                        padding: 10px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s;
                        font-family: 'Inter', sans-serif;
                    }
                    .ab-btn-outline {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        color: #0f172a;
                    }
                    .ab-btn-outline:hover {
                        background: #f8fafc;
                    }
                    .ab-btn-primary {
                        background: #000000;
                        color: #ffffff;
                    }
                    .ab-btn-primary:hover {
                        background: #1e293b;
                    }
                    .ab-btn-danger {
                        background: #e11d48;
                        color: #ffffff;
                    }
                    .ab-btn-danger:hover {
                        background: #be123c;
                    }
                    .ab-btn-warning {
                        background: #f59e0b;
                        color: #ffffff;
                    }
                    .ab-btn-warning:hover {
                        background: #d97706;
                    }

                    /* Centered Modals (Archive / Delete) */
                    .ab-modal-centered {
                        text-align: center;
                        padding: 32px 24px;
                    }
                    .ab-icon-container {
                        width: 56px;
                        height: 56px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px auto;
                    }
                    .ab-icon-warning {
                        background: #fef3c7;
                        color: #f59e0b;
                    }
                    .ab-icon-danger {
                        background: #ffe4e6;
                        color: #e11d48;
                    }
                    .ab-icon-container i {
                        font-size: 28px;
                    }
                    .ab-modal-centered .ab-modal-title {
                        margin-bottom: 12px;
                    }
                    .ab-modal-centered .ab-modal-subtitle {
                        line-height: 1.5;
                        margin-bottom: 24px;
                    }
                    .ab-modal-centered .ab-modal-footer {
                        justify-content: center;
                        border-top: none;
                        padding-top: 0;
                        margin-top: 0;
                    }
                `}
            </style>

            {/* Trigger uses the default 3 dots in Dropdown if trigger not provided, 
                we'll just use the default trigger behavior */}
            <div style={{ width: 'fit-content' }}>
                <Dropdown items={menuItems} align="left" placement="bottom" />
            </div>

            {activeModal && (
                <div className="ab-modal-overlay" onClick={handleCloseModal}>
                    <div className="ab-modal" onClick={e => e.stopPropagation()}>

                        {/* VIEW RECORD MODAL */}
                        {activeModal === 'view' && (
                            <>
                                <div className="ab-modal-header">
                                    <div>
                                        <h2 className="ab-modal-title">View Record</h2>
                                        <p className="ab-modal-subtitle">TXN-8472910</p>
                                    </div>
                                    <button className="ab-modal-close" onClick={handleCloseModal}>✕</button>
                                </div>
                                {renderInput('Entity Name', 'Acme Corporation', true)}
                                <div className="ab-form-row">
                                    {renderInput('Amount', '$14,500.00', true)}
                                    <div className="ab-form-group">
                                        <label className="ab-label">Status</label>
                                        <div className="ab-status-badge">
                                            <span className="ab-status-dot"></span>
                                            Cleared
                                        </div>
                                    </div>
                                </div>
                                <div className="ab-modal-footer">
                                    <button className="ab-btn ab-btn-primary" onClick={handleCloseModal}>Close</button>
                                </div>
                            </>
                        )}

                        {/* EDIT RECORD MODAL */}
                        {activeModal === 'edit' && (
                            <>
                                <div className="ab-modal-header">
                                    <div>
                                        <h2 className="ab-modal-title">Edit Record</h2>
                                        <p className="ab-modal-subtitle">Update details for TXN-8472910</p>
                                    </div>
                                    <button className="ab-modal-close" onClick={handleCloseModal}>✕</button>
                                </div>
                                {renderInput('Entity Name', 'Acme Corporation')}
                                <div className="ab-form-row">
                                    {renderInput('Amount', '14500.00')}
                                    <div className="ab-form-group">
                                        <label className="ab-label">Status</label>
                                        <select className="ab-input ab-select">
                                            <option>Cleared</option>
                                            <option>Pending</option>
                                            <option>Failed</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="ab-modal-footer">
                                    <button className="ab-btn ab-btn-outline" onClick={handleCloseModal}>Cancel</button>
                                    <button className="ab-btn ab-btn-primary" onClick={handleCloseModal}>Save Changes</button>
                                </div>
                            </>
                        )}

                        {/* CREATE RECORD MODAL */}
                        {activeModal === 'create' && (
                            <>
                                <div className="ab-modal-header">
                                    <div>
                                        <h2 className="ab-modal-title">Create Record</h2>
                                        <p className="ab-modal-subtitle">Enter details for new transaction.</p>
                                    </div>
                                    <button className="ab-modal-close" onClick={handleCloseModal}>✕</button>
                                </div>
                                {renderInput('Entity Name', '', false)}
                                <div className="ab-form-row">
                                    {renderInput('Amount', '0.00')}
                                    <div className="ab-form-group">
                                        <label className="ab-label">Currency</label>
                                        <select className="ab-input ab-select">
                                            <option>USD</option>
                                            <option>EUR</option>
                                            <option>PHP</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="ab-modal-footer">
                                    <button className="ab-btn ab-btn-outline" onClick={handleCloseModal}>Cancel</button>
                                    <button className="ab-btn ab-btn-primary" onClick={handleCloseModal}>Create</button>
                                </div>
                            </>
                        )}

                        {/* ARCHIVE RECORD MODAL */}
                        {activeModal === 'archive' && (
                            <div className="ab-modal-centered">
                                <div className="ab-icon-container ab-icon-warning">
                                    <i className="ti ti-archive" />
                                </div>
                                <h2 className="ab-modal-title">Archive Record</h2>
                                <p className="ab-modal-subtitle">
                                    Are you sure you want to archive this record? Archived records can be restored later.
                                </p>
                                <div className="ab-modal-footer">
                                    <button className="ab-btn ab-btn-outline" onClick={handleCloseModal}>Cancel</button>
                                    <button className="ab-btn ab-btn-warning" onClick={handleCloseModal}>Archive</button>
                                </div>
                            </div>
                        )}

                        {/* DELETE RECORD MODAL */}
                        {activeModal === 'delete' && (
                            <div className="ab-modal-centered">
                                <div className="ab-icon-container ab-icon-danger">
                                    <i className="ti ti-alert-triangle" />
                                </div>
                                <h2 className="ab-modal-title">Delete Record</h2>
                                <p className="ab-modal-subtitle">
                                    Are you sure you want to permanently delete this record? This action cannot be undone.
                                </p>
                                <div className="ab-modal-footer">
                                    <button className="ab-btn ab-btn-outline" onClick={handleCloseModal}>Cancel</button>
                                    <button className="ab-btn ab-btn-danger" onClick={handleCloseModal}>Delete</button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
};

export default ActionButtons;
