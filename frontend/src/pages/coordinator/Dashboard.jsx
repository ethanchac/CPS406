import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

export default function CoordinatorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reminderResult, setReminderResult] = useState(null)
  const [sending, setSending] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api.get('/coordinator/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  async function sendReminders() {
    setSending(true)
    try {
      const res = await api.post('/coordinator/reminders')
      setReminderResult(res.data)
      setShowModal(true)
    } catch {
      setReminderResult({ error: 'Failed to send reminders.' })
      setShowModal(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
          <p className="text-gray-500 mt-1">Co-op program overview</p>
        </div>
        <button
          onClick={sendReminders}
          disabled={sending}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm"
        >
          {sending ? 'Sending…' : '📧 Send Reminders'}
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : !data ? (
        <p className="text-gray-500">No data available.</p>
      ) : (
        <>
          {/* Top metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total Applicants" value={data.totalApplicants} color="blue" icon="📋" />
            <StatCard label="Enrolled Students" value={data.enrolled} color="green" icon="🎓" />
            <StatCard label="Pending Review" value={data.pending} color="yellow" icon="⏳" link="/coordinator/initial-review" />
            <StatCard label="Awaiting Final" value={data.provisionallyAccepted} color="indigo" icon="🔍" link="/coordinator/final-review" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Reports Submitted" value={data.reportsSubmitted} color="green" icon="📄" />
            <StatCard label="Missing Reports" value={data.missingReports} color="red" icon="⚠️" link="/coordinator/tracking" alert={data.missingReports > 0} />
            <StatCard label="Evals Submitted" value={data.evaluationsSubmitted} color="green" icon="✅" />
            <StatCard label="Flagged Students" value={data.flaggedStudents} color="red" icon="🚩" alert={data.flaggedStudents > 0} />
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MiniStat label="Finally Accepted" value={data.finallyAccepted} color="green" />
            <MiniStat label="Provisionally Accepted" value={data.provisionallyAccepted} color="indigo" />
            <MiniStat label="Rejected" value={data.rejected} color="red" />
            <MiniStat label="Finally Rejected" value={data.finallyRejected} color="gray" />
          </div>

          {/* Activity chart + Recent applicants */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">Application Activity (Last 30 Days)</h2>
              {data.recentActivity.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No activity</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={d => `Date: ${d}`} />
                    <Bar dataKey="newApplications" name="Applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">Recent Applicants</h2>
                <Link to="/coordinator/initial-review" className="text-xs text-blue-600 hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {(data.recentApplicants || []).map(a => (
                  <div key={a.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.full_name}</p>
                      <p className="text-xs text-gray-400">{new Date(a.applied_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
                {(!data.recentApplicants || data.recentApplicants.length === 0) && (
                  <p className="text-sm text-gray-400">No recent applicants</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              to="/coordinator/initial-review"
              icon="📥"
              title="Initial Review"
              desc={`${data.pending} application${data.pending !== 1 ? 's' : ''} pending review`}
              urgent={data.pending > 0}
            />
            <ActionCard
              to="/coordinator/final-review"
              icon="🎯"
              title="Final Review"
              desc={`${data.provisionallyAccepted} awaiting final decision`}
              urgent={data.provisionallyAccepted > 0}
            />
            <ActionCard
              to="/coordinator/tracking"
              icon="📊"
              title="Reporting & Tracking"
              desc={`${data.missingReports} overdue report${data.missingReports !== 1 ? 's' : ''} · ${data.missingEvaluations} missing eval${data.missingEvaluations !== 1 ? 's' : ''}`}
              urgent={data.missingReports > 0}
            />
          </div>
        </>
      )}

      {showModal && reminderResult && (
        <Modal onClose={() => setShowModal(false)}>
          {reminderResult.error ? (
            <p className="text-red-600">{reminderResult.error}</p>
          ) : reminderResult.message ? (
            <p className="text-gray-700">{reminderResult.message}</p>
          ) : (
            <div>
              <p className="font-semibold text-gray-900 mb-2">Reminders Sent: {reminderResult.emailsSent}</p>
              {reminderResult.recipients?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Sent to:</p>
                  <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
                    {reminderResult.recipients.map(r => <li key={r}>• {r}</li>)}
                  </ul>
                </div>
              )}
              {reminderResult.skipped?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Skipped:</p>
                  <ul className="text-sm text-gray-500 mt-1 space-y-0.5">
                    {reminderResult.skipped.map(r => (
                      <li key={r}>• {r} — {reminderResult.skippedReasons?.[r]}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </Layout>
  )
}

function StatCard({ label, value, color, icon, link, alert }) {
  const colors = {
    blue: 'text-blue-600', green: 'text-green-600', yellow: 'text-yellow-600',
    red: 'text-red-600', indigo: 'text-indigo-600', gray: 'text-gray-500'
  }
  const inner = (
    <div className={`bg-white border rounded-xl p-4 shadow-sm h-full ${alert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value ?? 0}</p>
    </div>
  )
  return link ? <Link to={link} className="block hover:opacity-90 transition-opacity">{inner}</Link> : inner
}

function MiniStat({ label, value, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  }
  return (
    <div className={`border rounded-lg px-4 py-3 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value ?? 0}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    provisionally_accepted: 'bg-indigo-100 text-indigo-700',
    finally_accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    finally_rejected: 'bg-gray-100 text-gray-600',
  }
  const labels = {
    pending: 'Pending',
    provisionally_accepted: 'Provisional',
    finally_accepted: 'Accepted',
    rejected: 'Rejected',
    finally_rejected: 'Final Reject',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  )
}

function ActionCard({ to, icon, title, desc, urgent }) {
  return (
    <Link
      to={to}
      className={`block bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${urgent ? 'border-amber-200 hover:border-amber-300' : 'border-gray-200 hover:border-blue-300'}`}
    >
      <span className="text-2xl">{icon}</span>
      <h3 className="font-semibold text-gray-900 mt-2">{title}</h3>
      <p className={`text-sm mt-1 ${urgent ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>{desc}</p>
    </Link>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Reminder Results</h2>
        {children}
        <button onClick={onClose} className="mt-5 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm">Close</button>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}
