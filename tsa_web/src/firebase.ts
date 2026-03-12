import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyDRewEIr_S2HXM2SuR386-0jm0YvUfTf_Q',
  authDomain: 'thryve-27216.firebaseapp.com',
  projectId: 'thryve-27216',
  storageBucket: 'thryve-27216.firebasestorage.app',
  messagingSenderId: '111101222893',
  appId: '1:111101222893:web:8c27ac4e49d8ff54a851e4',
  measurementId: 'G-OLWC219RRF',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
