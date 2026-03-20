import React from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { BellIcon } from './TopIcons'

interface PatientDetailPageProps {
  onNavigate: (page: TsaPage) => void
}

export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({ onNavigate }) => {
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
            <button className="tsa-nav-item" onClick={() => onNavigate('live')}>
              Live Feed
            </button>
            <button className="tsa-nav-item" onClick={() => onNavigate('escalations')}>
              Red-flag Alerts
            </button>
            <button className="tsa-nav-item tsa-nav-item--active">Patient Details</button>
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
            <button
              className="tsa-icon-button"
              aria-label="Notifications"
              onClick={() => onNavigate('notifications')}
            >
              <BellIcon />
            </button>
            <div className="tsa-avatar">GH</div>
          </div>
        </div>
      </header>

      <main className="tsa-main tsa-main--patient-detail">
        <section className="tsa-patient-detail-left">
          <header className="tsa-patient-detail-header">
            <div className="tsa-patient-detail-identity">
              <div className="tsa-patient-avatar-circle">A</div>
              <div>
                <div className="tsa-patient-detail-name">Ama Mansa Mensah</div>
                <div className="tsa-patient-detail-meta">
                  28 years · GHA-729A81023-4 · Medium Risk
                </div>
              </div>
              <span className="tsa-patient-risk-pill">Medium Risk</span>
            </div>
            <div className="tsa-patient-detail-actions">
              <button className="tsa-secondary-button">Refer Patient</button>
              <button className="tsa-primary-button tsa-primary-button--status">
                Update Triage Status
              </button>
            </div>
          </header>

          <section className="tsa-patient-detail-metrics">
            <article className="tsa-patient-metric-card">
              <div className="tsa-metric-label">Mental Health Score</div>
              <div className="tsa-patient-metric-main">
                <span className="tsa-patient-metric-value">72/100</span>
                <span className="tsa-patient-metric-trend">+2%</span>
              </div>
              <div className="tsa-metric-caption">
                EPDS scale: Stable monitoring recommended
              </div>
            </article>
            <article className="tsa-patient-metric-card">
              <div className="tsa-metric-label">Postnatal Period</div>
              <div className="tsa-patient-metric-main">
                <span className="tsa-patient-metric-value">Week 4</span>
                <span className="tsa-patient-metric-sub">Post-Delivery</span>
              </div>
            </article>
            <article className="tsa-patient-metric-card">
              <div className="tsa-metric-label">Nutritional Adherence</div>
              <div className="tsa-patient-metric-main">
                <span className="tsa-patient-metric-value">85%</span>
                <span className="tsa-patient-metric-sub">Optimal</span>
              </div>
              <div className="tsa-metric-caption">
                Iron and folic acid supplements recorded
              </div>
            </article>
          </section>

          <section className="tsa-card tsa-patient-timeline-card">
            <header className="tsa-patient-timeline-header">
              <div>
                <div className="tsa-detail-section-title">Health Progress Timeline</div>
                <div className="tsa-patient-timeline-subtitle">
                  Clinical check-ins and vital alert
                </div>
              </div>
              <div className="tsa-patient-timeline-legend">
                <span className="tsa-timeline-dot tsa-timeline-dot--check" />
                <span className="tsa-timeline-label">Healthy Check-in</span>
                <span className="tsa-timeline-dot tsa-timeline-dot--flag" />
                <span className="tsa-timeline-label">Red Flag / Alert</span>
                <button className="tsa-secondary-button">Last 6 Months</button>
              </div>
            </header>

            <div className="tsa-patient-timeline-track">
              <div className="tsa-patient-timeline-line" />
              <div className="tsa-patient-timeline-marks">
                <div className="tsa-patient-timeline-mark">
                  <span className="tsa-timeline-dot tsa-timeline-dot--check" />
                  <span className="tsa-timeline-week">Week 1</span>
                </div>
                <div className="tsa-patient-timeline-mark">
                  <span className="tsa-timeline-dot tsa-timeline-dot--check" />
                  <span className="tsa-timeline-week">Week 4</span>
                </div>
                <div className="tsa-patient-timeline-mark">
                  <span className="tsa-timeline-pill tsa-timeline-pill--alert">
                    Hypertension Alert
                  </span>
                  <span className="tsa-timeline-week">Week 8</span>
                </div>
                <div className="tsa-patient-timeline-mark">
                  <span className="tsa-timeline-dot tsa-timeline-dot--flag" />
                  <span className="tsa-timeline-week">Week 12</span>
                </div>
                <div className="tsa-patient-timeline-mark">
                  <span className="tsa-timeline-dot tsa-timeline-dot--flag" />
                  <span className="tsa-timeline-week">Week 16</span>
                </div>
                <div className="tsa-patient-timeline-mark">
                  <span className="tsa-timeline-pill tsa-timeline-pill--risk">Anemia Risk</span>
                  <span className="tsa-timeline-week">Week 20</span>
                </div>
                <div className="tsa-patient-timeline-mark">
                  <span className="tsa-timeline-dot tsa-timeline-dot--check" />
                  <span className="tsa-timeline-week">Week 24</span>
                </div>
              </div>
            </div>
          </section>

          <section className="tsa-card tsa-patient-notes-card">
            <header className="tsa-patient-notes-header">
              <div className="tsa-patient-notes-title-row">
                <span className="tsa-detail-section-title">Clinical Assessment &amp; Follow-up</span>
              </div>
              <div className="tsa-patient-notes-meta">Last saved: 12 mins ago</div>
            </header>
            <div className="tsa-patient-notes-body">
              <textarea
                className="tsa-patient-notes-textarea"
                placeholder="Type clinical notes, observations or recommended interventions for this visit..."
              />
            </div>
            <div className="tsa-patient-notes-footer">
              <button className="tsa-primary-button tsa-primary-button--notes">
                Save Clinical Notes
              </button>
            </div>
          </section>
        </section>

        <aside className="tsa-patient-detail-right">
          <section className="tsa-card tsa-identity-card">
            <header className="tsa-identity-header">
              <span className="tsa-detail-section-title">Identity Verification</span>
            </header>
            <div className="tsa-identity-row">
              <div className="tsa-identity-label">Ghana Card ID</div>
              <div className="tsa-identity-value">GHA-729A81023-4</div>
            </div>
            <div className="tsa-identity-row">
              <div className="tsa-identity-label">NHIS Number</div>
              <div className="tsa-identity-value">0921-3344-88</div>
            </div>
          </section>

          <section className="tsa-card tsa-emergency-card">
            <header className="tsa-emergency-header">
              <span className="tsa-detail-section-title">Emergency Contact</span>
            </header>
            <div className="tsa-emergency-body">
              <div className="tsa-emergency-name">Kojo Mensah (Husband)</div>
              <div className="tsa-emergency-phone">+233 24 555 0192</div>
            </div>
            <button className="tsa-primary-button tsa-primary-button--quickcall">
              Initiate Quick-Call
            </button>
          </section>
        </aside>
      </main>
    </div>
  )
}

