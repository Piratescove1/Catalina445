/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthScreen from './components/AuthScreen'

function Gate() {
  const { status } = useAuth()
  return status === 'unlocked' ? <App /> : <AuthScreen />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </StrictMode>,
)
