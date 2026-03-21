import React from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { TsaLayout } from './TsaLayout'

export const RedFlagDetailPage: React.FC<{ onNavigate: (page: TsaPage) => void }> = ({
  onNavigate,
}) => {
  return (
    <TsaLayout navContext="caseDetail" onNavigate={onNavigate}>
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
    </TsaLayout>
  )
}

