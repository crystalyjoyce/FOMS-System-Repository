import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Buttons';
import { Card } from '../components/Card';
import { Client } from '../data/seed';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

export const ClientManagement: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { clients, invoices, updateClient } = useAppData();
  
  // List view state
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Form State (used for both Edit and Add)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    address: '',
    rateType: 'Standard',
    billingSchedule: 'Monthly',
    status: 'Active'
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Sync form data when editing client changes (for Detail View)
  useEffect(() => {
    if (id) {
      const client = clients.find(c => c.id === id);
      if (client && !isEditMode) {
        setFormData({
          name: client.name,
          contactPerson: client.contactPerson,
          address: client.address,
          rateType: 'Standard',
          billingSchedule: client.billingSchedule,
          status: client.status
        });
      }
    }
  }, [id, clients, isEditMode]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      updateClient(id, {
        name: formData.name,
        contactPerson: formData.contactPerson,
        address: formData.address,
        billingSchedule: formData.billingSchedule as any,
        status: formData.status as any,
      });
      toast.success(`Client ${id} successfully updated.`);
      setIsEditMode(false);
    }
  };

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for adding a new client
    toast.success(`Client successfully created.`);
    setIsAddingNew(false);
  };

  if (id) {
    const editingClient = clients.find(c => c.id === id);
    if (!editingClient) return <div>Client not found</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => { navigate('/clients'); setIsEditMode(false); }} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Clients
        </div>

        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Client Record: {editingClient.id}</h3>
            {!isEditMode ? (
              // View Mode
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Client Name</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{formData.name}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Contact Person</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{formData.contactPerson}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Address</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{formData.address}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Rate Type</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{formData.rateType}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Billing Cycle</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{formData.billingSchedule}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Status</p>
                    <StatusBadge status={formData.status} />
                  </div>
                </div>
                
                {user?.role === 'Accountant' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Button variant="primary" title="Edit Details" onClick={() => setIsEditMode(true)} />
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Client Name *</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Contact Person *</label>
                  <input required type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Address *</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Rate Type *</label>
                  <input required type="text" name="rateType" value={formData.rateType} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Billing Cycle</label>
                  <select name="billingSchedule" value={formData.billingSchedule} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <option value="Monthly">Monthly</option>
                    <option value="Semi-monthly">Semi-monthly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <Button variant="secondary" title="Cancel" type="button" onClick={() => setIsEditMode(false)} />
                  <Button variant="primary" title="Save Changes" type="submit" />
                </div>
              </form>
            )}
          </div>
        </Card>

        {!isEditMode && (
          <Card>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '8px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>Billing History</h4>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                        <tr>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Invoice No.</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Due Date</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Amount</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.filter(inv => inv.clientId === editingClient.id).length > 0 ? (
                          invoices.filter(inv => inv.clientId === editingClient.id).map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '10px 16px', color: '#0F172A', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                              <td style={{ padding: '10px 16px', color: '#64748B' }}>{new Date(inv.dueDate).toLocaleDateString('en-PH')}</td>
                              <td style={{ padding: '10px 16px', color: '#0F172A', fontWeight: 600 }}>₱{inv.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '10px 16px' }}><StatusBadge status={inv.status} /></td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>No billing history found for this client.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Card>
        )}
      </div>
    );
  }

  // --- List View ---
  const tableColumns = [
    { key: 'id', label: 'CLIENT ID', sortable: true },
    { key: 'name', label: 'CLIENT NAME', sortable: true, render: (row: Client) => (
      <span onClick={() => navigate(`/clients/${row.id}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
        {row.name}
      </span>
    )},
    { 
      key: 'status', 
      label: 'STATUS',
      render: (row: Client) => (
        <StatusBadge status={row.status} />
      )
    }
  ];

  const tableActions = [
    { label: 'View Details', icon: 'ti-eye', onClick: (row: Client) => navigate(`/clients/${row.id}`) },
    { label: 'Edit Record', icon: 'ti-pencil', onClick: (row: Client) => navigate(`/clients/${row.id}`) }
  ];

  const handleAddNew = () => {
    setFormData({
      name: '',
      contactPerson: '',
      address: '',
      rateType: 'Standard',
      billingSchedule: 'Monthly',
      status: 'Active'
    });
    setIsAddingNew(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Modal for ADD NEW CLIENT ONLY */}
      {isAddingNew && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <Card style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>NEW CLIENT</h2>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Create New Client</h3>
              </div>
              <button onClick={() => setIsAddingNew(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}>×</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleAddNewSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Client Name *</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Contact Person *</label>
                  <input required type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Address *</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Rate Type *</label>
                  <input required type="text" name="rateType" value={formData.rateType} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Billing Cycle</label>
                  <select name="billingSchedule" value={formData.billingSchedule} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <option value="Monthly">Monthly</option>
                    <option value="Semi-monthly">Semi-monthly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <Button variant="secondary" title="Cancel" type="button" onClick={() => setIsAddingNew(false)} />
                  <Button variant="primary" title="Create Client" type="submit" />
                </div>
              </form>
            </div>
          </Card>
        </div>,
        document.body
      )}

      {/* Data Table */}
      <TableContainer>
        <DataTable 
          title={user?.role === 'Coordinator' ? "Client Search" : "Client Accounts"}
          data={clients}
          columns={tableColumns}
          actions={tableActions}
          createButtons={user?.role === 'Accountant' ? [{ label: 'New Client', icon: 'ti-plus', onClick: handleAddNew, variant: 'primary' }] : undefined}
          rowKey="id"
          emptyMessage="No clients found matching criteria."
          searchPlaceholder="Search client name..."
          searchFields={['name']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' }
              ]
            },
            {
              key: 'billingSchedule',
              label: 'Billing Cycle',
              options: [
                { label: 'Monthly', value: 'Monthly' },
                { label: 'Semi-monthly', value: 'Semi-monthly' },
                { label: 'Weekly', value: 'Weekly' }
              ]
            }
          ]}
          columnToggle={true}
          densityToggle={true}
          exportable={false}
        />
      </TableContainer>
    </div>
  );
};

export default ClientManagement;
