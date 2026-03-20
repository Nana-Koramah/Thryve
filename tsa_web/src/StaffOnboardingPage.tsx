import React, { useEffect, useMemo, useState } from 'react'
import { createUserWithEmailAndPassword, type User } from 'firebase/auth'
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

type Facility = {
  id: string
  name: string
  region: string
  district: string
  emailDomain?: string
}

type Mode = 'signup' | 'complete_profile'

export const StaffOnboardingPage: React.FC<{
  mode: Mode
  user: User | null
  onComplete: () => void
  onBackToSignIn?: () => void
}> = ({ mode, user, onComplete, onBackToSignIn }) => {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [facilityId, setFacilityId] = useState('')
  const [isFacilityAdmin, setIsFacilityAdmin] = useState(false)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => {
    if (mode === 'signup') return 'Create staff account'
    return 'Complete staff setup'
  }, [mode])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const snap = await getDocs(collection(db, 'facilities'))
        const list: Facility[] = snap.docs.map((d) => {
          const data = d.data() as any
          return {
            id: d.id,
            name: String(data?.name ?? ''),
            region: String(data?.region ?? ''),
            district: String(data?.district ?? ''),
            emailDomain: data?.emailDomain ? String(data.emailDomain) : undefined,
          }
        })
        if (!cancelled) setFacilities(list)
      } catch (e) {
        if (!cancelled) setFacilities([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!displayName.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!facilityId) {
      setError('Please select a facility.')
      return
    }

    const facility = facilities.find((f) => f.id === facilityId)
    const expectedDomain = facility?.emailDomain?.trim().toLowerCase()
    const emailToCheck = (mode === 'signup' ? email.trim() : user?.email ?? '').toLowerCase()
    if (expectedDomain) {
      const at = emailToCheck.lastIndexOf('@')
      const domain = at >= 0 ? emailToCheck.slice(at + 1) : ''
      if (!domain || domain !== expectedDomain) {
        setError(`Please use your hospital email (must end with @${expectedDomain}).`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      let activeUser = user
      if (mode === 'signup') {
        if (!email.trim() || !password.trim()) {
          setError('Please enter an email and password.')
          setIsSubmitting(false)
          return
        }
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password.trim(),
        )
        activeUser = credential.user
      }

      if (!activeUser) throw new Error('No authenticated user.')

      await setDoc(
        doc(db, 'staff', activeUser.uid),
        {
          role: 'staff',
          email: activeUser.email ?? email.trim(),
          displayName: displayName.trim(),
          facilityId,
          facilityName: facility?.name ?? '',
          accessLevel: isFacilityAdmin ? 'admin' : 'staff',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      onComplete()
    } catch (err: any) {
      let message = 'Unable to create staff account.'
      if (err?.code === 'auth/email-already-in-use') message = 'Email already in use.'
      if (err?.code === 'auth/weak-password') message = 'Password is too weak.'
      if (err?.code === 'auth/invalid-email') message = 'Please enter a valid email.'
      if (err?.code === 'permission-denied') message = 'Missing permissions for staff creation.'
      setError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-tsa-surface flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between bg-tsa-navy">
        <div className="flex items-center gap-3">
          <img src="/thryve _logo.png" alt="Thryve System Analytics" className="h-7" />
          <span className="text-sm font-semibold text-slate-100">{title}</span>
        </div>
        {mode === 'signup' && onBackToSignIn && (
          <button
            type="button"
            onClick={onBackToSignIn}
            className="text-xs text-slate-200 hover:text-white"
          >
            Back to sign in
          </button>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-white rounded-card shadow-card p-6">
          <p className="text-sm text-slate-600 mb-5">
            Select the facility you work under. This will decide which mothers and alerts you can
            view in TSA.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Your name</label>
              <input
                type="text"
                className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Work email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Facility</label>
              <select
                className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
              >
                <option value="">Select facility…</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · {f.district}
                  </option>
                ))}
              </select>
              {facilities.length === 0 && (
                <p className="text-[11px] text-slate-500 mt-1">
                  No facilities found yet. Add facilities in Firestore first.
                </p>
              )}
              {facilityId && facilities.find((f) => f.id === facilityId)?.emailDomain && (
                <p className="text-[11px] text-slate-500 mt-1">
                  This facility requires staff emails ending with{' '}
                  <span className="font-semibold">
                    @
                    {facilities.find((f) => f.id === facilityId)?.emailDomain}
                  </span>
                  .
                </p>
              )}
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={isFacilityAdmin}
                onChange={(e) => setIsFacilityAdmin(e.target.checked)}
              />
              <span>
                Facility Admin (can view all patient records for this facility)
              </span>
            </label>

            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-full bg-tsa-navy text-slate-50 text-sm font-semibold py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : mode === 'signup' ? 'Create account' : 'Continue'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

