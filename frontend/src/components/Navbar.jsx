import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const roleLinks = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard' },
    { to: '/student/guidelines', label: 'Guidelines' },
    { to: '/student/submit', label: 'Submit Report' },
  ],
  coordinator: [
    { to: '/coordinator/dashboard', label: 'Dashboard' },
    { to: '/coordinator/initial-review', label: 'Initial Review' },
    { to: '/coordinator/final-review', label: 'Final Review' },
    { to: '/coordinator/tracking', label: 'Tracking' },
  ],
  supervisor: [
    { to: '/supervisor/dashboard', label: 'Dashboard' },
  ],
}

export default function Navbar() {
  const { role, signOut } = useAuth()
  const navigate = useNavigate()
  const links = roleLinks[role] || []

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-blue-700 text-lg">TMU Co-op</span>
        <div className="flex gap-4">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
      >
        Sign Out
      </button>
    </nav>
  )
}
