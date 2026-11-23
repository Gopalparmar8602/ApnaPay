import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

// Public Pages
import LandingPage from './pages/public/LandingPage';

// Customer Pages
import LoginPage from './pages/customer/LoginPage';
import SignupPage from './pages/customer/SignupPage';
import VerifyOtpPage from './pages/customer/VerifyOtpPage';
import ForgotPasswordPage from './pages/customer/ForgotPasswordPage';
import VerifyResetOtpPage from './pages/customer/VerifyResetOtpPage';
import ResetPasswordPage from './pages/customer/ResetPasswordPage';
import CustomerDashboardOverview from './pages/customer/CustomerDashboardOverview';
import CustomerBankAccountsPage from './pages/customer/CustomerBankAccountsPage';
import CustomerUpiPage from './pages/customer/CustomerUpiPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerWalletPage from './pages/customer/CustomerWalletPage';
import CustomerTransactionsPage from './pages/customer/CustomerTransactionsPage';
import CustomerLandPage from './pages/customer/CustomerLandPage';
import CustomerBillsPage from './pages/customer/CustomerBillsPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminVerifyOtpPage from './pages/admin/AdminVerifyOtpPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminVerifyResetOtpPage from './pages/admin/AdminVerifyResetOtpPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';
import AdminChangePasswordPage from './pages/admin/AdminChangePasswordPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminDigitalLandPage from './pages/admin/AdminDigitalLandPage';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* ================= Customer Routes ================= */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />

            {/* Customer Portal Pages */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <CustomerDashboardOverview />
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

            {/* ================= Admin Routes ================= */}
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
            <Route
              path="/admin"
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
