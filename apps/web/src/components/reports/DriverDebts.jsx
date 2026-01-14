import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Users, CheckCircle, Clock, X, Wallet, AlertTriangle } from 'lucide-react'
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

// Confirmation Modal - Tasdiqlash uchun
const ConfirmationModal = memo(function ConfirmationModal({ title, message, amount, onConfirm, onCancel }) {
  return createPortal(
    <ModalWrapper onClose={onCancel}>
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-red-500/20">
        {/* Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title || 'Tasdiqlash'}</h3>
              <p className="text-red-400/70 text-sm">Bu amalni tasdiqlaysizmi?</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-slate-300 text-base">{message}</p>
          
          {amount && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">To'lov summasi</p>
              <p className="text-red-400 text-2xl font-bold">{formatMoney(amount)} so'm</p>
            </div>
          )}

          <p className="text-amber-400/70 text-sm flex items-center gap-2">
            <AlertTriangle size={14} />
            Bu amalni bekor qilish mumkin emas
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-slate-700 bg-slate-900/50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all active:scale-95"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-xl transition-all active:scale-95"
          >
            Ha, bekor qilish
          </button>
        </div>
      </div>
    </ModalWrapper>,
    document.body
  )
})

// Qisman to'lov modali - BIR HAYDOVCHINING BARCHA MARSHRUTLARI UCHUN
const PartialPaymentModal = memo(function PartialPaymentModal({ driverGroup, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [selectedFlightId, setSelectedFlightId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null) // { paymentIndex, amount }

  // Barcha marshrutlardan umumiy qarz va to'lovni hisoblash
  const totalOwed = driverGroup.flights.reduce((sum, f) => sum + (f.driverOwes || 0), 0)
  const totalPaid = driverGroup.flights.reduce((sum, f) => sum + (f.driverPaidAmount || 0), 0)
  const remaining = totalOwed - totalPaid

  // Tanlangan marshrutni topish
  const selectedFlight = driverGroup.flights.find(f => f._id === selectedFlightId)
  const selectedFlightRemaining = selectedFlight ? (selectedFlight.driverOwes || 0) - (selectedFlight.driverPaidAmount || 0) : 0

  // Birinchi to'lanmagan marshrutni avtomatik tanlash
  useEffect(() => {
    const unpaidFlight = driverGroup.flights.find(f => {
      const flightRemaining = (f.driverOwes || 0) - (f.driverPaidAmount || 0)
      return flightRemaining > 0
    })
    if (unpaidFlight) {
      setSelectedFlightId(unpaidFlight._id)
    }
  }, [driverGroup.flights])

  const quickAmounts = useMemo(() => {
    if (selectedFlightRemaining <= 0) return []
    const amounts = []
    const percentages = [0.25, 0.5, 0.75, 1]
    percentages.forEach(p => {
      const val = Math.round(selectedFlightRemaining * p / 1000) * 1000
      if (val > 0 && val <= selectedFlightRemaining && !amounts.includes(val)) {
        amounts.push(val)
      }
    })
    return amounts.slice(0, 4)
  }, [selectedFlightRemaining])

  const handleSubmit = useCallback(() => {
    setErrorMessage('')
    const paymentAmount = Number(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      setErrorMessage('Summa kiriting')
      return
    }
    if (!selectedFlightId) {
      setErrorMessage('Marshrut tanlanmagan')
      return
    }
    onSubmit(selectedFlightId, { amount: paymentAmount, note })
  }, [amount, note, selectedFlightId, onSubmit])

  const isFullPayment = Number(amount) === selectedFlightRemaining

  return createPortal(
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Minimal Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 flex-shrink-0">
          <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-all">
            <X size={18} />
          </button>
          <div className="pr-10">
            <h2 className="text-lg font-bold text-white">Pul olish</h2>
            <p className="text-white/90 text-sm mt-0.5">{driverGroup.driver?.fullName}</p>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Xatolik xabari */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
              <p className="text-red-800 text-sm font-medium">⚠️ {errorMessage}</p>
            </div>
          )}

          {/* Qarz info - Minimal */}
          <div className="bg-slate-50 rounded-xl p-3.5 space-y-2">
            {totalPaid > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Jami qarz:</span>
                <span className="text-slate-900 font-semibold">{formatMoney(totalOwed)}</span>
              </div>
            )}
            {totalPaid > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-600">To'langan:</span>
                <span className="text-emerald-600 font-semibold">-{formatMoney(totalPaid)}</span>
              </div>
            )}
            <div className={`flex justify-between items-center ${totalPaid > 0 ? 'border-t border-slate-200 pt-2' : ''}`}>
              <span className="text-slate-700 font-semibold">Qolgan:</span>
              <span className="text-amber-600 font-bold text-lg">{formatMoney(remaining)} so'm</span>
            </div>
          </div>

          {/* Marshrutlarni tanlash */}
          {driverGroup.flights.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marshrut tanlang</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {driverGroup.flights.map(f => {
                  const flightRemaining = (f.driverOwes || 0) - (f.driverPaidAmount || 0)
                  if (flightRemaining <= 0) return null
                  const isCompleted = f.status === 'completed'
                  return (
                    <button
                      key={f._id}
                      type="button"
                      onClick={() => setSelectedFlightId(f._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${selectedFlightId === f._id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{new Date(f.createdAt).toLocaleDateString('uz-UZ')}</span>
                          {!isCompleted && <span className="ml-2 text-xs opacity-75">(Faol)</span>}
                        </div>
                        <span className="font-bold">{formatMoney(flightRemaining)} so'm</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summa input - Main focus */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To'lov summasi</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amount ? formatMoney(amount) : ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '')
                  setAmount(val)
                }}
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-slate-900 text-base font-semibold placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="0"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">so'm</span>
            </div>
          </div>

          {/* Tez tanlash - Compact */}
          {quickAmounts.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${Number(amount) === amt
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {formatMoney(amt)}
                </button>
              ))}
            </div>
          )}

          {/* To'liq to'lash - Compact */}
          {selectedFlightRemaining > 0 && (
            <button
              type="button"
              onClick={() => setAmount(selectedFlightRemaining.toString())}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${isFullPayment
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                }`}
            >
              To'liq to'lash ({formatMoney(selectedFlightRemaining)})
            </button>
          )}

          {/* Izoh - Compact */}
          <div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Izoh (ixtiyoriy)"
            />
          </div>

          {/* To'lov tarixi - agar bor bo'lsa */}
          {selectedFlight && selectedFlight.driverPayments && selectedFlight.driverPayments.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">To'lov tarixi:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFlight.driverPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-700">{formatMoney(payment.amount)} so'm</p>
                      <p className="text-xs text-emerald-600">{new Date(payment.date).toLocaleDateString('uz-UZ')}</p>
                      {payment.note && <p className="text-xs text-slate-500 mt-0.5">{payment.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ paymentIndex: index, amount: payment.amount })}
                      className="ml-2 p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                      title="To'lovni bekor qilish"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit button - Fixed bottom */}
        <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!amount || Number(amount) <= 0 || !selectedFlightId}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] transition-all"
          >
            {isFullPayment ? 'To\'liq to\'lash' : 'Qisman to\'lash'}
          </button>
        </div>

        {/* Confirmation Modal for Payment Deletion */}
        {confirmDelete && (
          <ConfirmationModal
            title="To'lovni bekor qilish"
            message="Bu to'lovni bekor qilmoqchimisiz? Summa haydovchining qarziga qaytariladi."
            amount={confirmDelete.amount}
            onConfirm={() => {
              onSubmit(selectedFlightId, { deletePaymentIndex: confirmDelete.paymentIndex })
              setConfirmDelete(null)
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
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
  const [selectedDriverGroup, setSelectedDriverGroup] = useState(null)
  const [errorModal, setErrorModal] = useState(null) // { title, message }

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

    // Agar to'lovni bekor qilish bo'lsa
    if (data.deletePaymentIndex !== undefined) {
      try {
        const response = await api.delete(`/flights/${flightId}/driver-payment/${data.deletePaymentIndex}`)
        
        // Muvaffaqiyatli - UI ni yangilash
        setDebts(prev => prev.map(d => {
          if (d._id !== flightId) return d
          const updatedFlight = response.data.data
          return {
            ...d,
            driverPaidAmount: updatedFlight.driverPaidAmount,
            driverRemainingDebt: updatedFlight.driverRemainingDebt,
            driverPaymentStatus: updatedFlight.driverPaymentStatus,
            driverPayments: updatedFlight.driverPayments
          }
        }))
        
        // Stats'ni yangilash
        const refundedAmount = response.data.refundedAmount || 0
        setStats(prev => ({
          ...prev,
          totalDebt: prev.totalDebt + refundedAmount,
          paidAmount: Math.max(0, prev.paidAmount - refundedAmount)
        }))
        
        return
      } catch (err) {
        setErrorModal({
          title: 'Xatolik',
          message: err.response?.data?.message || 'To\'lovni bekor qilishda xatolik'
        })
        fetchDebts()
        return
      }
    }

    // Yangi to'lov qo'shish
    const totalOwed = flight.driverOwes || 0
    const previouslyPaid = flight.driverPaidAmount || 0
    const newPaidAmount = previouslyPaid + data.amount
    const newRemainingDebt = totalOwed - newPaidAmount
    const newStatus = newRemainingDebt <= 0 ? 'paid' : 'partial'

    try {
      // Serverga yuborish
      const response = await api.post(`/flights/${flightId}/driver-payment`, data)
      
      // Muvaffaqiyatli - UI ni yangilash
      // TUZATILDI: Faqat marshrutni yangilash, haydovchini o'chirmaslik
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
      
      // Stats'ni yangilash
      setStats(prev => ({
        ...prev,
        totalDebt: Math.max(0, prev.totalDebt - data.amount),
        paidAmount: prev.paidAmount + data.amount,
        paidCount: newStatus === 'paid' ? prev.paidCount + 1 : prev.paidCount,
        pendingCount: newStatus === 'paid' ? Math.max(0, prev.pendingCount - 1) : prev.pendingCount
      }))
    } catch (err) {
      setErrorModal({
        title: 'Xatolik',
        message: err.response?.data?.message || 'Xatolik yuz berdi'
      })
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
            // TUZATILDI: Barcha marshrutlarni ko'rsatish (to'langan va to'lanmagan)
            const groupedByDriver = {}
            
            debts.forEach(flight => {
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
              const isFullyPaid = remaining <= 0

              return (
                <div key={group.driver?._id || group.driver?.id || 'unknown'} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    {/* Driver info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white ${isFullyPaid ? 'bg-emerald-500' : 'bg-purple-500'}`}>
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
                        {isFullyPaid ? (
                          <>
                            <p className="font-bold text-lg text-emerald-600">To'langan</p>
                            <p className="text-xs text-emerald-500">
                              <CheckCircle size={10} className="inline mr-1" />
                              {formatMoney(group.totalPaid)} so'm
                            </p>
                          </>
                        ) : hasPartialPayment ? (
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

                      {/* Pul olish tugmasi - faqat to'lanmagan uchun */}
                      {!isFullyPaid && (
                        <button
                          onClick={() => {
                            setSelectedDriverGroup(group)
                          }}
                          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                        >
                          <Wallet size={16} className="inline mr-1" />
                          Pul olish
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for partial payments */}
                  {hasPartialPayment && !isFullyPaid && (
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
      {selectedDriverGroup && (
        <PartialPaymentModal
          driverGroup={selectedDriverGroup}
          onClose={() => setSelectedDriverGroup(null)}
          onSubmit={(flightId, data) => {
            handlePartialPayment(flightId, data)
            setSelectedDriverGroup(null)
          }}
        />
      )}

      {/* Error Modal */}
      {errorModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setErrorModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{errorModal.title}</h3>
                <p className="text-slate-600 text-sm">{errorModal.message}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorModal(null)}
              className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all"
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
