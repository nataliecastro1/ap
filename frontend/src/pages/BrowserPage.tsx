import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { useAuth } from '../hooks/useAuth'
import { useExtraction } from '../hooks/useExtraction'
import { CLIENTS, PUBLISHERS, YEARS } from '../data/mockClients'
import { formatBytes } from '../utils/formatting'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface BrowserSelection {
  client: string
  year: string
  publisher: string
  fileType: 'ROAR' | 'ELP'
  file?: File
}

interface ModalState {
  open: boolean
  client: string
  publisher: string
  fileType: 'ROAR' | 'ELP'
  file: File | null
}

export default function BrowserPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { status, error, step, extract } = useExtraction()

  // File browser state
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [expandedPublisher, setExpandedPublisher] = useState<string | null>(null)

  // Upload drop zone state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modal state
  const [modal, setModal] = useState<ModalState>({
    open: false,
    client: '',
    publisher: '',
    fileType: 'ROAR',
    file: null,
  })
  const [modalDocType, setModalDocType] = useState<'ROAR' | 'ELP'>('ROAR')
  const [modalPublisher, setModalPublisher] = useState('')

  function openModalForBrowser(sel: BrowserSelection) {
    setModal({
      open: true,
      client: sel.client,
      publisher: sel.publisher,
      fileType: sel.fileType,
      file: sel.file ?? null,
    })
    setModalDocType(sel.fileType)
    setModalPublisher(sel.publisher)
  }

  function openModalForUpload(file: File) {
    setModal({ open: true, client: '', publisher: '', fileType: 'ROAR', file })
    setModalDocType('ROAR')
    setModalPublisher('')
  }

  function closeModal() {
    setModal(m => ({ ...m, open: false }))
  }

  // ── File browser handlers ──────────────────────────────────────────────────

  function handleLetterClick(letter: string) {
    setActiveLetter(prev => (prev === letter ? null : letter))
    setExpandedClient(null)
    setExpandedYear(null)
    setExpandedPublisher(null)
  }

  function handleClientClick(client: string) {
    setExpandedClient(prev => (prev === client ? null : client))
    setExpandedYear(null)
    setExpandedPublisher(null)
  }

  function handleYearClick(year: string) {
    setExpandedYear(prev => (prev === year ? null : year))
    setExpandedPublisher(null)
  }

  function handlePublisherClick(publisher: string) {
    setExpandedPublisher(prev => (prev === publisher ? null : publisher))
  }

  function handleProcessFile(client: string, publisher: string, fileType: 'ROAR' | 'ELP') {
    openModalForBrowser({ client, publisher, year: expandedYear ?? '', fileType })
  }

  // ── Upload drop zone handlers ──────────────────────────────────────────────

  function acceptFile(f: File) {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'pptx') {
      alert('Please upload a PDF or PPTX file.')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      alert('File exceeds 50 MB limit.')
      return
    }
    setUploadFile(f)
    openModalForUpload(f)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) acceptFile(f)
  }

  async function handleModalExtract() {
    if (!modal.file) return
    await extract(modal.file, modalDocType, modalPublisher)
  }

  return (
    <div className="browser-page">
      <Header user={user ?? undefined} onLogout={logout} />

      <main className="browser-main">
        <div className="browser-layout">

          {/* ── LEFT PANEL: File Browser ──────────────────────────────── */}
          <div className="browser-left">
            <div className="panel-header">
              <div className="panel-title-row">
                <span className="panel-title">Client Files</span>
                <span className="sharepoint-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
                    <path d="M12.5 2C9.46 2 7 4.46 7 7.5c0 .63.12 1.23.32 1.79C5.36 9.86 4 11.53 4 13.5 4 15.98 6.02 18 8.5 18H19c2.21 0 4-1.79 4-4 0-1.93-1.36-3.54-3.18-3.93C19.94 9.6 20 9.06 20 8.5 20 5.46 17.54 3 14.5 3c-.7 0-1.37.13-1.98.36C12.35 3.13 12.43 3 12.5 2z"/>
                  </svg>
                  SharePoint
                </span>
              </div>
            </div>

            {/* A-Z alphabet grid */}
            <div className="alpha-grid">
              {ALPHABET.map(letter => (
                <button
                  key={letter}
                  className={`alpha-btn${activeLetter === letter ? ' active' : ''}${!CLIENTS[letter] ? ' disabled' : ''}`}
                  onClick={() => CLIENTS[letter] && handleLetterClick(letter)}
                  disabled={!CLIENTS[letter]}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Tree */}
            <div className="file-tree">
              {activeLetter && CLIENTS[activeLetter] && (
                <div className="tree-letter-section">
                  <div className="tree-letter-heading">{activeLetter}</div>
                  {CLIENTS[activeLetter].map(client => (
                    <div key={client} className="tree-client">
                      <button
                        className={`tree-item tree-item-client${expandedClient === client ? ' expanded' : ''}`}
                        onClick={() => handleClientClick(client)}
                      >
                        <span className="tree-arrow">{expandedClient === client ? '▾' : '▸'}</span>
                        <span className="tree-icon">🏢</span>
                        <span className="tree-name">{client}</span>
                      </button>

                      {expandedClient === client && YEARS.map(year => (
                        <div key={year} className="tree-year">
                          <button
                            className={`tree-item tree-item-year${expandedYear === year ? ' expanded' : ''}`}
                            onClick={() => handleYearClick(year)}
                          >
                            <span className="tree-arrow">{expandedYear === year ? '▾' : '▸'}</span>
                            <span className="tree-icon">📁</span>
                            <span className="tree-name">{year}</span>
                          </button>

                          {expandedYear === year && PUBLISHERS.map(publisher => (
                            <div key={publisher} className="tree-publisher">
                              <button
                                className={`tree-item tree-item-publisher${expandedPublisher === publisher ? ' expanded' : ''}`}
                                onClick={() => handlePublisherClick(publisher)}
                              >
                                <span className="tree-arrow">{expandedPublisher === publisher ? '▾' : '▸'}</span>
                                <span className="tree-icon">🏷️</span>
                                <span className="tree-name">{publisher}</span>
                              </button>

                              {expandedPublisher === publisher && (
                                <div className="tree-files">
                                  {(['ROAR', 'ELP'] as const).map(ft => (
                                    <div key={ft} className="tree-file-item">
                                      <span className="tree-file-icon">{ft === 'ROAR' ? '📄' : '📊'}</span>
                                      <span className="tree-file-name">{ft} Report</span>
                                      <span className="tree-file-type-badge">{ft}</span>
                                      <button
                                        className="btn-process-file"
                                        onClick={() => handleProcessFile(client, publisher, ft)}
                                      >
                                        Process
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {!activeLetter && (
                <div className="tree-empty">
                  <div className="tree-empty-icon">📂</div>
                  <div className="tree-empty-text">Select a letter above to browse clients</div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Upload ───────────────────────────────────── */}
          <div className="browser-right">
            <div className="panel-header">
              <div className="panel-title-row">
                <span className="panel-title">Upload Document</span>
              </div>
              <p className="panel-subtitle">Drag &amp; drop a PDF or PPTX file to process it directly</p>
            </div>

            <div
              className={`upload-drop-zone${dragOver ? ' drag-over' : ''}${uploadFile ? ' has-file' : ''}`}
              onClick={() => !uploadFile && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {!uploadFile ? (
                <>
                  <div className="upload-drop-icon">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="upload-drop-title">Drop your document here</div>
                  <div className="upload-drop-hint">PDF or PPTX · Max 50 MB</div>
                  <button className="btn-browse-file" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                    Browse Files
                  </button>
                </>
              ) : (
                <div className="upload-file-info">
                  <div className="upload-file-icon">
                    {uploadFile.name.endsWith('.pdf') ? '📄' : '📊'}
                  </div>
                  <div className="upload-file-details">
                    <div className="upload-file-name">{uploadFile.name}</div>
                    <div className="upload-file-size">{formatBytes(uploadFile.size)}</div>
                  </div>
                  <button
                    className="upload-file-clear"
                    onClick={e => { e.stopPropagation(); setUploadFile(null) }}
                    title="Remove"
                  >✕</button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />

            <p className="upload-or-hint">
              <span className="upload-or-line" />
              <span className="upload-or-text">or select from the client directory on the left</span>
              <span className="upload-or-line" />
            </p>

            {/* Supported formats info */}
            <div className="format-cards">
              <div className="format-card">
                <span className="format-icon">📄</span>
                <div>
                  <div className="format-name">ROAR Documents</div>
                  <div className="format-desc">Risk &amp; Opportunity Analysis Report</div>
                </div>
                <span className="format-badge format-badge-roar">PDF/PPTX</span>
              </div>
              <div className="format-card">
                <span className="format-icon">📊</span>
                <div>
                  <div className="format-name">ELP Documents</div>
                  <div className="format-desc">Effective License Position</div>
                </div>
                <span className="format-badge format-badge-elp">PDF/PPTX</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal overlay ─────────────────────────────────────────────────── */}
      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Process Document</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* File details */}
              <div className="modal-file-strip">
                <div className="modal-detail">
                  <span className="modal-detail-label">Client</span>
                  <span className="modal-detail-value">{modal.client || 'Uploaded file'}</span>
                </div>
                {modal.client && (
                  <div className="modal-detail">
                    <span className="modal-detail-label">File</span>
                    <span className="modal-detail-value">{modal.fileType} Report</span>
                  </div>
                )}
                {modal.file && (
                  <div className="modal-detail">
                    <span className="modal-detail-label">Filename</span>
                    <span className="modal-detail-value file-name-truncate">{modal.file.name}</span>
                  </div>
                )}
              </div>

              {/* Document type */}
              <div className="modal-field">
                <label className="modal-field-label">Document Type</label>
                <div className="modal-radio-group">
                  {(['ROAR', 'ELP'] as const).map(dt => (
                    <label key={dt} className={`modal-radio-btn${modalDocType === dt ? ' selected' : ''}`}>
                      <input
                        type="radio"
                        name="docType"
                        value={dt}
                        checked={modalDocType === dt}
                        onChange={() => setModalDocType(dt)}
                      />
                      <span className="modal-radio-icon">{dt === 'ROAR' ? '📄' : '📊'}</span>
                      <span>{dt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Publisher */}
              <div className="modal-field">
                <label className="modal-field-label" htmlFor="modal-publisher">Publisher</label>
                <input
                  id="modal-publisher"
                  className="modal-input"
                  type="text"
                  list="publisher-list"
                  placeholder="e.g. Microsoft, Oracle, Adobe…"
                  value={modalPublisher}
                  onChange={e => setModalPublisher(e.target.value)}
                />
                <datalist id="publisher-list">
                  {PUBLISHERS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              {/* Error state */}
              {error && (
                <div className="error-box" style={{ marginBottom: 0 }}>
                  <div className="error-title">Extraction Error</div>
                  <div className="error-body">{error}</div>
                </div>
              )}

              {/* Loading state */}
              {status === 'loading' && (
                <div className="modal-loading">
                  <div className="spinner-sm" />
                  <span>{step || 'Processing document…'}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <ModalExtractButton
                file={modal.file}
                docType={modalDocType}
                publisher={modalPublisher}
                onExtract={handleModalExtract}
                loading={status === 'loading'}
                onNavigate={(data) => { closeModal(); navigate('/dashboard', { state: data }) }}
                extractHook={{ status, error }}
              />
              <button className="modal-cancel" onClick={closeModal} disabled={status === 'loading'}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-component to handle extraction + navigation cleanly
interface ModalExtractButtonProps {
  file: File | null
  docType: string
  publisher: string
  onExtract: () => Promise<void>
  loading: boolean
  onNavigate: (data: import('../types').RoarData) => void
  extractHook: { status: string; error: string | null }
}

function ModalExtractButton({ file, docType, publisher, loading, onNavigate }: ModalExtractButtonProps) {
  const { extract, status, data, error: extractError, step } = useExtraction()

  async function handleClick() {
    if (!file) return
    await extract(file, docType, publisher)
  }

  // Navigate when extraction succeeds
  if (status === 'success' && data) {
    // Use a timeout to allow React to finish rendering
    setTimeout(() => onNavigate(data), 0)
  }

  const isLoading = status === 'loading' || loading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      {extractError && (
        <div className="error-box" style={{ marginBottom: 0 }}>
          <div className="error-title">Extraction Error</div>
          <div className="error-body">{extractError}</div>
        </div>
      )}
      {isLoading && (
        <div className="modal-loading">
          <div className="spinner-sm" />
          <span>{step || 'Processing document…'}</span>
        </div>
      )}
      <button
        className="btn-extract-roi"
        onClick={handleClick}
        disabled={!file || isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner-sm" />
            Extracting…
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Extract ROI Data
          </>
        )}
      </button>
    </div>
  )
}
