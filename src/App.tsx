import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ToastContext";
import ToastBar from "./components/ToastBar";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
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
          <NotificationProvider>
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

              {/* ── Coordinator & Accountant ────────────────────── */}
              <Route
                path="/clients"
                element={
                  <ProtectedRoute allowedRoles={['Coordinator', 'Accountant']}>
                    <ClientManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/:id"
                element={
                  <ProtectedRoute allowedRoles={['Coordinator', 'Accountant']}>
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
              <Route
                path="/waybills/:id"
                element={
                  <ProtectedRoute allowedRoles={['Coordinator']}>
                    <Waybills />
                  </ProtectedRoute>
                }
              />

              {/* ── Accountant Only ───────────────────────────── */}
              <Route
                path="/rate-configuration"
                element={
                  <ProtectedRoute allowedRoles={['Accountant']}>
                    <RateConfiguration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rate-configuration/:id"
                element={
                  <ProtectedRoute allowedRoles={['Accountant']}>
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
                path="/invoicing-desk/:id"
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
              <Route
                path="/receipts"
                element={
                  <ProtectedRoute allowedRoles={['Accountant']}>
                    <Receipts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receipts/:id"
                element={
                  <ProtectedRoute allowedRoles={['Accountant']}>
                    <Receipts />
                  </ProtectedRoute>
                }
              />

              {/* ── Head Accountant Only ──────────────────────── */}
              <Route
                path="/invoice-review"
                element={
                  <ProtectedRoute allowedRoles={['Head Accountant']}>
                    <InvoiceReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoice-review/:id"
                element={
                  <ProtectedRoute allowedRoles={['Head Accountant']}>
                    <InvoiceReview />
                  </ProtectedRoute>
                }
              />

              {/* ── Shared Finance Roles ──────────────────────── */}
              <Route
                path="/accounts-receivable"
                element={
                  <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                    <AccountsReceivable />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts-receivable/:id"
                element={
                  <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                    <AccountsReceivable />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments/:id"
                element={
                  <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/:id"
                element={
                  <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-trail"
                element={
                  <ProtectedRoute allowedRoles={['Head Accountant', 'Finance Manager']}>
                    <AuditTrail />
                  </ProtectedRoute>
                }
              />

              {/* Fallbacks */}
              <Route path="/speedpay-validation" element={
                <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                  <SpeedPayValidation />
                </ProtectedRoute>
              } />
              <Route path="/speedpay-validation/:id" element={
                <ProtectedRoute allowedRoles={['Accountant', 'Head Accountant', 'Finance Manager']}>
                  <SpeedPayValidation />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
          </AuditProvider>
          </NotificationProvider>
        </AuthProvider>
  </AppDataProvider>
  </BrowserRouter>
  );
}

export default App;
