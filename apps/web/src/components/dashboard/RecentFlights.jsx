import { Clock, MapPin, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function RecentFlights({ flights }) {
  const navigate = useNavigate()
  
  if (!flights || flights.length === 0) return null

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Hozirgina'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} daqiqa oldin`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} soat oldin`
    return date.toLocaleDateString('uz-UZ')
  }

  const statusConfig = {
    active: { label: 'Faol', color: 'bg-emerald-100 text-emerald-700', icon: Clock },
    completed: { label: 'Tugatilgan', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    cancelled: { label: 'Bekor qilingan', color: 'bg-red-100 text-red-700', icon: AlertCircle },
    in_progress: { label: 'Jarayonda', color: 'bg-orange-100 text-orange-700', icon: Clock },
    pending: { label: 'Kutilmoqda', color: 'bg-gray-100 text-gray-700', icon: Clock }
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
            <Clock className="text-purple-600" size={16} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">So'nggi reyslar</h2>
            <p className="text-xs sm:text-sm text-gray-500">Oxirgi faoliyat</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {flights.slice(0, 6).map((flight) => {
          const status = statusConfig[flight.status] || statusConfig.pending
          const StatusIcon = status.icon
          
          return (
            <div 
              key={flight._id}
              onClick={() => navigate(`/dashboard/flights/${flight._id}`)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                {flight.driver?.fullName?.charAt(0) || '?'}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{flight.driver?.fullName || 'Noma\'lum'}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={12} />
                  <span className="truncate">{flight.name || 'Yangi marshrut'}</span>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  <StatusIcon size={12} />
                  {status.label}
                </span>
                <p className="text-xs text-gray-400 mt-1">{formatDate(flight.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
