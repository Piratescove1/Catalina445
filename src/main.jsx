/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CompartmentsProvider } from './context/CompartmentsContext'
import AuthScreen from './components/AuthScreen'

function Gate() {
  const { status } = useAuth()
  return status === 'unlocked'
    ? <CompartmentsProvider><App /></CompartmentsProvider>
    : <AuthScreen />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </StrictMode>,
)
