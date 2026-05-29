import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { useAuth } from '../hooks/useAuth'
import type { RoarData } from '../types'
import { DOMO_COLUMNS } from '../types'
import { formatCurrency, formatNumber, slugify } from '../utils/formatting'

// ── Helpers ──────────────────────────────────────────────────────────────────

function catClass(cat: string): string {
  const c = cat.toLowerCase()
  if (c.includes('risk'))  return 'cat-risk'
  if (c.includes('avoid')) return 'cat-avoid'
  if (c.includes('optim')) return 'cat-optim'
  return 'cat-save'
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

interface BarProps { label: string; value: number; color: string }

function BarChart({ bars }: { bars: BarProps[] }) {
  const active = bars.filter(b => b.value > 0)

  const LW  = 188
  const VW  = 130
  const BH  = 26
  const GAP = 10
  const PAD = 8
  const W   = 560

  if (!active.length) {
    return (
      <svg viewBox="0 0 400 60" style={{ width: '100%' }}>
        <text x="50%" y="35" textAnchor="middle" fill="var(--muted)" fontSize="13">
          No data to display
        </text>
      </svg>
    )
  }

  const maxV = Math.max(...active.map(b => b.value))
  const barW = W - LW - VW - 8
  const H    = active.length * (BH + GAP) + PAD * 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
      {active.map((b, i) => {
        const y   = PAD + i * (BH + GAP)
        const bw  = Math.max((b.value / maxV) * barW, 2)
        const mid = y + BH / 2 + 4
        return (
          <g key={b.label}>
            <text x={LW - 8} y={mid} textAnchor="end" fill="var(--muted)" fontSize="11"
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">{b.label}</text>
            <rect x={LW} y={y} width={bw} height={BH} rx={4} fill={b.color} opacity={0.85} />
            <text x={LW + bw + 8} y={mid} fill={b.color} fontSize="11" fontWeight="600"
              fontFamily="'Courier New', monospace">{formatCurrency(b.value)}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, note, accent }: { label: string; value: number; note: string; accent: string }) {
  return (
    <div className={`metric-card mc-${accent}`}>
      <div className="mc-label">{label}</div>
      <div className="mc-value">{formatCurrency(value)}</div>
      <div className="mc-note">{note}</div>
    </div>
  )
}

// ── CSV export ────────────────────────────────────────────────────────────────

function toCsv(d: RoarData): string {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const row = [
    d.year,
    d.client,
    d.publisher,
    d.date_delivered,
    d.currency || 'USD',
    d.identified_risk                 || 0,
    d.identified_cost_avoidance       || 0,
    d.accomplished_cost_avoidance     || 0,
    d.identified_cost_optimization    || 0,
    d.accomplished_cost_optimization  || 0,
    d.realized_cost_savings           || 0,
    d.annual_publisher_contract_spend || 0,
    d.pricing_available,
    d.notes,
    d.elevate_deliverable,
  ]
  return [
    [...DOMO_COLUMNS].map(q).join(','),
    row.map(q).join(','),
  ].join('\n')
}

function downloadCsv(data: RoarData) {
  const csv  = toCsv(data)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `anglepoint-roi-${slugify(data.client)}-${slugify(data.publisher)}-${data.year || 'export'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const data = location.state as RoarData | null

  if (!data) {
    return (
      <div className="browser-page">
        <Header user={user ?? undefined} onLogout={logout} />
        <main className="dashboard-main">
          <div className="error-box" style={{ maxWidth: 480, margin: '60px auto' }}>
            <div className="error-title">No Data Found</div>
            <div className="error-body">No document data was passed to this page. Please go back and process a document first.</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn-back" onClick={() => navigate('/browse')}>← Back to Browser</button>
          </div>
        </main>
      </div>
    )
  }

  const totalOpp      = data.identified_risk + data.identified_cost_avoidance + data.identified_cost_optimization
  const totalAchieved = data.accomplished_cost_avoidance + data.accomplished_cost_optimization + data.realized_cost_savings

  const chartBars: BarProps[] = [
    { label: 'Identified Risk',           value: data.identified_risk,                color: '#e85555' },
    { label: 'Cost Avoid. Identified',    value: data.identified_cost_avoidance,       color: '#F5A623' },
    { label: 'Cost Avoid. Accomplished',  value: data.accomplished_cost_avoidance,     color: '#1D9E75' },
    { label: 'Cost Optim. Identified',    value: data.identified_cost_optimization,    color: '#F5A623' },
    { label: 'Cost Optim. Accomplished',  value: data.accomplished_cost_optimization,  color: '#1D9E75' },
    { label: 'Realized Savings',          value: data.realized_cost_savings,           color: '#1D9E75' },
    { label: 'Annual Contract Spend',     value: data.annual_publisher_contract_spend, color: '#5b9bd5' },
  ]

  const domoVals: Record<string, string> = {
    'Year':                            data.year,
    'Client':                          data.client,
    'Publisher':                       data.publisher,
    'Date Delivered':                  data.date_delivered,
    'Currency':                        data.currency || 'USD',
    'Identified Risk':                 data.identified_risk                 ? formatNumber(data.identified_risk)                 : '',
    'Identified Cost Avoidance':       data.identified_cost_avoidance       ? formatNumber(data.identified_cost_avoidance)       : '',
    'Accomplished Cost Avoidance':     data.accomplished_cost_avoidance     ? formatNumber(data.accomplished_cost_avoidance)     : '',
    'Identified Cost Optimization':    data.identified_cost_optimization    ? formatNumber(data.identified_cost_optimization)    : '',
    'Accomplished Cost Optimization':  data.accomplished_cost_optimization  ? formatNumber(data.accomplished_cost_optimization)  : '',
    'Realized Cost Savings':           data.realized_cost_savings           ? formatNumber(data.realized_cost_savings)           : '',
    'Annual Publisher Contract Spend': data.annual_publisher_contract_spend ? formatNumber(data.annual_publisher_contract_spend) : '',
    'Pricing Available':               data.pricing_available,
    'Notes':                           data.notes,
    'Elevate Deliverable':             data.elevate_deliverable,
  }

  const totalId = data.breakdown.reduce((s, r) => s + r.identified,   0)
  const totalAc = data.breakdown.reduce((s, r) => s + r.accomplished, 0)

  return (
    <div className="browser-page">
      <Header user={user ?? undefined} onLogout={logout} />

      <main className="dashboard-main">

        {/* ── Back button ── */}
        <button className="btn-back" onClick={() => navigate('/browse')}>
          ← New Document
        </button>

        {/* ── Document info strip ── */}
        <div className="doc-strip">
          {([
            ['Client',            data.client           || '—'],
            ['Publisher',         data.publisher         || '—'],
            ['Date Delivered',    data.date_delivered    || '—'],
            ['Year',              data.year              || '—'],
            ['Currency',          data.currency          || 'USD'],
            ['Doc Type',          data.document_type     || '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="doc-item">
              <div className="doc-item-label">{label}</div>
              <div className="doc-item-value">{value}</div>
            </div>
          ))}
        </div>

        {/* ── Hero metric ── */}
        <div className="hero-metric">
          <div className="hero-main">
            <div className="hero-label">Total Identified Opportunity</div>
            <div className="hero-value">{formatCurrency(totalOpp)}</div>
            <div className="hero-desc">Across risk, cost avoidance &amp; optimization</div>
          </div>
          <div className="hero-pills">
            <div className="hero-pill">
              <div className="hero-pill-label">Achieved / Savings</div>
              <div className="hero-pill-value hp-teal">{formatCurrency(totalAchieved)}</div>
            </div>
            <div className="hero-pill">
              <div className="hero-pill-label">Risk Exposure</div>
              <div className="hero-pill-value hp-red">{formatCurrency(data.identified_risk)}</div>
            </div>
            <div className="hero-pill">
              <div className="hero-pill-label">Annual Contract</div>
              <div className="hero-pill-value hp-blue">{formatCurrency(data.annual_publisher_contract_spend)}</div>
            </div>
          </div>
        </div>

        {/* ── Metric cards (7) ── */}
        <div className="metrics-grid">
          <MetricCard label="Identified Risk"                value={data.identified_risk}                note="Compliance / audit exposure"                        accent="red"  />
          <MetricCard label="Cost Avoidance Identified"      value={data.identified_cost_avoidance}       note="Potential savings identified"                      accent="gold" />
          <MetricCard label="Cost Avoidance Accomplished"    value={data.accomplished_cost_avoidance}     note="Already achieved"                                  accent="teal" />
          <MetricCard label="Cost Optimization Identified"   value={data.identified_cost_optimization}    note="Licensing opportunity"                             accent="gold" />
          <MetricCard label="Cost Optimization Accomplished" value={data.accomplished_cost_optimization}  note="Already implemented"                               accent="teal" />
          <MetricCard label="Realized Cost Savings"          value={data.realized_cost_savings}           note="Confirmed savings"                                 accent="teal" />
          <MetricCard label="Annual Contract Spend"          value={data.annual_publisher_contract_spend} note={`${data.publisher || 'Publisher'} licenses`}        accent="blue" />
        </div>

        {/* ── Chart + Breakdown ── */}
        <div className="viz-grid">
          <div className="viz-card">
            <div className="viz-title">Financial Overview — ROI Categories</div>
            <BarChart bars={chartBars} />
          </div>
          <div className="viz-card">
            <div className="viz-title">Line Item Breakdown</div>
            {data.breakdown.length === 0 ? (
              <p className="empty-msg">No line items found in this document.</p>
            ) : (
              <table className="bd-table">
                <thead>
                  <tr>
                    <th>Product / Item</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Identified</th>
                    <th style={{ textAlign: 'right' }}>Accomplished</th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.map((row, i) => (
                    <tr key={i} title={row.description}>
                      <td>{row.product  || '—'}</td>
                      <td><span className={`cat-badge ${catClass(row.category)}`}>{row.category || '—'}</span></td>
                      <td className="td-amt">{row.identified   ? formatCurrency(row.identified)   : '—'}</td>
                      <td className="td-amt">{row.accomplished ? formatCurrency(row.accomplished) : '—'}</td>
                    </tr>
                  ))}
                  <tr className="totals-row">
                    <td colSpan={2}><strong>Total</strong></td>
                    <td className="td-amt"><strong>{formatCurrency(totalId)}</strong></td>
                    <td className="td-amt"><strong>{formatCurrency(totalAc)}</strong></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Domo row preview ── */}
        <div className="domo-wrap">
          <div className="domo-header">
            <span className="viz-title">Domo Row Preview</span>
            <span className="domo-badge">Ready to Export</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="domo-tbl">
              <thead>
                <tr>{DOMO_COLUMNS.map(c => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                <tr>
                  {DOMO_COLUMNS.map(c => {
                    const v = domoVals[c]
                    return v
                      ? <td key={c} className="filled">{v}</td>
                      : <td key={c} className="empty">—</td>
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Export bar ── */}
        <div className="export-bar">
          <div>
            <div className="export-title">Export to CSV</div>
            <div className="export-sub">Formatted exactly for the Domo ROI tracking table · 15 columns</div>
          </div>
          <button className="btn-export" onClick={() => downloadCsv(data)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV
          </button>
        </div>

      </main>
    </div>
  )
}
