import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card } from './Card';

const deliveryData = [
  { name: 'Mon', Deliveries: 45, Returned: 4, Failed: 2 },
  { name: 'Tue', Deliveries: 62, Returned: 6, Failed: 1 },
  { name: 'Wed', Deliveries: 38, Returned: 3, Failed: 4 },
  { name: 'Thu', Deliveries: 78, Returned: 7, Failed: 3 },
  { name: 'Fri', Deliveries: 68, Returned: 5, Failed: 2 },
  { name: 'Sat', Deliveries: 32, Returned: 1, Failed: 1 },
  { name: 'Sun', Deliveries: 15, Returned: 0, Failed: 0 },
];

const orderStatusData = [
  { name: 'Delivered', value: 400, color: '#00A99D' },
  { name: 'Failed', value: 30, color: '#DC2626' },
  { name: 'In Transit', value: 300, color: '#0284C7' },
  { name: 'Pending', value: 150, color: '#D97706' },
  { name: 'Returned', value: 50, color: '#64748B' },
];

export const DeliveryPerformanceChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState('7D');

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-chart-line" style={{ color: '#00A99D', fontSize: '1.2rem' }}></i>
          Delivery Performance
        </h3>
        <div style={{ display: 'flex', background: '#F8FAFC', borderRadius: '24px', padding: '4px', gap: '4px' }}>
          {['Today', '7D', '30D', 'Custom'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                border: 'none',
                background: activeTab === tab ? '#FFFFFF' : 'transparent',
                color: activeTab === tab ? '#0EA5E9' : '#64748B',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={deliveryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
            <Bar dataKey="Deliveries" fill="#00A99D" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Returned" fill="#64748B" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const OrderStatusChart: React.FC = () => {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-box" style={{ color: '#00A99D', fontSize: '1.2rem' }}></i>
          Order Status Breakdown
        </h3>
        <span style={{ background: '#FFF7ED', color: '#EA580C', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
          ALL TIME
        </span>
      </div>
      <div style={{ width: '100%', height: 280, display: 'flex', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={orderStatusData}
              cx="40%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {orderStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 600 }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', color: '#475569' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
