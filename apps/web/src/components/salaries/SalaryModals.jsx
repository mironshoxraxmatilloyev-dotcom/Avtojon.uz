import { Calculator, X, User, Calendar, Clock, Banknote, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import { statusConfig } from './SalaryCard'

export function CalculateModal({ show, onClose, form, setForm, drivers, onSubmit }) {
  if (!show) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Maosh hisoblash</h2>
                <p className="text-blue-200 text-sm mt-1">Davr va shofyorni tanlang</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl text-white">
              <X size={24} />
            </button>
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2"><User size={16} className="text-gray-400" /> Shofyor</span>
            </label>
            <select 
              value={form.driverId} 
              onChange={(e) => setForm({ ...form, driverId: e.target.value })} 
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl" 
              required
            >
              <option value="">Shofyorni tanlang</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.fullName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Boshlanish</label>
              <input 
                type="date" 
                value={form.periodStart} 
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })} 
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tugash</label>
              <input 
                type="date" 
                value={form.periodEnd} 
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} 
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl" 
                required 
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
            <Calculator size={20} /> Hisoblash
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}

export function SalaryDetailModal({ salary, onClose }) {
  if (!salary) return null

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
  const StatusIcon = statusConfig[salary.status]?.icon || Clock

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className={`bg-gradient-to-r ${statusConfig[salary.status]?.gradient} p-6 rounded-t-3xl`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-2xl border border-white/30">
                {salary.driver?.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{salary.driver?.fullName}</h2>
                <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                  <Calendar size={14} />
                  <span>{formatDate(salary.periodStart)} - {formatDate(salary.periodEnd)}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex justify-center">
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border ${statusConfig[salary.status]?.color}`}>
              <StatusIcon size={18} />
              <span className="font-semibold">{statusConfig[salary.status]?.label}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Maosh tarkibi</h3>
            <DetailRow icon={Banknote} label="Bazaviy oylik" value={`${formatMoney(salary.baseSalary)} som`} bgColor="bg-gray-50" iconBg="bg-gray-200" iconColor="text-gray-600" />
            <DetailRow icon={FileText} label="Foydadan ulush" sublabel={`${salary.tripsCount || 0} ta reys tugatildi`} value={`${formatMoney(salary.tripsPayment)} som`} bgColor="bg-purple-50" iconBg="bg-purple-200" iconColor="text-purple-600" valueColor="text-purple-700" />
            <DetailRow icon={TrendingUp} label="Bonus" value={`+${formatMoney(salary.totalBonus)} som`} bgColor="bg-emerald-50" iconBg="bg-emerald-200" iconColor="text-emerald-600" valueColor="text-emerald-600" />
            <DetailRow icon={TrendingDown} label="Jarima" value={`-${formatMoney(salary.totalPenalty)} som`} bgColor="bg-red-50" iconBg="bg-red-200" iconColor="text-red-600" valueColor="text-red-600" />
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center">
            <p className="text-blue-200 text-sm mb-2">Jami maosh</p>
            <p className="text-4xl font-bold">{formatMoney(salary.netSalary)}</p>
            <p className="text-blue-200 text-sm mt-1">so'm</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function DetailRow({ icon: Icon, label, sublabel, value, bgColor, iconBg, iconColor, valueColor = 'text-gray-900' }) {
  return (
    <div className={`${bgColor} rounded-xl p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <span className="font-medium text-gray-700">{label}</span>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
      </div>
      <span className={`font-bold ${valueColor}`}>{value}</span>
    </div>
  )
}
