import { useEffect } from 'react'
import { useVoice } from '../hooks/useVoice'

export default function VoiceButton({ onCommand, context = '' }) {
  const { listening, transcript, error, supported, startListening, stopListening } = useVoice({ onCommand })

  // Auto-stop after 8 seconds to avoid hanging
  useEffect(() => {
    if (!listening) return
    const t = setTimeout(stopListening, 8000)
    return () => clearTimeout(t)
  }, [listening, stopListening])

  return (
    <div className="voice-wrap">
      <button
        className={`voice-btn ${listening ? 'voice-btn--listening' : ''} ${!supported ? 'voice-btn--disabled' : ''}`}
        onClick={!supported ? undefined : listening ? stopListening : startListening}
        disabled={!supported}
        aria-label={!supported ? 'Voice not supported' : listening ? 'Stop listening' : 'Start voice command'}
        title={!supported ? 'Voice requires HTTPS — not available over local HTTP' : ''}
      >
        <span className="voice-icon">{listening ? '⏹' : '🎤'}</span>
        <span className="voice-label">{!supported ? 'Voice (HTTPS only)' : listening ? 'Listening…' : 'Voice'}</span>
      </button>
      {context && !listening && (
        <p className="voice-hint">{context}</p>
      )}
      {transcript && (
        <p className="voice-transcript">"{transcript}"</p>
      )}
      {error && (
        <p className="voice-error">
          {error === 'not-allowed' ? 'Microphone permission denied' : `Error: ${error}`}
        </p>
      )}
    </div>
  )
}
