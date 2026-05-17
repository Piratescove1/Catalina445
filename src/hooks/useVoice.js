import { useState, useRef, useCallback } from 'react'

const wordToNum = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  a:1,an:1,half:0.5,dozen:12,'half a dozen':6 }

function parseQty(str) {
  const n = parseInt(str, 10)
  if (!isNaN(n)) return n
  return wordToNum[str.toLowerCase()] ?? 1
}

function parseCommand(transcript) {
  const t = transcript.trim().toLowerCase()
    .replace(/^(let['']?s|please|can you|hey|ok|okay|now)\s+/, '')

  // Remove <N> <unit> of <item> [from compartment N]
  let m = t.match(/^(?:remove|take out|use|used)\s+(\w+)\s+\w+\s+of\s+(.+?)(?:\s+from\s+compartment\s+\d+)?$/)
  if (m) return { action: 'remove', qty: parseQty(m[1]), item: m[2].trim() }

  // Remove <N> <item> [from compartment N]
  m = t.match(/^(?:remove|take out|use|used)\s+(\w+)\s+(.+?)(?:\s+from\s+compartment\s+\d+)?$/)
  if (m) return { action: 'remove', qty: parseQty(m[1]), item: m[2].trim() }

  // Add <item> to/in compartment <N>  e.g. "add engine oil to compartment 23"
  m = t.match(/^(?:add|put|stow|loaded?)\s+(\d+|\w+)\s+(?:\w+\s+of\s+)?(.+?)\s+(?:to|in)\s+compartment\s+(\d+)$/)
  if (m) {
    const maybeQty = parseQty(m[1])
    // If first token looks like a plain word (not a number/quantity word), treat whole phrase as item name
    const isQty = /^\d+$/.test(m[1]) || wordToNum[m[1]] !== undefined
    const item = isQty ? m[2].trim() : (m[1] + ' ' + m[2]).trim()
    const qty = isQty ? maybeQty : 1
    return { action: 'add', qty, item, compartmentNum: parseInt(m[3], 10) }
  }

  // Add <N> <unit> of <item>  e.g. "add 6 cans of beans"
  m = t.match(/^(?:add|put|stow|loaded?)\s+(\w+)\s+\w+\s+of\s+(.+)$/)
  if (m) return { action: 'add', qty: parseQty(m[1]), item: m[2].trim() }

  // Add <N> <item>
  m = t.match(/^(?:add|put|stow|loaded?)\s+(\w+)\s+(.+)$/)
  if (m) return { action: 'add', qty: parseQty(m[1]), item: m[2].trim() }

  // How many <item> / Check <item>
  m = t.match(/^(?:how many|check|count)\s+(.+)$/)
  if (m) return { action: 'check', item: m[1].replace(/\s*do\s+(?:we|i)\s+have.*$/, '').trim() }

  // Start voyage to <destination>
  m = t.match(/^(?:start|begin|log)\s+voyage(?:\s+to\s+(.+))?$/)
  if (m) return { action: 'startVoyage', destination: m[1]?.trim() || '' }

  // End voyage
  if (/^(?:end|stop|finish|complete)\s+voyage$/.test(t))
    return { action: 'endVoyage' }

  // Add note / Log note
  m = t.match(/^(?:log|note|add note)\s+(.+)$/)
  if (m) return { action: 'note', text: m[1].trim() }

  return null
}

export function useVoice({ onCommand }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const startListening = useCallback(() => {
    if (!supported) { setError('Voice not supported on this browser.'); return }
    if (listening) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => { setListening(true); setTranscript(''); setError('') }
    recognition.onend = () => setListening(false)
    recognition.onerror = (e) => { setError(e.error); setListening(false) }

    recognition.onresult = (e) => {
      // Try each alternative until one parses
      for (let i = 0; i < e.results[0].length; i++) {
        const text = e.results[0][i].transcript
        setTranscript(text)
        const cmd = parseCommand(text)
        if (cmd) { onCommand(cmd, text); return }
      }
      // No alternative parsed — show what was heard
      setTranscript(e.results[0][0].transcript)
      onCommand(null, e.results[0][0].transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [listening, supported, onCommand])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, transcript, error, supported, startListening, stopListening }
}
