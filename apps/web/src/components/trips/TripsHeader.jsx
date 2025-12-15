import { Plus, Route, Calendar, ArrowUpRight, Activity, Clock, CheckCircle } from 'lucide-react'

export default function TripsHeader({ 
  user, 
  trips, 
  onNewTrip 
}) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

  const activeTripsCount = trips.filter(t => t.status === 'in_progress').length
  const pendingTripsCount = trips.filter(t => t.status === 'pending').length
  const completedTripsCount = trips.filter(t => t.status === 'completed').length

  const quickStats = [
    { label: 'Jami reyslar', value: trips.length, icon: Route, color: 'from-blue-400 to-blue-600' },
    { label: "Yo'lda", value: activeTripsCount, icon: Activity, color: 'from-orange-400 to-orange-600' },
    { label: 'Kutilmoqda', value: pendingTripsCount, icon: Clock, color: 'from-yellow-400 to-yellow-600' },
    { label: 'Tugatilgan', value: completedTripsCount, icon: CheckCircle, color: 'from-green-400 to-green-600' },
  ]

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
      <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
      <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
      
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
            <Calendar size={14} />
            <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {user?.companyName || 'Admin'}! 👋
          </h1>
          <p className="text-blue-200">Reyslarni boshqaring va kuzating</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onNewTrip} 
            className="group px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
          >
            <Plus size={18} /> 
            Yangi reys
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Quick Stats in Header */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {quickStats.map((item, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                <item.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold">{item.value}</p>
                <p className="text-blue-200 text-xs">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
