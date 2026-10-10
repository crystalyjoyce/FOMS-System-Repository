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
      const [summaryRes, attentionRes, activityRes, trendsRes] = await Promise.allSettled([
        fetchDashboardSummary(),
        fetchAttentionAccounts(),
        fetchRecentActivity(),
        fetchTrends()
      ]);

      setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value : null);
      // fetchAttentionAccounts wraps in { items: [...] }
      setAttentionAccounts(
        attentionRes.status === 'fulfilled'
          ? ((attentionRes.value as any)?.items ?? attentionRes.value ?? [])
          : []
      );
      setActivities(activityRes.status === 'fulfilled' ? activityRes.value : []);
      setTrends(trendsRes.status === 'fulfilled' ? trendsRes.value : []);

      // Surface an error only if all endpoints failed
      const allFailed = [summaryRes, attentionRes, activityRes, trendsRes].every(r => r.status === 'rejected');
      if (allFailed) {
        setError('Could not load dashboard data. Ensure the AI service is running.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard data.');
      setSummary(null);
      setAttentionAccounts([]);
      setActivities([]);
      setTrends([]);
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
