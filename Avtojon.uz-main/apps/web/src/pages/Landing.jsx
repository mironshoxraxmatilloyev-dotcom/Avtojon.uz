import { Link } from 'react-router-dom'
import {
  Truck, MapPin, BarChart3, Shield, ArrowRight, Sparkles, Zap,
  CheckCircle, Star, Users, Route, Clock, TrendingUp, Play
} from 'lucide-react'

const features = [
  { icon: MapPin, title: 'Real-time GPS', desc: 'Mashinalaringizni jonli xaritada kuzating', color: 'from-emerald-500 to-teal-600' },
  { icon: BarChart3, title: 'Tahlil va hisobotlar', desc: 'Xarajatlar va samaradorlikni tahlil qiling', color: 'from-blue-500 to-indigo-600' },
  { icon: Shield, title: 'AI bilan nazorat', desc: 'Avtomatik alertlar va tavsiyalar', color: 'from-purple-500 to-violet-600' },
  { icon: Truck, title: 'Oson boshqaruv', desc: 'Shofyorlar va mashinalarni bir joydan boshqaring', color: 'from-amber-500 to-orange-600' },
]

const stats = [
  { value: '500+', label: 'Faol foydalanuvchilar' },
  { value: '10K+', label: 'Tugatilgan reyslar' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Qollab-quvvatlash' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Avtojon <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-violet-300 hover:text-white transition-colors font-medium">Kirish</Link>
              <Link to="/register" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all">
                Boshlash
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-8">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-violet-200">Yangi: AI asosida avtomatik tahlil</span>
            <ArrowRight className="w-4 h-4 text-violet-400" />
          </div>

          {/* Title */}
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Yuk tashishni{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              osonlashtiring
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-violet-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Mashinalar, shofyorlar va reyslarni bir platformada boshqaring.
            Real-time monitoring, AI tahlil va avtomatik hisob-kitob.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/40 transition-all"
            >
              Bepul boshlash
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-violet-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
              <Play size={20} className="text-violet-400" />
              Demo korish
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-12 text-violet-400/60 text-sm">
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Bepul sinov</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Karta talab qilinmaydi</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Istalgan vaqt bekor qilish</span>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{value}</p>
                  <p className="text-violet-300 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 rounded-full text-violet-300 text-sm font-medium mb-4">
              <Star className="w-4 h-4" /> Imkoniyatlar
            </span>
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Kuchli funksiyalar</h3>
            <p className="text-violet-300 max-w-2xl mx-auto">Biznesingizni keyingi bosqichga olib chiqadigan barcha vositalar</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 transition-all hover:bg-white/10">
                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={24} />
                </div>
                <h4 className="text-xl font-bold mb-2 text-white">{title}</h4>
                <p className="text-violet-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-300 text-sm font-medium mb-4">
              <Route className="w-4 h-4" /> Qanday ishlaydi
            </span>
            <h3 className="text-4xl md:text-5xl font-bold mb-4">3 oddiy qadam</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Royxatdan oting', desc: 'Bir daqiqada hisob yarating va platformaga kiring', icon: Users },
              { step: '02', title: 'Malumotlarni kiriting', desc: 'Mashinalar va shofyorlarni qoshing', icon: Truck },
              { step: '03', title: 'Boshqarishni boshlang', desc: 'Reyslarni yarating va real-time kuzating', icon: TrendingUp }
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-5xl font-bold text-violet-500/20">{step}</span>
                  <h4 className="text-xl font-bold mt-2 mb-3">{title}</h4>
                  <p className="text-violet-300">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-12 md:p-16 text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm font-medium mb-6">
                <Clock className="w-4 h-4" /> Cheklangan taklif
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-4">Hoziroq boshlang!</h3>
              <p className="text-violet-100 mb-8 text-lg max-w-xl mx-auto">
                Birinchi 30 kun bepul. Karta talab qilinmaydi. Istalgan vaqt bekor qilish mumkin.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-3 bg-white text-violet-600 px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-white/20 transition-all group"
              >
                Bepul royxatdan otish
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        {/* Main Footer */}
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Avtojon <Sparkles className="w-5 h-5 text-amber-400" />
                </h3>
              </div>
              <p className="text-violet-300 mb-6 max-w-sm leading-relaxed">
                Yuk tashish biznesingizni zamonaviy texnologiyalar bilan boshqaring.
                Real-time monitoring, AI tahlil va avtomatik hisob-kitob.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-white/5 hover:bg-violet-500/20 border border-white/10 rounded-xl flex items-center justify-center text-violet-300 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 hover:bg-violet-500/20 border border-white/10 rounded-xl flex items-center justify-center text-violet-300 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 hover:bg-violet-500/20 border border-white/10 rounded-xl flex items-center justify-center text-violet-300 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 hover:bg-violet-500/20 border border-white/10 rounded-xl flex items-center justify-center text-violet-300 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                </a>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-white font-semibold mb-5">Mahsulot</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Imkoniyatlar</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Narxlar</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Integratsiyalar</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-5">Kompaniya</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Biz haqimizda</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Karyera</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Hamkorlik</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-5">Yordam</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Qollab-quvvatlash</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Hujjatlar</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-violet-300 hover:text-white transition-colors">Aloqa</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-white/5">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-white font-semibold mb-1">Yangiliklardan xabardor boling</h4>
                <p className="text-violet-300 text-sm">Eng songgi yangiliklar va takliflarni oling</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Email manzilingiz"
                  className="flex-1 md:w-72 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-400 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all whitespace-nowrap">
                  Obuna bolish
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/5">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-violet-400 text-sm">© 2024 Avtojon. Barcha huquqlar himoyalangan.</p>
              <div className="flex items-center gap-6 text-violet-400 text-sm">
                <a href="#" className="hover:text-white transition-colors">Maxfiylik siyosati</a>
                <a href="#" className="hover:text-white transition-colors">Foydalanish shartlari</a>
                <a href="#" className="hover:text-white transition-colors">Cookie siyosati</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
