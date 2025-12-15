import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Truck, User, Lock, ArrowRight, Sparkles, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import { useAlert } from '../components/ui'
import { validateField, VALIDATION_RULES } from '../utils/validation'

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
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
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

  // Real-time validation
  const validateUsername = (value) => {
    if (!value.trim()) return 'Username kiriting'
    const result = validateField('username', value)
    return result.error
  }

  const validatePassword = (value) => {
    if (!value.trim()) return 'Parol kiriting'
    if (value.length < 6) return 'Parol kamida 6 ta belgi'
    return null
  }

  const handleUsernameChange = (value) => {
    setUsername(value)
    if (touched.username) {
      setErrors(prev => ({ ...prev, username: validateUsername(value) }))
    }
  }

  const handlePasswordChange = (value) => {
    setPassword(value)
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }))
    }
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (field === 'username') {
      setErrors(prev => ({ ...prev, username: validateUsername(username) }))
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all fields
    const usernameError = validateUsername(username)
    const passwordError = validatePassword(password)
    
    setTouched({ username: true, password: true })
    setErrors({ username: usernameError, password: passwordError })

    if (usernameError || passwordError) {
      alert.warning("Ogohlantirish", usernameError || passwordError)
      return
    }

    try {
      const result = await login(username, password)
      if (result.success) {
        alert.success('Xush kelibsiz!', `Salom, ${result.user?.fullName || username}`)
        navigate(result.role === 'driver' ? '/driver' : '/dashboard')
      } else {
        alert.error("Kirish xatosi", result.message || "Username yoki parol noto'g'ri")
      }
    } catch (error) {
      alert.error("Xatolik", error.userMessage || "Serverga ulanishda xatolik yuz berdi")
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
                <User className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${errors.username && touched.username ? 'text-red-400' : 'text-violet-400 group-focus-within:text-violet-300'}`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onBlur={() => handleBlur('username')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      passwordRef.current?.focus()
                    }
                  }}
                  aria-invalid={errors.username && touched.username}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border rounded-xl text-white text-sm sm:text-base placeholder-violet-400/50 focus:ring-2 focus:outline-none transition-all ${
                    errors.username && touched.username 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/10 focus:border-violet-500 focus:ring-violet-500/20 hover:border-white/20'
                  }`}
                  placeholder="username"
                />
              </div>
              {errors.username && touched.username && (
                <p id="username-error" className="flex items-center gap-1 text-red-400 text-xs mt-1.5 ml-1">
                  <AlertCircle size={12} />
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">Parol</label>
              <div className="relative group">
                <Lock className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${errors.password && touched.password ? 'text-red-400' : 'text-violet-400 group-focus-within:text-violet-300'}`} />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && username.trim() && password.trim()) {
                      handleSubmit(e)
                    }
                  }}
                  aria-invalid={errors.password && touched.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/5 border rounded-xl text-white text-sm sm:text-base placeholder-violet-400/50 focus:ring-2 focus:outline-none transition-all ${
                    errors.password && touched.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/10 focus:border-violet-500 focus:ring-violet-500/20 hover:border-white/20'
                  }`}
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
              {errors.password && touched.password && (
                <p id="password-error" className="flex items-center gap-1 text-red-400 text-xs mt-1.5 ml-1">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
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
