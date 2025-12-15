import { useState } from 'react'
import { User, Truck, Clock, Calendar, Play, CheckCircle, ChevronRight, Edit3 } from 'lucide-react'
import api from '../../services/api'
import { showToast } from '../Toast'

// ============ DRIVER & VEHICLE CARD ============
export function DriverVehicleCard({ trip, navigate }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shofyor va mashina</h2>
        </div>
      </div>

      {/* Driver Card */}
      <div 
        onClick={() => navigate(`/dashboard/drivers/${trip.driver?._id}`)}
        className="group p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white mb-4 cursor-pointer hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold">
            {trip.driver?.fullName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{trip.driver?.fullName || 'Nomalum'}</p>
            <p className="text-blue-200 text-sm">{trip.driver?.phone || ''}</p>
          </div>
          <ChevronRight size={20} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Vehicle Card */}
      <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
            <Truck size={28} className="text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900">{trip.vehicle?.plateNumber || '-'}</p>
            <p className="text-gray-500">{trip.vehicle?.brand} {trip.vehicle?.model}</p>
          </div>
        </div>
      </div>

      {/* Shofyor oyligi */}
      {trip.driverSalary?.amountInUSD > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Shofyor oyligi:</span>
            <span className="font-bold text-emerald-600">${trip.driverSalary.amountInUSD.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}


// ============ TIMELINE CARD ============
export function TimelineCard({ trip, formatDateTime }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Vaqt jadvali</h2>
      </div>

      <div className="relative">
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500"></div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg z-10">
              <Calendar size={18} className="text-white" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-gray-400 uppercase">Yaratilgan</p>
              <p className="font-semibold text-gray-900">{formatDateTime(trip.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg z-10 ${trip.startedAt ? 'bg-purple-500' : 'bg-gray-200'}`}>
              <Play size={18} className={trip.startedAt ? 'text-white' : 'text-gray-400'} />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-gray-400 uppercase">Boshlangan</p>
              <p className={`font-semibold ${trip.startedAt ? 'text-gray-900' : 'text-gray-400'}`}>
                {trip.startedAt ? formatDateTime(trip.startedAt) : 'Hali boshlanmagan'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg z-10 ${trip.completedAt ? 'bg-emerald-500' : 'bg-gray-200'}`}>
              <CheckCircle size={18} className={trip.completedAt ? 'text-white' : 'text-gray-400'} />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-gray-400 uppercase">Tugatilgan</p>
              <p className={`font-semibold ${trip.completedAt ? 'text-gray-900' : 'text-gray-400'}`}>
                {trip.completedAt ? formatDateTime(trip.completedAt) : 'Hali tugatilmagan'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ QUICK ACTIONS ============
export function QuickActions({ trip, onEdit, onUpdate }) {
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      await api.put(`/trips/${trip._id}/start`)
      showToast.success('Reys boshlandi!')
      onUpdate()
    } catch (e) {
      showToast.error(e.response?.data?.message || 'Xatolik')
    }
    setLoading(false)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      await api.put(`/trips/${trip._id}/complete`)
      showToast.success('Reys tugatildi!')
      onUpdate()
    } catch (e) {
      showToast.error(e.response?.data?.message || 'Xatolik')
    }
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
      <h3 className="font-bold mb-4">Tezkor amallar</h3>
      
      <div className="space-y-3">
        <button onClick={onEdit} className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition">
          <Edit3 size={20} />
          <span>Reysni tahrirlash</span>
        </button>

        {trip.status === 'pending' && (
          <button onClick={handleStart} disabled={loading} className="w-full p-3 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center gap-3 transition disabled:opacity-50">
            <Play size={20} />
            <span>Reysni boshlash</span>
          </button>
        )}

        {trip.status === 'in_progress' && (
          <button onClick={handleComplete} disabled={loading} className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center gap-3 transition disabled:opacity-50">
            <CheckCircle size={20} />
            <span>Reysni tugatish</span>
          </button>
        )}
      </div>
    </div>
  )
}
