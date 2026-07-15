import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ToastContext";
import ToastBar from "./components/ToastBar";
import { AuthProvider } from "./context/AuthContext";
import { AuditProvider } from "./context/AuditContext";
import { AppDataProvider } from "./context/AppDataContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";

// ── Universal Pages ──────────────────────────────────────────────
import { LoginPage } from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";

// ── Coordinator Pages ────────────────────────────────────────────
import ClientManagement from "./pages/ClientManagement";
import Waybills from "./pages/Waybills";

// ── Accountant Pages ─────────────────────────────────────────────
import RateConfiguration from "./pages/RateConfiguration";
import InvoicingDesk from "./pages/InvoicingDesk";
import InvoiceCreation from "./pages/InvoiceCreation";

// ── Head Accountant Pages ────────────────────────────────────────
import InvoiceReview from "./pages/InvoiceReview";

// ── Asst. Finance Manager Pages ──────────────────────────────────
import FinanceMaster from "./pages/FinanceMaster";

// ── Finance Manager / Shared Pages ──────────────────────────────
import WaybillLogs from "./pages/WaybillLogs";
import InvoiceArchives from "./pages/InvoiceArchives";
import AccountsReceivable from "./pages/AccountsReceivable";
import Payments from "./pages/Payments";
import Receipts from "./pages/Receipts";
import Reports from "./pages/Reports";
import AuditTrail from "./pages/AuditTrail";

// ── SpeedPay (Public + Finance Validation) ───────────────────────
import SpeedPay from "./pages/SpeedPay";
import SpeedPayValidation from "./pages/SpeedPayValidation";

function App() {
  return (
    <BrowserRouter>
      <AppDataProvider>
        <AuthProvider>
          <AuditProvider>
            <ToastProvider>
              <ToastBar />
              <Routes>
              {/* ── Public Routes ───────────────────────────────── */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/speedpay" element={<SpeedPay />} />

            {/* ── Protected Routes (Main Layout) ──────────────── */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Universal */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* ── Coordinator ───────────────────────────────── */}
              <Route
                path="/clients"
                element={
                  <ProtectedRoute allowedRoles={['Coordinator', 'Finance Manager', 'Assistant of Finance Manager', 'Accountant']}>
                    <ClientManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/waybills"
                element={
                  <ProtectedRoute allowedRoles={['Coordinator']}>
                    <Waybills />
                  </ProtectedRoute>
                }
              />

              {/* ── Accountant ────────────────────────────────── */}
              <Route
                path="/rate-configuration"
                element={
                  <ProtectedRoute allowedRoles={['Accountant', 'Finance Manager', 'Assistant of Finance Manager']}>
                    <RateConfiguration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoicing-desk"
                element={
                  <ProtectedRoute allowedRoles={['Accountant']}>
                    <InvoicingDesk />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoice-create"
                element={
                  <ProtectedRoute allowedRoles={['Accountant']}>
                    <InvoiceCreation />
                  </ProtectedRoute>
                }
              />

              {/* ── Head Accountant ───────────────────────────── */}
              <Route
                path="/invoice-review"
                element={
                  <ProtectedRoute allowedRoles={['Head Accountant']}>
                    <InvoiceReview />
                  </ProtectedRoute>
                }
              />

              {/* ── Assistant of Finance Manager ──────────────── */}
              <Route
                path="/finance-master"
                element={
                  <ProtectedRoute allowedRoles={['Assistant of Finance Manager']}>
                    <FinanceMaster />
                  </ProtectedRoute>
                }
              />

              {/* ── Finance Manager Read-Only Overview ───────── */}
              <Route
                path="/waybill-logs"
                element={
                  <ProtectedRoute allowedRoles={['Finance Manager']}>
                    <WaybillLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute allowedRoles={['Finance Manager']}>
                    <InvoiceArchives />
                  </ProtectedRoute>
                }
              />

              {/* ── Shared: FM + Asst. FM ─────────────────────── */}
              <Route
                path="/accounts-receivable"
                element={
                  <ProtectedRoute allowedRoles={['Finance Manager', 'Assistant of Finance Manager']}>
                    <AccountsReceivable />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['Finance Manager', 'Assistant of Finance Manager', 'Accountant']}>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receipts"
                element={
                  <ProtectedRoute allowedRoles={['Finance Manager']}>
                    <Receipts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['Finance Manager', 'Assistant of Finance Manager']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* ── Finance Manager Only ──────────────────────── */}
              <Route
                path="/audit-trail"
                element={
                  <ProtectedRoute allowedRoles={['Finance Manager']}>
                    <AuditTrail />
                  </ProtectedRoute>
                }
              />

              {/* Fallbacks */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuditProvider>
    </AuthProvider>
  </AppDataProvider>
  </BrowserRouter>
  );
}

export default App;
