import { createPortal } from 'react-dom'
import { X, User, Eye, EyeOff, RefreshCw } from 'lucide-react'
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
  const [editingPassword, setEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Parol yangilash kerak bo'lsa
    if (editingDriver && editingPassword && newPassword) {
      if (newPassword.length < 6) {
        alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
        return
      }
      setSaving(true)
      try {
        await onPasswordUpdate(editingDriver._id, newPassword)
      } catch (error) {
        alert('Parol yangilashda xatolik: ' + (error.response?.data?.message || error.message))
        setSaving(false)
        return
      }
    }
    
    // Asosiy form submit
    setSaving(true)
    try {
      await onSubmit(e)
      setEditingPassword(false)
      setNewPassword('')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setEditingPassword(false)
    setNewPassword('')
    setShowNewPassword(false)
    onClose()
  }

  if (!show) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
      <div className="absolute inset-0" onClick={handleClose} />
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
                  {editingDriver ? 'Tahrirlash' : 'Yangi haydovchi'}
                </h2>
                <p className="text-blue-300 text-sm">
                  {editingDriver ? 'Ma\'lumotlarni yangilang' : 'Yangi haydovchi qo\'shing'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-base font-semibold text-blue-200 mb-3">Username *</label>
              <input 
                type="text" 
                value={form.username} 
                onChange={(e) => setForm({ ...form, username: e.target.value })} 
                className="w-full px-5 py-4 text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition disabled:opacity-50" 
                placeholder="username" 
                required 
                disabled={!!editingDriver} 
              />
            </div>
            {!editingDriver && (
              <div>
                <label className="block text-base font-semibold text-blue-200 mb-3">Parol *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    className="w-full px-5 py-4 pr-14 text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="********" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-blue-200 mb-3">To'liq ism *</label>
            <input 
              type="text" 
              value={form.fullName} 
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
              className="w-full px-5 py-4 text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
              placeholder="Ism Familiya" 
              required 
            />
          </div>

          <div className="dark-phone">
            <label className="block text-base font-semibold text-blue-200 mb-3">Telefon</label>
            <PhoneInputDark 
              value={form.phone} 
              onChange={(phone) => setForm({ ...form, phone })} 
              placeholder="Telefon raqam" 
            />
          </div>

          {/* Parol (faqat tahrirlash rejimida) */}
          {editingDriver && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-semibold text-blue-200">Parol</label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPassword(!editingPassword)
                    setNewPassword('')
                    setShowNewPassword(false)
                  }}
                  className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition"
                >
                  <RefreshCw size={16} />
                  {editingPassword ? 'Bekor qilish' : 'Yangilash'}
                </button>
              </div>
              {editingPassword ? (
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="w-full px-5 py-4 pr-14 text-lg bg-white/5 border border-amber-500/50 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition" 
                    placeholder="Yangi parol (kamida 6 ta belgi)" 
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showNewPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              ) : (
                <div className="px-5 py-4 text-lg bg-white/5 border border-white/10 rounded-xl text-slate-400">
                  ••••••••
                </div>
              )}
            </div>
          )}

          {/* Vehicle (only for new driver) */}
          {!editingDriver && (
            <div className="pt-5 border-t border-white/10">
              <h3 className="text-xl font-semibold text-white mb-5">🚛 Mashina ma'lumotlari</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-base font-semibold text-blue-200 mb-3">Davlat raqami *</label>
                  <input 
                    type="text" 
                    value={form.plateNumber} 
                    onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} 
                    className="w-full px-5 py-4 text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition uppercase" 
                    placeholder="01 A 123 AB" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-base font-semibold text-blue-200 mb-3">Marka</label>
                    <input 
                      type="text" 
                      value={form.brand} 
                      onChange={(e) => setForm({ ...form, brand: e.target.value })} 
                      className="w-full px-5 py-4 text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                      placeholder="MAN, Volvo..." 
                    />
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-blue-200 mb-3">Yil</label>
                    <input 
                      type="number" 
                      value={form.year} 
                      onChange={(e) => setForm({ ...form, year: e.target.value })} 
                      className="w-full px-5 py-4 text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
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
            disabled={saving}
            className="w-full py-5 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saqlanmoqda...' : (editingDriver ? 'Saqlash' : "Qo'shish")}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
