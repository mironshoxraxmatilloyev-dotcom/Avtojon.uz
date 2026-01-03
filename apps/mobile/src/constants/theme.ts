export const COLORS = {
  primary: '#4f46e5',
  primaryLight: '#6366f1',
  secondary: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  
  white: '#ffffff',
  black: '#000000',
};

export const FUEL_TYPES: Record<string, string> = {
  diesel: 'Dizel',
  petrol: 'Benzin',
  gas: 'Gaz',
  metan: 'Metan',
  propan: 'Propan',
};

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  excellent: { label: "A'lo", color: COLORS.success },
  normal: { label: 'Yaxshi', color: COLORS.info },
  attention: { label: 'Diqqat', color: COLORS.warning },
  critical: { label: 'Kritik', color: COLORS.danger },
};

export const fmt = (n: number): string => {
  const abs = Math.abs(n || 0);
  if (abs >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  return new Intl.NumberFormat('uz-UZ').format(n || 0);
};
