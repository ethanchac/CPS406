import { useEffect, useState } from 'react'
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Applicants" value={data.totalApplicants} color="blue" />
            <StatCard label="Pending" value={data.pending} color="yellow" />
            <StatCard label="Accepted" value={data.accepted} color="green" />
            <StatCard label="Rejected" value={data.rejected} color="red" />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Application Activity (Last 30 Days)</h2>
            {data.recentActivity.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="newApplications" name="New Applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-2">Provisional Status</h3>
              <p className="text-3xl font-bold text-indigo-600">{data.provisionallyAccepted}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting final review</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-2">Finally Accepted</h3>
              <p className="text-3xl font-bold text-green-600">{data.finallyAccepted}</p>
              <p className="text-sm text-gray-500 mt-1">On the official roster</p>
            </div>
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

function StatCard({ label, value, color }) {
  const colors = { blue: 'text-blue-600', green: 'text-green-600', yellow: 'text-yellow-600', red: 'text-red-600' }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]}`}>
        {value === 0 && value !== undefined ? <span className="text-gray-300 text-xl">No data</span> : value ?? <span className="text-gray-300 text-xl">No data</span>}
      </p>
    </div>
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
