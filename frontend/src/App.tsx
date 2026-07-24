import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { PermissionGuard } from './components/guards/PermissionGuard';
import { useAuth } from './contexts/AuthContext';
import { usePermissions } from './contexts/PermissionContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DuplicateAlerts } from './pages/DuplicateAlerts';
import { CollectionPriorities } from './pages/CollectionPriorities';
import { CollectionRecommendations } from './pages/CollectionRecommendations';
import { ReviewHistory } from './pages/ReviewHistory';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Unauthorized } from './pages/Unauthorized';
import { AuditTrail } from './pages/AuditTrail';

import { Sidebar, GlobalHeader, ToastProvider, ToastBar } from './components';
import type { NavGroup } from './components/Sidebar';

// Speedex OneUI App Shell Layout

// Main Speedex OneUI App Shell Layout
const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build Speedex OneUI nav groups based on permissions
  const navGroups: NavGroup[] = [];

  // MAIN Group
  const mainItems = [];
  if (hasPermission('ai.dashboard.view')) {
    mainItems.push({
      label: 'Dashboard',
      icon: 'ti ti-layout-dashboard',
      active: location.pathname === '/ai/dashboard',
      onClick: () => navigate('/ai/dashboard'),
    });
  }
  if (mainItems.length > 0) {
    navGroups.push({ label: 'Main', items: mainItems });
  }

  // DUPLICATE DETECTION Group
  const duplicateItems = [];
  if (hasPermission('ai.duplicate.view') || hasPermission('ai.duplicate.review')) {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    duplicateItems.push({
      label: 'AI Duplicate Scan',
      icon: 'ti ti-scan',
      active: location.pathname === '/ai/duplicate-alerts' && (tab === 'scan' || !tab),
      onClick: () => navigate('/ai/duplicate-alerts?tab=scan'),
    });
    
    duplicateItems.push({
      label: 'Unique Documents',
      icon: 'ti ti-file-check',
      active: location.pathname === '/ai/duplicate-alerts' && tab === 'unique-docs',
      onClick: () => navigate('/ai/duplicate-alerts?tab=unique-docs'),
    });
    
    duplicateItems.push({
      label: 'Flagged Duplicates',
      icon: 'ti ti-alert-triangle',
      active: location.pathname === '/ai/duplicate-alerts' && tab === 'flagged-dups',
      onClick: () => navigate('/ai/duplicate-alerts?tab=flagged-dups'),
    });

    duplicateItems.push({
      label: 'Review History',
      icon: 'ti ti-history',
      active: location.pathname === '/ai/duplicate-alerts' && tab === 'history',
      onClick: () => navigate('/ai/duplicate-alerts?tab=history'),
    });
  }
  if (duplicateItems.length > 0) {
    navGroups.push({ label: 'Duplicate Detection', items: duplicateItems });
  }

  // COLLECTION INTELLIGENCE Group
  const collectionItems = [];
  if (hasPermission('ai.collection.view')) {
    collectionItems.push({
      label: 'Collection Priorities',
      icon: 'ti ti-trending-up',
      active: location.pathname === '/ai/collection-priorities' || location.pathname === '/ai/collection-recommendations',
      onClick: () => navigate('/ai/collection-priorities'),
    });
  }
  if (collectionItems.length > 0) {
    navGroups.push({ label: 'Collection Intelligence', items: collectionItems });
  }

  // ANALYTICS & CONTROL Group
  const analyticsItems = [];
  if (hasPermission('ai.reports.view')) {
    analyticsItems.push({
      label: 'Reports',
      icon: 'ti ti-file-text',
      active: location.pathname === '/ai/reports',
      onClick: () => navigate('/ai/reports'),
    });
  }
  if (hasPermission('ai.audit.view') || hasPermission('ai.audit.view_limited')) {
    analyticsItems.push({
      label: 'Review History',
      icon: 'ti ti-history',
      active: location.pathname === '/ai/review-history',
      onClick: () => navigate('/ai/review-history'),
    });
    analyticsItems.push({
      label: 'Audit Trail',
      icon: 'ti ti-shield',
      active: location.pathname === '/ai/audit-trail',
      onClick: () => navigate('/ai/audit-trail'),
    });
  }
  if (analyticsItems.length > 0) {
    navGroups.push({ label: 'Analytics & Control', items: analyticsItems });
  }

  // ACCOUNT Group
  navGroups.push({
    label: 'Account',
    items: [
      {
        label: 'Profile',
        icon: 'ti ti-user',
        active: location.pathname === '/ai/profile',
        onClick: () => navigate('/ai/profile'),
      },
    ],
  });

  const currentInfo = user
    ? {
        name: user.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        initials: user.username.split('_').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2) || 'US'
      }
    : { name: 'User', initials: 'U' };

  // Generate dynamic breadcrumbs for GlobalHeader
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length <= 1) return undefined;
    return paths.slice(1).map((p, i, arr) => ({
      label: p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      href: i < arr.length - 1 ? '/' + paths.slice(0, i + 2).join('/') : undefined,
    }));
  };

  const pageTitle = (() => {
    const seg = location.pathname.split('/').pop() ?? '';
    return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Dashboard';
  })();

  return (
    <div className="app-layout">
      <Sidebar
        logoUrl="/logo.png"
        logoText="SPEEDEX"
        navGroups={navGroups}
        profile={{
          name: currentInfo.name,
          role: user?.role ?? '',
          avatarInitials: currentInfo.initials,
        }}
        onLogout={handleLogout}
      />

      <div className="main-area">
        <GlobalHeader
          title={pageTitle}
          breadcrumbs={getBreadcrumbs()}
          profile={{
            name: currentInfo.name,
            role: user?.role ?? '',
            avatarInitials: currentInfo.initials,
          }}
          onLogout={handleLogout}
          onProfile={() => navigate('/ai/profile')}
        />

        <main>
          <Routes>
            {/* Dashboard Guard */}
            <Route path="dashboard" element={
              <PermissionGuard permission="ai.dashboard.view" fallbackRedirect="/unauthorized">
                <Dashboard />
              </PermissionGuard>
            } />

            {/* Duplicate detection Guard */}
            <Route path="duplicate-alerts" element={
              <PermissionGuard permission="ai.duplicate.view" fallbackRedirect="/unauthorized">
                <DuplicateAlerts />
              </PermissionGuard>
            } />



            {/* Collection Intelligence Guards */}
            <Route path="collection-priorities" element={
              <PermissionGuard permission="ai.collection.view" fallbackRedirect="/unauthorized">
                <CollectionPriorities />
              </PermissionGuard>
            } />

            <Route path="collection-recommendations" element={
              <PermissionGuard permission="ai.collection.view" fallbackRedirect="/unauthorized">
                <CollectionRecommendations />
              </PermissionGuard>
            } />

            {/* Analytics & Control Guards */}
            <Route path="reports" element={
              <PermissionGuard permission="ai.reports.view" fallbackRedirect="/unauthorized">
                <Reports />
              </PermissionGuard>
            } />

            <Route path="review-history" element={
              <PermissionGuard permission={["ai.audit.view", "ai.audit.view_limited"]} fallbackRedirect="/unauthorized">
                <ReviewHistory />
              </PermissionGuard>
            } />

            <Route path="audit-trail" element={
              <PermissionGuard permission={["ai.audit.view", "ai.audit.view_limited"]} fallbackRedirect="/unauthorized">
                <AuditTrail />
              </PermissionGuard>
            } />

            <Route path="profile" element={<Profile />} />
          </Routes>
        </main>

        <ToastBar />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Area */}
              <Route path="/ai/*" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              } />

              {/* Root Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
