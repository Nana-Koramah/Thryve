import React from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { BellIcon, SettingsIcon } from './TopIcons'

const ViewIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12C4.5 8.5 7.5 6 12 6C16.5 6 19.5 8.5 21 12C19.5 15.5 16.5 18 12 18C7.5 18 4.5 15.5 3 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const PhoneIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.5 4.5L9 4L10.5 7L9 8.5C9.75 10.5 11.5 12.25 13.5 13L15 11.5L18 13L17.5 15.5C17.37 16.09 16.89 16.5 16.28 16.5C11.58 16.25 7.75 12.42 7.5 7.72C7.5 7.11 7.91 6.63 8.5 6.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChatIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 18L4 20V7C4 5.9 4.9 5 6 5H18C19.1 5 20 5.9 20 7V13C20 14.1 19.1 15 18 15H8L6 18Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface DashboardPageProps {
  onNavigate: (page: TsaPage) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-tsa-surface text-slate-900 flex flex-col">
      <header className="h-14 px-6 bg-tsa-navy text-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img
              src="/thryve _logo.png"
              alt="Thryve System Analytics"
              className="h-6"
            />
          </div>
          <nav className="flex items-center gap-2 text-xs">
            <button className="px-3 py-1.5 rounded-full bg-slate-900 text-slate-50 font-medium">
              Live Feed
            </button>
            <button
              className="px-3 py-1.5 rounded-full text-slate-300 hover:bg-slate-800/60 transition"
              onClick={() => onNavigate('escalations')}
            >
              Escalations
            </button>
            <button className="px-3 py-1.5 rounded-full text-slate-300 hover:bg-slate-800/60 transition">
              Patients
            </button>
            <button className="px-3 py-1.5 rounded-full text-slate-300 hover:bg-slate-800/60 transition">
              Referrals
            </button>
            <button className="px-3 py-1.5 rounded-full text-slate-300 hover:bg-slate-800/60 transition">
              Institutional Reports
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <input
              type="text"
              placeholder="Search Patient ID or Name"
              aria-label="Search Patient ID or Name"
              className="w-64 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tsa-accent-blue/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-50"
              aria-label="Notifications"
            >
              <BellIcon />
            </button>
            <button
              className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-50"
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
            <div className="w-8 h-8 rounded-full bg-tsa-accent-blue text-white flex items-center justify-center text-xs font-semibold">
              GH
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto mt-6 mb-10 px-6 grid grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-5">
        <section className="flex flex-col gap-5">
          <header className="flex items-center justify-between mb-1">
            <div />
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>System Active</span>
            </div>
          </header>

          <section className="grid grid-cols-3 gap-3">
            <article className="bg-white rounded-card shadow-card px-4 py-3.5">
              <div className="text-xs text-slate-500">Active Red Flags</div>
              <div className="mt-1 text-2xl font-semibold">12</div>
              <div className="mt-1 text-[11px] text-rose-700">+2 from last hour</div>
            </article>

            <article className="bg-white rounded-card shadow-card px-4 py-3.5">
              <div className="text-xs text-slate-500">Avg. Triage Response</div>
              <div className="mt-1 text-2xl font-semibold">18m 45s</div>
              <div className="mt-1 text-[11px] text-emerald-700">+5% efficiency gain</div>
            </article>

            <article className="bg-white rounded-card shadow-card px-4 py-3.5">
              <div className="text-xs text-slate-500">Pending Referrals</div>
              <div className="mt-1 text-2xl font-semibold">05</div>
              <div className="mt-1 text-[11px] text-slate-500">Queue Stable</div>
            </article>
          </section>

          <section className="bg-white rounded-card shadow-card p-4">
            <header className="flex items-center justify-end mb-3">
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50">
                  Filter
                </button>
                <button className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50">
                  Export CSV
                </button>
              </div>
            </header>

            <div>
              <div className="grid grid-cols-[1.5fr_1fr_2.2fr_0.8fr_0.8fr] gap-2 py-2 text-[11px] text-slate-500">
                <span>Patient Name &amp; ID</span>
                <span>Status</span>
                <span>Summary</span>
                <span>Last Update</span>
                <span>Actions</span>
              </div>

              <div className="grid grid-cols-[1.5fr_1fr_2.2fr_0.8fr_0.8fr] gap-2 py-2.5 border-t border-slate-200 text-sm items-center">
                <div>
                  <div className="font-semibold">Abena Mensah</div>
                  <div className="text-[11px] text-slate-500">GHA-2024-2093</div>
                </div>
                <div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                    Urgent: Sepsis
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  BP: 140/90 · Temp: 38.5°C · HR: 110
                </div>
                <div className="text-[11px] text-slate-500">12 mins ago</div>
                <div className="flex gap-1">
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Call patient"
                  >
                    <PhoneIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Open chat"
                  >
                    <ChatIcon />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[1.5fr_1fr_2.2fr_0.8fr_0.8fr] gap-2 py-2.5 border-t border-slate-200 text-sm items-center">
                <div>
                  <div className="font-semibold">Esi Boateng</div>
                  <div className="text-[11px] text-slate-500">GHA-ADC-0213</div>
                </div>
                <div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                    Urgent: PPD Risk
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Behavioural flags detected · Self-harm risk
                </div>
                <div className="text-[11px] text-slate-500">45 mins ago</div>
                <div className="flex gap-1">
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Call patient"
                  >
                    <PhoneIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Open chat"
                  >
                    <ChatIcon />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[1.5fr_1fr_2.2fr_0.8fr_0.8fr] gap-2 py-2.5 border-t border-slate-200 text-sm items-center">
                <div>
                  <div className="font-semibold">Esi Arhin</div>
                  <div className="text-[11px] text-slate-500">GHA-ACC-1102</div>
                </div>
                <div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                    Stable
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  BP: 120/80 · Temp: 36.6°C · Baseline
                </div>
                <div className="text-[11px] text-slate-500">1 hour ago</div>
                <div className="flex gap-1">
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Call patient"
                  >
                    <PhoneIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Open chat"
                  >
                    <ChatIcon />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[1.5fr_1fr_2.2fr_0.8fr_0.8fr] gap-2 py-2.5 border-t border-slate-200 text-sm items-center">
                <div>
                  <div className="font-semibold">Ama Serwaa</div>
                  <div className="text-[11px] text-slate-500">GHA-EMU-4410</div>
                </div>
                <div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                    Stable
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Routine ANC follow-up · Remote sync
                </div>
                <div className="text-[11px] text-slate-500">2 hours ago</div>
                <div className="flex gap-1">
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Call patient"
                  >
                    <PhoneIcon />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs hover:bg-slate-100"
                    aria-label="Open chat"
                  >
                    <ChatIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 text-center">
              <button className="text-xs text-tsa-accent-blue hover:underline">
                View 18 more patients
              </button>
            </div>
          </section>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="bg-white rounded-card shadow-card p-4 flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <span className="text-sm font-semibold">Red Flags</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">
                LIVE
              </span>
            </header>

            <article className="rounded-[14px] px-3.5 py-3 bg-gradient-to-r from-rose-500 to-rose-400 text-rose-50 mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="font-semibold">Abena</div>
                  <div className="text-xs opacity-80">Emergency Triage</div>
                </div>
                <div className="text-sm font-semibold">28:42</div>
              </div>
              <p className="text-xs mb-2.5">
                Maternal Sepsis Suspected. High fever detected during remote monitoring.
              </p>
              <button className="w-full rounded-full bg-amber-100 text-amber-900 text-sm font-semibold py-2">
                Acknowledge
              </button>
            </article>

            <article className="rounded-[14px] px-3.5 py-3 border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="font-semibold">Esi Boateng</div>
                  <div className="text-xs text-slate-600">Awaiting Action</div>
                </div>
                <div className="text-sm font-semibold text-slate-700">12:15</div>
              </div>
              <p className="text-xs text-slate-700 mb-2.5">
                Postpartum Depression Risk: Critical screening score (EPDS &gt; 20).
              </p>
              <button className="w-full rounded-full border border-slate-200 bg-white text-xs font-medium py-1.5">
                Review Data
              </button>
            </article>

            <div className="mt-3 rounded-card bg-white shadow-card p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Facility Referral Map</span>
              </div>
              <div className="h-28 rounded-xl bg-gradient-to-tr from-blue-100 to-slate-50 flex items-center justify-center text-xs text-slate-600">
                <span>Map placeholder – referral network</span>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

