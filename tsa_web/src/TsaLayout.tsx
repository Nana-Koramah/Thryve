import React, { useState } from 'react'
import type { TsaPage } from './App'
import { BellIcon } from './TopIcons'
import { useStaffWelcome } from './useStaffWelcome'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'

/** Which area of the app is primary — drives sidebar highlights and Patient Details state. */
export type TsaNavContext =
  | 'live'
  | 'escalations'
  | 'patientDetail'
  | 'notifications'
  | 'caseDetail'
  | 'profile'

export interface TsaLayoutProps {
  children: React.ReactNode
  navContext: TsaNavContext
  onNavigate: (page: TsaPage) => void
}

export const TsaLayout: React.FC<TsaLayoutProps> = ({ children, navContext, onNavigate }) => {
  const {
    welcomeLabel,
    initials,
    loading,
    displayName,
    facilityName,
    accessLevel,
    profilePhotoUrl,
  } = useStaffWelcome()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const liveActive = navContext === 'live'
  const escalationsActive = navContext === 'escalations' || navContext === 'caseDetail'
  const patientActive = navContext === 'patientDetail' || navContext === 'caseDetail'
  const patientDisabled =
    navContext === 'live' ||
    navContext === 'escalations' ||
    navContext === 'notifications' ||
    navContext === 'caseDetail' ||
    navContext === 'profile'
  const notificationsPageActive = navContext === 'notifications'
  const profilePageActive = navContext === 'profile'

  const navBtn = (active: boolean, extra = '') =>
    `w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
      active
        ? 'bg-slate-800 text-white'
        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
    } ${extra}`

  return (
    <div className="h-screen overflow-hidden flex bg-tsa-surface text-slate-900">
      <aside
        className="w-56 shrink-0 h-full bg-tsa-navy text-slate-50 flex flex-col py-6 px-3 border-r border-slate-800/80 overflow-y-auto"
        aria-label="Main navigation"
      >
        <div className="px-3 mb-8">
          <img
            src="/thryve _logo.png"
            alt="Thryve System Analytics"
            className="h-7 w-auto max-w-full object-contain object-left"
          />
        </div>
        <nav className="flex flex-col gap-1">
          <button type="button" className={navBtn(liveActive)} onClick={() => onNavigate('live')}>
            Live Feed
          </button>
          <button
            type="button"
            className={navBtn(escalationsActive)}
            onClick={() => onNavigate('escalations')}
          >
            Red-flag Alerts
          </button>
          <button
            type="button"
            className={`${navBtn(patientActive)} disabled:opacity-60 disabled:cursor-not-allowed`}
            disabled={patientDisabled}
            onClick={() => onNavigate('patientDetail')}
            title={
              patientDisabled
                ? 'Open a patient from Live Feed to view details'
                : undefined
            }
          >
            Patient Details
          </button>
        </nav>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={async () => {
              setIsLoggingOut(true)
              try {
                await signOut(auth)
              } finally {
                setIsLoggingOut(false)
              }
            }}
            disabled={isLoggingOut}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition text-slate-50 hover:bg-slate-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="h-14 shrink-0 z-10 bg-white border-b border-slate-200 flex items-center gap-4 px-6">
          <p className="text-sm text-slate-800 font-medium truncate min-w-0">
            {loading ? <span className="text-slate-400">Welcome…</span> : welcomeLabel}
          </p>
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <input
              type="search"
              placeholder="Search Patient ID or Name"
              aria-label="Search Patient ID or Name"
              className="w-56 md:w-64 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
            />
            <button
              type="button"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                notificationsPageActive
                  ? 'bg-tsa-accent-blue text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              aria-label="Notifications"
              aria-current={notificationsPageActive ? 'page' : undefined}
              onClick={() => onNavigate('notifications')}
            >
              <BellIcon />
            </button>
            <button
              type="button"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                profilePageActive ? 'bg-tsa-accent-blue text-white' : 'bg-tsa-accent-blue text-white hover:opacity-95'
              }`}
              onClick={() => onNavigate('profile')}
              title={
                loading
                  ? 'Loading profile…'
                  : [
                      displayName ? `Signed in as ${displayName}` : 'Signed in staff',
                      facilityName ? facilityName : null,
                      accessLevel ? `(${accessLevel})` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')
              }
              aria-label={
                loading
                  ? 'Loading profile…'
                  : [
                      displayName ? `Signed in as ${displayName}` : 'Signed in staff',
                      facilityName ? facilityName : null,
                      accessLevel ? `(${accessLevel})` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')
              }
            >
              {loading ? (
                <span className="text-xs font-semibold">{initials}</span>
              ) : profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt={`${displayName || 'Staff'} profile photo`}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold">{initials}</span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">{children}</div>
      </div>
    </div>
  )
}
