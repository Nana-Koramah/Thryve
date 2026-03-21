import React from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { TsaLayout } from './TsaLayout'

/** Dummy notifications for doctors */
const NOTIFICATIONS = [
  {
    id: '1',
    type: 'red_flag',
    title: 'New red flag alert',
    body: 'Patient #GHA-0022-81 (Adabraka PolyClinic) reported severe bleeding. Time since alert: 42m.',
    time: '12 min ago',
    unread: true,
  },
  {
    id: '2',
    type: 'ppd',
    title: 'High PPD screening score',
    body: 'Patient #GHA-104F-33 (Ridge Hospital Annex) completed EPDS with score 14. High risk.',
    time: '28 min ago',
    unread: true,
  },
  {
    id: '3',
    type: 'check_in',
    title: 'Symptom check-in – fever',
    body: 'Patient #GHA-17E2-19 logged fever 38.5°C. Facility: Korle-Bu District Center.',
    time: '1 hr ago',
    unread: false,
  },
  {
    id: '4',
    type: 'red_flag',
    title: 'Red flag escalated',
    body: 'Case #GHA-55K9-04 (Tema General Hospital) escalated. Critical priority.',
    time: '2 hrs ago',
    unread: false,
  },
  {
    id: '5',
    type: 'system',
    title: 'Weekly summary ready',
    body: 'Greater Accra facility report for Week 12 is available for download.',
    time: '5 hrs ago',
    unread: false,
  },
  {
    id: '6',
    type: 'check_in',
    title: 'Missed check-in reminder',
    body: '3 patients from your facility have not checked in this week. Review list in Live Feed.',
    time: 'Yesterday',
    unread: false,
  },
]

export const NotificationsPage: React.FC<{ onNavigate: (page: TsaPage) => void }> = ({
  onNavigate,
}) => {
  return (
    <TsaLayout navContext="notifications" onNavigate={onNavigate}>
      <main className="tsa-main tsa-main--notifications">
        <section className="tsa-card tsa-notifications-card">
          <header className="tsa-notifications-header">
            <h1 className="tsa-notifications-title">Notifications</h1>
            <span className="tsa-notifications-badge">
              {NOTIFICATIONS.filter((n) => n.unread).length} unread
            </span>
          </header>

          <ul className="tsa-notifications-list">
            {NOTIFICATIONS.map((n) => (
              <li
                key={n.id}
                className={`tsa-notification-item ${n.unread ? 'tsa-notification-item--unread' : ''}`}
              >
                <div className="tsa-notification-dot" />
                <div className="tsa-notification-content">
                  <div className="tsa-notification-title">{n.title}</div>
                  <p className="tsa-notification-body">{n.body}</p>
                  <time className="tsa-notification-time">{n.time}</time>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </TsaLayout>
  )
}
