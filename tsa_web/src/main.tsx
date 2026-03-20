import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './firebase'
import './tailwind.css'
import './dashboard.css'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'
import { LoginPage } from './LoginPage'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { StaffOnboardingPage } from './StaffOnboardingPage'

const AuthGate: React.FC = () => {
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [staffChecked, setStaffChecked] = useState(false)
  const [hasStaffDoc, setHasStaffDoc] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next)
      setInitializing(false)
      setStaffChecked(false)
      setHasStaffDoc(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!user) return
      try {
        const snap = await getDoc(doc(db, 'staff', user.uid))
        if (cancelled) return
        setHasStaffDoc(snap.exists())
        setStaffChecked(true)
      } catch (_) {
        if (cancelled) return
        setHasStaffDoc(false)
        setStaffChecked(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [user])

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tsa-surface">
        <div className="bg-white rounded-card shadow-card px-4 py-3 text-sm text-slate-700">
          Loading workspace…
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (!staffChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tsa-surface">
        <div className="bg-white rounded-card shadow-card px-4 py-3 text-sm text-slate-700">
          Checking staff profile…
        </div>
      </div>
    )
  }

  if (!hasStaffDoc) {
    return (
      <StaffOnboardingPage
        mode="complete_profile"
        user={user}
        onComplete={() => {
          setHasStaffDoc(true)
        }}
      />
    )
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>,
)

