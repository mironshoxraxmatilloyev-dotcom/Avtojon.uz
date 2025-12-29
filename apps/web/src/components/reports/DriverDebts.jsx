import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Users, CheckCircle, Clock, X, Wallet } from 'lucide-react'
import api from '../../services/api'

const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)

// Modal Wrapper
const ModalWrapper = memo(({ children, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-slide-up sm:animate-scale-in" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
})

// Qisman to'lov modali
const PartialPaymentModal = memo(function PartialPaymentModal({ flight, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const totalOwed = flight.driverOwes || 0
  const previouslyPaid = flight.driverPaidAmount || 0
  const remaining = totalOwed - previouslyPaid

  const quickAmounts = useMemo(() => {
    if (remaining <= 0) return []
    const amounts = []
    const percentages = [0.25, 0.5, 0.75, 1]
    percentages.forEach(p => {
      const val = Math.round(remaining * p / 1000) * 1000
      if (val > 0 && val <= remaining && !amounts.includes(val)) {
        amounts.push(val)
      }
    })
    return amounts.slice(0, 4)
  }, [remaining])

  const handleSubmit = useCallback(() => {
    const paymentAmount = Number(amount)
    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > remaining) return
    onSubmit({ amount: paymentAmount, note })
  }, [amount, note, remaining, onSubmit])

  const isFullPayment = Number(amount) === remaining

  return createPortal(
    <ModalWrapper onClose={onClose}>
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pul olish</h2>
                <p className="text-emerald-400/80 text-sm mt-0.5">{flight.driver?.fullName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Qarz holati */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Jami qarz:</span>
              <span className="text-white font-bold">{formatMoney(totalOwed)} so'm</span>
            </div>
            {previouslyPaid > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 text-sm">To'langan:</span>
                <span className="text-emerald-400 font-bold">-{formatMoney(previouslyPaid)} so'm</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-amber-400 font-semibold">Qolgan qarz:</span>
              <span className="text-amber-400 font-bold text-xl">{formatMoney(remaining)} so'm</span>
            </div>
          </div>

          {/* Tez tanlash */}
          {quickAmounts.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-3">Tez tanlash</label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${Number(amount) === amt
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                  >
                    {formatMoney(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* To'liq to'lash */}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setAmount(remaining.toString())}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isFullPayment
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                }`}
            >
              <CheckCircle size={20} />
              To'liq to'lash ({formatMoney(remaining)})
            </button>
          )}

          {/* Summa kiritish */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-3">To'lov summasi</label>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? formatMoney(amount) : ''}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '')
                if (Number(val) <= remaining) setAmount(val)
              }}
              className="w-full px-6 py-6 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-3xl font-bold text-center placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
              placeholder="0"
              autoFocus
            />
            <p className="text-center text-slate-500 text-sm mt-2">so'm</p>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Izoh (ixtiyoriy)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
              placeholder="Masalan: Naqd pul, karta orqali..."
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!amount || Number(amount) <= 0 || Number(amount) > remaining}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            {isFullPayment ? 'To\'liq to\'lash' : 'Qisman to\'lash'}
          </button>

          {/* To'lov tarixi */}
          {flight.driverPayments?.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-slate-400 text-xs font-semibold mb-2">To'lov tarixi</h4>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {flight.driverPayments.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-white/5 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-emerald-400 font-semibold">{formatMoney(p.amount)}</span>
                      {p.note && <span className="text-slate-500 ml-2">- {p.note}</span>}
                    </div>
                    <span className="text-slate-500 text-xs">{new Date(p.date).toLocaleDateString('uz-UZ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>,
    document.body
  )
})

export default function DriverDebts() {
  const [loading, setLoading] = useState(true)
  const [debts, setDebts] = useState([])
  const [stats, setStats] = useState({ totalDebt: 0, paidAmount: 0, pendingCount: 0, paidCount: 0 })
  const [filter, setFilter] = useState('all')
  const [selectedFlight, setSelectedFlight] = useState(null)

  const fetchDebts = async () => {
    try {
      const res = await api.get('/flights/driver-debts', { params: { status: filter === 'all' ? undefined : filter } })
      setDebts(res.data.data || [])
      setStats(res.data.stats || { totalDebt: 0, paidAmount: 0, pendingCount: 0, paidCount: 0 })
    } catch {
      // Xatolikni jimgina o'tkazib yuborish
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebts()
  }, [filter])

  const handlePartialPayment = async (flightId, data) => {
    const flight = debts.find(d => d._id === flightId)
    if (!flight) return

    const totalOwed = flight.driverOwes || 0
    const previouslyPaid = flight.driverPaidAmount || 0
    const newPaidAmount = previouslyPaid + data.amount
    const newRemainingDebt = totalOwed - newPaidAmount
    const newStatus = newRemainingDebt <= 0 ? 'paid' : 'partial'

    setSelectedFlight(null)

    try {
      // Serverga yuborish
      await api.post(`/flights/${flightId}/driver-payment`, data)
      
      // Muvaffaqiyatli - UI ni yangilash
      if (newStatus === 'paid') {
        // To'liq to'langan - ro'yxatdan o'chirish
        setDebts(prev => prev.filter(d => d._id !== flightId))
        setStats(prev => ({
          ...prev,
          totalDebt: Math.max(0, prev.totalDebt - (totalOwed - previouslyPaid)),
          paidAmount: prev.paidAmount + (totalOwed - previouslyPaid),
          pendingCount: Math.max(0, prev.pendingCount - 1),
          paidCount: prev.paidCount + 1
        }))
      } else {
        // Qisman to'langan - yangilash
        setDebts(prev => prev.map(d => {
          if (d._id !== flightId) return d
          return {
            ...d,
            driverPaidAmount: newPaidAmount,
            driverRemainingDebt: newRemainingDebt,
            driverPaymentStatus: newStatus,
            driverPayments: [...(d.driverPayments || []), { amount: data.amount, date: new Date().toISOString(), note: data.note }]
          }
        }))
      }
    } catch (err) {
      console.error('Payment error:', err)
      // Xatolik bo'lsa - qayta yuklash
      fetchDebts()
    }
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
              <p className="text-sm text-slate-500">Marshrutlardan keyin haydovchilar beradigan pullar</p>
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
          // Haydovchilarni guruhlash - bir xil haydovchi faqat 1 marta ko'rinsin
          (() => {
            const unpaidDebts = debts.filter(f => f.driverPaymentStatus !== 'paid')
            const groupedByDriver = {}
            
            unpaidDebts.forEach(flight => {
              const driverId = flight.driver?._id || flight.driver?.id || 'unknown'
              if (!groupedByDriver[driverId]) {
                groupedByDriver[driverId] = {
                  driver: flight.driver,
                  flights: [],
                  totalOwed: 0,
                  totalPaid: 0
                }
              }
              groupedByDriver[driverId].flights.push(flight)
              groupedByDriver[driverId].totalOwed += (flight.driverOwes || 0)
              groupedByDriver[driverId].totalPaid += (flight.driverPaidAmount || 0)
            })

            return Object.values(groupedByDriver).map(group => {
              const remaining = group.totalOwed - group.totalPaid
              const hasPartialPayment = group.totalPaid > 0

              return (
                <div key={group.driver?._id || group.driver?.id || 'unknown'} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    {/* Driver info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white bg-purple-500">
                        {group.driver?.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{group.driver?.fullName}</p>
                        <p className="text-sm text-slate-500">{group.flights.length} ta marshrut</p>
                      </div>
                    </div>

                    {/* Amount & Action */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        {hasPartialPayment ? (
                          <>
                            <p className="font-bold text-lg text-amber-600">{formatMoney(remaining)} so'm</p>
                            <p className="text-xs text-emerald-500">
                              <CheckCircle size={10} className="inline mr-1" />
                              {formatMoney(group.totalPaid)} to'langan
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-lg text-red-600">{formatMoney(group.totalOwed)} so'm</p>
                            <p className="text-xs flex items-center justify-end gap-1 text-amber-500">
                              <Clock size={12} />
                              Kutilmoqda
                            </p>
                          </>
                        )}
                      </div>

                      {/* Pul olish tugmasi - birinchi to'lanmagan marshrutni ochadi */}
                      <button
                        onClick={() => {
                          // Eng eski to'lanmagan marshrutni topish
                          const unpaidFlight = group.flights.find(f => f.driverPaymentStatus !== 'paid') || group.flights[0]
                          setSelectedFlight(unpaidFlight)
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                      >
                        <Wallet size={16} className="inline mr-1" />
                        Pul olish
                      </button>
                    </div>
                  </div>

                  {/* Progress bar for partial payments */}
                  {hasPartialPayment && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                          style={{ width: `${Math.min((group.totalPaid / group.totalOwed) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          })()
        )}
      </div>

      {/* Partial Payment Modal */}
      {selectedFlight && (
        <PartialPaymentModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
          onSubmit={(data) => handlePartialPayment(selectedFlight._id, data)}
        />
      )}
    </div>
  )
}
