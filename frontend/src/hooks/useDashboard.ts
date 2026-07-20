import { useState, useEffect, useCallback } from 'react';
import { DashboardSummary, AttentionAccount, ActivityLog, TrendSnapshot } from '../types/types';
import { 
  fetchDashboardSummary, fetchAttentionAccounts, 
  fetchRecentActivity, fetchTrends 
} from '../services/dashboardService';

export function useDashboardData() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attentionAccounts, setAttentionAccounts] = useState<AttentionAccount[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [trends, setTrends] = useState<TrendSnapshot[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, attentionRes, activityRes, trendsRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchAttentionAccounts(),
        fetchRecentActivity(),
        fetchTrends()
      ]);
      
      setSummary(summaryRes);
      setAttentionAccounts(attentionRes.items);
      setActivities(activityRes);
      setTrends(trendsRes);
    } catch (e: any) {
      setError(e.message || "Unable to connect to the financial intelligence backend service. The server may be offline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    summary,
    attentionAccounts,
    activities,
    trends,
    loading,
    error,
    refresh: loadData
  };
}
