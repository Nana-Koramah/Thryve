import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'

export function initialsFromDisplayName(name: string): string {
  // Mobile app uses a single first-letter avatar fallback.
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const letter = trimmed[0]
  return letter.toUpperCase()
}

/** Loads staff displayName from Firestore for the signed-in user. */
export function useStaffWelcome(): {
  uid: string | null
  welcomeLabel: string
  initials: string
  loading: boolean
  displayName: string
  email: string
  facilityName: string
  facilityId: string
  accessLevel: string
  profilePhotoUrl: string
} {
  const [uid, setUid] = useState<string | null>(null)
  const [welcomeLabel, setWelcomeLabel] = useState('Welcome')
  const [initials, setInitials] = useState('–')
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [facilityId, setFacilityId] = useState('')
  const [accessLevel, setAccessLevel] = useState('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')

  useEffect(() => {
    let unsubscribeStaff: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUid(null)
        setWelcomeLabel('Welcome')
        setInitials('–')
        setDisplayName('')
        setEmail('')
        setFacilityName('')
        setAccessLevel('')
        setProfilePhotoUrl('')
        setLoading(false)
        if (unsubscribeStaff) unsubscribeStaff()
        return
      }
      setUid(user.uid)
      setLoading(true)
      if (unsubscribeStaff) unsubscribeStaff()

      const staffRef = doc(db, 'staff', user.uid)
      unsubscribeStaff = onSnapshot(
        staffRef,
        (snap) => {
          const staff = snap.exists() ? snap.data() : null
          const display =
            staff && typeof staff.displayName === 'string' ? staff.displayName.trim() : ''
          const emailFromDoc =
            staff && typeof staff.email === 'string' ? staff.email : ''
          const facility =
            staff && typeof staff.facilityName === 'string' ? staff.facilityName : ''
          const facId =
            staff && typeof staff.facilityId === 'string' ? staff.facilityId.trim() : ''
          const access =
            staff && typeof staff.accessLevel === 'string' ? staff.accessLevel : ''
          const photo =
            staff && typeof staff.profilePhotoUrl === 'string' ? staff.profilePhotoUrl : ''

          const emailLocal = user.email?.split('@')[0] ?? ''
          const name = display || emailLocal || 'Staff'
          const fullEmail = emailFromDoc || user.email || ''

          setWelcomeLabel(`Welcome ${name}`)
          setInitials(initialsFromDisplayName(name))
          setDisplayName(name)
          setEmail(fullEmail)
          setFacilityName(facility)
          setFacilityId(facId)
          setAccessLevel(access)
          setProfilePhotoUrl(photo)
          setLoading(false)
        },
        () => {
          const fallback = user.email?.split('@')[0] ?? 'Staff'
          setWelcomeLabel(`Welcome ${fallback}`)
          setInitials(initialsFromDisplayName(fallback))
          setDisplayName(fallback)
          setEmail(user.email ?? '')
          setFacilityName('')
          setFacilityId('')
          setAccessLevel('')
          setProfilePhotoUrl('')
          setLoading(false)
        },
      )
    })
    return () => {
      unsubAuth()
      if (unsubscribeStaff) unsubscribeStaff()
    }
  }, [])

  return {
    uid,
    welcomeLabel,
    initials,
    loading,
    displayName,
    email,
    facilityName,
    facilityId,
    accessLevel,
    profilePhotoUrl,
  }
}
