import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Truck, User, Lock, ArrowRight, Sparkles, Eye, EyeOff, Zap } from 'lucide-react'
import { useAlert } from '../components/ui'

const Scene3D = lazy(() => import('../components/3d/Scene3D'))

// CSS-based 3D tilt card
function Card3D({ children, className }) {
  const cardRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card || window.innerWidth < 768) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = (y - centerY) / 900
      const rotateY = (centerX - x) / 90

      card.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`
    }

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}

// Static button wrapper - magnetic effekt o'chirilgan
function MagneticButton({ children, className, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const formRef = useRef(null)
  const passwordRef = useRef(null)

  // CSS entrance animation
  useEffect(() => {
    if (formRef.current) {
      formRef.current.style.opacity = '0'
      formRef.current.style.transform = 'translateY(20px)'
      requestAnimationFrame(() => {
        formRef.current.style.transition = 'all 0.6s ease-out'
        formRef.current.style.opacity = '1'
        formRef.current.style.transform = 'translateY(0)'
      })
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username.trim()) {
      alert.warning("Ogohlantirish", "Username kiriting")
      return
    }
    if (!password.trim()) {
      alert.warning("Ogohlantirish", "Parol kiriting")
      return
    }

    const result = await login(username, password)
    if (result.success) {
      alert.success('Xush kelibsiz!', `Salom, ${result.user?.fullName || username}`)
      navigate(result.role === 'driver' ? '/driver' : '/dashboard')
    } else {
      alert.error("Kirish xatosi", result.message || "Username yoki parol noto'g'ri")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <Scene3D variant="auth" />
      </Suspense>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-transparent to-[#0a0a1a] opacity-60"></div>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a1a] to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a1a] to-transparent"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] z-[2]"></div>

      <div ref={formRef} className="relative z-10 w-full max-w-md px-2 sm:px-0">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              Avtojon <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </h1>
          </Link>
          <p className="text-violet-300 text-sm sm:text-base">Hisobingizga kiring</p>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-xs sm:text-sm text-violet-200">Xavfsiz tizimga kirish</span>
          </div>
        </div>

        {/* Login Card */}
        <Card3D className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-8 shadow-2xl shadow-violet-500/10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">Username</label>
              <div className="relative group">
                <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-violet-400 group-focus-within:text-violet-300 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      passwordRef.current?.focus()
                    }
                  }}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder-violet-400/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all hover:border-white/20"
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">Parol</label>
              <div className="relative group">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-violet-400 group-focus-within:text-violet-300 transition-colors" />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && username.trim() && password.trim()) {
                      handleSubmit(e)
                    }
                  }}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder-violet-400/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all hover:border-white/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <MagneticButton className="w-full pt-1 sm:pt-0">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50 transition-all active:scale-[0.98] group"
              >
                {loading ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Kirish
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </MagneticButton>
          </form>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10 text-center">
            <p className="text-violet-300 text-sm sm:text-base">
              Hisobingiz yo'qmi?{' '}
              <Link to="/register" className="text-violet-400 hover:text-white font-semibold transition-colors">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>
        </Card3D>

        <Link to="/" className="flex items-center justify-center gap-2 mt-5 sm:mt-6 text-violet-400 hover:text-white transition-colors text-sm sm:text-base group">
          <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          Bosh sahifaga
        </Link>
      </div>
    </div>
  )
}
