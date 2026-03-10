import { useEffect, useState } from 'react'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

export default function FinalReview() {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  function load() {
    setLoading(true)
    api.get('/coordinator/applicants?status=provisionally_accepted&page=1')
      .then(r => setApplicants(r.data.applicants))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function confirmAction() {
    if (!confirm) return
    setActionLoading(true)
    try {
      await api.patch(`/coordinator/applicants/${confirm.id}/status`, { status: confirm.status })
      showToast('success', confirm.status === 'finally_accepted'
        ? `${confirm.name} has been finally accepted and added to the roster.`
        : `${confirm.name} has been finally rejected.`)
      setConfirm(null)
      load()
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Action failed.')
      setConfirm(null)
    } finally {
      setActionLoading(false)
    }
  }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Final Review</h1>
        <p className="text-gray-500 mt-1">Finalize provisional decisions. This action cannot be undone.</p>
      </div>

      {toast && (
        <div role="alert" className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-3 underline text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : applicants.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-amber-800 font-medium">⚠️ Final decisions are permanent and cannot be reversed.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Full Name', 'Student ID', 'Email', 'Applied', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applicants.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.full_name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{a.student_id}</td>
                      <td className="px-4 py-3 text-gray-600">{a.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 text-xs">{daysAgo(a.applied_at)}</span>
                        <span className="text-gray-400 text-xs block">{new Date(a.applied_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirm({ id: a.id, name: a.full_name, status: 'finally_accepted' })}
                            className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium transition-colors"
                          >
                            Finally Accept
                          </button>
                          <button
                            onClick={() => setConfirm({ id: a.id, name: a.full_name, status: 'finally_rejected' })}
                            className="border border-red-300 text-red-600 bg-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium transition-colors"
                          >
                            Finally Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center mt-2">{applicants.length} awaiting final decision</p>
        </>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirm Final Decision</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 font-medium">⚠️ This action cannot be undone.</p>
            </div>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to <strong>{confirm.status === 'finally_accepted' ? 'finally accept' : 'finally reject'}</strong> <strong>{confirm.name}</strong>?
              {confirm.status === 'finally_accepted'
                ? ' They will be added to the official co-op roster.'
                : ' They will be permanently removed from the program.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmAction}
                disabled={actionLoading}
                className={`flex-1 text-white py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors ${confirm.status === 'finally_accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {actionLoading ? 'Processing…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}

function EmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
      <p className="text-4xl mb-3">✅</p>
      <p className="text-gray-500">No students awaiting final review.</p>
    </div>
  )
}
