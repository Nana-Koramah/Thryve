import React, { useState } from 'react'
import { DashboardPage } from './DashboardPage'
import { EscalationPage } from './EscalationPage'
import { RedFlagDetailPage } from './RedFlagDetailPage'

export type TsaPage = 'live' | 'escalations' | 'caseDetail'

export const App: React.FC = () => {
  const [page, setPage] = useState<TsaPage>('live')

  if (page === 'caseDetail') {
    return <RedFlagDetailPage onNavigate={setPage} />
  }

  if (page === 'escalations') {
    return <EscalationPage onNavigate={setPage} />
  }

  return <DashboardPage onNavigate={setPage} />
}

