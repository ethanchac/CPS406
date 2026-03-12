import { useState, useRef } from 'react'
import api from '../../lib/axios'
import Layout from '../../components/Layout'

const MAX_SIZE = 2 * 1024 * 1024

export default function ReportSubmission() {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(null)
  const [serverError, setServerError] = useState('')
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const selected = e.target.files[0]
    setFileError('')
    setServerError('')
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.')
      setFile(null)
      return
    }
    if (selected.size > MAX_SIZE) {
      setFileError('File must be under 2 MB.')
      setFile(null)
      return
    }
    setFile(selected)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setFileError('Please select a PDF file.'); return }
    setUploading(true)
    setProgress(0)
    setServerError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/students/me/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setSuccess(res.data)
    } catch (err) {
      setServerError(err.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h2>
            <p className="text-gray-500 text-sm">
              {success.message} Submitted at {new Date(success.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Term Report</h1>
        <p className="text-gray-500 mt-1">Upload your completed co-op term report as a PDF.</p>
      </div>

      <div className="max-w-lg">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-gray-800 mb-2">Requirements</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• PDF format only</li>
            <li>• Maximum file size: 2 MB</li>
            <li>• One report per work term</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Report PDF
              </label>
              <div
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  fileError ? 'border-red-400 bg-red-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Select PDF report"
                  aria-describedby={fileError ? 'file-error' : undefined}
                  aria-invalid={!!fileError}
                />
                {file ? (
                  <>
                    <p className="text-green-700 font-medium">{file.name}</p>
                    <p className="text-xs text-green-600 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500">Click to select a PDF file</p>
                    <p className="text-xs text-gray-400 mt-1">PDF only, max 2 MB</p>
                  </>
                )}
              </div>
              {fileError && (
                <p id="file-error" role="alert" className="mt-2 text-xs text-red-600">{fileError}</p>
              )}
            </div>

            {uploading && (
              <div className="mb-4" role="status" aria-live="polite">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {serverError && (
              <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading…' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
