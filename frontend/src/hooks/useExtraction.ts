import { useState } from 'react'
import type { RoarData } from '../types/roar'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface ExtractionState {
  status:  Status
  data:    RoarData | null
  error:   string | null
  step:    string
}

interface UseExtractionReturn extends ExtractionState {
  extract: (file: File) => Promise<void>
  reset:   () => void
}

const IDLE: ExtractionState = { status: 'idle', data: null, error: null, step: '' }

export function useExtraction(): UseExtractionReturn {
  const [state, setState] = useState<ExtractionState>(IDLE)

  async function extract(file: File) {
    setState({ status: 'loading', data: null, error: null, step: 'Uploading file…' })

    const body = new FormData()
    body.append('file', file)

    try {
      setState(s => ({ ...s, step: 'Analyzing with Claude AI…' }))

      const res = await fetch('/api/extract', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? `Server error ${res.status}`)
      }

      setState({ status: 'success', data: json as RoarData, error: null, step: '' })
    } catch (err) {
      setState({
        status: 'error',
        data:   null,
        error:  err instanceof Error ? err.message : String(err),
        step:   '',
      })
    }
  }

  function reset() {
    setState(IDLE)
  }

  return { ...state, extract, reset }
}
