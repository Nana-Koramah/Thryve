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
    <div className="tsa-root">
      <header className="tsa-topbar">
        <div className="tsa-topbar-left">
          <div className="tsa-logo">
            <img
              src="/thryve _logo.png"
              alt="Thryve System Analytics"
              className="tsa-logo-image"
            />
          </div>
          <nav className="tsa-nav">
            <button className="tsa-nav-item tsa-nav-item--active">Live Feed</button>
            <button className="tsa-nav-item" onClick={() => onNavigate('escalations')}>
              Escalations
            </button>
            <button className="tsa-nav-item">Patients</button>
            <button className="tsa-nav-item">Referrals</button>
            <button className="tsa-nav-item">Institutional Reports</button>
          </nav>
        </div>
        <div className="tsa-topbar-right">
          <div className="tsa-search">
            <input
              type="text"
              placeholder="Search Patient ID or Name"
              aria-label="Search Patient ID or Name"
            />
          </div>
          <div className="tsa-topbar-icons">
            <button className="tsa-icon-button" aria-label="Notifications">
              <BellIcon />
            </button>
            <button className="tsa-icon-button" aria-label="Settings">
              <SettingsIcon />
            </button>
            <div className="tsa-avatar">GH</div>
          </div>
        </div>
      </header>

      <main className="tsa-main">
        <section className="tsa-main-left">
          <header className="tsa-page-header">
            <div />
            <div className="tsa-system-status">
              <span className="tsa-system-dot" />
              <span>System Active</span>
            </div>
          </header>

          <section className="tsa-metrics-row">
            <article className="tsa-metric-card">
              <div className="tsa-metric-label">Active Red Flags</div>
              <div className="tsa-metric-value">12</div>
              <div className="tsa-metric-caption tsa-metric-caption--negative">
                +2 from last hour
              </div>
            </article>

            <article className="tsa-metric-card">
              <div className="tsa-metric-label">Avg. Triage Response</div>
              <div className="tsa-metric-value">18m 45s</div>
              <div className="tsa-metric-caption tsa-metric-caption--positive">
                +5% efficiency gain
              </div>
            </article>

            <article className="tsa-metric-card">
              <div className="tsa-metric-label">Pending Referrals</div>
              <div className="tsa-metric-value">05</div>
              <div className="tsa-metric-caption">Queue Stable</div>
            </article>
          </section>

          <section className="tsa-card tsa-patient-feed">
            <header className="tsa-card-header">
              <div className="tsa-card-header-actions">
                <button className="tsa-secondary-button">Filter</button>
                <button className="tsa-secondary-button">Export CSV</button>
              </div>
            </header>
            <div className="tsa-table">
              <div className="tsa-table-header">
                <span>Patient Name &amp; ID</span>
                <span>Status</span>
                <span>Summary</span>
                <span>Last Update</span>
                <span>Actions</span>
              </div>

              <div className="tsa-table-row">
                <div>
                  <div className="tsa-patient-name">Abena Mensah</div>
                  <div className="tsa-patient-id">GHA-2024-2093</div>
                </div>
                <div>
                  <span className="tsa-pill tsa-pill--urgent">Urgent: Sepsis</span>
                </div>
                <div className="tsa-patient-summary">
                  BP: 140/90 · Temp: 38.5°C · HR: 110
                </div>
                <div className="tsa-patient-time">12 mins ago</div>
                <div className="tsa-row-actions">
                  <button
                    className="tsa-icon-chip"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Call patient">
                    <PhoneIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Open chat">
                    <ChatIcon />
                  </button>
                </div>
              </div>

              <div className="tsa-table-row">
                <div>
                  <div className="tsa-patient-name">Esi Boateng</div>
                  <div className="tsa-patient-id">GHA-ADC-0213</div>
                </div>
                <div>
                  <span className="tsa-pill tsa-pill--ppd">Urgent: PPD Risk</span>
                </div>
                <div className="tsa-patient-summary">
                  Behavioural flags detected · Self-harm risk
                </div>
                <div className="tsa-patient-time">45 mins ago</div>
                <div className="tsa-row-actions">
                  <button
                    className="tsa-icon-chip"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Call patient">
                    <PhoneIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Open chat">
                    <ChatIcon />
                  </button>
                </div>
              </div>

              <div className="tsa-table-row">
                <div>
                  <div className="tsa-patient-name">Esi Arhin</div>
                  <div className="tsa-patient-id">GHA-ACC-1102</div>
                </div>
                <div>
                  <span className="tsa-pill tsa-pill--stable">Stable</span>
                </div>
                <div className="tsa-patient-summary">
                  BP: 120/80 · Temp: 36.6°C · Baseline
                </div>
                <div className="tsa-patient-time">1 hour ago</div>
                <div className="tsa-row-actions">
                  <button
                    className="tsa-icon-chip"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Call patient">
                    <PhoneIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Open chat">
                    <ChatIcon />
                  </button>
                </div>
              </div>

              <div className="tsa-table-row">
                <div>
                  <div className="tsa-patient-name">Ama Serwaa</div>
                  <div className="tsa-patient-id">GHA-EMU-4410</div>
                </div>
                <div>
                  <span className="tsa-pill tsa-pill--stable">Stable</span>
                </div>
                <div className="tsa-patient-summary">
                  Routine ANC follow-up · Remote sync
                </div>
                <div className="tsa-patient-time">2 hours ago</div>
                <div className="tsa-row-actions">
                  <button
                    className="tsa-icon-chip"
                    aria-label="View patient"
                    onClick={() => onNavigate('patientDetail')}
                  >
                    <ViewIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Call patient">
                    <PhoneIcon />
                  </button>
                  <button className="tsa-icon-chip" aria-label="Open chat">
                    <ChatIcon />
                  </button>
                </div>
              </div>
            </div>
            <div className="tsa-table-footer">
              <button className="tsa-link-button">View 18 more patients</button>
            </div>
          </section>
        </section>

        <aside className="tsa-main-right">
          <section className="tsa-card tsa-redflags">
            <header className="tsa-card-header tsa-card-header--space-between">
              <h2>Red Flags</h2>
              <span className="tsa-live-pill">LIVE</span>
            </header>

            <article className="tsa-alert-card tsa-alert-card--primary">
              <div className="tsa-alert-header">
                <div>
                  <div className="tsa-alert-title">Abena</div>
                  <div className="tsa-alert-subtitle">Emergency Triage</div>
                </div>
                <div className="tsa-alert-timer">28:42</div>
              </div>
              <p className="tsa-alert-body">
                Maternal Sepsis Suspected. High fever detected during remote monitoring.
              </p>
              <button className="tsa-primary-button">Acknowledge</button>
            </article>

            <article className="tsa-alert-card tsa-alert-card--secondary">
              <div className="tsa-alert-header">
                <div>
                  <div className="tsa-alert-title">Esi Boateng</div>
                  <div className="tsa-alert-subtitle">Awaiting Action</div>
                </div>
                <div className="tsa-alert-timer">12:15</div>
              </div>
              <p className="tsa-alert-body">
                Postpartum Depression Risk: Critical screening score (EPDS &gt; 20).
              </p>
              <button className="tsa-secondary-button tsa-secondary-button--full">
                Review Data
              </button>
            </article>

            <div className="tsa-card tsa-map-card">
              <div className="tsa-card-header">
                <h3>Facility Referral Map</h3>
              </div>
              <div className="tsa-map-placeholder">
                <span>Map placeholder – referral network</span>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

