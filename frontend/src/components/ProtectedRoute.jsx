import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
  const { session, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (allowedRole && role !== allowedRole) {
    const redirectMap = { student: '/student/dashboard', coordinator: '/coordinator/dashboard', supervisor: '/supervisor/dashboard' }
    return <Navigate to={redirectMap[role] || '/login'} replace />
  }

  return children
}
