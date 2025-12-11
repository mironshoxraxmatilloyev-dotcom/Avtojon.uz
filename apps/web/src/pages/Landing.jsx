import { useEffect, useRef, lazy, Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Truck, MapPin, BarChart3, Shield, ArrowRight, Sparkles, Zap,
  CheckCircle, Star, Users, Route, Clock, TrendingUp, Play, ChevronDown
} from 'lucide-react'
// import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation'

// Lazy load 3D scene for better performance
const Scene3D = lazy(() => import('../components/3d/Scene3D'))

gsap.registerPlugin(ScrollTrigger)

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

// Optimized animated text - CSS based with JS trigger
function AnimatedText({ children, delay = 0 }) {
  const ref = useRef(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    // Use CSS transitions instead of GSAP for better performance
    element.style.transitionDelay = `${delay}s`
    requestAnimationFrame(() => {
      element.classList.add('animate-in')
    })
  }, [delay])
  
  return (
    <div 
      ref={ref} 
      className="opacity-0 translate-y-6 transition-all duration-700 ease-out"
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </div>
  )
}

// Simplified magnetic button - lighter effect
function MagneticButton({ children, className, ...props }) {
  const buttonRef = useRef(null)
  
  useEffect(() => {
    const button = buttonRef.current
    if (!button || window.innerWidth < 768) return // Disable on mobile
    
    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) * 0.15
      const y = (e.clientY - rect.top - rect.height / 2) * 0.15
      
      button.style.transform = `translate(${x}px, ${y}px)`
    }
    
    const handleMouseLeave = () => {
      button.style.transform = 'translate(0, 0)'
    }
    
    button.addEventListener('mousemove', handleMouseMove)
    button.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      button.removeEventListener('mousemove', handleMouseMove)
      button.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])
  
  return (
    <div 
      ref={buttonRef} 
      className={`${className} transition-transform duration-200 ease-out`} 
      style={{ willChange: 'transform' }}
      {...props}
    >
      {children}
    </div>
  )
}

// Static Card - 3D tilt o'chirilgan (input yozishda noqulaylik qilmasligi uchun)
function Card3D({ children, className }) {
  return <div className={className}>{children}</div>
}

export default function Landing() {
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const statsRef = useRef(null)
  const stepsRef = useRef(null)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [demoLoading, setDemoLoading] = useState(false)

  // Demo akkaunt bilan kirish
  const handleDemoLogin = async () => {
    setDemoLoading(true)
    try {
      // Demo endpoint - avtomatik demo user yaratadi
      const response = await api.post('/auth/demo')
      
      if (response.data.success && response.data.data) {
        setAuth(response.data.data.token, response.data.data.user)
        navigate('/dashboard')
      }
    } catch (error) {
      alert('Demo akkauntga kirishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setDemoLoading(false)
    }
  }
  
  // Hero parallax effect
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    
    gsap.to(hero, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* 3D Background Scene */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent" />
        }>
          <Scene3D variant="hero" />
        </Suspense>
      </div>

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-transparent to-[#0a0a1a] opacity-60"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a1a] to-transparent"></div>
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-[2]"></div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 backdrop-blur-xl bg-[#0a0a1a]/50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <AnimatedText>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-1.5 sm:gap-2">
                  Avtojon <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </h1>
              </div>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <div className="flex items-center gap-2 sm:gap-4">
                <Link to="/login" className="text-violet-300 hover:text-white transition-colors font-medium text-sm sm:text-base px-2 py-1.5">Kirish</Link>
                <MagneticButton>
                  <Link to="/register" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all text-sm sm:text-base inline-block">
                    Boshlash
                  </Link>
                </MagneticButton>
              </div>
            </AnimatedText>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 container mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <AnimatedText delay={0.3}>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-6 sm:mb-8">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-violet-200">Yangi: AI asosida avtomatik tahlil</span>
              <ArrowRight className="w-4 h-4 text-violet-400 flex-shrink-0" />
            </div>
          </AnimatedText>

          {/* Title */}
          <AnimatedText delay={0.4}>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              Yuk tashishni{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
                osonlashtiring
              </span>
            </h2>
          </AnimatedText>

          {/* Subtitle */}
          <AnimatedText delay={0.5}>
            <p className="text-base sm:text-xl text-violet-200 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Mashinalar, shofyorlar va reyslarni bir platformada boshqaring.
              Real-time monitoring, AI tahlil va avtomatik hisob-kitob.
            </p>
          </AnimatedText>

          {/* CTA Buttons */}
          <AnimatedText delay={0.6}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full px-2">
              <MagneticButton>
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/40 transition-all w-full sm:w-auto"
                >
                  Bepul boshlash
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <button 
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold text-violet-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all w-full sm:w-auto backdrop-blur-sm disabled:opacity-50"
                >
                  {demoLoading ? (
                    <><div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div> Yuklanmoqda...</>
                  ) : (
                    <><Play size={18} className="text-violet-400" /> Demo ko'rish</>
                  )}
                </button>
              </MagneticButton>
            </div>
          </AnimatedText>

          {/* Trust badges */}
          <AnimatedText delay={0.7}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-10 text-violet-400/60 text-sm">
              <span className="flex items-center gap-2"><CheckCircle size={16} /> Bepul sinov</span>
              <span className="flex items-center gap-2"><CheckCircle size={16} /> Karta talab qilinmaydi</span>
              <span className="flex items-center gap-2"><CheckCircle size={16} /> Istalgan vaqt bekor qilish</span>
            </div>
          </AnimatedText>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="max-w-4xl mx-auto mt-16 sm:mt-20 px-2">
          <Card3D className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{value}</p>
                  <p className="text-violet-300 text-xs sm:text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </Card3D>
        </div>
      </section>


      {/* Features Section */}
      <section className="relative z-10 py-16 sm:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 rounded-full text-violet-300 text-sm font-medium mb-4">
              <Star className="w-4 h-4" /> Imkoniyatlar
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Kuchli funksiyalar</h3>
            <p className="text-violet-300 max-w-2xl mx-auto text-sm sm:text-base px-2">Biznesingizni keyingi bosqichga olib chiqadigan barcha vositalar</p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <Card3D key={title} className="group bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-violet-500/30 transition-all hover:bg-white/10">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-white">{title}</h4>
                <p className="text-violet-300 text-xs sm:text-base">{desc}</p>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-16 sm:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-300 text-sm font-medium mb-4">
              <Route className="w-4 h-4" /> Qanday ishlaydi
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">3 oddiy qadam</h3>
          </div>

          <div ref={stepsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Ro\'yxatdan o\'ting', desc: 'Bir daqiqada hisob yarating va platformaga kiring', icon: Users },
              { step: '02', title: 'Ma\'lumotlarni kiriting', desc: 'Mashinalar va shofyorlarni qo\'shing', icon: Truck },
              { step: '03', title: 'Boshqarishni boshlang', desc: 'Reyslarni yarating va real-time kuzating', icon: TrendingUp }
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card3D key={step} className="relative">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-white/10 text-center h-full hover:border-violet-500/30 transition-all">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg shadow-violet-500/30">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <span className="text-3xl sm:text-5xl font-bold text-violet-500/20">{step}</span>
                  <h4 className="text-lg sm:text-xl font-bold mt-2 mb-2 sm:mb-3">{title}</h4>
                  <p className="text-violet-300 text-sm sm:text-base">{desc}</p>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <Card3D className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center">
            <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
            <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm font-medium mb-4 sm:mb-6">
                <Clock className="w-4 h-4" /> Cheklangan taklif
              </div>
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Hoziroq boshlang!</h3>
              <p className="text-violet-100 mb-6 sm:mb-8 text-base sm:text-lg max-w-xl mx-auto px-2">
                Birinchi 30 kun bepul. Karta talab qilinmaydi. Istalgan vaqt bekor qilish mumkin.
              </p>
              <MagneticButton className="inline-block">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 sm:gap-3 bg-white text-violet-600 px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-2xl hover:shadow-white/20 transition-all group"
                >
                  Bepul ro'yxatdan o'tish
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </MagneticButton>
            </div>
          </Card3D>
        </div>
      </section>

      {/* Footer - Pro Design */}
      <footer className="relative z-10">
        {/* Gradient Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
        
        {/* Main Footer */}
        <div className="relative overflow-hidden bg-[#0a0a1a]">
          {/* Background Effects */}
          <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
          
          <div className="relative container mx-auto px-4 py-10 sm:py-16">
            {/* Mobile: Stack layout, Desktop: Grid */}
            <div className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">
              
              {/* Brand Section */}
              <div className="lg:col-span-4 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a1a]"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      Avtojon <Sparkles className="w-4 h-4 text-amber-400" />
                    </h3>
                    <p className="text-violet-400 text-xs">Yuk tashish platformasi</p>
                  </div>
                </div>
                <p className="text-violet-300/70 text-sm mb-6 max-w-xs mx-auto lg:mx-0">
                  Yuk tashish biznesingizni zamonaviy texnologiyalar bilan boshqaring.
                </p>
                
                {/* Social Links */}
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  {[
                    { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z', color: 'hover:bg-blue-500/20' },
                    { icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', color: 'hover:bg-pink-500/20' },
                    { icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', color: 'hover:bg-red-500/20' },
                    { icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z', color: 'hover:bg-blue-600/20' }
                  ].map((social, i) => (
                    <a key={i} href="#" className={`w-9 h-9 bg-white/5 ${social.color} border border-white/10 rounded-lg flex items-center justify-center transition-all`}>
                      <svg className="w-4 h-4 text-violet-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d={social.icon}/>
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Links Grid - 3 columns on mobile, integrated on desktop */}
              <div className="lg:col-span-8 grid grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Mahsulot</h4>
                  <ul className="space-y-2">
                    {['Imkoniyatlar', 'Narxlar', 'API'].map((name) => (
                      <li key={name}>
                        <a href="#" className="text-violet-300/70 hover:text-white transition-colors text-xs sm:text-sm">{name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Kompaniya</h4>
                  <ul className="space-y-2">
                    {['Biz haqimizda', 'Blog', 'Karyera'].map((name) => (
                      <li key={name}>
                        <a href="#" className="text-violet-300/70 hover:text-white transition-colors text-xs sm:text-sm">{name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Yordam</h4>
                  <ul className="space-y-2">
                    {['FAQ', 'Aloqa', 'Hujjatlar'].map((name) => (
                      <li key={name}>
                        <a href="#" className="text-violet-300/70 hover:text-white transition-colors text-xs sm:text-sm">{name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="bg-[#080810] border-t border-white/5">
          <div className="container mx-auto px-4 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <p className="text-violet-400/60 text-xs sm:text-sm">© 2024 Avtojon. Barcha huquqlar himoyalangan.</p>
              <div className="flex items-center gap-4 sm:gap-6">
                {['Maxfiylik', 'Shartlar'].map((item) => (
                  <a key={item} href="#" className="text-violet-400/60 hover:text-white transition-colors text-xs sm:text-sm">{item}</a>
                ))}
                <span className="text-violet-400/60 text-xs sm:text-sm">🇺🇿 O'zbekcha</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
