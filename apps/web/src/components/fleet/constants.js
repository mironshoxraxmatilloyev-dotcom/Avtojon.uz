import { CheckCircle, AlertTriangle } from 'lucide-react'

export const FUEL = { petrol: 'Benzin', diesel: 'Dizel', gas: 'Gaz', metan: 'Metan' }

export const STATUS_CONFIG = {
  excellent: { label: 'A\'lo', color: 'emerald', icon: CheckCircle },
  normal: { label: 'Yaxshi', color: 'blue', icon: CheckCircle },
  attention: { label: 'Diqqat', color: 'amber', icon: AlertTriangle },
  critical: { label: 'Kritik', color: 'red', icon: AlertTriangle }
}

export const CHART_COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  indigo: '#6366f1'
}

export const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)
