import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Crown, Check, CreditCard, ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import api from '../services/api'

const PLANS = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro (Oylik)',
    price: 99000,
    duration: '1 oy',
    popular: true,
    features: [
      'Cheksiz mashinalar',
      'Moliyaviy hisobotlar',
      'Smart alerts',
      'Ovozli kiritish',
      'Texnik yordam'
    ]
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro (Yillik)',
    price: 990000,
    duration: '1 yil',
    discount: '2 oy tekin',
    features: [
      'Cheksiz mashinalar',
      'Moliyaviy hisobotlar',
      'Smart alerts',
      'Ovozli kiritish',
      'Prioritet yordam',
      '2 oy tekin!'
    ]
  }
}

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState('pro_monthly')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)

  // URL dan status va order_id olish
  const status = searchParams.get('status')
  const orderId = searchParams.get('order_id')

  // To'lov holatini tekshirish
  useEffect(() => {
    if (orderId) {
      checkPaymentStatus(orderId)
    }
  }, [orderId])

  const checkPaymentStatus = async (id) => {
    setCheckingStatus(true)
    try {
      const { data } = await api.get(`/payments/status/${id}`)
      if (data.success) {
        setPaymentStatus(data.data)
      }
    } catch (err) {
      console.error('Status check error:', err)
    } finally {
      setCheckingStatus(false)
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
        plan: selectedPlan,
        provider: selectedProvider
      })

      if (data.success && data.data.paymentUrl) {
        // To'lov sahifasiga yo'naltirish
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
    return new Intl.NumberFormat('uz-UZ').format(price)
  }

  // To'lov holati tekshirilmoqda
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">To'lov tekshirilmoqda...</h2>
          <p className="text-gray-500">Iltimos, kuting</p>
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
            Sizning Pro obunangiz aktivlashtirildi. Endi barcha imkoniyatlardan foydalanishingiz mumkin.
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
            onClick={() => navigate('/fleet')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
          >
            Davom etish
          </button>
        </div>
      </div>
    )
  }

  // To'lov kutilmoqda yoki jarayonda
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
          <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-amber-700">
              <span className="font-medium">Buyurtma:</span> {paymentStatus.orderId}
            </p>
            <p className="text-sm text-amber-700">
              <span className="font-medium">Summa:</span> {formatPrice(paymentStatus.amount)} so'm
            </p>
            <p className="text-sm text-amber-700">
              <span className="font-medium">Holat:</span> {paymentStatus.status === 'pending' ? 'Kutilmoqda' : 'Jarayonda'}
            </p>
          </div>
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

  // To'lov bekor qilingan yoki xato
  if (paymentStatus?.status === 'cancelled' || paymentStatus?.status === 'failed' || status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lov amalga oshmadi</h1>
          <p className="text-gray-500 mb-6">
            To'lov bekor qilindi yoki xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.
          </p>
          <button
            onClick={() => {
              setPaymentStatus(null)
              navigate('/payment', { replace: true })
            }}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
          >
            Qaytadan urinish
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

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pro ga o'tish</h1>
          <p className="text-gray-500">Avtoparkingizni professional darajada boshqaring</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {Object.values(PLANS).map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                  Mashhur
                </span>
              )}
              {plan.discount && (
                <span className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                  {plan.discount}
                </span>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.duration}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === plan.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                }`}>
                  {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>

              <p className="text-3xl font-bold text-gray-900 mb-4">
                {formatPrice(plan.price)} <span className="text-base font-normal text-gray-500">so'm</span>
              </p>

              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            To'lov usulini tanlang
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Payme */}
            <button
              onClick={() => setSelectedProvider('payme')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                selectedProvider === 'payme'
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <svg viewBox="0 0 100 30" className="h-7">
                <text x="10" y="22" fill="#00CCCC" fontWeight="bold" fontSize="18">payme</text>
              </svg>
              <span className="text-xs text-gray-500">Humo, UzCard, Visa, MC</span>
            </button>

            {/* Click */}
            <button
              onClick={() => setSelectedProvider('click')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                selectedProvider === 'click'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <svg viewBox="0 0 100 30" className="h-7">
                <text x="10" y="22" fill="#0066FF" fontWeight="bold" fontSize="18">CLICK</text>
              </svg>
              <span className="text-xs text-gray-500">Humo, UzCard, Visa, MC</span>
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
              To'lash - {formatPrice(PLANS[selectedPlan].price)} so'm
            </>
          )}
        </button>

        {/* Security note */}
        <p className="text-center text-gray-400 text-sm mt-4">
          🔒 Barcha to'lovlar xavfsiz va shifrlangan
        </p>

        {/* Supported cards */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className="text-xs text-gray-400">Qo'llab-quvvatlanadi:</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Humo</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">UzCard</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">Visa</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">MasterCard</span>
          </div>
        </div>
      </div>
    </div>
  )
}
