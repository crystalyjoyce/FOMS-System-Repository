export interface DashboardSummary {
  totalDuplicateAlerts: number;
  pendingDuplicateReviews: number;
  exactMatchAlerts: number;
  urgentCollectionAccounts: number;
  recommendationsAwaitingValidation: number;
  lastUpdatedAt: string;
}

export interface AttentionAccount {
  priorityId: string;
  clientName: string;
  invoiceNumber: string;
  outstandingBalance: number;
  dueDate: string;
  daysOverdue: number;
  priorityLevel: string;
  recommendationBasis: string[];
  reviewStatus: string;
}

export interface ActivityLog {
  id: number;
  statusDot: 'success' | 'warning' | 'danger' | 'info';
  description: string;
  relatedRecord: string;
  timeAgo: string;
  userRole: string;
}

export interface TrendSnapshot {
  recordedAt: string;
  clientId: string;
  trendType: string;
  totalOutstanding: number;
  overdueInvoiceCount: number;
  collectedAmount: number;
  averageCollectionDays: number;
}
