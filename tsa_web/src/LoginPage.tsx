import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import { StaffOnboardingPage } from './StaffOnboardingPage'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim())
    } catch (err: any) {
      let message = 'Unable to sign in. Please check your details.'
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        message = 'Invalid email or password.'
      } else if (err?.code === 'auth/user-not-found') {
        message = 'No account found with this email.'
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.'
      }
      setError(message)
      setIsSubmitting(false)
    }
  }

  if (mode === 'signup') {
    return (
      <StaffOnboardingPage
        mode="signup"
        user={null}
        onComplete={() => {
          // Auth state changes will route into the app.
        }}
        onBackToSignIn={() => setMode('signin')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-tsa-surface flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between bg-tsa-navy">
        <div className="flex items-center gap-3">
          <img
            src="/thryve _logo.png"
            alt="Thryve System Analytics"
            className="h-7"
          />
          <span className="text-sm font-semibold text-slate-100">
            Staff Sign-in
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-white rounded-card shadow-card p-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            Sign in to access Thryve System Analytics for your facility.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Work email
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 mt-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-full bg-tsa-navy text-slate-50 text-sm font-semibold py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">New staff member?</span>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="text-xs font-semibold text-tsa-navy hover:underline"
            >
              Create account
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

