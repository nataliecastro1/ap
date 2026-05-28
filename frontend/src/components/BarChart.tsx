import { formatCurrency } from '../utils/formatting'

interface Bar { label: string; value: number; color: string }

interface Props {
  bars: Bar[]
}

const LW  = 172  // label column width
const VW  = 120  // value column width
const BH  = 26   // bar height
const GAP = 10   // gap between bars
const PAD = 8    // vertical padding
const W   = 530  // total SVG width

export function BarChart({ bars }: Props) {
  const active = bars.filter(b => b.value > 0)

  if (!active.length) {
    return (
      <svg viewBox="0 0 400 60" style={{ width: '100%' }}>
        <text x="50%" y="35" textAnchor="middle" fill="var(--muted)" fontSize="13">
          No data to display
        </text>
      </svg>
    )
  }

  const maxV  = Math.max(...active.map(b => b.value))
  const barW  = W - LW - VW - 8
  const H     = active.length * (BH + GAP) + PAD * 2

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, overflow: 'visible' }}
    >
      {active.map((b, i) => {
        const y   = PAD + i * (BH + GAP)
        const bw  = Math.max((b.value / maxV) * barW, 2)
        const mid = y + BH / 2 + 4

        return (
          <g key={b.label}>
            <text
              x={LW - 8} y={mid}
              textAnchor="end"
              fill="var(--muted)"
              fontSize="11"
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            >
              {b.label}
            </text>
            <rect
              x={LW} y={y}
              width={bw} height={BH}
              rx={4} fill={b.color} opacity={0.85}
            />
            <text
              x={LW + bw + 8} y={mid}
              fill={b.color}
              fontSize="11" fontWeight="600"
              fontFamily="'Courier New', monospace"
            >
              {formatCurrency(b.value)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
