import { useState }     from 'react'
import { Header }       from './components/Header'
import { FileUpload }   from './components/FileUpload'
import { Dashboard }    from './components/Dashboard'
import { useExtraction } from './hooks/useExtraction'

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const { status, data, error, step, extract, reset } = useExtraction()

  async function handleProcess() {
    if (file) await extract(file)
  }

  function handleReset() {
    setFile(null)
    reset()
  }

  return (
    <>
      <Header />

      <main className="main">

        {/* ── SETUP ─────────────────────────── */}
        {status !== 'loading' && status !== 'success' && (
          <div className="setup-card card">
            <div className="card-label">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload ROAR Document
            </div>

            <FileUpload onFile={f => setFile(f)} />

            <button
              className="btn-process"
              disabled={!file}
              onClick={handleProcess}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Extract ROI Values
            </button>
          </div>
        )}

        {/* ── LOADING ───────────────────────── */}
        {status === 'loading' && (
          <div className="loading-wrap">
            <div className="spinner" />
            <div className="loading-label">{step || 'Analyzing document…'}</div>
            <div className="loading-step">This may take 10–30 seconds for large files</div>
          </div>
        )}

        {/* ── ERROR ─────────────────────────── */}
        {error && (
          <div className="error-box">
            <div className="error-title">⚠ Extraction Error</div>
            <div className="error-body">{error}</div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────── */}
        {status === 'success' && data && (
          <Dashboard data={data} onReset={handleReset} />
        )}

      </main>
    </>
  )
}
