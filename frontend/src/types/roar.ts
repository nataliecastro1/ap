export interface BreakdownItem {
  product:      string
  category:     string
  identified:   number
  accomplished: number
  description:  string
}

export interface RoarData {
  client:                          string
  publisher:                       string
  date_delivered:                  string
  year:                            string
  currency:                        string
  identified_risk:                 number
  identified_cost_avoidance:       number
  accomplished_cost_avoidance:     number
  identified_cost_optimization:    number
  accomplished_cost_optimization:  number
  realized_cost_savings:           number
  annual_publisher_contract_spend: number
  pricing_available:               string
  notes:                           string
  elevate_deliverable:             string
  breakdown:                       BreakdownItem[]
}

export const DOMO_COLUMNS = [
  'Year',
  'Client',
  'Publisher',
  'Date Delivered',
  'Currency',
  'Identified Risk',
  'Identified Cost Avoidance',
  'Accomplished Cost Avoidance',
  'Identified Cost Optimization',
  'Accomplished Cost Optimization',
  'Realized Cost Savings',
  'Annual Publisher Contract Spend',
  'Pricing Available',
  'Notes',
  'Elevate Deliverable',
] as const

export type DomoColumn = (typeof DOMO_COLUMNS)[number]
