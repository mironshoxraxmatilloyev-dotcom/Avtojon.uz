import { X, Copy, Check, Eye, EyeOff, Crown, Calendar, Shield, Sparkles } from 'lucide-react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

// Credentials Modal - Pro Design
export function CredentialsModal({ credentials, onClose, onCopy, copiedField }) {
  if (!credentials) return null
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 rotate-3">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mt-10 mb-6">
          <h3 className="text-xl font-bold text-white mb-1">Kirish ma'lumotlari</h3>
          <p className="text-sm text-slate-400">Bu ma'lumotlarni xavfsiz saqlang</p>
        </div>
        
        <div className="space-y-3">
          <CredentialField 
            label="Username" 
            value={credentials.username} 
            onCopy={() => onCopy(credentials.username, 'username')} 
            copied={copiedField === 'username'} 
          />
          <CredentialField 
            label="Parol" 
            value={credentials.password} 
            onCopy={() => onCopy(credentials.password, 'password')} 
            copied={copiedField === 'password'} 
          />
        </div>
        
        <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Bu ma'lumotlarni xavfsiz joyda saqlang!
          </p>
        </div>
      </div>
    </div>
  )
}

function CredentialField({ label, value, onCopy, copied }) {
  return (
    <div className="bg-slate-700/50 rounded-xl p-4 border border-white/5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-white font-mono text-lg">{value}</p>
        </div>
        <button onClick={onCopy} className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}

// Password Modal - Pro Design
export function PasswordModal({ user, newPassword, setNewPassword, showPassword, setShowPassword, onSubmit, onClose }) {
  if (!user) return null
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{user.fullName?.charAt(0) || '?'}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Parol yangilash</h3>
              <p className="text-sm text-slate-400">{user.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative mb-6">
          <input 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Yangi parol kiriting" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            className="w-full px-4 py-4 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 pr-12 text-lg" 
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <button onClick={onSubmit} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30">
          Parolni yangilash
        </button>
      </div>
    </div>
  )
}

// Subscription Modal - Pro Design
export function SubscriptionModal({ data, days, setDays, loading, onSubmit, onClose }) {
  if (!data) return null
  
  const newEndDate = new Date(
    Math.max(
      data.subscription?.endDate ? new Date(data.subscription.endDate).getTime() : Date.now(),
      Date.now()
    ) + days * 24 * 60 * 60 * 1000
  ).toLocaleDateString('uz-UZ')
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Obuna uzaytirish</h3>
              <p className="text-sm text-slate-400">{data.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-white/5">
          <p className="text-xs text-slate-400 mb-1">Joriy holat</p>
          <p className="text-white font-medium">
            {data.subscription?.endDate 
              ? new Date(data.subscription.endDate) > new Date()
                ? `Faol - ${new Date(data.subscription.endDate).toLocaleDateString('uz-UZ')} gacha`
                : '❌ Tugagan'
              : '⏳ Sinov muddati'}
          </p>
        </div>

        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-3 block">Muddat tanlang</label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { d: 7, label: '1 hafta' },
              { d: 30, label: '1 oy' },
              { d: 90, label: '3 oy' },
              { d: 365, label: '1 yil' },
            ].map(({ d, label }) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  days === d 
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input 
              type="number" 
              min="1"
              value={days} 
              onChange={(e) => setDays(parseInt(e.target.value) || 1)} 
              className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
            />
            <span className="text-slate-400 font-medium">kun</span>
          </div>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Yangi tugash sanasi:</span>
            <span className="text-white font-bold text-lg">{newEndDate}</span>
          </div>
        </div>

        <button 
          onClick={onSubmit} 
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              Obunani uzaytirish
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Businessman Form Modal - Pro Design
export function BusinessmanModal({ show, editing, formData, setFormData, submitting, onSubmit, onClose }) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${editing ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
              {editing ? (
                <span className="text-white font-bold text-lg">{formData.fullName?.charAt(0) || '?'}</span>
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{editing ? 'Tahrirlash' : 'Yangi biznesmen'}</h3>
              <p className="text-sm text-slate-400">{editing ? 'Ma\'lumotlarni yangilash' : 'Yangi hisob yaratish'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">To'liq ism</label>
            <input 
              type="text" 
              placeholder="Ism familiya" 
              value={formData.fullName} 
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
              className="w-full px-4 py-3.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20" 
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Biznes turi</label>
            <input 
              type="text" 
              placeholder="Masalan: Yuk tashish" 
              value={formData.businessType} 
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} 
              className="w-full px-4 py-3.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20" 
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Telefon raqam</label>
            <PhoneInput
              country={'uz'}
              value={formData.phone}
              onChange={(phone) => setFormData({ ...formData, phone })}
              inputClass="!w-full !px-4 !py-3.5 !bg-slate-700/50 !border-white/10 !rounded-xl !text-white !text-base"
              containerClass="!w-full"
              buttonClass="!bg-slate-700/50 !border-white/10 !rounded-l-xl !px-3"
              dropdownClass="!bg-slate-800 !border-white/10 !rounded-xl"
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting} 
            className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
              editing 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-blue-500/30' 
                : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-violet-500/30'
            } text-white disabled:opacity-50`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              editing ? 'Yangilash' : 'Qo\'shish'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
