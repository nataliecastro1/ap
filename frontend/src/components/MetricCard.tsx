import { formatCurrency } from '../utils/formatting'

type Accent = 'gold' | 'teal' | 'red' | 'blue'

interface Props {
  label:  string
  value:  number
  note:   string
  accent: Accent
}

export function MetricCard({ label, value, note, accent }: Props) {
  return (
    <div className={`metric-card mc-${accent}`}>
      <div className="mc-label">{label}</div>
      <div className="mc-value">{formatCurrency(value)}</div>
      <div className="mc-note">{note}</div>
    </div>
  )
}
