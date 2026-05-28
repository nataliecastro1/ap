import type { RoarData } from '../types/roar'
import { DOMO_COLUMNS } from '../types/roar'
import { slugify } from '../utils/formatting'

interface Props { data: RoarData }

function toCsv(d: RoarData): string {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const row = [
    d.year,
    d.client,
    d.publisher,
    d.date_delivered,
    d.currency || 'USD',
    d.identified_risk                  || 0,
    d.identified_cost_avoidance        || 0,
    d.accomplished_cost_avoidance      || 0,
    d.identified_cost_optimization     || 0,
    d.accomplished_cost_optimization   || 0,
    d.realized_cost_savings            || 0,
    d.annual_publisher_contract_spend  || 0,
    d.pricing_available,
    d.notes,
    d.elevate_deliverable,
  ]

  return [
    [...DOMO_COLUMNS].map(q).join(','),
    row.map(q).join(','),
  ].join('\n')
}

export function ExportBar({ data }: Props) {
  function download() {
    const csv  = toCsv(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `anglepoint-roi-${slugify(data.client)}-${slugify(data.publisher)}-${data.year || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="export-bar">
      <div>
        <div className="export-title">Export to CSV</div>
        <div className="export-sub">Formatted exactly for the Domo ROI tracking table</div>
      </div>
      <button className="btn-export" onClick={download}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download CSV
      </button>
    </div>
  )
}
