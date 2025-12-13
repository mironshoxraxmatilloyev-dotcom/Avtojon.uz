import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { User, Lock, ArrowRight, Sparkles, Eye, EyeOff, Building2, UserCircle } from 'lucide-react'
import { showToast } from '../components/Toast'
import { PhoneInputDark } from '../components/PhoneInput'

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', fullName: '', companyName: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await register(form)
    if (result.success) {
      showToast.success('Royxatdan otdingiz!')
      navigate('/dashboard')
    } else {
      showToast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            Avtojon <Sparkles className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-violet-300 mt-2">Yangi hisob yarating</p>
        </div>

        {/* Register Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-violet-200 mb-2">Toliq ism *</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-400/50 focus:border-violet-500 focus:outline-none transition-all"
                  placeholder="Ism Familiya"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-violet-200 mb-2">Username *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-400/50 focus:border-violet-500 focus:outline-none transition-all"
                  placeholder="username"
                  required
                />
              </div>
              <p className="text-xs text-violet-400/60 mt-1.5 ml-1">Login qilish uchun ishlatiladi</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-violet-200 mb-2">Parol *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-400/50 focus:border-violet-500 focus:outline-none transition-all"
                  placeholder="Kamida 6 ta belgi"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-violet-200 mb-2">Kompaniya</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-400/50 focus:border-violet-500 focus:outline-none transition-all"
                  placeholder="Kompaniya nomi"
                />
              </div>
            </div>

            <div className="dark-phone">
              <label className="block text-sm font-semibold text-violet-200 mb-2">Telefon</label>
              <PhoneInputDark
                value={form.phone}
                onChange={(phone) => setForm({...form, phone})}
                placeholder="Telefon raqam"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50 transition-all group mt-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Royxatdan otish
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-violet-300">
              Hisobingiz bormi?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
                Kirish
              </Link>
            </p>
          </div>
        </div>

        <Link to="/" className="flex items-center justify-center gap-2 mt-6 text-violet-400 hover:text-violet-300 transition-colors">
          <ArrowRight size={16} className="rotate-180" /> Bosh sahifaga
        </Link>
      </div>
    </div>
  )
}
