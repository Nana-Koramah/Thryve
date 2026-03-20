import React, { useState } from 'react'
import { DashboardPage } from './DashboardPage'
import { EscalationPage } from './EscalationPage'
import { RedFlagDetailPage } from './RedFlagDetailPage'
import { PatientDetailPage } from './PatientDetailPage'
import { NotificationsPage } from './NotificationsPage'

export type TsaPage = 'live' | 'escalations' | 'caseDetail' | 'patientDetail' | 'notifications'

export const App: React.FC = () => {
  const [page, setPage] = useState<TsaPage>('live')

  if (page === 'patientDetail') {
    return <PatientDetailPage onNavigate={setPage} />
  }

  if (page === 'caseDetail') {
    return <RedFlagDetailPage onNavigate={setPage} />
  }

  if (page === 'escalations') {
    return <EscalationPage onNavigate={setPage} />
  }

  if (page === 'notifications') {
    return <NotificationsPage onNavigate={setPage} />
  }

  return <DashboardPage onNavigate={setPage} />
}

