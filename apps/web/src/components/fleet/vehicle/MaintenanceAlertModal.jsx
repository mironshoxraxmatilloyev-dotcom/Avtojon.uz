import { memo } from 'react'
import { X, AlertTriangle, Droplets, Circle, Wrench, Bell } from 'lucide-react'

const ALERT_ICONS = {
  oil: Droplets,
  tire: Circle,
  service: Wrench,
  default: Bell
}

const ALERT_COLORS = {
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    text: 'text-red-700'
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    text: 'text-amber-700'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-700'
  }
}

export const MaintenanceAlertModal = memo(({ alerts, onClose }) => {
  if (!alerts || alerts.length === 0) return null

  const hasDanger = alerts.some(a => a.severity === 'danger')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full max-w-md border-2 shadow-2xl ${hasDanger ? 'border-red-300' : 'border-amber-300'}`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${hasDanger ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasDanger ? 'bg-red-100' : 'bg-amber-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${hasDanger ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${hasDanger ? 'text-red-800' : 'text-amber-800'}`}>
                Diqqat!
              </h2>
              <p className="text-sm text-gray-600">
                {alerts.length} ta ogohlantirish
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/50 rounded-lg text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {alerts.map((alert, index) => {
            const Icon = ALERT_ICONS[alert.type] || ALERT_ICONS.default
            const colors = ALERT_COLORS[alert.severity] || ALERT_COLORS.info

            return (
              <div 
                key={index}
                className={`flex items-start gap-3 p-4 rounded-xl border ${colors.bg} ${colors.border}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${colors.text}`}>
                    {alert.type === 'oil' && 'Moy almashtirish'}
                    {alert.type === 'tire' && 'Shina almashtirish'}
                    {alert.type === 'service' && 'Texnik xizmat'}
                    {!['oil', 'tire', 'service'].includes(alert.type) && 'Ogohlantirish'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.message}
                  </p>
                  {alert.threshold && (
                    <p className={`text-xs mt-2 font-medium ${colors.text}`}>
                      {alert.threshold > 0 ? `${alert.threshold} km qoldi` : `${Math.abs(alert.threshold)} km o'tib ketdi`}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-semibold transition-all shadow-lg shadow-blue-500/25"
          >
            Tushundim
          </button>
        </div>
      </div>
    </div>
  )
})

export default MaintenanceAlertModal
