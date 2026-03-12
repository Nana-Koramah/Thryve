import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './firebase'
import './tailwind.css'
import './dashboard.css'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'
import { LoginPage } from './LoginPage'

const AuthGate: React.FC = () => {
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next)
      setInitializing(false)
    })
    return () => unsub()
  }, [])

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

  return <App />
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>,
)

