import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [workTerms, setWorkTerms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/students/me/workterms').then(r => setWorkTerms(r.data)).finally(() => setLoading(false))
  }, [])

  const name = user?.user_metadata?.full_name || 'Student'

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name}</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your co-op status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickLink to="/student/guidelines" icon="📋" label="Guidelines & Deadline" desc="View your report deadline and download the template" />
        <QuickLink to="/student/submit" icon="📄" label="Submit Report" desc="Upload your term report PDF" />
        <QuickLink to="/student/guidelines" icon="📅" label="Work Terms" desc="See all your work terms below" />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Work Terms</h2>
        {loading ? (
          <Spinner />
        ) : workTerms.length === 0 ? (
          <EmptyState message="No work terms found. Check back after your application is accepted." />
        ) : (
          <div className="space-y-4">
            {workTerms.map(wt => (
              <WorkTermCard key={wt.id} wt={wt} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}

function WorkTermCard({ wt }) {
  const hasReport = (wt.term_reports || []).length > 0
  const job = (wt.job_assignments || [])[0]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{wt.term_label}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {wt.start_date} – {wt.end_date || 'Ongoing'}
          </p>
          {job && <p className="text-sm text-gray-600 mt-1">{job.company_name}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={wt.status} />
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${hasReport ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            Report: {hasReport ? 'Submitted' : 'Pending'}
          </span>
        </div>
      </div>
      {wt.report_deadline && (
        <p className="mt-3 text-xs text-gray-500">
          Report deadline: <span className="font-medium text-gray-700">{wt.report_deadline}</span>
        </p>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-600',
    flagged: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function QuickLink({ to, icon, label, desc }) {
  return (
    <Link to={to} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all block">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-semibold text-gray-900 mt-2">{label}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  )
}

function Spinner() {
  return <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}

function EmptyState({ message }) {
  return <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">{message}</div>
}
