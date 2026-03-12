import { useEffect, useState } from 'react'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

const PAGE_SIZE = 20

export default function InitialReview() {
  const [applicants, setApplicants] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)

  function load(p = page) {
    setLoading(true)
    api.get(`/coordinator/applicants?status=pending&page=${p}`)
      .then(r => { setApplicants(r.data.applicants); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  async function updateStatus(id, status) {
    setActionLoading(id + status)
    try {
      await api.patch(`/coordinator/applicants/${id}/status`, { status })
      setToast({ type: 'success', msg: status === 'provisionally_accepted' ? 'Student provisionally accepted. Login credentials sent.' : 'Applicant rejected.' })
      load(page)
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Action failed.' })
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Initial Review</h1>
        <p className="text-gray-500 mt-1">Review pending applications and make provisional decisions.</p>
      </div>

      {toast && (
        <div role="alert" className={`mb-4 px-4 py-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-3 underline text-xs">Dismiss</button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : applicants.length === 0 ? (
        <EmptyState message="No pending applicants. All applications have been reviewed." />
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Full Name', 'Student ID', 'Email', 'Applied', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applicants.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{a.student_id}</td>
                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(a.applied_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(a.id, 'provisionally_accepted')}
                          disabled={!!actionLoading}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                        >
                          {actionLoading === a.id + 'provisionally_accepted' ? '…' : 'Accept'}
                        </button>
                        <button
                          onClick={() => updateStatus(a.id, 'rejected')}
                          disabled={!!actionLoading}
                          className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium transition-colors"
                        >
                          {actionLoading === a.id + 'rejected' ? '…' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-400 text-center mt-2">{total} pending applicant{total !== 1 ? 's' : ''}</p>
        </>
      )}
    </Layout>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}

function EmptyState({ message }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
      <p className="text-4xl mb-3">✅</p>
      <p className="text-gray-500">{message}</p>
    </div>
  )
}
