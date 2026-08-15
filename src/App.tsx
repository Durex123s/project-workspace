import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import ProtectedRoute from '@/routes/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/features/auth/LoginPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import GroupsListPage from '@/features/groups/GroupsListPage'
import GroupWorkspacePage from '@/features/groups/GroupWorkspacePage'
import TestsPage from '@/features/tests/TestsPage'
import DocumentsPage from '@/features/documents/DocumentsPage'
import ProfilePage from '@/features/profile/ProfilePage'
import AdminGroupsPage from '@/features/admin/AdminGroupsPage'
import TransmissionCalculatorPage from '@/features/calculators/TransmissionCalculatorPage'
import AdminValidationsPage from '@/features/validations/AdminValidationsPage'

// Remarque architecture : aucune route n'est dupliquée par groupe.
// /groups/:groupId dessert dynamiquement tous les groupes existants.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/groups" element={<GroupsListPage />} />
              <Route path="/groups/:groupId/*" element={<GroupWorkspacePage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin/groups" element={<AdminGroupsPage />} />
              <Route path="/admin/validations" element={<AdminValidationsPage />} />
              <Route path="/calculators" element={<TransmissionCalculatorPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
