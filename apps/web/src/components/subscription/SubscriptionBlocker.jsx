import { useState } from 'react'
import {
  Crown,
  Phone,
  Truck,
  Users,
  Fuel,
  Route,
  BarChart3,
  Wrench,
  Check,
  Sparkles,
  AlertCircle,
  Clock,
} from 'lucide-react'
import api from '../../services/api'

const SUPPORT_PHONE = '+998 88 019 19 09'
const PRICE_PER_UNIT = 30000 // Biznesmenlar uchun 30,000 so'm / mashina / oy

const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n)

// Fleet uchun - mashinalar
export function FleetSubscriptionBlocker({ vehicleCount = 1 }) {
  const [loading, setLoading] = useState(false)
  const totalPrice = Math.max(1, vehicleCount) * PRICE_PER_UNIT

  const handlePayment = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/payments/create', {
        provider: 'payme',
        type: 'fleet',
        unitCount: vehicleCount,
      })
      if (data.success && data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl
      }
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.message || "To'lov yaratishda xatolik"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span className="text-amber-100 text-sm font-medium"><span>avto</span><span className="text-white">JON</span> Pro</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Sinov muddati tugadi</h1>
            <p className="text-amber-100 text-sm mt-1">Davom etish uchun obuna sotib oling</p>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 mb-5 border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-600" />
                  <span className="text-slate-700 font-medium">Mashinalar:</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">{vehicleCount} ta</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500 mb-3 pb-3 border-b border-orange-200">
                <span>Har biri uchun:</span>
                <span>{fmt(PRICE_PER_UNIT)} so'm/oy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-bold text-lg">Jami:</span>
                <span className="text-3xl font-bold text-orange-600">
                  {fmt(totalPrice)} <span className="text-sm font-normal text-slate-500">so'm</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <Feature icon={Truck} text="Mashinalar" color="orange" />
              <Feature icon={Fuel} text="Yoqilg'i" color="orange" />
              <Feature icon={Wrench} text="Ta'mirlash" color="orange" />
              <Feature icon={BarChart3} text="Hisobotlar" color="orange" />
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#00CCCC] hover:bg-[#00B3B3] disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mb-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl font-bold">payme</span>
                  <span>orqali to'lash</span>
                </>
              )}
            </button>

            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>{SUPPORT_PHONE}</span>
            </a>

            <p className="text-xs text-slate-400 text-center mt-4">
              Telegram: <span className="text-orange-500 font-medium">@avtojon_support</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <img src="/main_logo.jpg" alt="Avtojon" className="w-8 h-8 rounded-lg" />
          <span className="text-slate-500 font-medium"><span className="text-slate-700">avto</span><span className="text-amber-500">JON</span> Fleet</span>
        </div>
      </div>
    </div>
  )
}

// Biznesmen uchun - haydovchilar
export function BusinessSubscriptionBlocker({ driverCount = 1 }) {
  const [loading, setLoading] = useState(false)
  const totalPrice = Math.max(1, driverCount) * PRICE_PER_UNIT

  const handlePayment = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/payments/create', {
        provider: 'payme',
        type: 'business',
        unitCount: driverCount,
      })
      if (data.success && data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl
      }
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.message || "To'lov yaratishda xatolik"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span className="text-blue-100 text-sm font-medium"><span>avto</span><span className="text-white">JON</span> Pro</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Sinov muddati tugadi</h1>
            <p className="text-blue-100 text-sm mt-1">Davom etish uchun obuna sotib oling</p>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-5 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-700 font-medium">Haydovchilar:</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{driverCount} ta</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500 mb-3 pb-3 border-b border-blue-200">
                <span>Har biri uchun:</span>
                <span>{fmt(PRICE_PER_UNIT)} so'm/oy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-bold text-lg">Jami:</span>
                <span className="text-3xl font-bold text-blue-600">
                  {fmt(totalPrice)} <span className="text-sm font-normal text-slate-500">so'm</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <Feature icon={Users} text="Haydovchilar" color="blue" />
              <Feature icon={Route} text="Marshrutlar" color="blue" />
              <Feature icon={Truck} text="Mashinalar" color="blue" />
              <Feature icon={BarChart3} text="Hisobotlar" color="blue" />
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#00CCCC] hover:bg-[#00B3B3] disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mb-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl font-bold">payme</span>
                  <span>orqali to'lash</span>
                </>
              )}
            </button>

            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>{SUPPORT_PHONE}</span>
            </a>

            <p className="text-xs text-slate-400 text-center mt-4">
              Telegram: <span className="text-blue-500 font-medium">@avtojon_support</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <img src="/main_logo.jpg" alt="Avtojon" className="w-8 h-8 rounded-lg" />
          <span className="font-medium"><span className="text-slate-700">avto</span><span className="text-amber-500">JON</span></span>
        </div>
      </div>
    </div>
  )
}

const Feature = ({ icon: Icon, text, color }) => (
  <div className={`flex items-center gap-2 p-2.5 rounded-xl ${color === 'blue' ? 'bg-blue-50' : 'bg-orange-50'}`}>
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color === 'blue' ? 'bg-blue-100' : 'bg-orange-100'}`}>
      <Icon size={14} className={color === 'blue' ? 'text-blue-600' : 'text-orange-600'} />
    </div>
    <span className="text-slate-700 text-xs font-medium">{text}</span>
    <Check size={12} className="text-emerald-500 ml-auto" />
  </div>
)

// Obuna ogohlantirish komponenti
export function SubscriptionWarning({ daysRemaining, type = 'business', unitCount = 1 }) {
  const [loading, setLoading] = useState(false)
  const totalPrice = Math.max(1, unitCount) * PRICE_PER_UNIT
  const isExpired = daysRemaining <= 0
  const isUrgent = daysRemaining <= 3

  const handlePayment = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/payments/create', { provider: 'payme', type, unitCount })
      if (data.success && data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl
      }
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.message || "To'lov yaratishda xatolik"))
    } finally {
      setLoading(false)
    }
  }

  if (daysRemaining > 7) return null

  return (
    <div className={`rounded-2xl p-4 mb-4 border ${
      isExpired ? 'bg-red-50 border-red-200' : isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isExpired ? 'bg-red-100' : isUrgent ? 'bg-amber-100' : 'bg-blue-100'
        }`}>
          {isExpired ? <AlertCircle className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${isExpired ? 'text-red-800' : isUrgent ? 'text-amber-800' : 'text-blue-800'}`}>
            {isExpired ? 'Obuna muddati tugadi!' : `Obuna ${daysRemaining} kundan keyin tugaydi`}
          </h3>
          <p className={`text-sm mt-0.5 ${isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-blue-600'}`}>
            {isExpired ? 'Davom etish uchun obunani yangilang' : 'Xizmatdan uzluksiz foydalanish uchun obunani yangilang'}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handlePayment}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                isExpired ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#00CCCC] hover:bg-[#00B3B3] text-white'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-bold">payme</span>
                  <span>• {fmt(totalPrice)} so'm</span>
                </>
              )}
            </button>
            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="text-sm text-slate-600 hover:text-slate-800">
              {SUPPORT_PHONE}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
