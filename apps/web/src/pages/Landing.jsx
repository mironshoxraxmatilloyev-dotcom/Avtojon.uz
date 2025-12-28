import { useState, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import {
  Truck, MapPin, BarChart3, Shield, ArrowRight, Sparkles,
  CheckCircle, Star, Users, Route, TrendingUp, Play,
  Fuel, Calculator, Globe, Download, Smartphone
} from 'lucide-react'

const features = [
  { icon: MapPin, title: 'Real-time GPS', desc: 'Mashinalaringizni jonli xaritada kuzating', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
  { icon: BarChart3, title: 'Tahlil va hisobotlar', desc: 'Xarajatlar va samaradorlikni tahlil qiling', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
  { icon: Shield, title: 'Xavfsiz tizim', desc: 'Ma\'lumotlaringiz to\'liq himoyalangan', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
  { icon: Truck, title: 'Oson boshqaruv', desc: 'Haydovchilar va mashinalarni boshqaring', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
  { icon: Fuel, title: 'Yoqilg\'i hisobi', desc: 'Har bir litr yoqilg\'ini nazorat qiling', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/30' },
  { icon: Calculator, title: 'Avtomatik hisob', desc: 'Foyda va xarajatlar avtomatik', gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/30' },
]

const stats = [
  { value: '500+', label: 'Foydalanuvchilar', color: 'text-indigo-600' },
  { value: '10K+', label: 'Reyslar', color: 'text-purple-600' },
  { value: '99.9%', label: 'Uptime', color: 'text-emerald-600' },
  { value: '24/7', label: 'Qo\'llab-quvvatlash', color: 'text-amber-600' },
]

const AnimatedText = memo(({ children, delay = 0 }) => (
  <div
    className="opacity-0 translate-y-4 animate-fadeIn"
    style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
  >
    {children}
  </div>
))

export default function Landing() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [demoLoading, setDemoLoading] = useState(false)

  const handleDemoLogin = useCallback(async () => {
    setDemoLoading(true)
    try {
      const response = await api.post('/auth/demo')
      if (response.data.success && response.data.data) {
        setAuth(response.data.data.token, response.data.data.user)
        navigate('/dashboard')
      }
    } catch (error) {
      alert('Demo akkauntga kirishda xatolik yuz berdi.')
    } finally {
      setDemoLoading(false)
    }
  }, [setAuth, navigate])

  // Fixed Header - Portal orqali body ga render qilinadi
  const FixedHeader = () => createPortal(
    <header 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'linear-gradient(to right, #4f46e5, #9333ea, #ec4899)',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Avtojon" className="w-10 h-10 rounded-xl object-cover" />
            <h1 className="text-xl font-bold text-white flex items-center gap-1.5">
              Avtojon <Sparkles className="w-4 h-4 text-amber-300" />
            </h1>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-white/90 hover:text-white transition-colors font-medium text-sm px-4 py-2">
              Kirish
            </Link>
            <Link to="/register" className="bg-white text-indigo-600 hover:bg-amber-300 hover:text-indigo-700 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-black/10 transition-all">
              Boshlash
            </Link>
          </div>
        </div>
      </div>
    </header>,
    document.body
  )

  return (
    <div className="landing-page min-h-screen overflow-hidden">
      {/* Fixed Header - Portal orqali */}
      <FixedHeader />

      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        {/* Hero Content */}
        <section className="relative z-10 pt-20 sm:pt-24 pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <AnimatedText delay={0.1}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-white/90 font-medium">Xalqaro reyslar qo'llab-quvvatlanadi</span>
                </div>
              </AnimatedText>

              {/* Title */}
              <AnimatedText delay={0.2}>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
                  Yuk tashishni{' '}
                  <span className="text-amber-300">osonlashtiring</span>
                </h2>
              </AnimatedText>

              {/* Subtitle */}
              <AnimatedText delay={0.3}>
                <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Mashinalar, haydovchilar va reyslarni bir platformada boshqaring.
                  Real-time monitoring va avtomatik hisob-kitob.
                </p>
              </AnimatedText>

              {/* CTA Buttons */}
              <AnimatedText delay={0.4}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-3 bg-white text-indigo-600 hover:bg-amber-300 hover:text-indigo-700 px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-black/20 transition-all w-full sm:w-auto"
                  >
                    Bepul boshlash
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    onClick={handleDemoLogin}
                    disabled={demoLoading}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-white bg-white/10 border-2 border-white/30 hover:bg-white/20 transition-all w-full sm:w-auto disabled:opacity-50 backdrop-blur-sm"
                  >
                    {demoLoading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Yuklanmoqda...</>
                    ) : (
                      <><Play size={20} /> Demo ko'rish</>
                    )}
                  </button>
                </div>

                {/* Download App - Haydovchilar uchun */}
                <div className="mt-6">
                  <a
                    href="/api/downloads/avtojon.apk"
                    download="Avtojon.apk"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/90 hover:bg-emerald-400 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-500/20 backdrop-blur-sm"
                  >
                    <Smartphone size={18} />
                    <span> Ilovani  yuklab olish</span>
                    <Download size={16} />
                  </a>
                </div>
              </AnimatedText>

              {/* Trust badges */}
              <AnimatedText delay={0.5}>
                <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-white/70 text-sm">
                  <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-300" /> Bepul sinov</span>
                  <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-300" /> Karta talab qilinmaydi</span>
                  <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-300" /> Istalgan vaqt bekor qilish</span>
                </div>
              </AnimatedText>
            </div>
          </div>
        </section>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 -mb-px">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 80L60 73C120 67 240 53 360 47C480 40 600 40 720 43C840 47 960 53 1080 57C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#eef2ff" />
          </svg>
        </div>
      </div>

      {/* Stats Section - Light Indigo Background */}
      <section className="relative z-10 bg-indigo-50">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <AnimatedText delay={0.6}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(({ value, label, color }) => (
                  <div key={label} className="bg-white rounded-2xl p-6 shadow-xl shadow-indigo-200/50 text-center hover:shadow-2xl hover:-translate-y-1 transition-all">
                    <p className={`text-3xl sm:text-4xl font-bold ${color}`}>{value}</p>
                    <p className="text-slate-500 text-sm mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* Features Section - Gradient Background */}
      <section className="relative z-10 py-20 sm:py-28 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 text-sm font-semibold mb-4">
              <Star className="w-4 h-4" /> Imkoniyatlar
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Kuchli funksiyalar</h3>
            <p className="text-slate-600 max-w-xl mx-auto">Biznesingizni keyingi bosqichga olib chiqadigan barcha vositalar</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map(({ icon: Icon, title, desc, gradient, shadow }) => (
              <div key={title} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all border border-white">
                <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg ${shadow} group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-slate-900">{title}</h4>
                <p className="text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - Soft Gradient */}
      <section className="relative z-10 py-20 sm:py-28 bg-gradient-to-b from-pink-50 via-amber-50 to-emerald-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-600 text-sm font-semibold mb-4">
              <Route className="w-4 h-4" /> Qanday ishlaydi
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">3 oddiy qadam</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Ro\'yxatdan o\'ting', desc: 'Bir daqiqada hisob yarating', icon: Users, gradient: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/30', bg: 'bg-indigo-50' },
              { step: '02', title: 'Ma\'lumot kiriting', desc: 'Mashina va haydovchilarni qo\'shing', icon: Truck, gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/30', bg: 'bg-purple-50' },
              { step: '03', title: 'Boshqaring', desc: 'Reyslarni real-time kuzating', icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30', bg: 'bg-emerald-50' }
            ].map(({ step, title, desc, icon: Icon, gradient, shadow, bg }) => (
              <div key={step} className="relative group">
                <div className={`${bg} rounded-2xl p-8 text-center h-full hover:shadow-xl transition-all border border-white`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg ${shadow} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-5xl font-bold text-slate-200">{step}</span>
                  <h4 className="text-xl font-bold mt-2 mb-2 text-slate-900">{title}</h4>
                  <p className="text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-emerald-50 to-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-10 sm:p-14 text-center">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-3xl -ml-30 -mb-30" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />

            <div className="relative">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Hoziroq boshlang!</h3>
              <p className="text-white/80 mb-8 text-lg max-w-lg mx-auto">
                Birinchi 30 kun bepul. Karta talab qilinmaydi.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-3 bg-white text-indigo-600 hover:bg-amber-300 hover:text-indigo-700 px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl transition-all group"
              >
                Bepul ro'yxatdan o'tish
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Avtojon <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-slate-500 text-xs">Yuk tashish platformasi</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Biz haqimizda</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Aloqa</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Maxfiylik</a>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Globe className="w-4 h-4" /> O'zbekcha
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-6 text-center">
            <p className="text-slate-600 text-sm">© 2024 Avtojon. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
