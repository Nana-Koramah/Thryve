import React from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { BellIcon, SettingsIcon } from './TopIcons'

export const EscalationPage: React.FC<{ onNavigate: (page: TsaPage) => void }> = ({
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
            <button className="tsa-nav-item tsa-nav-item--active">Escalations</button>
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

      <main className="tsa-main tsa-main--escalation">
        <section className="tsa-escalation-left">
          <header className="tsa-page-header">
            <div />
            <div className="tsa-escalation-metrics">
              <div className="tsa-escalation-metric">
                <div className="tsa-metric-label">Active Alerts</div>
                <div className="tsa-metric-value">12</div>
                <div className="tsa-metric-caption tsa-metric-caption--negative">+20%</div>
              </div>
              <div className="tsa-escalation-metric">
                <div className="tsa-metric-label">Avg Breach Time</div>
                <div className="tsa-metric-value">14m 20s</div>
                <div className="tsa-metric-caption">Past Threshold</div>
              </div>
            </div>
          </header>

          <section className="tsa-card tsa-escalation-table-card">
            <header className="tsa-card-header">
              <div className="tsa-card-header-actions">
                <button className="tsa-secondary-button">Filter</button>
                <button className="tsa-secondary-button">Sort: Time</button>
              </div>
            </header>

            <div className="tsa-escalation-table">
              <div className="tsa-escalation-header-row">
                <span>Patient ID</span>
                <span>Origin Facility</span>
                <span>Elapsed</span>
                <span>Priority</span>
                <span>Action</span>
              </div>

              <div className="tsa-escalation-row">
                <span className="tsa-patient-id">#GHA-0022-81</span>
                <span className="tsa-facility-name">Adabraka PolyClinic</span>
                <span className="tsa-time-breach tsa-time-breach--critical">42m 12s</span>
                <span className="tsa-pill tsa-pill--urgent">Critical</span>
                <button
                  className="tsa-link-button tsa-link-button--inline"
                  onClick={() => onNavigate('caseDetail')}
                >
                  Manage Case
                </button>
              </div>

              <div className="tsa-escalation-row">
                <span className="tsa-patient-id">#GHA-104F-33</span>
                <span className="tsa-facility-name">Ridge Hospital Annex</span>
                <span className="tsa-time-breach tsa-time-breach--warning">38m 05s</span>
                <span className="tsa-pill tsa-pill--ppd">High</span>
                <button
                  className="tsa-link-button tsa-link-button--inline"
                  onClick={() => onNavigate('caseDetail')}
                >
                  Manage Case
                </button>
              </div>

              <div className="tsa-escalation-row">
                <span className="tsa-patient-id">#GHA-17E2-19</span>
                <span className="tsa-facility-name">Korle-Bu District Center</span>
                <span className="tsa-time-breach tsa-time-breach--ok">22m 10s</span>
                <span className="tsa-pill tsa-pill--stable">Borderline</span>
                <button
                  className="tsa-link-button tsa-link-button--inline"
                  onClick={() => onNavigate('caseDetail')}
                >
                  Manage Case
                </button>
              </div>
            </div>
          </section>
        </section>

        <aside className="tsa-escalation-right">
          <section className="tsa-card tsa-reroute-card">
            <header className="tsa-card-header tsa-card-header--space-between">
              <span className="tsa-escalated-pill">Escalated</span>
            </header>

            <div className="tsa-reroute-details">
              <div className="tsa-reroute-row">
                <span className="tsa-reroute-label">Failing Facility</span>
                <span className="tsa-reroute-value">Adabraka PolyClinic</span>
              </div>
              <div className="tsa-reroute-row">
                <span className="tsa-reroute-label">Available Staff</span>
                <span className="tsa-reroute-value tsa-reroute-value--critical">
                  1/4 (Crit. Low)
                </span>
              </div>
              <div className="tsa-reroute-row">
                <span className="tsa-reroute-label">Primary Contact</span>
                <span className="tsa-reroute-value">Nurse M. Boakye</span>
              </div>
            </div>

            <div className="tsa-reroute-recommend">
              <div className="tsa-card tsa-reroute-option">
                <div className="tsa-reroute-option-header">Recommended Reroute</div>
                <div className="tsa-reroute-option-body">
                  <div className="tsa-reroute-option-icon">GR</div>
                  <div>
                    <div className="tsa-reroute-option-title">Greater Accra Regional</div>
                    <div className="tsa-reroute-option-sub">
                      4.3km away · 12 Beds Available
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tsa-reroute-actions">
              <button className="tsa-secondary-button tsa-secondary-button--full">
                Call
              </button>
              <button className="tsa-primary-button tsa-primary-button--full">
                Reroute
              </button>
            </div>

            <button className="tsa-secondary-button tsa-secondary-button--full tsa-reroute-notify">
              Notify Regional Supervisor
            </button>
          </section>

          <section className="tsa-card tsa-escalation-map-card">
            <div className="tsa-map-placeholder">
              <span>Map placeholder – active breaches across Accra</span>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

