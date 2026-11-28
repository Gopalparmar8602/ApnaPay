import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

// Customer Auth Pages
import LoginPage from './pages/customer/LoginPage';
import SignupPage from './pages/customer/SignupPage';
import VerifyOtpPage from './pages/customer/VerifyOtpPage';
import ForgotPasswordPage from './pages/customer/ForgotPasswordPage';
import VerifyResetOtpPage from './pages/customer/VerifyResetOtpPage';
import ResetPasswordPage from './pages/customer/ResetPasswordPage';

// Customer Portal Pages
import CustomerDashboardOverview from './pages/customer/CustomerDashboardOverview';
import CustomerBankAccountsPage from './pages/customer/CustomerBankAccountsPage';
import CustomerUpiPage from './pages/customer/CustomerUpiPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerWalletPage from './pages/customer/CustomerWalletPage';
import CustomerTransactionsPage from './pages/customer/CustomerTransactionsPage';
import CustomerLandPage from './pages/customer/CustomerLandPage';
import CustomerBillsPage from './pages/customer/CustomerBillsPage';
import CustomerServicesPage from './pages/customer/CustomerServicesPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Customer Modules (Manshi Additions)
import MoneyTransfers from './pages/transfers/MoneyTransfers';
import Payments from './pages/payments/Payments';
import UserKycCenter from './pages/customer/UserKycCenter';
import UserDisputeCenter from './pages/customer/UserDisputeCenter';
import RechargeManagement from './pages/RechargeManagement';
import CustomerRechargePage from './pages/customer/CustomerRechargePage';
import CustomerSipPage from './pages/customer/CustomerSipPage';
import SipManagement from './pages/SipManagement';
import QrManagement from './pages/QrManagement';
import Dashboard from './pages/Dashboard';

// Admin Auth & Management Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminVerifyOtpPage from './pages/admin/AdminVerifyOtpPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminVerifyResetOtpPage from './pages/admin/AdminVerifyResetOtpPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';
import AdminChangePasswordPage from './pages/admin/AdminChangePasswordPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminDigitalLandPage from './pages/admin/AdminDigitalLandPage';

// Enterprise 18-Module Admin Console (Manshi Addition)
import AdminPanel from './pages/admin/AdminPanel';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Global React Error Boundary to prevent blank white screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#071224',
          color: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#0B1D35',
            border: '1px solid #16365C',
            borderRadius: '14px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#00D5FF' }}>
              Application Notice
            </h2>
            <p style={{ fontSize: '14px', color: '#8BA2C1', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/app';
              }}
              style={{
                backgroundColor: '#00D5FF',
                color: '#071224',
                fontWeight: '600',
                fontSize: '14px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AdminAuthProvider>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ================= Customer Auth Routes ================= */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />

              {/* ================= Customer Portal Pages ================= */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <CustomerDashboardOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/services"
                element={
                  <ProtectedRoute>
                    <CustomerServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/banks"
                element={
                  <ProtectedRoute>
                    <CustomerBankAccountsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/wallet"
                element={
                  <ProtectedRoute>
                    <CustomerWalletPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/bills"
                element={
                  <ProtectedRoute>
                    <CustomerBillsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/transactions"
                element={
                  <ProtectedRoute>
                    <CustomerTransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/land"
                element={
                  <ProtectedRoute>
                    <CustomerLandPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/upi"
                element={
                  <ProtectedRoute>
                    <CustomerUpiPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/profile"
                element={
                  <ProtectedRoute>
                    <CustomerProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Manshi Customer Feature Routes Wrapped in DashboardLayout */}
              <Route
                path="/app/transfers"
                element={<Navigate to="/app/wallet" replace />}
              />
              <Route
                path="/app/payments"
                element={<Navigate to="/app/wallet" replace />}
              />
              <Route
                path="/app/kyc"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="KYC Verification" subtitle="RBI Compliant Identity & Document Verification">
                      <UserKycCenter />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/disputes"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Dispute & Refunds" subtitle="Track Payment Disputes, Evidence & Refund Inquiries">
                      <UserDisputeCenter />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/recharge"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Mobile Recharge" subtitle="Prepaid & Data Plans across Jio, Airtel, Vi & BSNL">
                      <CustomerRechargePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/sip"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Mutual Funds & SIP" subtitle="Top CRISP Picks • Start a SIP from ₹100">
                      <CustomerSipPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/qr"
                element={<Navigate to="/app/profile" replace />}
              />
              <Route
                path="/app/dashboard-v2"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ================= Admin Auth Routes ================= */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/verify-otp" element={<AdminVerifyOtpPage />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
              <Route path="/admin/verify-reset-otp" element={<AdminVerifyResetOtpPage />} />
              <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
              <Route
                path="/admin/change-password"
                element={
                  <AdminProtectedRoute>
                    <AdminChangePasswordPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <AdminProtectedRoute>
                    <AdminProfilePage />
                  </AdminProtectedRoute>
                }
              />

              {/* ================= Admin Dedicated Views ================= */}
              <Route
                path="/admin/overview"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboardPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/land"
                element={
                  <AdminProtectedRoute>
                    <AdminDigitalLandPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/digital-land"
                element={
                  <AdminProtectedRoute>
                    <AdminDigitalLandPage />
                  </AdminProtectedRoute>
                }
              />

              {/* ================= Enterprise 18-Module Admin Console ================= */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
