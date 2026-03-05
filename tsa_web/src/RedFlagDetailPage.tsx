import React from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { BellIcon, SettingsIcon } from './TopIcons'

export const RedFlagDetailPage: React.FC<{ onNavigate: (page: TsaPage) => void }> = ({
  onNavigate,
}) => {
  return (
    <div className="tsa-root">
      <header className="tsa-topbar tsa-topbar--light">
        <div className="tsa-topbar-left">
          <div className="tsa-logo tsa-logo--light">
            <img
              src="/thryve _logo.png"
              alt="Thryve System Analytics"
              className="tsa-logo-image"
            />
          </div>
          <nav className="tsa-nav tsa-nav--light">
            <button className="tsa-nav-item" onClick={() => onNavigate('live')}>
              Live Feed
            </button>
            <button className="tsa-nav-item tsa-nav-item--active" onClick={() => onNavigate('escalations')}>
              Escalations
            </button>
            <button className="tsa-nav-item">Facilities</button>
            <button className="tsa-nav-item">Patient Records</button>
            <button className="tsa-nav-item">Reports</button>
          </nav>
        </div>
        <div className="tsa-topbar-right">
          <div className="tsa-search tsa-search--light">
            <input
              type="text"
              placeholder="Search Patient ID or Name"
              aria-label="Search Patient ID or Name"
            />
          </div>
          <div className="tsa-topbar-icons tsa-topbar-icons--light">
            <button className="tsa-icon-button tsa-icon-button--light" aria-label="Notifications">
              <BellIcon />
            </button>
            <button className="tsa-icon-button tsa-icon-button--light" aria-label="Settings">
              <SettingsIcon />
            </button>
            <div className="tsa-avatar tsa-avatar--light">GH</div>
          </div>
        </div>
      </header>

      <main className="tsa-main tsa-main--detail">
        <section className="tsa-detail-left">
          <button
            className="tsa-link-button tsa-detail-back"
            onClick={() => onNavigate('escalations')}
          >
            ← Back to escalations
          </button>

          <section className="tsa-card tsa-detail-card tsa-detail-card--symptoms">
            <div className="tsa-detail-header-row">
              <div>
                <div className="tsa-detail-label">TSA Dashboard</div>
                <div className="tsa-detail-title">Patient: Ama Mansa</div>
                <div className="tsa-detail-pill tsa-detail-pill--priority">High Priority</div>
              </div>
              <div className="tsa-detail-meta">
                <div className="tsa-detail-meta-label">Time Since Alert</div>
                <div className="tsa-detail-meta-value">12:44</div>
                <div className="tsa-detail-meta-sub">Dr. Kofi Adu · Greater Accra</div>
              </div>
            </div>

            <div className="tsa-detail-section-heading">Symptom Breakdown</div>
            <div className="tsa-symptom-bar">
              <div className="tsa-symptom-label-row">
                <span>Fever</span>
                <span className="tsa-symptom-value">39.2°C</span>
              </div>
              <div className="tsa-symptom-track">
                <div className="tsa-symptom-fill tsa-symptom-fill--fever" />
              </div>
            </div>
            <div className="tsa-symptom-bar">
              <div className="tsa-symptom-label-row">
                <span>Heavy Bleeding</span>
                <span className="tsa-symptom-value tsa-symptom-value--severe">Severe</span>
              </div>
              <div className="tsa-symptom-track">
                <div className="tsa-symptom-fill tsa-symptom-fill--bleeding" />
              </div>
            </div>
            <div className="tsa-symptom-bar">
              <div className="tsa-symptom-label-row">
                <span>BP Systolic</span>
                <span className="tsa-symptom-value">145 mmHg</span>
              </div>
              <div className="tsa-symptom-track">
                <div className="tsa-symptom-fill tsa-symptom-fill--bp" />
              </div>
            </div>

            <div className="tsa-detail-subsection">
              <div className="tsa-detail-subsection-title">Patient History</div>
              <dl className="tsa-detail-history-list">
                <div className="tsa-detail-history-item">
                  <dt>Gestation</dt>
                  <dd>32 Weeks (Third Trimester)</dd>
                </div>
                <div className="tsa-detail-history-item">
                  <dt>Previous Complications</dt>
                  <dd>Gestational Diabetes (Managed)</dd>
                </div>
                <div className="tsa-detail-history-item">
                  <dt>Location</dt>
                  <dd>Kumasi, Ashanti Region</dd>
                </div>
              </dl>
            </div>
          </section>
        </section>

        <section className="tsa-detail-center">
          <section className="tsa-card tsa-detail-card tsa-detail-card--transcript">
            <div className="tsa-detail-section-header">
              <div className="tsa-detail-section-title">Live AI Transcription</div>
              <div className="tsa-detail-section-actions">
                <button className="tsa-secondary-button">Translate to Twi</button>
                <button className="tsa-secondary-button">Share Log</button>
              </div>
            </div>

            <div className="tsa-transcript-list">
              <article className="tsa-transcript-entry tsa-transcript-entry--patient">
                <header className="tsa-transcript-header">
                  <span className="tsa-transcript-speaker">Patient · 10:42:10</span>
                </header>
                <p>
                  “I woke up about an hour ago and I felt a sudden gush. I'm really{' '}
                  <span className="tsa-transcript-highlight">scared</span> because the{' '}
                  <span className="tsa-transcript-highlight">bleeding</span> hasn't stopped and it's
                  much heavier than before.”
                </p>
              </article>

              <article className="tsa-transcript-entry tsa-transcript-entry--system">
                <header className="tsa-transcript-header">
                  <span className="tsa-transcript-speaker">System Operator · 10:42:38</span>
                </header>
                <p>
                  “I understand, Ama. Please try to stay calm. Are you feeling any{' '}
                  <span className="tsa-transcript-highlight">pain</span> in your abdomen right now?”
                </p>
              </article>

              <article className="tsa-transcript-entry tsa-transcript-entry--patient">
                <header className="tsa-transcript-header">
                  <span className="tsa-transcript-speaker">Patient · 10:42:59</span>
                </header>
                <p>
                  “Yes, it's a sharp, <span className="tsa-transcript-highlight">stabbing pain</span>.
                  It's making me feel very dizzy. I can't stand up to get my bag.”
                </p>
              </article>

              <section className="tsa-ai-insight">
                <header className="tsa-ai-insight-header">
                  <span className="tsa-ai-insight-label">AI Insight</span>
                </header>
                <p>
                  High emotional distress detected. Keywords “dizzy” and “stabbing pain” suggest
                  possible placental abruption. Immediate referral recommended.
                </p>
              </section>
            </div>
          </section>
        </section>

        <section className="tsa-detail-right">
          <section className="tsa-card tsa-detail-card tsa-detail-card--protocol">
            <div className="tsa-detail-protocol-header">
              <div>
                <div className="tsa-detail-section-title">GHS Emergency Protocol</div>
                <div className="tsa-detail-protocol-subtitle">
                  Follow steps in order for severe bleeding
                </div>
              </div>
            </div>

            <ol className="tsa-protocol-list">
              <li>
                <label className="tsa-protocol-item">
                  <input type="checkbox" />
                  <span>
                    Confirm exact GPS location{' '}
                    <span className="tsa-protocol-meta">Verified &amp; locked, 6° 40' N, 1° 37' W</span>
                  </span>
                </label>
              </li>
              <li>
                <label className="tsa-protocol-item">
                  <input type="checkbox" />
                  <span>
                    Assess consciousness level{' '}
                    <span className="tsa-protocol-meta">Patient alert but disoriented</span>
                  </span>
                </label>
              </li>
              <li>
                <label className="tsa-protocol-item">
                  <input type="checkbox" />
                  <span>
                    Check fetal movement{' '}
                    <span className="tsa-protocol-meta">Ask patient to count movements</span>
                  </span>
                </label>
              </li>
              <li>
                <label className="tsa-protocol-item">
                  <input type="checkbox" />
                  <span>
                    Deploy blood bank alert{' '}
                    <span className="tsa-protocol-meta">Pre-emptively reserve O+ units</span>
                  </span>
                </label>
              </li>
            </ol>

            <section className="tsa-protocol-warning">
              <div className="tsa-protocol-warning-title">Protocol Deviation Warning</div>
              <p className="tsa-protocol-warning-body">
                One or more steps incomplete. Deviation in a mandatory sub-protocol. Confirm all
                tasks before dispatch decision.
              </p>
            </section>

            <div className="tsa-protocol-map">
              <div className="tsa-map-placeholder tsa-map-placeholder--mini">
                <span>Interactive service map placeholder</span>
              </div>
            </div>
          </section>
        </section>

        <section className="tsa-detail-footer">
          <div className="tsa-detail-footer-note">
            <span className="tsa-detail-footer-label">Final decision required</span>
            <span className="tsa-detail-footer-caption">
              Clinician oversight mandatory for closure
            </span>
          </div>
          <div className="tsa-detail-footer-actions">
            <button className="tsa-secondary-button">Resolved</button>
            <button className="tsa-secondary-button">Home Visit Required</button>
            <button className="tsa-primary-button tsa-primary-button--emergency">
              Emergency Referral
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

