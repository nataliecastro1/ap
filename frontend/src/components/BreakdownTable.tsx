import type { BreakdownItem } from '../types/roar'
import { formatCurrency } from '../utils/formatting'

interface Props {
  items: BreakdownItem[]
}

function catClass(cat: string): string {
  const c = cat.toLowerCase()
  if (c.includes('risk'))  return 'cat-risk'
  if (c.includes('avoid')) return 'cat-avoid'
  if (c.includes('optim')) return 'cat-optim'
  return 'cat-save'
}

export function BreakdownTable({ items }: Props) {
  if (!items.length) {
    return <p className="empty-msg">No line items found in this document.</p>
  }

  const totalId = items.reduce((s, r) => s + r.identified,   0)
  const totalAc = items.reduce((s, r) => s + r.accomplished, 0)

  return (
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
        {items.map((row, i) => (
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
  )
}
