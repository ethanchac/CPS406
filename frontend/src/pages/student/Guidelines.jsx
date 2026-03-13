import { useEffect, useState } from 'react'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

export default function Guidelines() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/students/me/guidelines')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load guidelines.'))
      .finally(() => setLoading(false))
  }, [])

  const isOverdue = data?.reportDeadline && data.reportDeadline !== 'Date pending' && new Date(data.reportDeadline) < new Date()

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Guidelines & Deadline</h1>
        <p className="text-gray-500 mt-1">Your co-op report requirements and submission deadline.</p>
      </div>

      {loading && <Spinner />}
      {error && <p className="text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

      {data && (
        <div className="space-y-4">
          {isOverdue && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-700">Deadline Passed</p>
                <p className="text-sm text-red-600 mt-0.5">Your report deadline has passed. Please submit your report as soon as possible or contact your coordinator.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              label="Work Term End Date"
              value={data.workTermEndDate || 'Not set'}
              icon="📅"
            />
            <InfoCard
              label="Report Deadline"
              value={data.reportDeadline}
              icon="⏰"
              highlight={isOverdue ? 'red' : data.reportDeadline !== 'Date pending' ? 'blue' : 'gray'}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Report Requirements</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span>•</span> Report must be submitted as a PDF file</li>
              <li className="flex gap-2"><span>•</span> File size must not exceed 2 MB</li>
              <li className="flex gap-2"><span>•</span> Deadline is 14 calendar days after your work term end date</li>
              <li className="flex gap-2"><span>•</span> Only one report can be submitted per work term</li>
            </ul>
          </div>

          {data.templateDownloadUrl ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">Report Template</p>
                <p className="text-sm text-blue-700 mt-0.5">Download the official co-op report template</p>
              </div>
              <a
                href={data.templateDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </a>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500">Template unavailable. Contact your coordinator.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

function InfoCard({ label, value, icon, highlight = 'gray' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-white border-gray-200',
  }
  return (
    <div className={`border rounded-xl p-5 shadow-sm ${colors[highlight]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}
