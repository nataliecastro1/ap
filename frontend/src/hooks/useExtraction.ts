import { useState, useCallback } from 'react'
import type { RoarData } from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface ExtractionState {
  status: Status
  data:   RoarData | null
  error:  string | null
  step:   string
}

interface UseExtractionReturn extends ExtractionState {
  extract: (file: File, docType: string, publisher: string) => Promise<void>
  reset:   () => void
}

const IDLE: ExtractionState = { status: 'idle', data: null, error: null, step: '' }

export function useExtraction(): UseExtractionReturn {
  const [state, setState] = useState<ExtractionState>(IDLE)

  const extract = useCallback(async (file: File, docType: string, publisher: string) => {
    setState({ status: 'loading', data: null, error: null, step: 'Uploading file…' })

    const body = new FormData()
    body.append('file',          file)
    body.append('document_type', docType)
    body.append('publisher',     publisher)

    try {
      setState(s => ({ ...s, step: 'Analyzing with Claude AI…' }))

      const res  = await fetch('/api/extract', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? json.detail ?? `Server error ${res.status}`)
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
  }, [])

  const reset = useCallback(() => setState(IDLE), [])

  return { ...state, extract, reset }
}
