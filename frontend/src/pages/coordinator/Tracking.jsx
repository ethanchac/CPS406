import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

const FILTERS = [
  { key: 'missing_report', label: 'Missing Report (overdue)', color: 'red' },
  { key: 'submitted_report', label: 'Report Submitted', color: 'green' },
  { key: 'missing_evaluation', label: 'Missing Evaluation', color: 'amber' },
]

export default function Tracking() {
  const [activeFilters, setActiveFilters] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Auto-load all students on mount
    fetchStudents({})
  }, [])

  function toggleFilter(key) {
    const next = { ...activeFilters, [key]: !activeFilters[key] }
    setActiveFilters(next)
    fetchStudents(next)
  }

  async function fetchStudents(filters) {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, 'true') })
    try {
      const res = await api.get(`/coordinator/students?${params}`)
      setResults(res.data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  const filtered = (results || []).filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.studentName?.toLowerCase().includes(q) || r.studentNumber?.includes(q) || r.termLabel?.toLowerCase().includes(q)
  })

  const overdue = filtered.filter(r => r.deadline && r.deadline < today && r.reportStatus === 'missing')
  const nonOverdue = filtered.filter(r => !(r.deadline && r.deadline < today && r.reportStatus === 'missing'))

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporting & Tracking</h1>
        <p className="text-gray-500 mt-1">Monitor student report and evaluation submissions.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap gap-3 flex-1">
            {FILTERS.map(f => {
              const active = !!activeFilters[f.key]
              const colorMap = {
                red: active ? 'bg-red-600 text-white border-red-600' : 'border-red-200 text-red-700 hover:bg-red-50',
                green: active ? 'bg-green-600 text-white border-green-600' : 'border-green-200 text-green-700 hover:bg-green-50',
                amber: active ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-200 text-amber-700 hover:bg-amber-50',
              }
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${colorMap[f.color]}`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
          <input
            type="text"
            placeholder="Search by name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-56"
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : results === null ? null : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500">No students match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-red-500 text-sm font-semibold">⚠️ Overdue ({overdue.length})</span>
              </div>
              <StudentTable rows={overdue} today={today} />
            </div>
          )}
          {nonOverdue.length > 0 && (
            <div>
              {overdue.length > 0 && <p className="text-xs text-gray-400 px-1 mb-2">All others ({nonOverdue.length})</p>}
              <StudentTable rows={nonOverdue} today={today} />
            </div>
          )}
          <p className="text-xs text-gray-400 text-right">{filtered.length} row{filtered.length !== 1 ? 's' : ''} shown</p>
        </div>
      )}
    </Layout>
  )
}

function StudentTable({ rows, today }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Student', 'ID', 'Work Term', 'Deadline', 'Report', 'Evaluation'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => {
              const isOverdue = r.deadline && r.deadline < today && r.reportStatus === 'missing'
              return (
                <tr key={i} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <Link to={`/coordinator/student/${r.studentId}`} className="font-medium text-blue-700 hover:underline">
                      {r.studentName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.studentNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{r.termLabel}</td>
                  <td className="px-4 py-3">
                    {r.deadline ? (
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {isOverdue && '⚠️ '}{r.deadline}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={r.reportStatus} /></td>
                  <td className="px-4 py-3"><StatusPill status={r.evaluationStatus} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    submitted: 'bg-green-100 text-green-700',
    missing: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}
