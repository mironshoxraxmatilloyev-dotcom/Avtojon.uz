import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Truck, User, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Shield, Zap, CheckCircle } from 'lucide-react'
import { useAlert } from '../components/ui'

// Color Palette:
// Primary: #2563EB (blue-600)
// Secondary: #1E293B (slate-800)
// Accent: #10B981 (emerald-500)

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const passwordRef = useRef(null)

  const validateUsername = (value) => {
    if (!value.trim()) return 'Username kiriting'
    if (value.length < 3) return 'Kamida 3 ta belgi'
    return null
  }

  const validatePassword = (value) => {
    if (!value.trim()) return 'Parol kiriting'
    if (value.length < 6) return 'Kamida 6 ta belgi'
    return null
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (field === 'username') {
      setErrors(prev => ({ ...prev, username: validateUsername(username) }))
    } else {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
        const redirectPath = {
          'driver': '/driver',
          'super_admin': '/super-admin',
          'business': '/dashboard',
          'admin': '/fleet'
        }[result.role] || '/fleet'
        navigate(redirectPath)
      } else {
        alert.error("Kirish xatosi", result.message || "Username yoki parol noto'g'ri")
      }
    } catch (error) {
      alert.error("Xatolik", error.userMessage || "Serverga ulanishda xatolik")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Blue Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/50 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-700/50 rounded-full blur-3xl" />
        </div>
        
        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Avtojon" className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-2xl font-bold text-white">Avtojon</span>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Yuk tashish biznesini<br />
              <span className="text-blue-200">osonlashtiring</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-md">
              Reyslar, shofyorlar, mashinalar va moliyaviy hisobotlarni bir joydan nazorat qiling
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Feature icon={Zap} text="Tezkor va qulay interfeys" />
            <Feature icon={Shield} text="Xavfsiz ma'lumotlar saqlash" />
            <Feature icon={CheckCircle} text="Real-time monitoring" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-blue-200 text-sm">© 2024 Avtojon. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/logo.jpg" alt="Avtojon" className="w-12 h-12 rounded-xl object-cover" />
              <span className="text-2xl font-bold text-slate-800">Avtojon</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">Xush kelibsiz!</h2>
            <p className="text-slate-500">Hisobingizga kirish uchun ma'lumotlarni kiriting</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.username && touched.username ? 'text-red-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (touched.username) setErrors(prev => ({ ...prev, username: validateUsername(e.target.value) }))
                    }}
                    onBlur={() => handleBlur('username')}
                    onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
                      errors.username && touched.username 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                    placeholder="username"
                  />
                </div>
                {errors.username && touched.username && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-2">
                    <AlertCircle size={12} /> {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Parol</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.password && touched.password ? 'text-red-400' : 'text-slate-400'}`} />
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (touched.password) setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }))
                    }}
                    onBlur={() => handleBlur('password')}
                    className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
                      errors.password && touched.password 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                    placeholder="Parol"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-2">
                    <AlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Kirish
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500">
                Hisobingiz yo'qmi?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Ro'yxatdan o'ting
                </Link>
              </p>
            </div>
          </div>

          {/* Back Link */}
          <Link to="/" className="flex items-center justify-center gap-2 mt-6 text-slate-500 hover:text-blue-600 transition-colors group">
            <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            Bosh sahifaga
          </Link>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-white font-medium">{text}</span>
    </div>
  )
}
