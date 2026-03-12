import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

const SECTIONS = [
  { key: 'behaviourScore', label: 'Behaviour', id: 'behaviour' },
  { key: 'skillsScore', label: 'Skills', id: 'skills' },
  { key: 'knowledgeScore', label: 'Knowledge', id: 'knowledge' },
  { key: 'attitudeScore', label: 'Attitude', id: 'attitude' },
]

export default function Evaluation() {
  const { assignmentId } = useParams()
  const [activeTab, setActiveTab] = useState('digital')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Submission Complete</h2>
            <p className="text-gray-500 text-sm">Your evaluation has been submitted successfully. Thank you!</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Evaluation</h1>
        <p className="text-gray-500 mt-1">Choose to fill out a digital form or upload a scanned PDF.</p>
      </div>

      <div className="max-w-2xl">
        <div className="flex border-b border-gray-200 mb-6">
          <TabBtn active={activeTab === 'digital'} onClick={() => setActiveTab('digital')}>Digital Form</TabBtn>
          <TabBtn active={activeTab === 'pdf'} onClick={() => setActiveTab('pdf')}>Upload PDF</TabBtn>
        </div>

        {activeTab === 'digital' ? (
          <DigitalForm assignmentId={assignmentId} onSuccess={() => setSubmitted(true)} />
        ) : (
          <PDFUpload assignmentId={assignmentId} onSuccess={() => setSubmitted(true)} />
        )}
      </div>
    </Layout>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function DigitalForm({ assignmentId, onSuccess }) {
  const [scores, setScores] = useState({ behaviourScore: null, skillsScore: null, knowledgeScore: null, attitudeScore: null })
  const [comments, setComments] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const refs = { behaviourScore: useRef(), skillsScore: useRef(), knowledgeScore: useRef(), attitudeScore: useRef() }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    const newErrors = {}
    const firstMissing = SECTIONS.find(s => !scores[s.key])
    if (firstMissing) {
      SECTIONS.filter(s => !scores[s.key]).forEach(s => { newErrors[s.key] = `${s.label} score is required.` })
      setErrors(newErrors)
      refs[firstMissing.key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setLoading(true)
    try {
      await api.post(`/supervisor/evaluations/${assignmentId}/form`, { ...scores, comments })
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const map = {}; data.errors.forEach(e => { map[e.field] = e.message }); setErrors(map)
      } else {
        setServerError(data?.error || 'Submission failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {SECTIONS.map(s => (
        <div
          key={s.key}
          ref={refs[s.key]}
          id={s.id}
          className={`bg-white border rounded-xl p-5 shadow-sm mb-4 ${errors[s.key] ? 'border-red-400' : 'border-gray-200'}`}
        >
          <h3 className="font-semibold text-gray-800 mb-3">{s.label}</h3>
          <div className="flex gap-3 flex-wrap">
            {[1, 2, 3, 4, 5].map(n => (
              <label key={n} className="cursor-pointer">
                <input
                  type="radio"
                  name={s.key}
                  value={n}
                  checked={scores[s.key] === n}
                  onChange={() => { setScores(sc => ({ ...sc, [s.key]: n })); setErrors(er => ({ ...er, [s.key]: '' })) }}
                  className="sr-only"
                  aria-label={`${s.label} score ${n}`}
                />
                <span className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all ${
                  scores[s.key] === n ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}>
                  {n}
                </span>
              </label>
            ))}
          </div>
          {errors[s.key] && (
            <p role="alert" className="mt-2 text-xs text-red-600 border-l-2 border-red-400 pl-2">{errors[s.key]}</p>
          )}
        </div>
      ))}

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
        <label className="block font-semibold text-gray-800 mb-2" htmlFor="comments">Overall Comments</label>
        <textarea
          id="comments"
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={4}
          placeholder="Additional observations or feedback…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {serverError && <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Submitting…' : 'Submit Evaluation'}
      </button>
    </form>
  )
}

function PDFUpload({ assignmentId, onSuccess }) {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [serverError, setServerError] = useState('')
  const inputRef = useRef(null)
  const MAX = 20 * 1024 * 1024

  function handleFileChange(e) {
    const f = e.target.files[0]
    setFileError('')
    if (!f) return
    if (f.type !== 'application/pdf') { setFileError('Only PDF files are accepted.'); return }
    if (f.size > MAX) { setFileError('File must be under 20 MB.'); return }
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setFileError('Please select a PDF.'); return }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/supervisor/evaluations/${assignmentId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      onSuccess()
    } catch (err) {
      setServerError(err.response?.data?.error || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Upload PDF Evaluation</h3>
        <p className="text-sm text-gray-500 mb-4">Upload a scanned paper evaluation. PDF only, max 20 MB.</p>
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${fileError ? 'border-red-400 bg-red-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
          {file ? (
            <><p className="text-green-700 font-medium">{file.name}</p><p className="text-xs text-green-600 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p></>
          ) : (
            <><p className="text-gray-500">Click to select a PDF file</p><p className="text-xs text-gray-400 mt-1">PDF only, max 20 MB</p></>
          )}
        </div>
        {fileError && <p role="alert" className="mt-2 text-xs text-red-600">{fileError}</p>}
        {uploading && (
          <div className="mt-3" role="status" aria-live="polite">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">{progress}%</p>
          </div>
        )}
      </div>
      {serverError && <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>}
      <button type="submit" disabled={uploading || !file} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {uploading ? 'Uploading…' : 'Upload Evaluation'}
      </button>
    </form>
  )
}
