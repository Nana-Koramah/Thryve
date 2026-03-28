import React from 'react'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { PatientEpdsResponsesPage } from './PatientEpdsResponsesPage'

afterEach(() => {
  cleanup()
})

vi.mock('./TsaLayout', () => ({
  TsaLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('./firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn((_ref: unknown, onNext: (snap: { exists: () => boolean; data: () => Record<string, unknown> }) => void) => {
    onNext({
      exists: () => true,
      data: () => ({ fullName: 'Ama Mensah' }),
    })
    return () => {}
  }),
}))

vi.mock('./usePatientClinicalData', () => ({
  usePatientClinicalData: vi.fn(() => ({
    ppdScreenings: [
      {
        id: 'ppd-1',
        conductedAt: new Date('2026-03-01T10:00:00Z'),
        totalScore: 11,
        riskLevel: 'medium',
        textSummary: 'Patient reported anxious mood.',
        language: 'en',
        screeningAudioUrl: null,
        answers: [
          {
            id: 'q4',
            questionText: 'I have been anxious or worried for no good reason…',
            score: 2,
            selectedLabel: 'Yes, sometimes',
            answerText: 'Mostly at night.',
            audioUrl: 'https://example.com/a1.m4a',
          },
        ],
      },
    ],
    loading: false,
    error: null,
  })),
}))

describe('PatientEpdsResponsesPage', () => {
  it('renders selected answer text and audio control', () => {
    render(<PatientEpdsResponsesPage motherUid="mother-1" onNavigate={() => {}} />)

    fireEvent.click(screen.getByText('Show responses'))

    expect(screen.getByText('Answer selected')).toBeInTheDocument()
    expect(screen.getByText('Yes, sometimes')).toBeInTheDocument()
    expect(screen.getByText('Notes: Mostly at night.')).toBeInTheDocument()
    expect(screen.getByText('Voice note')).toBeInTheDocument()
  })

  it('navigates back to patient details', () => {
    const onNavigate = vi.fn()
    render(<PatientEpdsResponsesPage motherUid="mother-1" onNavigate={onNavigate} />)

    fireEvent.click(screen.getByText('← Back to patient details'))

    expect(onNavigate).toHaveBeenCalledWith('patientDetail')
  })
})
