import { DashboardSummary, AttentionAccount, ActivityLog, TrendSnapshot } from '../types/types';

const getHeaders = () => {
  const token = localStorage.getItem("foms_ai_token");
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch('/api/ai/dashboard/summary', {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard summary data");
  return res.json();
}

export async function fetchAttentionAccounts(): Promise<{ items: AttentionAccount[] }> {
  const res = await fetch('/api/ai/dashboard/attention-accounts', {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch collection attention accounts");
  return res.json();
}

export async function fetchRecentActivity(): Promise<ActivityLog[]> {
  const res = await fetch('/api/ai/dashboard/recent-activity', {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch recent activity logs");
  return res.json();
}

export async function fetchTrends(): Promise<TrendSnapshot[]> {
  const res = await fetch('/api/ai/dashboard/trends', {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch finance trends snapshots");
  return res.json();
}
