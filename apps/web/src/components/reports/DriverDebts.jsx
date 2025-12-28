import { useState, useEffect } from 'react'
import { Users, CheckCircle, Clock } from 'lucide-react'
import api from '../../services/api'

const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)

export default function DriverDebts() {
  const [loading, setLoading] = useState(true)
  const [debts, setDebts] = useState([])
  const [stats, setStats] = useState({ totalDebt: 0, paidAmount: 0, pendingCount: 0, paidCount: 0 })
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'paid'

  const fetchDebts = async () => {
    try {
      const res = await api.get('/flights/driver-debts', { params: { status: filter === 'all' ? undefined : filter } })
      setDebts(res.data.data || [])
      setStats(res.data.stats || { totalDebt: 0, paidAmount: 0, pendingCount: 0, paidCount: 0 })
    } catch (err) {
      console.error('Driver debts error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebts()
  }, [filter])

  const handleTogglePayment = async (flightId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'

    // 🚀 Optimistic update - UI ni darhol yangilash
    const oldDebts = [...debts]
    const oldStats = { ...stats }

    // Agar to'landi bo'lsa - ro'yxatdan olib tashlash
    if (newStatus === 'paid') {
      setDebts(prev => prev.filter(d => d._id !== flightId))
    } else {
      setDebts(prev => prev.map(d =>
        d._id === flightId ? { ...d, driverPaymentStatus: newStatus } : d
      ))
    }

    // Stats ni yangilash
    const flight = debts.find(d => d._id === flightId)
    if (flight) {
      const amount = flight.driverOwes || 0
      if (newStatus === 'paid') {
        setStats(prev => ({
          ...prev,
          paidAmount: prev.paidAmount + amount,
          totalDebt: prev.totalDebt - amount,
          pendingCount: prev.pendingCount - 1,
          paidCount: prev.paidCount + 1
        }))
      } else {
        setStats(prev => ({
          ...prev,
          paidAmount: prev.paidAmount - amount,
          totalDebt: prev.totalDebt + amount,
          pendingCount: prev.pendingCount + 1,
          paidCount: prev.paidCount - 1
        }))
      }
    }

    // Serverga so'rov yuborish (background)
    api.put(`/flights/${flightId}/driver-payment`, { status: newStatus })
      .catch(err => {
        // Xatolik bo'lsa, eski holatga qaytarish
        console.error('Update payment error:', err)
        setDebts(oldDebts)
        setStats(oldStats)
      })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Haydovchi qarzdorliklari</h3>
              <p className="text-sm text-slate-500">Reyslardan keyin haydovchilar beradigan pullar</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-500">Jami qarzdorlik</p>
            <p className="text-lg font-bold text-red-600">{formatMoney(stats.totalDebt)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-500">To'langan</p>
            <p className="text-lg font-bold text-emerald-600">{formatMoney(stats.paidAmount)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-500">Kutilmoqda</p>
            <p className="text-lg font-bold text-amber-600">{stats.pendingCount} ta</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-500">Yopilgan</p>
            <p className="text-lg font-bold text-slate-600">{stats.paidCount} ta</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'all', label: 'Barchasi' },
            { key: 'pending', label: 'Kutilmoqda' },
            { key: 'paid', label: 'To\'langan' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.key
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {debts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Qarzdorlik yo'q</p>
            <p className="text-slate-400 text-sm mt-1">Barcha haydovchilar hisob-kitobni tugatgan</p>
          </div>
        ) : (
          debts.filter(f => f.driverPaymentStatus !== 'paid').map(flight => (
              <div key={flight._id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  {/* Driver info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white bg-purple-500">
                      {flight.driver?.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{flight.driver?.fullName}</p>
                      <p className="text-sm text-slate-500 truncate">{flight.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(flight.completedAt || flight.createdAt).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-600">
                        {formatMoney(flight.driverOwes)} so'm
                      </p>
                      <p className="text-xs flex items-center justify-end gap-1 text-amber-500">
                        <Clock size={12} />
                        Kutilmoqda
                      </p>
                    </div>

                    {/* Toggle button */}
                    <button
                      onClick={() => handleTogglePayment(flight._id, flight.driverPaymentStatus)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                    >
                      ✓ To'landi
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
