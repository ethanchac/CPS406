import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Apply from './pages/Apply'

import StudentDashboard from './pages/student/Dashboard'
import Guidelines from './pages/student/Guidelines'
import ReportSubmission from './pages/student/ReportSubmission'

import CoordinatorDashboard from './pages/coordinator/Dashboard'
import InitialReview from './pages/coordinator/InitialReview'
import FinalReview from './pages/coordinator/FinalReview'
import Tracking from './pages/coordinator/Tracking'
import StudentProfile from './pages/coordinator/StudentProfile'

import SupervisorRegister from './pages/supervisor/Register'
import SupervisorDashboard from './pages/supervisor/Dashboard'
import Evaluation from './pages/supervisor/Evaluation'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/supervisor/register" element={<SupervisorRegister />} />

          <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/guidelines" element={<ProtectedRoute allowedRole="student"><Guidelines /></ProtectedRoute>} />
          <Route path="/student/submit" element={<ProtectedRoute allowedRole="student"><ReportSubmission /></ProtectedRoute>} />

          <Route path="/coordinator/dashboard" element={<ProtectedRoute allowedRole="coordinator"><CoordinatorDashboard /></ProtectedRoute>} />
          <Route path="/coordinator/initial-review" element={<ProtectedRoute allowedRole="coordinator"><InitialReview /></ProtectedRoute>} />
          <Route path="/coordinator/final-review" element={<ProtectedRoute allowedRole="coordinator"><FinalReview /></ProtectedRoute>} />
          <Route path="/coordinator/tracking" element={<ProtectedRoute allowedRole="coordinator"><Tracking /></ProtectedRoute>} />
          <Route path="/coordinator/student/:id" element={<ProtectedRoute allowedRole="coordinator"><StudentProfile /></ProtectedRoute>} />

          <Route path="/supervisor/dashboard" element={<ProtectedRoute allowedRole="supervisor"><SupervisorDashboard /></ProtectedRoute>} />
          <Route path="/supervisor/evaluate/:assignmentId" element={<ProtectedRoute allowedRole="supervisor"><Evaluation /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
