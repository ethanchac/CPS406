import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

export default function StudentProfile() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [flagModal, setFlagModal] = useState(null)
  const [flagForm, setFlagForm] = useState({ reason: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  function load() {
    setLoading(true)
    api.get(`/coordinator/students/${id}`).then(r => setStudent(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function submitFlag(e) {
    e.preventDefault()
    if (!flagForm.reason) return
    setSubmitting(true)
    try {
      await api.post(`/coordinator/students/${id}/flags`, {
        jobAssignmentId: flagModal.assignmentId,
        reason: flagForm.reason,
        notes: flagForm.notes,
      })
      setToast({ type: 'success', msg: 'Flag created. Student marked as requiring a meeting.' })
      setFlagModal(null)
      setFlagForm({ reason: '', notes: '' })
      load()
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to flag.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><Spinner /></Layout>
  if (!student) return <Layout><p className="text-gray-500">Student not found.</p></Layout>

  const hasFlag = (student.work_terms || []).some(wt =>
    (wt.job_assignments || []).some(j => (j.exception_flags || []).length > 0)
  )

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
          <p className="text-gray-500 mt-1">Student #{student.student_number}</p>
        </div>
        {hasFlag && (
          <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-red-200">
            ⚠️ Requires Meeting
          </span>
        )}
      </div>

      {toast && (
        <div role="alert" className={`mb-4 px-4 py-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-3 underline text-xs">Dismiss</button>
        </div>
      )}

      <div className="space-y-5">
        {(student.work_terms || []).map(wt => (
          <div key={wt.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{wt.term_label}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${wt.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {wt.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
              <InfoItem label="Start" value={wt.start_date} />
              <InfoItem label="End" value={wt.end_date || 'Ongoing'} />
              <InfoItem label="Report Deadline" value={wt.report_deadline || 'Pending'} />
              <InfoItem label="Report" value={(wt.term_reports || []).length > 0 ? '✅ Submitted' : '⏳ Not submitted'} />
            </div>

            {(wt.job_assignments || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Job Assignments</h3>
                {wt.job_assignments.map(j => {
                  const flag = (j.exception_flags || [])[0]
                  return (
                    <div key={j.id} className={`border rounded-lg p-3 mb-2 ${flag ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{j.company_name}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">Status: {j.status}</p>
                          {flag && (
                            <p className="text-xs text-red-600 mt-1">
                              Flagged: {flag.reason.replace(/_/g, ' ')} — {flag.notes || 'No notes'}
                            </p>
                          )}
                        </div>
                        {!flag && (
                          <button
                            onClick={() => setFlagModal({ assignmentId: j.id, company: j.company_name })}
                            className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium"
                          >
                            Flag Issue
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {flagModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Flag Issue</h2>
            <p className="text-sm text-gray-500 mb-5">Flagging assignment at <strong>{flagModal.company}</strong></p>
            <form onSubmit={submitFlag}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={flagForm.reason}
                  onChange={e => setFlagForm(f => ({ ...f, reason: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason…</option>
                  <option value="fired_terminated">Fired / Terminated</option>
                  <option value="rejected">Rejected from Assignment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={flagForm.notes}
                  onChange={e => setFlagForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Attendance issues, performance concerns…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting || !flagForm.reason} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit Flag'}
                </button>
                <button type="button" onClick={() => { setFlagModal(null); setFlagForm({ reason: '', notes: '' }) }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}
