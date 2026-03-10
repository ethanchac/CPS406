import { useEffect, useState } from 'react'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

const PAGE_SIZE = 20

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

export default function InitialReview() {
  const [applicants, setApplicants] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(new Set())

  function load(p = page) {
    setLoading(true)
    setSelected(new Set())
    api.get(`/coordinator/applicants?status=pending&page=${p}`)
      .then(r => { setApplicants(r.data.applicants); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === applicants.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(applicants.map(a => a.id)))
    }
  }

  async function updateStatus(id, status) {
    setActionLoading(id + status)
    try {
      await api.patch(`/coordinator/applicants/${id}/status`, { status })
      showToast('success', status === 'provisionally_accepted'
        ? 'Student provisionally accepted. Login credentials sent.'
        : 'Applicant rejected.')
      load(page)
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Action failed.')
    } finally {
      setActionLoading(null)
    }
  }

  async function bulkAction(status) {
    if (selected.size === 0) return
    setBulkLoading(true)
    let succeeded = 0
    for (const id of selected) {
      try {
        await api.patch(`/coordinator/applicants/${id}/status`, { status })
        succeeded++
      } catch {}
    }
    showToast('success', `${succeeded} of ${selected.size} applicant${selected.size !== 1 ? 's' : ''} ${status === 'provisionally_accepted' ? 'accepted' : 'rejected'}.`)
    setBulkLoading(false)
    load(page)
  }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const allSelected = applicants.length > 0 && selected.size === applicants.length
  const someSelected = selected.size > 0

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Initial Review</h1>
        <p className="text-gray-500 mt-1">Review pending applications and make provisional decisions.</p>
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
        <EmptyState message="No pending applicants. All applications have been reviewed." />
      ) : (
        <>
          {someSelected && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">{selected.size} applicant{selected.size !== 1 ? 's' : ''} selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => bulkAction('provisionally_accepted')}
                  disabled={bulkLoading}
                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {bulkLoading ? '…' : 'Accept All'}
                </button>
                <button
                  onClick={() => bulkAction('rejected')}
                  disabled={bulkLoading}
                  className="border border-red-300 text-red-600 bg-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium transition-colors"
                >
                  {bulkLoading ? '…' : 'Reject All'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {['Full Name', 'Student ID', 'Email', 'Applied', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applicants.map(a => (
                    <tr key={a.id} className={`hover:bg-gray-50 ${selected.has(a.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(a.id)}
                          onChange={() => toggleSelect(a.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
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
                            onClick={() => updateStatus(a.id, 'provisionally_accepted')}
                            disabled={!!actionLoading || bulkLoading}
                            className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                          >
                            {actionLoading === a.id + 'provisionally_accepted' ? '…' : 'Accept'}
                          </button>
                          <button
                            onClick={() => updateStatus(a.id, 'rejected')}
                            disabled={!!actionLoading || bulkLoading}
                            className="border border-red-300 text-red-600 bg-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium transition-colors"
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
