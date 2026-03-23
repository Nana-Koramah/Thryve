import React, { useCallback, useState } from 'react'
import { AlertHistoryPage } from './AlertHistoryPage'
import { DashboardPage } from './DashboardPage'
import { EscalationPage } from './EscalationPage'
import { RedFlagDetailPage } from './RedFlagDetailPage'
import { PatientDetailPage } from './PatientDetailPage'
import { PatientRecordPage } from './PatientRecordPage'
import { PatientEpdsResponsesPage } from './PatientEpdsResponsesPage'
import { ProfilePage } from './ProfilePage'

export type TsaPage =
  | 'live'
  | 'alertHistory'
  | 'escalations'
  | 'caseDetail'
  | 'patientDetail'
  | 'patientEpds'
  | 'patientRecord'
  | 'profile'

export const App: React.FC = () => {
  const [page, setPage] = useState<TsaPage>('live')
  const [selectedMotherUid, setSelectedMotherUid] = useState<string | null>(null)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  /** Where “Back” on patient profile returns (Live Feed, Alert history, or Red-flag Alerts). */
  const [patientBackPage, setPatientBackPage] = useState<TsaPage>('live')

  const navigate = useCallback((next: TsaPage) => {
    if (next === 'patientRecord') {
      setPage('patientRecord')
      return
    }
    if (next === 'patientEpds') {
      setPage('patientEpds')
      return
    }
    if (next === 'patientDetail') {
      setPage('patientDetail')
      return
    }
    setSelectedMotherUid(null)
    if (next !== 'caseDetail') {
      setSelectedAlertId(null)
    }
    setPage(next)
  }, [])

  if (page === 'patientRecord') {
    return <PatientRecordPage motherUid={selectedMotherUid} onNavigate={navigate} />
  }

  if (page === 'patientEpds') {
    return <PatientEpdsResponsesPage motherUid={selectedMotherUid} onNavigate={navigate} />
  }

  if (page === 'patientDetail') {
    return (
      <PatientDetailPage
        motherUid={selectedMotherUid}
        backPage={patientBackPage}
        onNavigate={navigate}
      />
    )
  }

  if (page === 'caseDetail') {
    return <RedFlagDetailPage alertId={selectedAlertId} onNavigate={navigate} />
  }

  if (page === 'escalations') {
    return (
      <EscalationPage
        onNavigate={navigate}
        onManageCase={(motherUid) => {
          if (!motherUid) return
          setPatientBackPage('escalations')
          setSelectedMotherUid(motherUid)
          setPage('patientDetail')
        }}
      />
    )
  }

  if (page === 'alertHistory') {
    return (
      <AlertHistoryPage
        onNavigate={navigate}
        onOpenPatientDetail={(uid) => {
          setPatientBackPage('alertHistory')
          setSelectedMotherUid(uid)
          setPage('patientDetail')
        }}
      />
    )
  }

  if (page === 'profile') {
    return <ProfilePage onNavigate={navigate} />
  }

  return (
    <DashboardPage
      onNavigate={navigate}
      onOpenPatientDetail={(uid) => {
        setPatientBackPage('live')
        setSelectedMotherUid(uid)
        setPage('patientDetail')
      }}
    />
  )
}
