import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { formatBytes } from '../utils/formatting'

interface Props {
  onFile: (file: File) => void
}

export function FileUpload({ onFile }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function accept(f: File) {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'pptx') {
      alert('Please upload a PDF or PPTX file.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('File exceeds 10 MB limit.')
      return
    }
    setFile(f)
    onFile(f)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files[0]
    if (f) accept(f)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) accept(f)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {!file ? (
        <div
          className={`drop-zone${over ? ' over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <span className="drop-icon">📄</span>
          <div className="drop-title">Drop your ROAR file here</div>
          <div className="drop-hint">PDF or PPTX · Max 10 MB</div>
        </div>
      ) : (
        <div className="file-chip">
          <span>📋</span>
          <span className="file-chip-name">{file.name}</span>
          <span className="file-chip-size">{formatBytes(file.size)}</span>
          <button className="file-chip-clear" onClick={clear} title="Remove">✕</button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.pptx"
        style={{ display: 'none' }}
        onChange={onChange}
      />
    </div>
  )
}
