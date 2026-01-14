import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart3, TrendingUp, Users, Route, Fuel, Calendar,
  ArrowUpRight, Activity, DollarSign, Clock, CheckCircle,
  X, ChevronLeft, ChevronRight, Filter, Sparkles, Download, FileSpreadsheet,
  Utensils, Wrench, Car, CircleDot
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import DriverDebts from '../components/reports/DriverDebts'
import DriverSalaries from '../components/reports/DriverSalaries'

// Excel export funksiyasi
const exportToExcel = (data, filename) => {
  // Excel XML format
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Size="12" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#3B82F6" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="title">
      <Font ss:Bold="1" ss:Size="14" ss:Color="#1E40AF"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
    <Style ss:ID="data">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
      </Borders>
    </Style>
    <Style ss:ID="number">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
      </Borders>
    </Style>
    <Style ss:ID="total">
      <Font ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Right"/>
    </Style>
  </Styles>`

  let xml = xmlHeader

  // Haydovchilar sheet
  xml += `
  <Worksheet ss:Name="Haydovchilar">
    <Table>
      <Column ss:Width="50"/>
      <Column ss:Width="150"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:StyleID="header"><Data ss:Type="String">№</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Ism</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Holat</Data></Cell>
      </Row>`

  data.drivers.forEach((d, i) => {
    xml += `
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="Number">${i + 1}</Data></Cell>
        <Cell ss:StyleID="data"><Data ss:Type="String">${d.fullName || ''}</Data></Cell>
        <Cell ss:StyleID="data"><Data ss:Type="String">${d.status === 'busy' ? 'Band' : 'Bo\'sh'}</Data></Cell>
      </Row>`
  })
  xml += `
    </Table>
  </Worksheet>`

  // Reyslar sheet
  xml += `
  <Worksheet ss:Name="Reyslar">
    <Table>
      <Column ss:Width="50"/>
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:StyleID="header"><Data ss:Type="String">№</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Haydovchi</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Sana</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Holat</Data></Cell>
      </Row>`

  data.flights.forEach((f, i) => {
    xml += `
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="Number">${i + 1}</Data></Cell>
        <Cell ss:StyleID="data"><Data ss:Type="String">${f.driver?.fullName || 'Noma\'lum'}</Data></Cell>
        <Cell ss:StyleID="data"><Data ss:Type="String">${new Date(f.createdAt).toLocaleDateString('uz-UZ')}</Data></Cell>
        <Cell ss:StyleID="data"><Data ss:Type="String">${f.status === 'completed' ? 'Tugatilgan' : 'Faol'}</Data></Cell>
      </Row>`
  })
  xml += `
    </Table>
  </Worksheet>`

  // Statistika sheet
  xml += `
  <Worksheet ss:Name="Statistika">
    <Table>
      <Column ss:Width="200"/>
      <Column ss:Width="150"/>
      <Row ss:Height="35">
        <Cell ss:MergeAcross="1" ss:StyleID="title"><Data ss:Type="String">Hisobot - ${filename}</Data></Cell>
      </Row>
      <Row><Cell/></Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="header"><Data ss:Type="String">Ko'rsatkich</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Qiymat</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Jami haydovchilar</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.drivers.total}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Bo'sh haydovchilar</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.drivers.free}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Band haydovchilar</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.drivers.busy}</Data></Cell>
      </Row>
      <Row><Cell/></Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Jami marshrutlar</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.flights.total}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Tugatilgan marshrutlar</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.flights.completed}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Faol marshrutlar</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.flights.active}</Data></Cell>
      </Row>
      <Row><Cell/></Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Jami xarajat (so'm)</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.expenses.total}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Yoqilg'i (so'm)</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.expenses.fuel}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="data"><Data ss:Type="String">Boshqa (so'm)</Data></Cell>
        <Cell ss:StyleID="number"><Data ss:Type="Number">${data.stats.expenses.other}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`

  // Download
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

const PERIODS = [
  { key: 'daily', label: 'Kunlik' },
  { key: 'weekly', label: 'Haftalik' },
  { key: 'monthly', label: 'Oylik' }
]

// Pro Bar Chart with animations and gradients
const ProBarChart = ({ data, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const colors = {
    blue: { from: '#3b82f6', to: '#6366f1', bg: 'bg-blue-500/10' },
    green: { from: '#10b981', to: '#14b8a6', bg: 'bg-emerald-500/10' },
    orange: { from: '#f97316', to: '#ef4444', bg: 'bg-orange-500/10' },
    purple: { from: '#8b5cf6', to: '#a855f7', bg: 'bg-purple-500/10' }
  }
  const c = colors[color] || colors.blue

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className="text-sm font-bold text-gray-900">
              {typeof item.value === 'number' && item.value > 1000
                ? new Intl.NumberFormat('uz-UZ').format(item.value)
                : item.value}
            </span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out group-hover:opacity-90"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                boxShadow: `0 0 20px ${c.from}40`
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full animate-pulse opacity-50"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                background: `linear-gradient(90deg, ${c.from}, ${c.to})`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Pro Donut Chart with glow effects
const ProDonutChart = ({ data, title, total }) => {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  let cumulativePercent = 0
  const radius = 15.9
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-2">
      <div className="relative w-44 h-44 sm:w-48 sm:h-48">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl" />

        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 relative z-10">
          {/* Background circle */}
          <circle cx="18" cy="18" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />

          {/* Data segments */}
          {data.map((item, i) => {
            const percent = (item.value / (total || 1)) * 100
            const strokeDasharray = animated ? `${(percent / 100) * circumference} ${circumference}` : `0 ${circumference}`
            const strokeDashoffset = -(cumulativePercent / 100) * circumference
            cumulativePercent += percent

            return (
              <circle
                key={i}
                cx="18" cy="18" r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="4"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 8px ${item.color}60)` }}
              />
            )
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {total}
          </span>
          <span className="text-sm text-gray-500 font-medium">{title}</span>
        </div>
      </div>

      {/* Legend - horizontal with better styling */}
      <div className="flex flex-row justify-center gap-8">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 group cursor-default">
            <div
              className="w-4 h-4 rounded-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}50` }}
            />
            <div className="flex flex-col">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Professional Area Chart
const ProLineChart = ({ data }) => {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <BarChart3 size={40} className="mx-auto mb-2 opacity-30" />
          <p>Ma'lumot yo'q</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  // Chart dimensions
  const width = 500
  const height = 200
  const padding = { top: 20, right: 20, bottom: 40, left: 45 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
    ...d
  }))

  // Create smooth path
  const createPath = () => {
    if (points.length < 2) return `M ${points[0]?.x || 0} ${points[0]?.y || 0}`
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx1 = prev.x + (curr.x - prev.x) / 3
      const cpx2 = prev.x + (curr.x - prev.x) * 2 / 3
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`
    }
    return path
  }

  const linePath = createPath()
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  // Y-axis labels
  const yLabels = [0, Math.ceil(maxValue / 4), Math.ceil(maxValue / 2), Math.ceil(maxValue * 3 / 4), maxValue]

  // X-axis labels (show only some for monthly)
  const getXLabels = () => {
    if (data.length <= 7) return data.map((d, i) => ({ index: i, label: d.label }))
    // Monthly: show 1, 8, 15, 22, last
    const indices = [0, 7, 14, 21, data.length - 1]
    return indices.filter(i => i < data.length).map(i => ({ index: i, label: data[i].day || i + 1 }))
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {hovered !== null ? (
            <span className="text-gray-900 font-medium">
              {data[hovered]?.fullLabel || data[hovered]?.label || `${data[hovered]?.day}-kun`}: <span className="text-blue-600">{data[hovered]?.value} ta mashrut</span>
            </span>
          ) : (
            <span>Grafik ustiga kuring</span>
          )}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-sm text-gray-500 ml-1">ta mashrut</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '220px' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map((val, i) => {
            const y = padding.top + chartHeight - (val / maxValue) * chartHeight
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4,4" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[11px] fill-gray-400">{val}</text>
              </g>
            )
          })}

          {/* Area */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />

          {/* Data points - faqat qiymat > 0 yoki hover bo'lganda ko'rsatish */}
          {points.map((p, i) => {
            const showPoint = p.value > 0 || hovered === i
            if (!showPoint && data.length > 10) return null // Oylik uchun 0 nuqtalarni yashirish
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hovered === i ? 7 : (p.value > 0 ? 4 : 2)}
                  fill={p.value > 0 ? 'white' : '#e5e7eb'}
                  stroke={p.value > 0 ? '#3b82f6' : '#d1d5db'}
                  strokeWidth={p.value > 0 ? 2 : 1}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ filter: hovered === i ? 'drop-shadow(0 2px 4px rgba(59,130,246,0.4))' : 'none' }}
                />
                {hovered === i && <circle cx={p.x} cy={p.y} r="3" fill="#3b82f6" />}
              </g>
            )
          })}

          {/* Hover areas */}
          {points.map((p, i) => (
            <rect key={`hover-${i}`} x={p.x - chartWidth / data.length / 2} y={padding.top} width={chartWidth / data.length} height={chartHeight}
              fill="transparent" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} className="cursor-pointer" />
          ))}

          {/* X-axis labels */}
          {getXLabels().map(({ index, label }) => (
            <text key={index} x={points[index]?.x} y={height - 10} textAnchor="middle" className="text-[11px] fill-gray-500 font-medium">
              {label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

// Detail Modal Component
const DetailModal = ({ isOpen, onClose, title, icon: Icon, color, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`sticky top-0 bg-gradient-to-r ${color} p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-white/70 text-sm">Batafsil ma'lumot</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6 overflow-auto max-h-[calc(85vh-100px)]">{children}</div>
      </div>
    </div>,
    document.body
  )
}

// Pro Stat Card
const StatCard = ({ icon: Icon, label, value, subtext, color, bgColor, gradient, onClick }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 cursor-pointer group`}
  >
    {/* Background decoration */}
    <div className={`absolute -right-8 -top-8 w-24 h-24 ${bgColor} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`} />

    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={color} size={22} />
        </div>
        <ArrowUpRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      {subtext && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Sparkles size={12} className={color} />
          {subtext}
        </p>
      )}
    </div>
  </div>
)

export default function Reports() {
  const { isDemo } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modal, setModal] = useState({ open: false, type: null })
  const [rawData, setRawData] = useState({ drivers: [], flights: [], expenses: [], fuelStats: null })
  const [stats, setStats] = useState({
    drivers: { total: 0, busy: 0, free: 0 },
    flights: { total: 0, active: 0, completed: 0 },
    expenses: { total: 0, fuel: 0, other: 0 },
    fuel: { totalKub: 0, totalLitr: 0, efficiency: 0 },
    chartData: []
  })

  const getPeriodRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    if (period === 'daily') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (period === 'weekly') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
    }
    return { start, end }
  }

  const navigatePeriod = (direction) => {
    const newDate = new Date(currentDate)
    if (period === 'daily') newDate.setDate(newDate.getDate() + direction)
    else if (period === 'weekly') newDate.setDate(newDate.getDate() + (direction * 7))
    else newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const getPeriodLabel = () => {
    const { start, end } = getPeriodRange()
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
    const shortMonths = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

    if (period === 'daily') return `${start.getDate()}-${months[start.getMonth()]}, ${start.getFullYear()}`
    if (period === 'weekly') return `${start.getDate()}-${shortMonths[start.getMonth()]} - ${end.getDate()}-${shortMonths[end.getMonth()]}, ${end.getFullYear()}`
    return `${months[start.getMonth()]}, ${start.getFullYear()}`
  }

  const filterByPeriod = (items, dateField = 'createdAt') => {
    const { start, end } = getPeriodRange()
    return items.filter(item => {
      const date = new Date(item[dateField])
      return date >= start && date <= end
    })
  }

  const generateChartData = (flights) => {
    const { start, end } = getPeriodRange()
    const data = []
    if (period === 'daily') {
      // Soatlik: 6 ta interval (4 soatlik)
      const intervals = ['00:00-04:00', '04:00-08:00', '08:00-12:00', '12:00-16:00', '16:00-20:00', '20:00-24:00']
      for (let h = 0; h < 24; h += 4) {
        const count = flights.filter(f => {
          const hour = new Date(f.createdAt).getHours()
          return hour >= h && hour < h + 4
        }).length
        data.push({ label: `${String(h).padStart(2, '0')}:00`, value: count })
      }
    } else if (period === 'weekly') {
      // Haftalik: har bir kun
      const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
      const shortDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(start)
        dayDate.setDate(start.getDate() + d)
        const count = flights.filter(f => new Date(f.createdAt).toDateString() === dayDate.toDateString()).length
        data.push({ label: shortDays[d], fullLabel: days[d], value: count, date: dayDate.getDate() })
      }
    } else {
      // Oylik: har bir kun uchun alohida
      const daysInMonth = end.getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const count = flights.filter(f => {
          const fDate = new Date(f.createdAt)
          return fDate.getDate() === d && fDate.getMonth() === start.getMonth() && fDate.getFullYear() === start.getFullYear()
        }).length
        data.push({
          label: d % 5 === 1 || d === daysInMonth ? String(d) : '', // Faqat 1, 6, 11, 16, 21, 26, 31 ko'rsatiladi
          fullLabel: `${d}-kun`,
          value: count,
          day: d
        })
      }
    }
    return data
  }

  useEffect(() => {
    const fetchData = async () => {
      if (isDemo()) {
        const demoFlights = Array.from({ length: 50 }, (_, i) => ({
          _id: `demo${i}`,
          status: i < 3 ? 'active' : 'completed',
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          driver: { fullName: `Haydovchi ${i + 1}` },
          totalDistance: Math.floor(Math.random() * 500) + 100
        }))
        const demoDrivers = Array.from({ length: 8 }, (_, i) => ({
          _id: `d${i}`, fullName: `Haydovchi ${i + 1}`, status: i < 3 ? 'busy' : 'free'
        }))
        setRawData({
          drivers: demoDrivers,
          flights: demoFlights,
          expenses: { totalAmount: 45000000 },
          fuelStats: {
            totalDistance: 15000,
            totalExpenses: 45000000,
            fuel: {
              totalCost: 32000000,
              totalKub: 850,
              totalLitr: 200,
              efficiency: { metan: 17.6, overall: 14.3 }
            },
            expensesByType: { fuel: 32000000, food: 5000000, repair: 3000000, toll: 2000000, fine: 1000000, other: 2000000 }
          }
        })
        setLoading(false)
        return
      }
      try {
        const [driversRes, flightsRes, fuelStatsRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/flights'),
          api.get('/flights/stats/fuel').catch(() => ({ data: { data: null } }))
        ])
        setRawData({
          drivers: driversRes.data.data || [],
          flights: flightsRes.data.data || [],
          expenses: {},
          fuelStats: fuelStatsRes.data.data || null
        })
      } catch (err) {
        // Error ignored
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isDemo])

  useEffect(() => {
    const { drivers, flights, fuelStats } = rawData
    const filteredFlights = filterByPeriod(flights)

    // Yoqilg'i va xarajatlar - API dan kelgan ma'lumotlar
    const fuelData = fuelStats || { fuel: {}, expensesByType: {} }

    setStats({
      drivers: {
        total: drivers.length,
        busy: drivers.filter(d => d.status === 'busy').length,
        free: drivers.filter(d => d.status === 'free' || d.status === 'available').length
      },
      flights: {
        total: filteredFlights.length,
        active: filteredFlights.filter(f => f.status === 'active').length,
        completed: filteredFlights.filter(f => f.status === 'completed').length,
        list: filteredFlights
      },
      expenses: {
        total: fuelData.totalExpenses || 0,
        fuel: fuelData.fuel?.totalCost || 0,
        food: fuelData.expensesByType?.food || 0,
        repair: fuelData.expensesByType?.repair || 0,
        toll: fuelData.expensesByType?.toll || 0,
        fine: fuelData.expensesByType?.fine || 0,
        other: fuelData.expensesByType?.other || 0
      },
      fuel: {
        totalKub: fuelData.fuel?.totalKub || 0,
        totalLitr: fuelData.fuel?.totalLitr || 0,
        efficiency: fuelData.fuel?.efficiency?.metan || fuelData.fuel?.efficiency?.overall || 0,
        byType: fuelData.fuel?.byType || {}
      },
      totalDistance: fuelData.totalDistance || 0,
      chartData: generateChartData(filteredFlights)
    })
  }, [rawData, period, currentDate])

  const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n)

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 size={20} className="text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Hisobotlar
                </span>
                <p className="text-sm font-normal text-gray-500 mt-0.5">Biznes statistikasi va tahlil</p>
              </div>
            </h1>
          </div>

          {/* Excel Download Button */}
          <button
            onClick={() => exportToExcel(
              { drivers: rawData.drivers, flights: stats.flights.list || [], stats },
              `Hisobot_${getPeriodLabel().replace(/\s/g, '_')}`
            )}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 min-w-[140px] sm:min-w-0"
          >
            <FileSpreadsheet size={18} className="flex-shrink-0" />
            <span className="text-sm whitespace-nowrap">Excel</span>
            <Download size={16} className="flex-shrink-0" />
          </button>
        </div>

        {/* Period Selector - Pro Style */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Filter size={18} className="text-white" />
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1.5">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${period === p.key
                    ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigatePeriod(-1)}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl min-w-[200px] justify-center border border-gray-200">
              <Calendar size={16} className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-700">{getPeriodLabel()}</span>
            </div>
            <button
              onClick={() => navigatePeriod(1)}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Haydovchilar" value={stats.drivers.total}
          subtext={`${stats.drivers.free} bosh, ${stats.drivers.busy} band`}
          color="text-blue-600" bgColor="bg-blue-100"
          onClick={() => setModal({ open: true, type: 'drivers' })} />

        <StatCard icon={Route} label="Reyslar" value={stats.flights.total}
          subtext={`${stats.flights.completed} tugatilgan`}
          color="text-emerald-600" bgColor="bg-emerald-100"
          onClick={() => setModal({ open: true, type: 'flights' })} />

        <StatCard icon={Activity} label="Faol marshrutlar" value={stats.flights.active}
          subtext="Hozir yo'lda" color="text-orange-600" bgColor="bg-orange-100"
          onClick={() => setModal({ open: true, type: 'active' })} />

        <StatCard icon={DollarSign} label="Xarajatlar" value={formatMoney(stats.expenses.total)}
          subtext="so'm" color="text-red-600" bgColor="bg-red-100"
          onClick={() => setModal({ open: true, type: 'expenses' })} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <TrendingUp className="text-white" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {period === 'daily' ? 'Soatlik' : period === 'weekly' ? 'Kunlik' : 'Oylik'} reyslar
              </h3>
              <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
            </div>
          </div>
          <ProLineChart data={stats.chartData} />
        </div>

        {/* Drivers Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          onClick={() => setModal({ open: true, type: 'drivers' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Users className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Haydovchilar holati</h3>
              <p className="text-sm text-gray-500">Hozirgi vaqtda</p>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <ProDonutChart
            data={[
              { label: 'Bo\'sh', value: stats.drivers.free, color: '#10b981' },
              { label: 'Band', value: stats.drivers.busy, color: '#f97316' },
            ]}
            title="Jami"
            total={stats.drivers.total}
          />
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          onClick={() => setModal({ open: true, type: 'expenses' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Fuel className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Xarajatlar taqsimoti</h3>
              <p className="text-sm text-gray-500">Kategoriya bo'yicha</p>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
          </div>
          <ProBarChart
            data={[
              { label: 'Yoqilg\'i', value: stats.expenses.fuel },
              { label: 'Ovqat', value: stats.expenses.food || 0 },
              { label: 'Ta\'mir', value: stats.expenses.repair || 0 },
              { label: 'Yo\'l to\'lovi', value: stats.expenses.toll || 0 },
              { label: 'Boshqa', value: (stats.expenses.fine || 0) + (stats.expenses.other || 0) },
            ]}
            color="orange"
          />
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-500">Jami xarajat:</span>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {formatMoney(stats.expenses.total)} so'm
            </span>
          </div>
        </div>

        {/* Flights Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          onClick={() => setModal({ open: true, type: 'flights' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Route className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Marshrutlar holati</h3>
              <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <ProDonutChart
            data={[
              { label: 'Tugatilgan', value: stats.flights.completed, color: '#10b981' },
              { label: 'Faol', value: stats.flights.active, color: '#f97316' },
            ]}
            title="Jami"
            total={stats.flights.total}
          />
        </div>
      </div>

      {/* Summary Cards - Pro Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl p-6 text-white group hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <span className="font-medium">O'rtacha mashrut/{period === 'daily' ? 'soat' : period === 'weekly' ? 'kun' : 'hafta'}</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold">
              {stats.chartData.length > 0 ? Math.round(stats.chartData.reduce((a, b) => a + b.value, 0) / stats.chartData.length) : 0}
            </p>
            <p className="text-blue-200 mt-2">ta mashrut</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl p-6 text-white group hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <span className="font-medium">Muvaffaqiyat darajasi</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold">
              {stats.flights.total > 0 ? Math.round((stats.flights.completed / stats.flights.total) * 100) : 0}%
            </p>
            <p className="text-emerald-200 mt-2">tugatilgan marshrutlar</p>
          </div>
        </div>

        {/* Yoqilg'i samaradorligi - YANGI */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-3xl p-6 text-white group hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Fuel size={24} />
              </div>
              <span className="font-medium">Yoqilg'i samaradorligi</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold">
              {stats.fuel?.efficiency || 0}
            </p>
            <p className="text-cyan-200 mt-2">km / 1 kub</p>
            <div className="mt-3 flex gap-3 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-lg flex items-center gap-1"><CircleDot size={12} className="text-green-300" /> {stats.fuel?.totalKub || 0} kub</span>
              <span className="bg-white/20 px-2 py-1 rounded-lg flex items-center gap-1"><Fuel size={12} /> {stats.fuel?.totalLitr || 0} litr</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-3xl p-6 text-white group hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Route size={24} />
              </div>
              <span className="font-medium">Jami masofa</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">
              {formatMoney(stats.totalDistance || 0)}
            </p>
            <p className="text-orange-200 mt-2">km yurgan</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DetailModal isOpen={modal.open && modal.type === 'drivers'} onClose={() => setModal({ open: false })}
        title="Haydovchilar batafsil" icon={Users} color="from-blue-500 to-indigo-600">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 text-center border border-emerald-100">
              <p className="text-4xl font-bold text-emerald-600">{stats.drivers.free}</p>
              <p className="text-sm text-emerald-700 mt-1">Bo'sh haydovchilar</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 text-center border border-orange-100">
              <p className="text-4xl font-bold text-orange-600">{stats.drivers.busy}</p>
              <p className="text-sm text-orange-700 mt-1">Band haydovchilar</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Haydovchilar ro'yxati</h4>
            <div className="space-y-2 max-h-64 overflow-auto pr-2">
              {rawData.drivers.map(driver => (
                <div key={driver._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${driver.status === 'busy' ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      }`}>
                      {driver.fullName?.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{driver.fullName}</span>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${driver.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {driver.status === 'busy' ? 'Band' : 'Bo\'sh'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailModal>

      <DetailModal isOpen={modal.open && modal.type === 'flights'} onClose={() => setModal({ open: false })}
        title={`Reyslar - ${getPeriodLabel()}`} icon={Route} color="from-emerald-500 to-teal-600">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 text-center border border-emerald-100">
              <p className="text-4xl font-bold text-emerald-600">{stats.flights.completed}</p>
              <p className="text-sm text-emerald-700 mt-1">Tugatilgan</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 text-center border border-orange-100">
              <p className="text-4xl font-bold text-orange-600">{stats.flights.active}</p>
              <p className="text-sm text-orange-700 mt-1">Faol</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Reyslar ro'yxati ({stats.flights.total} ta)</h4>
            <div className="space-y-2 max-h-64 overflow-auto pr-2">
              {(stats.flights.list || []).slice(0, 20).map(flight => (
                <div key={flight._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{flight.driver?.fullName || 'Noma\'lum'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(flight.createdAt).toLocaleDateString('uz-UZ')}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${flight.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {flight.status === 'completed' ? 'Tugatilgan' : 'Faol'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailModal>

      <DetailModal isOpen={modal.open && modal.type === 'active'} onClose={() => setModal({ open: false })}
        title="Faol marshrutlar" icon={Activity} color="from-orange-500 to-red-600">
        <div className="space-y-4">
          {stats.flights.active === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">Hozirda faol mashrut yo'q</p>
              <p className="text-sm text-gray-400 mt-1">Yangi marshrut boshlanganida bu yerda ko'rinadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(stats.flights.list || []).filter(f => f.status === 'active').map(flight => (
                <div key={flight._id} className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {flight.driver?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{flight.driver?.fullName}</p>
                      <p className="text-sm text-gray-500">{flight.totalDistance || 0} km</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DetailModal>

      <DetailModal isOpen={modal.open && modal.type === 'expenses'} onClose={() => setModal({ open: false })}
        title="Xarajatlar batafsil" icon={DollarSign} color="from-red-500 to-rose-600">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 text-center border border-red-100">
            <p className="text-5xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              {formatMoney(stats.expenses.total)}
            </p>
            <p className="text-sm text-red-700 mt-2">Jami xarajat (so'm)</p>
          </div>

          {/* Yoqilg'i statistikasi */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border border-cyan-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Fuel size={20} className="text-cyan-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Yoqilg'i statistikasi</h4>
                <p className="text-xs text-gray-500">Samaradorlik va sarflanish</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-cyan-600">{stats.fuel?.totalKub || 0}</p>
                <p className="text-xs text-gray-500">kub (metan)</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.fuel?.totalLitr || 0}</p>
                <p className="text-xs text-gray-500">litr</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.fuel?.efficiency || 0}</p>
                <p className="text-xs text-gray-500">km/kub</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-emerald-50 rounded-xl">
              <p className="text-sm text-emerald-700 text-center">
                1 kub metan bilan <span className="font-bold">{stats.fuel?.efficiency || 0} km</span> yurish mumkin
              </p>
            </div>
          </div>

          {/* Xarajat turlari */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Fuel size={18} className="text-orange-500" />
                <span className="text-sm font-medium text-orange-700">Yoqilg'i</span>
              </div>
              <p className="text-xl font-bold text-orange-600">{formatMoney(stats.expenses.fuel)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Utensils size={18} className="text-green-500" />
                <span className="text-sm font-medium text-green-700">Ovqat</span>
              </div>
              <p className="text-xl font-bold text-green-600">{formatMoney(stats.expenses.food || 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={18} className="text-red-500" />
                <span className="text-sm font-medium text-red-700">Ta'mir</span>
              </div>
              <p className="text-xl font-bold text-red-600">{formatMoney(stats.expenses.repair || 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Car size={18} className="text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Yo'l to'lovi</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{formatMoney(stats.expenses.toll || 0)}</p>
            </div>
          </div>
        </div>
      </DetailModal>

      {/* Shofyor qarzdorliklari */}
      <DriverDebts />

      {/* Shofyor oyliklari */}
      <DriverSalaries />
    </div>
  )
}
