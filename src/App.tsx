/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './pages/ClientDashboard';
import ClientReportsPage from './pages/ClientReportsPage';
import AdminDashboard from './pages/AdminDashboard';
import FinancialReportsPage from './pages/FinancialReportsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Client Routes */}
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="reports" element={<ClientReportsPage />} />

            {/* Admin Routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/reports" element={<FinancialReportsPage />} />
            <Route path="admin/clients" element={<AdminDashboard />} />
            <Route path="admin/withdrawals" element={<AdminDashboard />} />
            <Route path="admin/upload" element={<UploadPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
