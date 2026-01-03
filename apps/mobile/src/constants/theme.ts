// Web bilan bir xil ranglar
export const COLORS = {
  // Primary - Indigo/Blue (web bilan bir xil)
  primary: '#4f46e5',
  primaryLight: '#6366f1',
  primaryDark: '#4338ca',
  
  // Secondary
  secondary: '#f59e0b',
  secondaryLight: '#fbbf24',
  
  // Status colors
  success: '#10b981',
  successLight: '#d1fae5',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  
  // Backgrounds
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  
  // Borders
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Text
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textLight: '#cbd5e1',
  
  // Common
  white: '#ffffff',
  black: '#000000',
  
  // Tab colors
  emerald: '#10b981',
  emeraldLight: '#d1fae5',
  blue: '#3b82f6',
  blueLight: '#dbeafe',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  violet: '#8b5cf6',
  violetLight: '#ede9fe',
  cyan: '#06b6d4',
  cyanLight: '#cffafe',
  red: '#ef4444',
  redLight: '#fee2e2',
  orange: '#f97316',
  orangeLight: '#ffedd5',
};

export const FUEL_TYPES: Record<string, string> = {
  diesel: 'Dizel',
  petrol: 'Benzin',
  benzin: 'Benzin',
  gas: 'Gaz',
  metan: 'Metan',
  propan: 'Propan',
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  excellent: { label: "A'lo", color: COLORS.success, bg: COLORS.successLight },
  normal: { label: 'Yaxshi', color: COLORS.info, bg: COLORS.infoLight },
  attention: { label: 'Diqqat', color: COLORS.warning, bg: COLORS.warningLight },
  critical: { label: 'Kritik', color: COLORS.danger, bg: COLORS.dangerLight },
};

export const OIL_STATUS: Record<string, { label: string; color: string }> = {
  ok: { label: 'Yaxshi', color: COLORS.success },
  approaching: { label: 'Yaqin', color: COLORS.warning },
  overdue: { label: "O'tgan", color: COLORS.danger },
};

export const TIRE_STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Yangi', color: COLORS.success },
  used: { label: 'Ishlatilgan', color: COLORS.info },
  worn: { label: 'Eskirgan', color: COLORS.danger },
};

export const TIRE_POSITIONS = [
  'Old chap',
  'Old o\'ng',
  'Orqa chap',
  'Orqa o\'ng',
  'Orqa chap (ichki)',
  'Orqa o\'ng (ichki)',
  'Zaxira',
];

export const SERVICE_TYPES = [
  'TO-1',
  'TO-2',
  'Moy almashtirish',
  'Tormoz',
  'Shina',
  'Dvigatel',
  'Uzatmalar qutisi',
  'Elektrika',
  'Kuzov',
  'Boshqa',
];

export const INCOME_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  trip: { label: 'Marshrut', icon: '🚛', color: 'blue' },
  rental: { label: 'Ijara', icon: '🏠', color: 'violet' },
  other: { label: 'Boshqa', icon: '💰', color: 'amber' },
};

// Formatters
export const fmt = (n: number): string => {
  const abs = Math.abs(n || 0);
  if (abs >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  return new Intl.NumberFormat('uz-UZ').format(n || 0);
};

export const fmtDate = (d: string | Date): string => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('uz-UZ');
};

export const today = (): string => new Date().toISOString().split('T')[0];
