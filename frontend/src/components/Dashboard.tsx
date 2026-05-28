import type { RoarData } from '../types/roar'
import { MetricCard }    from './MetricCard'
import { BarChart }      from './BarChart'
import { BreakdownTable } from './BreakdownTable'
import { DomoPreview }   from './DomoPreview'
import { ExportBar }     from './ExportBar'
import { formatCurrency } from '../utils/formatting'

interface Props {
  data:  RoarData
  onReset: () => void
}

export function Dashboard({ data, onReset }: Props) {
  const totalOpp     = data.identified_risk + data.identified_cost_avoidance + data.identified_cost_optimization
  const totalAchieved = data.accomplished_cost_avoidance + data.accomplished_cost_optimization + data.realized_cost_savings

  const chartBars = [
    { label: 'Identified Risk',          value: data.identified_risk,                 color: '#e85555' },
    { label: 'Cost Avoid. Identified',   value: data.identified_cost_avoidance,        color: '#F5A623' },
    { label: 'Cost Avoid. Accomplished', value: data.accomplished_cost_avoidance,      color: '#1D9E75' },
    { label: 'Cost Optim. Identified',   value: data.identified_cost_optimization,     color: '#F5A623' },
    { label: 'Cost Optim. Accomplished', value: data.accomplished_cost_optimization,   color: '#1D9E75' },
    { label: 'Realized Savings',         value: data.realized_cost_savings,            color: '#1D9E75' },
    { label: 'Annual Contract Spend',    value: data.annual_publisher_contract_spend,  color: '#5b9bd5' },
  ]

  return (
    <div>
      {/* Top bar */}
      <div className="results-topbar">
        <div>
          <div className="results-title">Value at a Glance</div>
          <div className="results-sub">
            {[data.client, data.publisher, data.date_delivered].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button className="btn-reset" onClick={onReset}>↺ New Document</button>
      </div>

      {/* Doc info strip */}
      <div className="doc-strip">
        {[
          ['Client',            data.client           || '—'],
          ['Publisher',         data.publisher         || '—'],
          ['Date Delivered',    data.date_delivered    || '—'],
          ['Year',              data.year              || '—'],
          ['Currency',          data.currency          || 'USD'],
          ['Pricing Available', data.pricing_available || '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="doc-item-label">{label}</div>
            <div className="doc-item-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="hero-metric">
        <div>
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

      {/* Metric cards */}
      <div className="metrics-grid">
        <MetricCard label="Identified Risk"                value={data.identified_risk}                 note="Compliance / audit exposure"    accent="red"  />
        <MetricCard label="Cost Avoidance Identified"      value={data.identified_cost_avoidance}        note="Potential savings identified"   accent="gold" />
        <MetricCard label="Cost Avoidance Accomplished"    value={data.accomplished_cost_avoidance}      note="Already achieved"               accent="teal" />
        <MetricCard label="Cost Optimization Identified"   value={data.identified_cost_optimization}     note="Licensing opportunity"          accent="gold" />
        <MetricCard label="Cost Optimization Accomplished" value={data.accomplished_cost_optimization}   note="Already implemented"            accent="teal" />
        <MetricCard label="Realized Cost Savings"          value={data.realized_cost_savings}            note="Confirmed savings"              accent="teal" />
        <MetricCard label="Annual Contract Spend"          value={data.annual_publisher_contract_spend}  note={`${data.publisher || 'Publisher'} licenses`} accent="blue" />
      </div>

      {/* Chart + table */}
      <div className="viz-grid">
        <div className="viz-card">
          <div className="viz-title">Financial Overview — ROI Categories</div>
          <BarChart bars={chartBars} />
        </div>
        <div className="viz-card">
          <div className="viz-title">Line Item Breakdown</div>
          <BreakdownTable items={data.breakdown} />
        </div>
      </div>

      {/* Domo preview */}
      <DomoPreview data={data} />

      {/* Export */}
      <ExportBar data={data} />
    </div>
  )
}
