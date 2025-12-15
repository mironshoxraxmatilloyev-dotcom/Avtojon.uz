import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Truck, User, Lock, ArrowRight, Sparkles, Eye, EyeOff, Building2, UserCircle, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { PhoneInputDark } from '../components/PhoneInput'
import { useAlert } from '../components/ui'
import { validateForm, SCHEMAS } from '../utils/validation'

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
      const rotateX = (y - centerY) / 150
      const rotateY = (centerX - x) / 150
      
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

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', fullName: '', companyName: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const formRef = useRef(null)
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const companyRef = useRef(null)

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    // Real-time validation for touched fields
    if (touched[name]) {
      validateSingleField(name, value)
    }
  }

  const validateSingleField = (name, value) => {
    let error = null
    
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'To\'liq ism majburiy'
        else if (value.trim().length < 2) error = 'Kamida 2 ta belgi'
        break
      case 'username':
        if (!value.trim()) error = 'Username majburiy'
        else if (value.length < 3) error = 'Kamida 3 ta belgi'
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) error = 'Faqat harflar, raqamlar va _'
        break
      case 'password':
        if (!value) error = 'Parol majburiy'
        else if (value.length < 6) error = 'Kamida 6 ta belgi'
        break
    }
    
    setErrors(prev => ({ ...prev, [name]: error }))
    return error
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateSingleField(name, form[name])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all required fields
    const newErrors = {}
    const requiredFields = ['fullName', 'username', 'password']
    
    requiredFields.forEach(field => {
      const error = validateSingleField(field, form[field])
      if (error) newErrors[field] = error
    })
    
    setTouched({ fullName: true, username: true, password: true })
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0]
      alert.warning("Ogohlantirish", firstError)
      return
    }
    
    try {
      const result = await register(form)
      if (result.success) {
        alert.success("Muvaffaqiyatli!", "Ro'yxatdan o'tdingiz. Xush kelibsiz!")
        navigate('/dashboard')
      } else {
        alert.error("Xatolik", result.message || "Ro'yxatdan o'tishda xatolik yuz berdi")
      }
    } catch (error) {
      alert.error("Xatolik", error.userMessage || "Serverga ulanishda xatolik yuz berdi")
    }
  }
  
  // Helper for input styling
  const getInputClass = (fieldName) => {
    const hasError = errors[fieldName] && touched[fieldName]
    return `w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border rounded-xl text-white text-sm sm:text-base placeholder-violet-400/50 focus:ring-2 focus:outline-none transition-all ${
      hasError 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-white/10 focus:border-violet-500 focus:ring-violet-500/20 hover:border-white/20'
    }`
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      <Suspense fallback={null}>
        <Scene3D variant="auth" />
      </Suspense>

      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-transparent to-[#0a0a1a] opacity-60"></div>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a1a] to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a1a] to-transparent"></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] z-[2]"></div>

      <div ref={formRef} className="relative z-10 w-full max-w-md my-4 sm:my-8 px-2 sm:px-0">
        <div className="text-center mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              Avtojon <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </h1>
          </Link>
          <p className="text-violet-300 text-sm sm:text-base">Yangi hisob yarating</p>
        </div>

        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-xs sm:text-sm text-violet-200">30 kun bepul sinov</span>
          </div>
        </div>

        <Card3D className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-8 shadow-2xl shadow-violet-500/10">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">To'liq ism *</label>
              <div className="relative group">
                <UserCircle className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${errors.fullName && touched.fullName ? 'text-red-400' : 'text-violet-400 group-focus-within:text-violet-300'}`} />
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      usernameRef.current?.focus()
                    }
                  }}
                  aria-invalid={errors.fullName && touched.fullName}
                  className={getInputClass('fullName')}
                  placeholder="Ism Familiya"
                />
              </div>
              {errors.fullName && touched.fullName && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5 ml-1">
                  <AlertCircle size={12} />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">Username *</label>
              <div className="relative group">
                <User className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${errors.username && touched.username ? 'text-red-400' : 'text-violet-400 group-focus-within:text-violet-300'}`} />
                <input
                  ref={usernameRef}
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={() => handleBlur('username')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      passwordRef.current?.focus()
                    }
                  }}
                  aria-invalid={errors.username && touched.username}
                  className={getInputClass('username')}
                  placeholder="username"
                />
              </div>
              {errors.username && touched.username ? (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5 ml-1">
                  <AlertCircle size={12} />
                  {errors.username}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-violet-400/60 mt-1 sm:mt-1.5 ml-1">Login qilish uchun ishlatiladi</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">Parol *</label>
              <div className="relative group">
                <Lock className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${errors.password && touched.password ? 'text-red-400' : 'text-violet-400 group-focus-within:text-violet-300'}`} />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (form.fullName.trim() && form.username.trim() && form.password.length >= 6) {
                        handleSubmit(e)
                      } else {
                        companyRef.current?.focus()
                      }
                    }
                  }}
                  aria-invalid={errors.password && touched.password}
                  className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/5 border rounded-xl text-white text-sm sm:text-base placeholder-violet-400/50 focus:ring-2 focus:outline-none transition-all ${
                    errors.password && touched.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/10 focus:border-violet-500 focus:ring-violet-500/20 hover:border-white/20'
                  }`}
                  placeholder="Kamida 6 ta belgi"
                  minLength={6}
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
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5 ml-1">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">Kompaniya</label>
              <div className="relative group">
                <Building2 className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-violet-400 group-focus-within:text-violet-300 transition-colors" />
                <input
                  ref={companyRef}
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && form.fullName.trim() && form.username.trim() && form.password.length >= 6) {
                      handleSubmit(e)
                    }
                  }}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder-violet-400/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all hover:border-white/20"
                  placeholder="Kompaniya nomi"
                />
              </div>
            </div>

            <div className="dark-phone">
              <label className="block text-xs sm:text-sm font-semibold text-violet-200 mb-1.5 sm:mb-2">Telefon</label>
              <PhoneInputDark
                value={form.phone}
                onChange={(phone) => setForm({...form, phone})}
                placeholder="Telefon raqam"
              />
            </div>

            <MagneticButton className="w-full pt-1 sm:pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50 transition-all active:scale-[0.98] group"
              >
                {loading ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Ro'yxatdan o'tish
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </MagneticButton>
          </form>

          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-violet-400/60 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1"><CheckCircle size={14} /> Bepul</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} /> Xavfsiz</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} /> Tez</span>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 text-center">
            <p className="text-violet-300 text-sm sm:text-base">
              Hisobingiz bormi?{' '}
              <Link to="/login" className="text-violet-400 hover:text-white font-semibold transition-colors">
                Kirish
              </Link>
            </p>
          </div>
        </Card3D>

        <Link to="/" className="flex items-center justify-center gap-2 mt-4 sm:mt-6 text-violet-400 hover:text-white transition-colors text-sm sm:text-base group">
          <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> 
          Bosh sahifaga
        </Link>
      </div>
    </div>
  )
}
