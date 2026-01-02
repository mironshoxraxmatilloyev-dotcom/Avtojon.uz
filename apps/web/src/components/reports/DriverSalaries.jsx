import { useState, useEffect } from 'react'
import { Wallet, CheckCircle, Clock, DollarSign, User } from 'lucide-react'
import api from '../../services/api'

const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)

export default function DriverSalaries() {
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState([])
  const [stats, setStats] = useState({ totalPending: 0, driversCount: 0 })
  const [paying, setPaying] = useState(null)

  const fetchSalaries = async () => {
    try {
      const res = await api.get('/drivers/salaries/pending')
      setDrivers(res.data.data || [])
      setStats(res.data.stats || { totalPending: 0, driversCount: 0 })
    } catch (err) {
      console.error('Driver salaries error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalaries()
  }, [])

  const handlePaySalary = async (driverId, amount) => {
    setPaying(driverId)
    try {
      await api.post(`/drivers/${driverId}/pay-salary`, { amount })
      
      // Muvaffaqiyatli - UI ni yangilash
      setDrivers(prev => prev.filter(d => d._id !== driverId))
      setStats(prev => ({
        ...prev,
        totalPending: Math.max(0, prev.totalPending - amount),
        driversCount: Math.max(0, prev.driversCount - 1)
      }))
    } catch (err) {
      console.error('Pay salary error:', err)
      // Xatolik bo'lsa - qayta yuklash
      await fetchSalaries()
    } finally {
      setPaying(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Haydovchi oyliklari</h3>
              <p className="text-sm text-slate-500">Marshrutlardan olingan foiz ulushlar</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500">Jami to'lanmagan</p>
            <p className="text-2xl font-bold text-amber-600">{formatMoney(stats.totalPending)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500">Haydovchilar soni</p>
            <p className="text-2xl font-bold text-slate-600">{stats.driversCount} ta</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {drivers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Barcha oyliklar to'langan</p>
            <p className="text-slate-400 text-sm mt-1">Hozircha kutilayotgan to'lov yo'q</p>
          </div>
        ) : (
          drivers.map(driver => (
            <div key={driver._id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                {/* Driver info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white">
                    {driver.fullName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{driver.fullName}</p>
                    <p className="text-sm text-slate-500">{driver.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        Jami: {formatMoney(driver.totalEarnings)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-xl text-amber-600">
                      {formatMoney(driver.pendingEarnings)}
                    </p>
                    <p className="text-xs text-amber-500 flex items-center justify-end gap-1">
                      <Clock size={12} />
                      Kutilmoqda
                    </p>
                  </div>

                  {/* Pay button */}
                  <button
                    onClick={() => handlePaySalary(driver._id, driver.pendingEarnings)}
                    disabled={paying === driver._id}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
                  >
                    {paying === driver._id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "To'lash"
                    )}
                  </button>
                </div>
              </div>

              {/* Recent payments */}
              {driver.salaryPayments?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Oxirgi to'lovlar:</p>
                  <div className="flex flex-wrap gap-2">
                    {driver.salaryPayments.slice(-3).reverse().map((payment, idx) => (
                      <span key={idx} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                        {formatMoney(payment.amount)} • {new Date(payment.paidAt).toLocaleDateString('uz-UZ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
