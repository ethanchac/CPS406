import { useState } from 'react'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

const FILTERS = [
  { key: 'missing_report', label: 'Missing Student Report' },
  { key: 'submitted_report', label: 'Submitted Student Report' },
  { key: 'missing_evaluation', label: 'Missing Employer Evaluation' },
]

export default function Tracking() {
  const [activeFilters, setActiveFilters] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  function toggleFilter(key) {
    setActiveFilters(f => ({ ...f, [key]: !f[key] }))
  }

  async function applyFilters() {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(activeFilters).forEach(([k, v]) => { if (v) params.set(k, 'true') })
    try {
      const res = await api.get(`/coordinator/students?${params}`)
      setResults(res.data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporting & Tracking</h1>
        <p className="text-gray-500 mt-1">Filter students by report and evaluation status.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Filters</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {FILTERS.map(f => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!activeFilters[f.key]}
                onChange={() => toggleFilter(f.key)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{f.label}</span>
            </label>
          ))}
        </div>
        <button
          onClick={applyFilters}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
      </div>

      {results === null ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm text-gray-400">
          Select filters and click "Apply Filters" to see results.
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500">No students match the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">{results.length} student{results.length !== 1 ? 's' : ''} found</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Student Name', 'Student ID', 'Work Term', 'Deadline', 'Report', 'Evaluation'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.studentName}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.studentNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{r.termLabel}</td>
                    <td className="px-4 py-3 text-gray-600">{r.deadline || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.reportStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.evaluationStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
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
