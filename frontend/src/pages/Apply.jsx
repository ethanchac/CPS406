import { useState } from 'react'
import api from '../lib/axios'

export default function Apply() {
  const [form, setForm] = useState({ fullName: '', studentId: '', email: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    setLoading(true)
    try {
      await api.post('/students/apply', form)
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const map = {}
        data.errors.forEach(e => { map[e.field] = e.message })
        setErrors(map)
      } else {
        setServerError(data?.error || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-500">
              Your application has been received. A coordinator will review it and contact you at the email address you provided.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Apply to Co-op</h1>
          <p className="mt-2 text-gray-500">Toronto Metropolitan University</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} noValidate>
            <Field
              id="fullName" name="fullName" label="Full Name" type="text"
              value={form.fullName} onChange={handleChange}
              error={errors.fullName} placeholder="Aaron Tom"
              autoComplete="name"
            />
            <Field
              id="studentId" name="studentId" label="Student ID" type="text"
              value={form.studentId} onChange={handleChange}
              error={errors.studentId} placeholder="501234567"
              hint="9-digit university student number"
            />
            <Field
              id="email" name="email" label="School Email" type="email"
              value={form.email} onChange={handleChange}
              error={errors.email} placeholder="you@torontomu.ca"
              autoComplete="email"
            />
            {serverError && (
              <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {serverError}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? 'Submitting…' : 'Apply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ id, name, label, type, value, onChange, error, placeholder, hint, autoComplete }) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <input
        id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
