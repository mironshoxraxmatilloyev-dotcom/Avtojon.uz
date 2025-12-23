import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Phone, X, Clock, Crown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

const SUPPORT_PHONE = '+998 88 019 91 19'

export default function SubscriptionAlert() {
  const { user, updateUser } = useAuthStore()
  const [show, setShow] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [daysLeft, setDaysLeft] = useState(null)
  const [plan, setPlan] = useState('trial')
  const [dismissed, setDismissed] = useState(false)
  const checkedRef = useRef(false)

  // Obuna holatini tekshirish - FAQAT 1 MARTA
  useEffect(() => {
    // Agar allaqachon tekshirilgan bo'lsa yoki user yo'q bo'lsa - chiqish
    if (checkedRef.current) return
    if (!user || user.role === 'super_admin' || user.role === 'driver') return

    checkedRef.current = true

    const checkSubscription = async () => {
      try {
        const { data } = await api.get('/auth/subscription')
        const sub = data.data

        if (sub) {
          setPlan(sub.plan || 'trial')
          
          if (sub.isExpired) {
            setIsExpired(true)
            setShow(true)
            updateUser({ subscriptionExpired: true })
          } else if (sub.endDate) {
            const endDate = new Date(sub.endDate)
            const now = new Date()
            const diff = endDate - now

            if (diff <= 0 || isNaN(diff)) {
              setIsExpired(true)
              setShow(true)
              updateUser({ subscriptionExpired: true })
            } else {
              setIsExpired(false)
              const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
              setDaysLeft(days)
              if (days <= 3) {
                setShow(true)
              }
            }
          }
        }
      } catch (err) {
        // Silent fail - subscription check xatosi sahifani bloklamasin
      }
    }

    // 2 sekunddan keyin tekshirish - sahifa yuklansin avval
    const timeout = setTimeout(checkSubscription, 2000)
    return () => clearTimeout(timeout)
  }, [user?.role]) // Faqat role o'zgarganda qayta tekshirish

  // Plan nomini o'zbekchaga o'girish
  const getPlanName = () => {
    switch (plan) {
      case 'trial': return 'Trial'
      case 'basic': return 'Basic'
      case 'pro': return 'Pro'
      default: return 'Obuna'
    }
  }

  const handleCall = () => {
    window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`
  }

  if (!show || dismissed) return null

  // Muddati tugagan - to'liq ekran blocker
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-lg w-full">
          {/* Animated icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-red-500/20 rounded-full animate-ping" />
            </div>
            <div className="relative w-28 h-28 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30 rotate-3">
              <AlertTriangle className="w-14 h-14 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">Bepul muddat tugadi!</h1>
          <p className="text-slate-400 mb-8 text-lg">
            Tizimdan foydalanishni davom ettirish uchun obunani yangilang
          </p>
          
          {/* Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-slate-700/50 shadow-xl">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Pro tarif</h3>
                <p className="text-slate-400 text-sm">Barcha imkoniyatlar</p>
              </div>
              <div className="ml-auto text-right">
                <span className="text-2xl font-bold text-white">50k</span>
                <span className="text-slate-400 text-sm">/oy</span>
              </div>
            </div>

            <p className="text-slate-300 mb-4 text-sm">
              Obunani yangilash uchun quyidagi raqamga qo'ng'iroq qiling:
            </p>
            
            <button
              onClick={handleCall}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-green-500/25 mb-4"
            >
              <Phone className="w-6 h-6" />
              <span className="text-xl">{SUPPORT_PHONE}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/30 rounded-xl p-3 text-center">
                <span className="text-2xl">🚀</span>
                <p className="text-xs text-slate-400 mt-1">Tez ishlash</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-3 text-center">
                <span className="text-2xl">📊</span>
                <p className="text-xs text-slate-400 mt-1">Hisobotlar</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-slate-500">
            Telegram: <span className="text-purple-400 font-medium">@avtojon_support</span>
          </p>
        </div>
      </div>
    )
  }

  // Ogohlantirish - muddat tugashiga yaqin
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
            <Clock className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white">{getPlanName()}</h4>
              <button 
                onClick={() => setDismissed(true)}
                className="text-amber-400/60 hover:text-amber-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-amber-500/20 rounded-lg">
                <span className="font-mono font-bold text-amber-400 text-lg">{daysLeft}</span>
                <span className="text-amber-400 text-sm ml-1">kun</span>
              </div>
              <span className="text-amber-200/60 text-sm">qoldi</span>
            </div>
            
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-green-500/20"
            >
              <Phone className="w-4 h-4" />
              <span>Obunani uzaytirish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
