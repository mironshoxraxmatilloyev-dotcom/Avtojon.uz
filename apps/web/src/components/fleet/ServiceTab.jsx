import { memo, useState, useEffect } from 'react'
import { 
  AlertTriangle, CheckCircle, ChevronRight, Truck, Wrench, Zap, Shield,
  Droplets, Circle, Calendar, Bell, Clock, Fuel, Loader2
} from 'lucide-react'
import api from '../../services/api'

export const ServiceTab = memo(({ vehicles, navigate }) => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/maintenance/fleet/alerts')
        setAlerts(data.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadAlerts()
  }, [])

  const attentionVehicles = vehicles.filter(v => v.status === 'attention' || v.status === 'critical')
  const criticalVehicles = vehicles.filter(v => v.status === 'critical')
  const warningVehicles = vehicles.filter(v => v.status === 'attention')
  const healthyVehicles = vehicles.length - attentionVehicles.length

  // Alertlarni turlarga ajratish
  const oilAlerts = alerts.filter(a => a.type === 'oil')
  const tireAlerts = alerts.filter(a => a.type === 'tire')
  const serviceAlerts = alerts.filter(a => a.type === 'service')
  const otherAlerts = alerts.filter(a => !['oil', 'tire', 'service'].includes(a.type))

  // Loading holati
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-slate-500">Yuklanmoqda...</span>
        </div>
      </div>
    )
  }

  const hasAnyIssue = alerts.length > 0 || attentionVehicles.length > 0

  return (
    <div className="space-y-8">
      {/* PRO Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={AlertTriangle}
          label="Kritik"
          value={criticalVehicles.length}
          color="red"
        />
        <SummaryCard
          icon={Zap}
          label="Diqqat"
          value={warningVehicles.length}
          color="amber"
        />
        <SummaryCard
          icon={Bell}
          label="Ogohlantirishlar"
          value={alerts.length}
          color="indigo"
        />
        <SummaryCard
          icon={Shield}
          label="Yaxshi"
          value={healthyVehicles}
          color="emerald"
        />
      </div>

      {/* Agar hech qanday muammo yo'q bo'lsa */}
      {!hasAnyIssue && <AllGoodState />}

      {/* Smart Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ogohlantirishlar</h3>
              <p className="text-sm text-slate-500">{alerts.length} ta muammo aniqlandi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Moy ogohlantirishlari */}
            {oilAlerts.length > 0 && (
              <AlertGroup
                icon={Droplets}
                title="Moy almashtirish"
                color="amber"
                alerts={oilAlerts}
                navigate={navigate}
              />
            )}

            {/* Shina ogohlantirishlari */}
            {tireAlerts.length > 0 && (
              <AlertGroup
                icon={Circle}
                title="Shina tekshiruvi"
                color="orange"
                alerts={tireAlerts}
                navigate={navigate}
              />
            )}

            {/* Servis ogohlantirishlari */}
            {serviceAlerts.length > 0 && (
              <AlertGroup
                icon={Wrench}
                title="Texnik xizmat"
                color="red"
                alerts={serviceAlerts}
                navigate={navigate}
              />
            )}

            {/* Boshqa ogohlantirishlar */}
            {otherAlerts.length > 0 && (
              <AlertGroup
                icon={Calendar}
                title="Boshqa"
                color="slate"
                alerts={otherAlerts}
                navigate={navigate}
              />
            )}
          </div>
        </div>
      )}

      {/* Attention Required List */}
      {attentionVehicles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Xizmat ko'rsatish kerak</h3>
              <p className="text-sm text-slate-500">{attentionVehicles.length} ta mashina</p>
            </div>
          </div>

          <div className="space-y-3">
            {attentionVehicles.map(v => (
              <AttentionCard
                key={v._id}
                vehicle={v}
                onClick={() => navigate(`/fleet/vehicle/${v._id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

// Alert Group Component - Muammolarni aniq ko'rsatish
const AlertGroup = memo(({ icon: Icon, title, color, alerts, navigate }) => {
  const colors = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-500', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' }
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-2xl p-4 border-2 ${c.border}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 ${c.icon} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className={`font-bold ${c.text}`}>{title}</h4>
          <p className="text-xs text-slate-500">{alerts.length} ta ogohlantirish</p>
        </div>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert, i) => (
          <div
            key={i}
            onClick={() => navigate(`/fleet/vehicle/${alert.vehicleId}`)}
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-slate-900">{alert.plateNumber}</p>
                {alert.severity === 'danger' && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">KRITIK</span>
                )}
              </div>
              <p className="text-sm text-slate-600">{alert.message}</p>
              {alert.threshold !== undefined && (
                <p className={`text-xs font-medium mt-1 ${alert.threshold <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {alert.threshold <= 0 
                    ? `${Math.abs(alert.threshold).toLocaleString()} km o'tib ketdi` 
                    : `${alert.threshold.toLocaleString()} km qoldi`
                  }
                </p>
              )}
            </div>
            <ChevronRight size={18} className="text-slate-400 flex-shrink-0 ml-2" />
          </div>
        ))}
        {alerts.length > 5 && (
          <p className="text-xs text-center text-slate-500 pt-2">
            +{alerts.length - 5} ta yana
          </p>
        )}
      </div>
    </div>
  )
})

const SummaryCard = memo(({ icon: Icon, label, value, color }) => {
  const colors = {
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-500', text: 'text-red-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'bg-indigo-500', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-600' }
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-2xl p-5 border-2 ${c.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
      <p className="text-slate-600 text-sm font-medium mt-1">{label}</p>
    </div>
  )
})

const AttentionCard = memo(({ vehicle, onClick }) => {
  const isCritical = vehicle.status === 'critical'

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isCritical
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : 'bg-amber-50 border-amber-200 hover:border-amber-300'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        isCritical ? 'bg-red-100' : 'bg-amber-100'
      }`}>
        <Truck className={`w-6 h-6 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-slate-900">{vehicle.plateNumber}</h4>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isCritical ? 'Kritik' : 'Diqqat'}
          </span>
        </div>
        <p className="text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
    </div>
  )
})

const AllGoodState = memo(() => (
  <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-12 text-center">
    <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-10 h-10 text-emerald-600" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">Hammasi yaxshi!</h3>
    <p className="text-slate-500 max-w-md mx-auto">
      Barcha mashinalar yaxshi holatda. Hozircha xizmat ko'rsatish talab qilinmaydi.
    </p>
  </div>
))
