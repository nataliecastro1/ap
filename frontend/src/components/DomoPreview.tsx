import type { RoarData, DomoColumn } from '../types/roar'
import { DOMO_COLUMNS } from '../types/roar'
import { formatNumber } from '../utils/formatting'

interface Props { data: RoarData }

function buildValues(d: RoarData): Record<DomoColumn, string> {
  return {
    'Year':                            d.year,
    'Client':                          d.client,
    'Publisher':                       d.publisher,
    'Date Delivered':                  d.date_delivered,
    'Currency':                        d.currency || 'USD',
    'Identified Risk':                 d.identified_risk                  ? formatNumber(d.identified_risk)                  : '',
    'Identified Cost Avoidance':       d.identified_cost_avoidance        ? formatNumber(d.identified_cost_avoidance)        : '',
    'Accomplished Cost Avoidance':     d.accomplished_cost_avoidance      ? formatNumber(d.accomplished_cost_avoidance)      : '',
    'Identified Cost Optimization':    d.identified_cost_optimization     ? formatNumber(d.identified_cost_optimization)     : '',
    'Accomplished Cost Optimization':  d.accomplished_cost_optimization   ? formatNumber(d.accomplished_cost_optimization)   : '',
    'Realized Cost Savings':           d.realized_cost_savings            ? formatNumber(d.realized_cost_savings)            : '',
    'Annual Publisher Contract Spend': d.annual_publisher_contract_spend  ? formatNumber(d.annual_publisher_contract_spend)  : '',
    'Pricing Available':               d.pricing_available,
    'Notes':                           d.notes,
    'Elevate Deliverable':             d.elevate_deliverable,
  }
}

export function DomoPreview({ data }: Props) {
  const vals = buildValues(data)

  return (
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
                const v = vals[c]
                return v
                  ? <td key={c} className="filled">{v}</td>
                  : <td key={c} className="empty">—</td>
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
