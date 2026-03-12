import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'

const REQUIREMENTS = [
  { test: pw => pw.length >= 8, label: 'At least 8 characters' },
  { test: pw => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: pw => /\d/.test(pw), label: 'One digit (0–9)' },
  { test: pw => /[!@#$%^&*]/.test(pw), label: 'One special character (!@#$%^&*)' },
]

export default function SupervisorRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', companyName: '', workEmail: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    const newErrors = {}
    if (!form.fullName) newErrors.fullName = 'Full name is required.'
    if (!form.companyName) newErrors.companyName = 'Company name is required.'
    if (!form.workEmail) newErrors.workEmail = 'Work email is required.'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }

    setLoading(true)
    try {
      await api.post('/auth/register/supervisor', {
        fullName: form.fullName,
        companyName: form.companyName,
        workEmail: form.workEmail,
        password: form.password,
      })
      navigate('/login?registered=1')
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const map = {}
        data.errors.forEach(e => {
          if (!map[e.field]) map[e.field] = e.message
        })
        setErrors(map)
      } else {
        setServerError(data?.error || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const pwMet = REQUIREMENTS.filter(r => r.test(form.password))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Registration</h1>
          <p className="mt-2 text-gray-500">Create an account to submit student evaluations</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} noValidate>
            <Field id="fullName" name="fullName" label="Full Name" type="text" value={form.fullName} onChange={handleChange} error={errors.fullName} placeholder="Jane Doe" autoComplete="name" />
            <Field id="companyName" name="companyName" label="Company Name" type="text" value={form.companyName} onChange={handleChange} error={errors.companyName} placeholder="Acme Corp" />
            <Field id="workEmail" name="workEmail" label="Work Email" type="email" value={form.workEmail} onChange={handleChange} error={errors.workEmail} placeholder="jane@company.com" autoComplete="email" />

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password" name="password" type="password" value={form.password} onChange={handleChange}
                autoComplete="new-password"
                aria-describedby="password-requirements"
                aria-invalid={!!errors.password}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.password && <p role="alert" className="mt-1 text-xs text-red-600">{errors.password}</p>}
              <div id="password-requirements" className="mt-2 space-y-1">
                {REQUIREMENTS.map(r => (
                  <p key={r.label} className={`text-xs flex gap-1.5 items-center ${r.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{r.test(form.password) ? '✓' : '○'}</span> {r.label}
                  </p>
                ))}
              </div>
            </div>

            <Field id="confirmPassword" name="confirmPassword" label="Confirm Password" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />

            {serverError && <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>}

            <button
              type="submit"
              disabled={loading || pwMet.length < REQUIREMENTS.length}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>
          <p className="mt-5 text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ id, name, label, type, value, onChange, error, placeholder, autoComplete }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
      />
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
