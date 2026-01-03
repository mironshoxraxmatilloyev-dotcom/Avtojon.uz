import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Truck, Lock, ArrowRight, Eye, EyeOff, UserCircle, AlertCircle, Shield, BarChart3, Users } from 'lucide-react'
import PhoneInputField from '../components/PhoneInput'
import { useAlert } from '../components/ui'

// Color Palette:
// Primary: #2563EB (blue-600)
// Secondary: #1E293B (slate-800)
// Accent: #10B981 (emerald-500)

export default function Register() {
  const [form, setForm] = useState({ fullName: '', password: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const passwordRef = useRef(null)

  const validateField = (name, value) => {
    if (name === 'fullName') {
      if (!value.trim()) return 'Ismingizni kiriting'
      if (value.trim().length < 2) return 'Kamida 2 ta belgi'
    }
    if (name === 'password') {
      if (!value) return 'Parol majburiy'
      if (value.length < 6) return 'Kamida 6 ta belgi'
    }
    if (name === 'phone') {
      if (!value || value.length < 9) return 'Telefon raqam majburiy'
    }
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, form[name]) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    ;['fullName', 'password', 'phone'].forEach(field => {
      const error = validateField(field, form[field])
      if (error) newErrors[field] = error
    })

    setTouched({ fullName: true, password: true, phone: true })
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      alert.warning("Ogohlantirish", Object.values(newErrors)[0])
      return
    }

    try {
      const result = await register(form)
      if (result.success) {
        alert.success("Muvaffaqiyatli!", "Ro'yxatdan o'tdingiz. Xush kelibsiz!")
        navigate('/fleet')
      } else {
        alert.error("Xatolik", result.message || "Ro'yxatdan o'tishda xatolik")
      }
    } catch (error) {
      alert.error("Xatolik", error.userMessage || "Serverga ulanishda xatolik")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Emerald Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/50 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/50 rounded-full blur-3xl" />
        </div>
        
        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <img src="/main_logo.jpg" alt="Avtojon" className="w-12 h-12 rounded-xl object-cover" />
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">avto</span>
              <span className="text-2xl font-bold" style={{ color: '#09b3b4' }}>JON</span>
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Biznesingizni<br />
              <span className="text-emerald-100">yangi bosqichga</span> olib chiqing
            </h1>
            <p className="text-emerald-100 text-lg max-w-md">
              Minglab kompaniyalar avtoJON bilan ishlaydi. Siz ham qo'shiling!
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Feature icon={BarChart3} text="Moliyaviy hisobotlar" />
            <Feature icon={Users} text="Haydovchilarni boshqarish" />
            <Feature icon={Shield} text="Xavfsiz va ishonchli" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-emerald-200 text-sm">© 2024 avtoJON. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col p-4 lg:p-12 bg-slate-50">
        {/* Top Bar - Orqaga */}
        <div className="flex justify-start items-center mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors group"
          >
            <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            Orqaga
          </Link>
        </div>

        {/* Form Container - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-3">
                <img src="/main_logo.jpg" alt="Avtojon" className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-slate-800">avto</span>
                  <span className="text-2xl font-bold" style={{ color: '#09b3b4' }}>JON</span>
                </div>
              </Link>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name - Ism */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ism</label>
                  <div className="relative">
                    <UserCircle className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.fullName && touched.fullName ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('fullName')}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
                        errors.fullName && touched.fullName 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-slate-200 focus:border-emerald-500'
                      }`}
                      placeholder="Ism Familiya"
                    />
                  </div>
                  {errors.fullName && touched.fullName && (
                    <p className="flex items-center gap-1 text-red-500 text-xs mt-2">
                      <AlertCircle size={12} /> {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone - Telefon */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefon</label>
                  <PhoneInputField
                    value={form.phone}
                    onChange={(phone) => {
                      setForm({ ...form, phone })
                      if (touched.phone) setErrors(prev => ({ ...prev, phone: validateField('phone', phone) }))
                    }}
                    onBlur={() => handleBlur('phone')}
                    placeholder="Telefon raqam"
                    error={errors.phone && touched.phone}
                  />
                  {errors.phone && touched.phone && (
                    <p className="flex items-center gap-1 text-red-500 text-xs mt-2">
                      <AlertCircle size={12} /> {errors.phone}
                    </p>
                  )}
                </div>

                {/* Password - Parol */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Parol</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.password && touched.password ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
                        errors.password && touched.password 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-slate-200 focus:border-emerald-500'
                      }`}
                      placeholder="Kamida 6 ta belgi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
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
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Ro'yxatdan o'tish
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-500">
                  Hisobingiz bormi?{' '}
                  <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                    Kirish
                  </Link>
                </p>
              </div>
            </div>
          </div>
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
