import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { 
  Briefcase, LogOut, Bell, Users, Car, TrendingUp,
  MapPin, Calendar, Clock, ChevronRight
} from 'lucide-react'

export default function BusinessDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{user?.businessType || 'Biznes'}</h1>
                <p className="text-xs text-slate-500">{user?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 relative">
                <Bell size={20} />
              </button>
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-slate-600 hover:text-red-600 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Xush kelibsiz, {user?.fullName}!</h2>
          <p className="text-emerald-100">Biznes panelingizga xush kelibsiz. Bu yerda barcha ma'lumotlaringizni boshqarishingiz mumkin.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500">Shofyorlar</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500">Mashinalar</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500">Reyslar</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500">Daromad</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Tezkor harakatlar</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  <Users className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Shofyorlar</p>
                  <p className="text-sm text-slate-500">Boshqarish</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
          </button>

          <button className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Car className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Mashinalar</p>
                  <p className="text-sm text-slate-500">Avtopark</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </button>

          <button className="bg-white rounded-xl p-5 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Hisobotlar</p>
                  <p className="text-sm text-slate-500">Statistika</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}
