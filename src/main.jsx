/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BoatsProvider, useBoats } from './context/BoatsContext'
import { CompartmentsProvider } from './context/CompartmentsContext'
import AuthScreen from './components/AuthScreen'

// Remount the app (and per-boat contexts) whenever the active boat changes, so
// every hook re-reads that boat's data.
function BoatScoped() {
  const { activeBoatId } = useBoats()
  return (
    <CompartmentsProvider key={activeBoatId}>
      <App />
    </CompartmentsProvider>
  )
}

function Gate() {
  const { status } = useAuth()
  if (status !== 'unlocked') return <AuthScreen />
  return (
    <BoatsProvider>
      <BoatScoped />
    </BoatsProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </StrictMode>,
)
