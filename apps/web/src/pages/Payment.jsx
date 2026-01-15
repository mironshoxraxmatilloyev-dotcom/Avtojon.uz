import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Truck, ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw, Shield, Sparkles, Zap, Star, AlertCircle } from 'lucide-react'
import api from '../services/api'

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

  // FIX: Memoize calculatePrice to prevent infinite loops and satisfy useEffect deps
  const calculatePrice = useCallback(async () => {
    setCalculating(true)
    setError('') // Clear previous errors when recalculating
    try {
      const { data } = await api.get('/payments/calculate')
      if (data.success) {
        setPriceData(data.data)
      } else {
        setError('Narxni hisoblashda xatolik')
      }
    } catch (err) {
      console.error('Price calculation error:', err)
      setError('Narxni hisoblashda xatolik yuz berdi')
    } finally {
      setCalculating(false)
    }
  }, []) // No dependencies - API call is stable

  // FIX: Memoize checkPaymentStatus with orderId dependency
  const checkPaymentStatus = useCallback(async (id) => {
    if (!id) return
    
    setCalculating(true)
    try {
      const { data } = await api.get(`/payments/status/${id}`)
      if (data.success) {
        setPaymentStatus(data.data)
      }
    } catch (err) {
      console.error('Payment status check error:', err)
      // Don't show error to user - they can retry manually
    } finally {
      setCalculating(false)
    }
  }, [])

  // FIX: Proper useEffect with correct dependencies
  useEffect(() => {
    if (!orderId) {
      calculatePrice()
    }
  }, [orderId, calculatePrice])

  // FIX: Separate useEffect for payment status check
  useEffect(() => {
    if (orderId) {
      checkPaymentStatus(orderId)
    }
  }, [orderId, checkPaymentStatus])

  // FIX: Add handler for provider selection that clears errors
  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider)
    setError('') // UX: Clear error when user makes a new selection
  }

  // FIX: Improved payment handler with double-submit protection and better error handling
  const handlePayment = async () => {
    // Validation with clear error messages
    if (!selectedProvider) {
      setError('To\'lov tizimini tanlang')
      return
    }

    // UX: Warn user that Click is not yet supported
    if (selectedProvider === 'click') {
      setError('Click to\'lov tizimi hozircha qo\'llab-quvvatlanmaydi. Iltimos, Payme tanlang.')
      return
    }

    if (!priceData?.totalPrice || priceData.totalPrice <= 0) {
      setError('To\'lov summasi noto\'g\'ri')
      return
    }

    // FIX: Double-submit protection - prevent multiple clicks
    if (loading) return

    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/payments/create', { provider: selectedProvider })
      
      if (data.success && data.data.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = data.data.paymentUrl
      } else {
        setError('To\'lov yaratishda xatolik yuz berdi')
        setLoading(false) // Re-enable button only on error
      }
    } catch (err) {
      console.error('Payment creation error:', err)
      const errorMessage = err.response?.data?.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.'
      setError(errorMessage)
      setLoading(false) // Re-enable button on error
    }
    // Note: Don't set loading=false on success - we're redirecting anyway
  }

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0'
    return new Intl.NumberFormat('uz-UZ').format(price)
  }

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

  // FIX: Backend returns 'state' not 'status' - check both for compatibility
  if (paymentStatus?.state === 'performed' || paymentStatus?.status === 'completed' || status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lov muvaffaqiyatli!</h1>
          <p className="text-gray-500 mb-6">Obunangiz 30 kunga uzaytirildi.</p>
          {paymentStatus && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-emerald-700"><span className="font-medium">Buyurtma:</span> {paymentStatus.orderId}</p>
              <p className="text-sm text-emerald-700"><span className="font-medium">Summa:</span> {formatPrice(paymentStatus.amount)} so'm</p>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors">
            Davom etish
          </button>
        </div>
      </div>
    )
  }

  // FIX: Check for 'created' state from backend (state: 1)
  if (paymentStatus?.state === 'created' || paymentStatus?.status === 'pending' || paymentStatus?.status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lov kutilmoqda</h1>
          <p className="text-gray-500 mb-6">To'lov hali tasdiqlanmagan.</p>
          <button onClick={() => checkPaymentStatus(orderId)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={18} />
            Qayta tekshirish
          </button>
        </div>
      </div>
    )
  }

  // FIX: Check for 'cancelled' state from backend
  if (paymentStatus?.state === 'cancelled' || paymentStatus?.status === 'cancelled' || paymentStatus?.status === 'failed' || status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lov amalga oshmadi</h1>
          <p className="text-gray-500 mb-6">To'lov bekor qilindi yoki xatolik yuz berdi.</p>
          <button 
            onClick={() => { 
              setPaymentStatus(null)
              setError('')
              setSelectedProvider(null) // Reset provider selection
              navigate('/payment', { replace: true })
              calculatePrice() // Refresh price data
            }} 
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
          >
            Qaytadan urinish
          </button>
        </div>
      </div>
    )
  }

  if (priceData?.vehicleCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mashina topilmadi</h1>
          <p className="text-gray-500 mb-6">Avval mashina qo'shing.</p>
          <button onClick={() => navigate('/fleet')} className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors">
            Mashina qo'shish
          </button>
        </div>
      </div>
    )
  }

  // FIX: Calculate if button should be disabled and why
  const isButtonDisabled = loading || !selectedProvider || !priceData?.totalPrice || priceData.totalPrice <= 0
  const getDisabledReason = () => {
    if (loading) return null // Loading state is obvious
    if (!selectedProvider) return 'To\'lov tizimini tanlang'
    if (!priceData?.totalPrice || priceData.totalPrice <= 0) return 'To\'lov summasi noto\'g\'ri'
    return null
  }
  const disabledReason = getDisabledReason()

  return (
    // FIX: Remove overflow-y-auto to prevent double scroll - let body handle scrolling
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-white/60 hover:text-white transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-medium">Orqaga</span>
        </button>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white/90">7 kun bepul sinov davri</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                Xizmatdan to'liq foydalanish uchun{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  obunani faollashtiring
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-white/60 leading-relaxed">
                Tezkor, xavfsiz va avtomatik to'lov tizimi orqali biznesingizni yangi bosqichga olib chiqing
              </p>
            </div>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Shield, title: 'Xavfsiz to\'lov', desc: 'SSL shifrlangan' },
                { icon: Zap, title: '24/7 xizmat', desc: 'Doimo faol' },
                { icon: CheckCircle, title: 'Bekor qilish', desc: 'Istalgan vaqt' },
                { icon: Star, title: 'Avtomatik', desc: 'Yangilanish' }
              ].map((benefit, idx) => (
                <div 
                  key={idx}
                  className="group flex items-start gap-3 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-0.5">{benefit.title}</h3>
                    <p className="text-xs text-white/50">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{priceData?.vehicleCount || 0}</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Mashinalar</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">30</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Kun</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
                  {priceData?.totalPrice ? formatPrice(priceData.totalPrice) : '0'}
                </div>
                <div className="text-xs text-white/50 uppercase tracking-wider">So'm</div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-3xl" />
            
            {/* Card */}
            <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              {/* Price Section */}
              <div className="mb-8">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium text-white/60">Jami to'lov</span>
                  <span className="text-xs text-white/40">30 kun</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    {priceData?.totalPrice ? formatPrice(priceData.totalPrice) : '0'}
                  </span>
                  <span className="text-xl text-white/60">so'm</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/50">
                  <Truck className="w-4 h-4" />
                  <span>{priceData?.vehicleCount || 0} ta mashina × {formatPrice(priceData?.pricePerVehicle || 0)} so'm</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-4">
                  To'lov usulini tanlang
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('payme')}
                    disabled={loading}
                    className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedProvider === 'payme'
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        selectedProvider === 'payme' ? 'bg-white shadow-lg scale-110' : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <span className="text-xl font-bold text-cyan-500">payme</span>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-white/70 font-medium">Humo • UzCard</div>
                      </div>
                      {selectedProvider === 'payme' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* UX: Show Click as disabled since backend doesn't support it yet */}
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('click')}
                    disabled={loading}
                    className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedProvider === 'click'
                        ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        selectedProvider === 'click' ? 'bg-white shadow-lg scale-110' : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <span className="text-xl font-bold text-blue-600">CLICK</span>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-white/70 font-medium">Humo • UzCard</div>
                      </div>
                      {selectedProvider === 'click' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* UX: Show disabled reason as info message when button is disabled but no error */}
              {!error && disabledReason && (
                <div className="mb-6 p-4 bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="flex-shrink-0 w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-200">{disabledReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl animate-shake">
                  <div className="flex items-start gap-3">
                    <XCircle className="flex-shrink-0 w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-200">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={isButtonDisabled}
                className="group relative w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-2xl shadow-purple-500/30 disabled:shadow-none transition-all duration-300 overflow-hidden"
                aria-label={disabledReason || 'To\'lash'}
              >
                {/* Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Yuklanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      <span>To'lash</span>
                    </>
                  )}
                </span>
              </button>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>256-bit SSL shifrlangan xavfsiz to'lov</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
