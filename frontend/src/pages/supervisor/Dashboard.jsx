import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/supervisor/students').then(r => setAssignments(r.data)).finally(() => setLoading(false))
  }, [])

  const name = user?.user_metadata?.full_name || 'Supervisor'

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {name}</h1>
        <p className="text-gray-500 mt-1">Manage evaluations for your co-op students.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Assigned Students</h2>
        {loading ? (
          <Spinner />
        ) : assignments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
            <p className="text-gray-400">No students assigned yet. Contact the co-op coordinator to be linked with students.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(a => {
              const wt = a.work_terms || {}
              const student = wt.students || {}
              return (
                <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{student.full_name || 'Unknown Student'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">#{student.student_number} · {wt.term_label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{wt.start_date} – {wt.end_date || 'Ongoing'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${a.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                    <Link
                      to={`/supervisor/evaluate/${a.id}`}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Evaluate
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </Layout>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
}
