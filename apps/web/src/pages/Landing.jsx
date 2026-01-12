import { memo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, MapPin, BarChart3, Shield, ArrowRight,
  CheckCircle, Star, Users, Route, TrendingUp, Play,
  Fuel, Calculator, Globe
} from 'lucide-react'

// Rang konstantalari
const COLORS = {
  navy: '#1E3A5F',
  accent: '#10B981',
}

const features = [
  { icon: MapPin, title: 'Real-time GPS', desc: 'Mashinalaringizni jonli xaritada kuzating', gradient: 'from-emerald-500 to-teal-600' },
  { icon: BarChart3, title: 'Tahlil va hisobotlar', desc: 'Xarajatlar va samaradorlikni tahlil qiling', gradient: 'from-blue-500 to-indigo-600' },
  { icon: Shield, title: 'Xavfsiz tizim', desc: 'Ma\'lumotlaringiz to\'liq himoyalangan', gradient: 'from-violet-500 to-purple-600' },
  { icon: Truck, title: 'Oson boshqaruv', desc: 'Haydovchilar va mashinalarni boshqaring', gradient: 'from-amber-500 to-orange-600' },
  { icon: Fuel, title: 'Yoqilg\'i hisobi', desc: 'Har bir litr yoqilg\'ini nazorat qiling', gradient: 'from-rose-500 to-pink-600' },
  { icon: Calculator, title: 'Avtomatik hisob', desc: 'Foyda va xarajatlar avtomatik', gradient: 'from-cyan-500 to-blue-600' },
]

const stats = [
  { value: '500+', label: 'Foydalanuvchilar' },
  { value: '10K+', label: 'Reyslar' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Qo\'llab-quvvatlash' },
]

const AnimatedText = memo(({ children, delay = 0 }) => (
  <div className="opacity-0 translate-y-4 animate-fadeIn" style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}>
    {children}
  </div>
))

// Navbar - Oq fon bilan (ochiq dizayn)
const FixedHeader = memo(() => (
  <header className="fixed top-0 left-0 right-0 z-[99999] pointer-events-auto pt-[env(safe-area-inset-top)] bg-white/80 backdrop-blur-md border-b border-indigo-100">
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
      <div className="flex justify-between items-center gap-2">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/main_logo.jpg" alt="Avtojon" className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover shadow-md" />
          <div className="flex items-baseline tracking-tight">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-800">avto</span>
            <span className="text-xl sm:text-2xl font-extrabold text-indigo-600">JON</span>
          </div>
        </Link>
        <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm shadow-lg transition-all whitespace-nowrap text-white">
          Kirish
        </Link>
      </div>
    </div>
  </header>
))

export default function Landing() {
  // Body va root ga scroll class qo'shish - scroll ishlashi uchun
  useEffect(() => {
    // Body ni scroll qilish uchun sozlash
    document.body.classList.add('landing-scroll')
    document.body.style.overflow = 'auto'
    document.body.style.position = 'static'
    document.body.style.height = 'auto'
    
    // Root elementni ham sozlash
    const root = document.getElementById('root')
    if (root) {
      root.style.height = 'auto'
      root.style.minHeight = '100vh'
      root.style.overflow = 'visible'
    }
    
    return () => {
      document.body.classList.remove('landing-scroll')
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.height = ''
      
      if (root) {
        root.style.height = ''
        root.style.minHeight = ''
        root.style.overflow = ''
      }
    }
  }, [])

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">
      <FixedHeader />

      {/* Hero Section - Ochiq gradient (oq-ko'k-pushti) */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/50 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-200/50 rounded-full blur-3xl" />
        </div>

        <section className="relative z-10 pt-24 sm:pt-28 pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <AnimatedText delay={0.1}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.15] tracking-tight text-slate-800">
                  Mashinangiz <span className="text-indigo-600">100%</span>
                  <br />nazorat va hisob-kitobda
                </h2>
              </AnimatedText>

              <AnimatedText delay={0.2}>
                <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                  Mashinangiz xarajatlarini, daromadlarini va foydasini doim bilib borish uchun hoziroq bepul boshlang
                </p>
              </AnimatedText>

              <AnimatedText delay={0.3}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/register" className="group inline-flex items-center justify-center gap-3 bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/30 transition-all w-full sm:w-auto">
                    Bepul boshlash <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button type="button" onClick={() => { alert('Video qo\'llanma hali tayyorlanmoqda! Tez orada qo\'shiladi.'); }} className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all w-full sm:w-auto shadow-lg">
                    <Play size={20} className="text-indigo-600" /> Video qo'llanma
                  </button>
                </div>

                <div className="mt-8 flex flex-row items-center justify-center gap-4">
                  <a href="/avtojon.apk" download className="group flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 rounded-xl transition-all shadow-md">
                    <svg className="w-7 h-7 text-[#3DDC84]" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" /></svg>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide">Yuklab olish</div>
                      <div className="text-sm font-semibold">Android</div>
                    </div>
                  </a>
                  <button type="button" onClick={() => { alert('iOS ilovasi tez orada qo\'shiladi! Hozircha Android versiyasidan foydalaning.'); }} className="group flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-md">
                    <svg className="w-7 h-7 text-slate-800" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide">Tez orada</div>
                      <div className="text-sm font-semibold">iOS</div>
                    </div>
                  </button>
                </div>
              </AnimatedText>

              <AnimatedText delay={0.4}>
                <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-slate-600 text-sm">
                  <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> Bepul sinov</span>
                  <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> Karta talab qilinmaydi</span>
                  <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> Istalgan vaqt bekor qilish</span>
                </div>
              </AnimatedText>
            </div>
          </div>
        </section>

        <div className="absolute bottom-0 left-0 right-0 -mb-px">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full block"><path d="M0 80L60 73C120 67 240 53 360 47C480 40 600 40 720 43C840 47 960 53 1080 57C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white" /></svg>
        </div>
      </div>

      {/* Stats Section */}
      <section className="relative z-10 bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-lg text-center hover:shadow-xl hover:-translate-y-1 transition-all border border-indigo-100">
                  <p className="text-3xl sm:text-4xl font-bold" style={{ color: COLORS.navy }}>{value}</p>
                  <p className="text-slate-500 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 sm:py-24 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-100 rounded-full text-indigo-600 text-sm font-semibold mb-6">
              <Star className="w-4 h-4" /> Imkoniyatlar
            </span>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Kuchli funksiyalar</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Biznesingizni keyingi bosqichga olib chiqadigan barcha vositalar bir joyda</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map(({ icon: Icon, title, desc, gradient }) => (
              <div key={title} className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg shadow-indigo-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-white/50">
                <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <Icon className="text-white w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900">{title}</h4>
                <p className="text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-16 sm:py-24 bg-gradient-to-b from-pink-50 via-amber-50 to-emerald-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-100 rounded-full text-emerald-600 text-sm font-semibold mb-6">
              <Route className="w-4 h-4" /> Qanday ishlaydi
            </span>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">3 oddiy qadam</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Bir necha daqiqada tizimni ishga tushiring va natijalarni ko'ring</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {[
              { step: '01', title: 'Ro\'yxatdan o\'ting', desc: 'Bir daqiqada hisob yarating va tizimga kiring', icon: Users, gradient: 'from-indigo-500 to-purple-600', bg: 'bg-gradient-to-br from-indigo-50 to-purple-100' },
              { step: '02', title: 'Ma\'lumot kiriting', desc: 'Mashina va haydovchilarni qo\'shing, asosiy ma\'lumotlarni to\'ldiring', icon: Truck, gradient: 'from-purple-500 to-pink-600', bg: 'bg-gradient-to-br from-purple-50 to-pink-100' },
              { step: '03', title: 'Boshqaring', desc: 'Reyslarni real-time kuzating va hisobotlarni oling', icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-gradient-to-br from-emerald-50 to-teal-100' }
            ].map(({ step, title, desc, icon: Icon, gradient, bg }, index) => (
              <div key={step} className="relative group">
                <div className={`${bg} rounded-3xl p-8 lg:p-10 text-center h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-white/50`}>
                  <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="relative mb-4">
                    <span className="text-6xl lg:text-7xl font-black text-slate-200/60 absolute -top-4 left-1/2 transform -translate-x-1/2">{step}</span>
                    <h4 className="text-xl lg:text-2xl font-bold mt-4 mb-3 text-slate-900 relative z-10">{title}</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-base lg:text-lg">{desc}</p>
                </div>
                {/* Connection line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-6 w-8 lg:w-12 h-0.5 bg-gradient-to-r from-slate-300 to-slate-200 transform -translate-y-1/2 z-10">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-slate-400 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 sm:py-28 bg-gradient-to-b from-emerald-50 to-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl lg:rounded-[2rem] p-12 sm:p-16 lg:p-20 text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -ml-40 -mb-40" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Hoziroq boshlang!
              </h3>
              <p className="text-white/90 mb-10 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                Birinchi 30 kun bepul sinov. Karta talab qilinmaydi. 
                Istalgan vaqt bekor qilishingiz mumkin.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <Link to="/register" className="group inline-flex items-center gap-3 bg-white text-indigo-600 hover:bg-amber-300 hover:text-indigo-700 px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl transition-all transform hover:scale-105">
                  Bepul ro'yxatdan o'tish 
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button type="button" onClick={() => { alert('Video qo\'llanma hali tayyorlanmoqda! Tez orada qo\'shiladi.'); }} className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all">
                  <Play size={20} /> Video ko'rish
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-white/80 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-300" /> 
                  30 kun bepul
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-300" /> 
                  Karta kerak emas
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-300" /> 
                  Istalgan vaqt bekor qiling
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Logo va tavsif */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>avto</span><span className="text-indigo-400">JON</span>
                  </h3>
                  <p className="text-slate-400 text-sm">Yuk tashish platformasi</p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed mb-6 max-w-md">
                O'zbekistondagi eng zamonaviy yuk tashish boshqaruv tizimi. 
                Mashinalaringizni kuzating, xarajatlarni nazorat qiling va foyda oling.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/></svg>
                </a>
              </div>
            </div>

            {/* Havolalar */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Mahsulot</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Imkoniyatlar</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Narxlar</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Integratsiya</a></li>
              </ul>
            </div>

            {/* Qo'llab-quvvatlash */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Qo'llab-quvvatlash</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Yordam markazi</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Aloqa</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Maxfiylik</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Shartlar</a></li>
              </ul>
            </div>
          </div>

          {/* Pastki qism */}
          <div className="border-t border-slate-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm">
                © 2024 avtoJON. Barcha huquqlar himoyalangan.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Globe className="w-4 h-4" /> 
                  <span>O'zbekcha</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span>Versiya 1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
