import { createPortal } from 'react-dom'
import { X, User, Eye, EyeOff } from 'lucide-react'
import { PhoneInputDark } from '../PhoneInput'
import { useState } from 'react'

export default function DriverModal({ 
  show, 
  onClose, 
  onSubmit, 
  form, 
  setForm, 
  editingDriver,
  onPasswordUpdate
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordUpdating, setPasswordUpdating] = useState(false)

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
      return
    }
    setPasswordUpdating(true)
    try {
      await onPasswordUpdate(editingDriver._id, newPassword)
      setNewPassword('')
      setShowNewPassword(false)
      alert('Parol muvaffaqiyatli yangilandi')
    } catch (error) {
      alert('Xatolik: ' + (error.response?.data?.message || error.message || 'Parolni yangilab bo\'lmadi'))
    } finally {
      setPasswordUpdating(false)
    }
  }

  if (!show) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-t-3xl" />
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingDriver ? 'Tahrirlash' : 'Yangi shofyor'}
                </h2>
                <p className="text-blue-300 text-sm">
                  {editingDriver ? 'Ma\'lumotlarni yangilang' : 'Yangi shofyor qo\'shing'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">Username *</label>
              <input 
                type="text" 
                value={form.username} 
                onChange={(e) => setForm({ ...form, username: e.target.value })} 
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition disabled:opacity-50" 
                placeholder="username" 
                required 
                disabled={!!editingDriver} 
              />
            </div>
            {!editingDriver && (
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">Parol *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="********" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-200 mb-2">To'liq ism *</label>
            <input 
              type="text" 
              value={form.fullName} 
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
              placeholder="Ism Familiya" 
              required 
            />
          </div>

          <div className="dark-phone">
            <label className="block text-sm font-semibold text-blue-200 mb-2">Telefon</label>
            <PhoneInputDark 
              value={form.phone} 
              onChange={(phone) => setForm({ ...form, phone })} 
              placeholder="Telefon raqam" 
            />
          </div>

          {/* Oylik maosh */}
          <div>
            <label className="block text-sm font-semibold text-blue-200 mb-2">Oylik maosh</label>
            <input 
              type="text" 
              value={form.baseSalary ? Number(form.baseSalary).toLocaleString('uz-UZ') : ''} 
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setForm({ ...form, baseSalary: value })
              }} 
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
              placeholder="5,000,000" 
            />
          </div>

          {/* Parol yangilash (faqat tahrirlash rejimida) */}
          {editingDriver && (
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🔐 Parolni yangilash</h3>
              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="Yangi parol" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={handlePasswordUpdate}
                  disabled={!newPassword || passwordUpdating}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all"
                >
                  {passwordUpdating ? 'Yangilanmoqda...' : 'Parolni yangilash'}
                </button>
              </div>
            </div>
          )}

          {/* Vehicle (only for new driver) */}
          {!editingDriver && (
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🚛 Mashina ma'lumotlari</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Davlat raqami *</label>
                  <input 
                    type="text" 
                    value={form.plateNumber} 
                    onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} 
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition uppercase" 
                    placeholder="01 A 123 AB" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Marka</label>
                    <input 
                      type="text" 
                      value={form.brand} 
                      onChange={(e) => setForm({ ...form, brand: e.target.value })} 
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                      placeholder="MAN, Volvo..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Yil</label>
                    <input 
                      type="number" 
                      value={form.year} 
                      onChange={(e) => setForm({ ...form, year: e.target.value })} 
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                      placeholder="2020" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button 
            type="submit" 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
          >
            {editingDriver ? 'Saqlash' : "Qo'shish"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
