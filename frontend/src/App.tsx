import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { PermissionGuard } from './components/guards/PermissionGuard';
import { AiSidebar } from './components/AiSidebar';
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

// Layout wrapper to inject sidebar
const MainLayout: React.FC = () => {
  return (
    <div className="app-container">
      <AiSidebar />
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
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
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
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
