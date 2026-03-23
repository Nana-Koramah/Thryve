import React, { useState } from 'react'
import type { TsaPage } from './App'
import { AlertHistoryIcon } from './TopIcons'
import { useStaffWelcome } from './useStaffWelcome'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'

/** Which area of the app is primary — drives sidebar highlights and Patient Details state. */
export type TsaNavContext =
  | 'live'
  | 'alertHistory'
  | 'escalations'
  | 'patientDetail'
  | 'patientEpds'
  | 'patientRecord'
  | 'caseDetail'
  | 'profile'

/** Live Feed: binds the top-bar search to the patient table filter. Other pages omit this. */
export type HeaderPatientSearchBinding = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}

export interface TsaLayoutProps {
  children: React.ReactNode
  navContext: TsaNavContext
  onNavigate: (page: TsaPage) => void
  /** When set (Live Feed only), the header search filters linked mothers. */
  headerPatientSearch?: HeaderPatientSearchBinding
}

export const TsaLayout: React.FC<TsaLayoutProps> = ({
  children,
  navContext,
  onNavigate,
  headerPatientSearch,
}) => {
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
  const patientActive =
    navContext === 'patientDetail' || navContext === 'patientRecord' || navContext === 'caseDetail'
  const patientDisabled =
    navContext === 'live' ||
    navContext === 'alertHistory' ||
    navContext === 'escalations' ||
    navContext === 'caseDetail' ||
    navContext === 'profile'
  const alertHistoryPageActive = navContext === 'alertHistory'
  const profilePageActive = navContext === 'profile'

  /** No top-bar search on single-patient views (case summary + full track record). */
  const hideHeaderPatientSearch =
    navContext === 'patientDetail' ||
    navContext === 'patientEpds' ||
    navContext === 'patientRecord'

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
                ? 'Open a patient from Live Feed or Alert history to view details'
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
        <header className="h-14 shrink-0 z-10 bg-white border-b border-slate-200 flex items-center gap-4 px-6 min-w-0">
          <p className="text-sm text-slate-800 font-medium truncate min-w-0 shrink-0 max-w-[min(100%,14rem)] sm:max-w-xs">
            {loading ? <span className="text-slate-400">Welcome…</span> : welcomeLabel}
          </p>
          <div className="flex flex-1 min-w-0 items-center justify-end gap-2 sm:gap-3">
            {headerPatientSearch ? (
              <input
                type="search"
                id="tsa-header-patient-search"
                autoComplete="off"
                value={headerPatientSearch.value}
                onChange={(e) => headerPatientSearch.onChange(e.target.value)}
                placeholder={
                  headerPatientSearch.placeholder ??
                  'Search by name, Ghana Card ID, or NHIS…'
                }
                aria-label="Search patients by name, Ghana Card ID, or NHIS number"
                className="min-w-0 w-[min(100%,11rem)] sm:w-48 md:w-56 lg:w-72 max-w-full px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
              />
            ) : hideHeaderPatientSearch ? null : (
              <input
                type="search"
                disabled
                placeholder="Search on Live Feed for patients"
                aria-label="Patient search is available on the Live Feed page"
                title="Open Live Feed to search by name, Ghana Card ID, or NHIS"
                className="min-w-0 w-[min(100%,11rem)] sm:w-48 md:w-56 lg:w-64 max-w-full px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-xs text-slate-500 placeholder:text-slate-400 cursor-not-allowed opacity-80"
              />
            )}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                alertHistoryPageActive
                  ? 'bg-tsa-accent-blue text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              aria-label="Alert history — all facility alerts and types"
              aria-current={alertHistoryPageActive ? 'page' : undefined}
              title="Alert history"
              onClick={() => onNavigate('alertHistory')}
            >
              <AlertHistoryIcon />
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
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">{children}</div>
      </div>
    </div>
  )
}
