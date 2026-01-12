import { memo, useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, ChevronRight, Truck, Wrench, Zap, Shield, Droplets, Circle, Bell, Loader2 } from 'lucide-react'
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

  const dangerVehicleIds = new Set(alerts.filter(a => a.severity === 'danger').map(a => a.vehicleId?.toString()))
  const warningVehicleIds = new Set(alerts.filter(a => a.severity === 'warning').map(a => a.vehicleId?.toString()))
  
  const attentionVehicles = vehicles.filter(v => {
    const vId = v._id?.toString()
    return v.status === 'attention' || v.status === 'critical' || dangerVehicleIds.has(vId) || warningVehicleIds.has(vId)
  })
  
  const criticalVehicles = vehicles.filter(v => {
    const vId = v._id?.toString()
    return v.status === 'critical' || dangerVehicleIds.has(vId)
  })
  
  const warningVehicles = vehicles.filter(v => {
    const vId = v._id?.toString()
    const isCritical = v.status === 'critical' || dangerVehicleIds.has(vId)
    return !isCritical && (v.status === 'attention' || warningVehicleIds.has(vId))
  })
  
  const healthyVehicles = vehicles.length - attentionVehicles.length

  const oilAlerts = alerts.filter(a => a.type === 'oil')
  const tireAlerts = alerts.filter(a => a.type === 'tire')
  const serviceAlerts = alerts.filter(a => a.type === 'service')
  const otherAlerts = alerts.filter(a => !['oil', 'tire', 'service'].includes(a.type))

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="ml-2 text-slate-500 text-sm">Yuklanmoqda...</span>
        </div>
      </div>
    )
  }

  const hasAnyIssue = alerts.length > 0 || attentionVehicles.length > 0

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        <SummaryCard icon={AlertTriangle} label="Kritik" value={criticalVehicles.length} color="red" />
        <SummaryCard icon={Zap} label="Diqqat" value={warningVehicles.length} color="amber" />
        <SummaryCard icon={Bell} label="Ogohlantirishlar" value={alerts.length} color="indigo" />
        <SummaryCard icon={Shield} label="Yaxshi" value={healthyVehicles} color="emerald" />
      </div>

      {/* All Good State */}
      {!hasAnyIssue && <AllGoodState />}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ogohlantirishlar</h3>
              <p className="text-[10px] text-slate-500">{alerts.length} ta muammo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {oilAlerts.length > 0 && <AlertGroup icon={Droplets} title="Moy almashtirish" color="amber" alerts={oilAlerts} navigate={navigate} />}
            {tireAlerts.length > 0 && <AlertGroup icon={Circle} title="Shina tekshiruvi" color="orange" alerts={tireAlerts} navigate={navigate} />}
            {serviceAlerts.length > 0 && <AlertGroup icon={Wrench} title="Texnik xizmat" color="red" alerts={serviceAlerts} navigate={navigate} />}
            {otherAlerts.length > 0 && <AlertGroup icon={Bell} title="Boshqa" color="slate" alerts={otherAlerts} navigate={navigate} />}
          </div>
        </div>
      )}

      {/* Attention Vehicles */}
      {attentionVehicles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Xizmat kerak</h3>
              <p className="text-[10px] text-slate-500">{attentionVehicles.length} ta mashina</p>
            </div>
          </div>

          <div className="space-y-2">
            {attentionVehicles.map(v => {
              const vId = v._id?.toString()
              const isCritical = v.status === 'critical' || dangerVehicleIds.has(vId)
              return (
                <AttentionCard key={v._id} vehicle={v} isCritical={isCritical} onClick={() => navigate(`/fleet/vehicle/${v._id}`)} />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

const AlertGroup = memo(({ icon: Icon, title, color, alerts, navigate }) => {
  const colors = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-500', text: 'text-orange-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-500', text: 'text-red-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-500', text: 'text-slate-700' }
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-xl p-3 border ${c.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 ${c.icon} rounded-lg flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h4 className={`font-bold text-sm ${c.text}`}>{title}</h4>
          <p className="text-[10px] text-slate-500">{alerts.length} ta</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {alerts.slice(0, 3).map((alert, i) => (
          <div
            key={i}
            onClick={() => navigate(`/fleet/vehicle/${alert.vehicleId}`)}
            className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100 cursor-pointer hover:shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="font-bold text-slate-900 text-xs">{alert.plateNumber}</p>
                {alert.severity === 'danger' && (
                  <span className="px-1 py-0.5 bg-red-100 text-red-700 text-[8px] font-bold rounded">KRITIK</span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-1">{alert.message}</p>
            </div>
            <ChevronRight size={14} className="text-slate-400 flex-shrink-0 ml-2" />
          </div>
        ))}
        {alerts.length > 3 && (
          <p className="text-[10px] text-center text-slate-500 pt-1">+{alerts.length - 3} ta yana</p>
        )}
      </div>
    </div>
  )
})

const SummaryCard = memo(({ icon: Icon, label, value, color }) => {
  const colors = {
    red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' }
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-xl p-3 lg:p-4`}>
      <div className={`w-8 h-8 ${c.icon} rounded-lg flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className={`text-xl lg:text-2xl font-bold ${c.text}`}>{value}</p>
      <p className="text-[10px] lg:text-xs text-slate-500 font-medium">{label}</p>
    </div>
  )
})

const AttentionCard = memo(({ vehicle, isCritical, onClick }) => (
  <div
    onClick={onClick}
    className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
      isCritical ? 'bg-red-50 border-red-200 hover:border-red-300' : 'bg-amber-50 border-amber-200 hover:border-amber-300'
    }`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
      <Truck className={`w-5 h-5 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <h4 className="font-bold text-slate-900 text-sm">{vehicle.plateNumber}</h4>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          {isCritical ? 'Kritik' : 'Diqqat'}
        </span>
      </div>
      <p className="text-xs text-slate-500 truncate">{vehicle.brand}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
  </div>
))

const AllGoodState = memo(() => (
  <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-8 text-center">
    <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
      <CheckCircle className="w-7 h-7 text-emerald-600" />
    </div>
    <h3 className="text-base font-bold text-slate-900 mb-1">Hammasi yaxshi!</h3>
    <p className="text-slate-500 text-sm">Barcha mashinalar yaxshi holatda</p>
  </div>
))
