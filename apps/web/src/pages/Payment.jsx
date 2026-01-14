import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Truck, CreditCard, ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw, Calendar, Shield } from 'lucide-react'
import api from '../services/api'

// Fleet users uchun: 10,000 so'm / mashina / oy
// Biznesmenlar uchun: 30,000 so'm / mashina / oy
const PRICE_PER_VEHICLE = 30000 // Biznesmenlar uchun

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(true)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [priceData, setPriceData] = useState(null)

  const status = searchParams.get('status')
  const orderId = searchParams.get('order_id')

  // Narxni hisoblash
  useEffect(() => {
    if (!orderId) {
      calculatePrice()
    }
  }, [])

  // To'lov holatini tekshirish
  useEffect(() => {
    if (orderId) {
      checkPaymentStatus(orderId)
    }
  }, [orderId])

  const calculatePrice = async () => {
    setCalculating(true)
    try {
      const { data } = await api.get('/payments/calculate')
      if (data.success) {
        setPriceData(data.data)
      }
    } catch (err) {
      setError('Narxni hisoblashda xatolik')
    } finally {
      setCalculating(false)
    }
  }

  const checkPaymentStatus = async (id) => {
    setCalculating(true)
    try {
      const { data } = await api.get(`/payments/status/${id}`)
      if (data.success) {
        setPaymentStatus(data.data)
      }
    } catch (err) {
      // Error ignored
    } finally {
      setCalculating(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedProvider) {
      setError('To\'lov tizimini tanlang')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/payments/create', {
        provider: selectedProvider
      })

      if (data.success && data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl
      } else {
        setError('To\'lov yaratishda xatolik')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0'
    return new Intl.NumberFormat('uz-UZ').format(price)
  }

  // Loading
  if (calculating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Yuklanmoqda...</h2>
        </div>
      </div>
    )
  }

  // Muvaffaqiyatli to'lov
  if (paymentStatus?.status === 'completed' || status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lov muvaffaqiyatli!</h1>
          <p className="text-gray-500 mb-6">
            Obunangiz 30 kunga uzaytirildi. Barcha imkoniyatlardan foydalanishingiz mumkin.
          </p>
          {paymentStatus && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-emerald-700">
                <span className="font-medium">Buyurtma:</span> {paymentStatus.orderId}
              </p>
              <p className="text-sm text-emerald-700">
                <span className="font-medium">Summa:</span> {formatPrice(paymentStatus.amount)} so'm
              </p>
            </div>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
          >
            Davom etish
          </button>
        </div>
      </div>
    )
  }

  // To'lov kutilmoqda
  if (paymentStatus?.status === 'pending' || paymentStatus?.status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lov kutilmoqda</h1>
          <p className="text-gray-500 mb-6">
            To'lov hali tasdiqlanmagan. Agar to'lov qilgan bo'lsangiz, bir necha daqiqa kuting.
          </p>
          <button
            onClick={() => checkPaymentStatus(orderId)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Qayta tekshirish
          </button>
        </div>
      </div>
    )
  }

  // To'lov bekor qilingan
  if (paymentStatus?.status === 'cancelled' || paymentStatus?.status === 'failed' || status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lov amalga oshmadi</h1>
          <p className="text-gray-500 mb-6">
            To'lov bekor qilindi yoki xatolik yuz berdi.
          </p>
          <button
            onClick={() => {
              setPaymentStatus(null)
              navigate('/payment', { replace: true })
              calculatePrice()
            }}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
          >
            Qaytadan urinish
          </button>
        </div>
      </div>
    )
  }

  // Mashina yo'q
  if (priceData?.vehicleCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mashina topilmadi</h1>
          <p className="text-gray-500 mb-6">
            Avval mashina qo'shing, keyin obuna sotib olishingiz mumkin.
          </p>
          <button
            onClick={() => navigate('/fleet')}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
          >
            Mashina qo'shish
          </button>
        </div>
      </div>
    )
  }

  // Asosiy to'lov sahifasi
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="p-4 lg:p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Orqaga</span>
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Obuna to'lovi</h1>
          <p className="text-gray-500">Har bir mashina uchun oylik to'lov</p>
        </div>

        {/* Price Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Mashinalar soni</p>
                <p className="text-sm text-gray-500">{formatPrice(PRICE_PER_VEHICLE)} so'm / mashina</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-indigo-600">{priceData?.vehicleCount}</span>
          </div>

          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Muddat</p>
                <p className="text-sm text-gray-500">Oylik obuna</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-gray-700">30 kun</span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">Jami to'lov:</p>
            <p className="text-3xl font-bold text-indigo-600">
              {priceData?.totalPrice ? formatPrice(priceData.totalPrice) : '0'} <span className="text-base font-normal text-gray-500">so'm</span>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Eslatma:</strong> Birinchi 7 kun bepul! Sinov muddati tugagandan so'ng to'lov talab qilinadi.
          </p>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            To'lov usuli
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedProvider('payme')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                selectedProvider === 'payme'
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xl font-bold text-cyan-500">payme</span>
              <span className="text-xs text-gray-500">Humo, UzCard, Visa</span>
            </button>

            <button
              onClick={() => setSelectedProvider('click')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                selectedProvider === 'click'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xl font-bold text-blue-600">CLICK</span>
              <span className="text-xs text-gray-500">Humo, UzCard, Visa</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handlePayment}
          disabled={loading || !selectedProvider}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/30 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Yuklanmoqda...
            </>
          ) : (
            <>
              To'lash - {priceData?.totalPrice ? formatPrice(priceData.totalPrice) : '0'} so'm
            </>
          )}
        </button>

        {/* Security */}
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-sm">
          <Shield size={16} />
          <span>Xavfsiz to'lov</span>
        </div>
      </div>
    </div>
  )
}
