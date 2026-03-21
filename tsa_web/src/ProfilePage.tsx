import React, { useEffect, useMemo, useRef, useState } from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { TsaLayout } from './TsaLayout'
import { useStaffWelcome } from './useStaffWelcome'
import { db, storage } from './firebase'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage'

export const ProfilePage: React.FC<{ onNavigate: (page: TsaPage) => void }> = ({
  onNavigate,
}) => {
  const { uid, loading, displayName, email, facilityName, accessLevel, initials, profilePhotoUrl } =
    useStaffWelcome()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxBytes = 5 * 1024 * 1024 // 5MB

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [selectedFile])

  const visiblePhotoUrl = previewUrl || profilePhotoUrl

  const staffLabel = useMemo(() => displayName || 'Staff', [displayName])

  const selectFile = () => fileInputRef.current?.click()

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null
    setError(null)

    if (!file) {
      setSelectedFile(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      setSelectedFile(null)
      return
    }
    if (file.size > maxBytes) {
      setError('Image is too large. Please use an image up to 5MB.')
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
  }

  const savePhoto = async () => {
    if (!uid) return
    if (!selectedFile) return

    setIsSaving(true)
    setError(null)
    try {
      const photoPath = `users/${uid}/profile_photo.jpg`
      const targetRef = storageRef(storage, photoPath)

      await uploadBytes(targetRef, selectedFile)
      const url = await getDownloadURL(targetRef)

      const staffRef = doc(db, 'staff', uid)
      const snap = await getDoc(staffRef)
      if (!snap.exists()) throw new Error('Staff profile not found.')

      const current = snap.data() as any
      // Write the full document to satisfy strict Firestore rules.
      const next = {
        ...current,
        profilePhotoUrl: url,
        updatedAt: serverTimestamp(),
      }
      await setDoc(staffRef, next)

      setSelectedFile(null)
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Unable to upload profile photo.')
    } finally {
      setIsSaving(false)
    }
  }

  const removePhoto = async () => {
    if (!uid) return
    setIsSaving(true)
    setError(null)
    try {
      if (!window.confirm('Remove your profile photo?')) return

      const photoPath = `users/${uid}/profile_photo.jpg`
      const targetRef = storageRef(storage, photoPath)

      // Storage delete can fail if file doesn't exist; treat as non-fatal.
      try {
        await deleteObject(targetRef)
      } catch {}

      const staffRef = doc(db, 'staff', uid)
      const snap = await getDoc(staffRef)
      if (!snap.exists()) throw new Error('Staff profile not found.')

      const current = snap.data() as any
      const next = {
        ...current,
        profilePhotoUrl: '',
        updatedAt: serverTimestamp(),
      }
      await setDoc(staffRef, next)

      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Unable to remove profile photo.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <TsaLayout navContext="profile" onNavigate={onNavigate}>
      <main className="p-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              View your details and update your profile picture.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 items-start">
            <section className="bg-white rounded-card shadow-card p-6">
              <div className="flex items-center gap-5">
                <div
                  className="w-[45px] h-[45px] rounded-full bg-tsa-accent-blue text-white flex items-center justify-center overflow-hidden"
                >
                  {loading ? (
                    <span className="text-[22px] font-semibold leading-none">{initials}</span>
                  ) : visiblePhotoUrl ? (
                    <img
                      src={visiblePhotoUrl}
                      alt={`${staffLabel} profile`}
                      className="w-[45px] h-[45px] object-cover"
                    />
                  ) : (
                    <span className="text-[22px] font-semibold leading-none">{initials}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{staffLabel}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {facilityName || 'Not linked to a facility'}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  // Use both the attribute + class to avoid any browser/native rendering quirks.
                  hidden
                  className="hidden"
                  onChange={onPickFile}
                />

                {selectedFile ? (
                  <div className="mt-4">
                    <div className="text-xs text-slate-600 mb-2">Preview</div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <img
                        src={previewUrl || undefined}
                        alt="Selected preview"
                        className="w-full max-h-64 object-cover"
                      />
                    </div>
                  </div>
                ) : null}

                {error ? <div className="mt-3 text-xs text-rose-600">{error}</div> : null}

                <div className="mt-5 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={selectFile}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-full bg-tsa-navy text-slate-50 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {selectedFile ? 'Choose another' : 'Change photo'}
                  </button>
                  <button
                    type="button"
                    onClick={savePhoto}
                    disabled={!selectedFile || isSaving}
                    className="px-3 py-2 rounded-full bg-tsa-accent-blue text-white text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving…' : 'Save photo'}
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={isSaving || (!profilePhotoUrl && !previewUrl)}
                    className="px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Remove photo
                  </button>
                  {selectedFile ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        setError(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      disabled={isSaving}
                      className="px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-card shadow-card p-6">
              <h2 className="text-sm font-semibold text-slate-900">Account details</h2>

              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Name</dt>
                  <dd className="font-medium text-slate-900">{loading ? '—' : staffLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900">{loading ? '—' : email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Facility</dt>
                  <dd className="font-medium text-slate-900">
                    {loading ? '—' : facilityName || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Access level</dt>
                  <dd className="font-medium text-slate-900">
                    {loading ? '—' : accessLevel || '—'}
                  </dd>
                </div>
              </dl>

            </section>
          </div>
        </div>
      </main>
    </TsaLayout>
  )
}

