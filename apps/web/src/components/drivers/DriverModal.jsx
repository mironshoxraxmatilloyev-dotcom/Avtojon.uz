import { createPortal } from 'react-dom'
import { X, User, Eye, EyeOff, RefreshCw, Truck, Droplets } from 'lucide-react'
import { PhoneInputDark } from '../PhoneInput'
import { useState, useEffect } from 'react'
import api from '../../services/api'

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
  const [vehicleData, setVehicleData] = useState(null)
  const [loadingVehicle, setLoadingVehicle] = useState(false)

  // Tahrirlash rejimida mashina ma'lumotlarini yuklash
  useEffect(() => {
    if (editingDriver && show) {
      setLoadingVehicle(true)
      api.get(`/drivers/${editingDriver._id}`)
        .then(res => {
          const vehicle = res.data.data?.vehicle
          if (vehicle) {
            setVehicleData(vehicle)
            setForm(f => ({
              ...f,
              vehicleId: vehicle._id,
              plateNumber: vehicle.plateNumber || '',
              brand: vehicle.brand || '',
              year: vehicle.year || '',
              oilChangeIntervalKm: vehicle.oilChangeIntervalKm || 15000,
              lastOilChangeOdometer: vehicle.lastOilChangeOdometer || 0,
              currentOdometer: vehicle.currentOdometer || 0
            }))
          }
        })
        .catch(() => {})
        .finally(() => setLoadingVehicle(false))
    } else {
      setVehicleData(null)
    }
  }, [editingDriver, show])

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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/90 p-0 sm:p-4">
      <div className="absolute inset-0" onClick={handleClose} />
      <div 
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-2xl sm:rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-1" />
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="absolute inset-x-0 top-0 h-16 sm:h-20 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-t-2xl sm:rounded-t-3xl" />
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <User className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {editingDriver ? 'Tahrirlash' : 'Yangi haydovchi'}
                </h2>
                <p className="text-blue-300 text-xs sm:text-sm">
                  {editingDriver ? 'Ma\'lumotlarni yangilang' : 'Yangi haydovchi qo\'shing'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
            >
              <X size={22} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-6 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">Username *</label>
              <input 
                type="text" 
                value={form.username} 
                onChange={(e) => setForm({ ...form, username: e.target.value })} 
                className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition disabled:opacity-50" 
                placeholder="username" 
                required 
                disabled={!!editingDriver} 
              />
            </div>
            {!editingDriver && (
              <div>
                <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">Parol *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 text-base sm:text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="********" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={20} className="sm:w-[22px] sm:h-[22px]" /> : <Eye size={20} className="sm:w-[22px] sm:h-[22px]" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">To'liq ism *</label>
            <input 
              type="text" 
              value={form.fullName} 
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
              className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
              placeholder="Ism Familiya" 
              required 
            />
          </div>

          <div className="dark-phone">
            <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">Telefon</label>
            <PhoneInputDark 
              value={form.phone} 
              onChange={(phone) => setForm({ ...form, phone })} 
              placeholder="Telefon raqam" 
            />
          </div>

          {/* Parol (faqat tahrirlash rejimida) */}
          {editingDriver && (
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <label className="text-sm sm:text-base font-semibold text-blue-200">Parol</label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPassword(!editingPassword)
                    setNewPassword('')
                    setShowNewPassword(false)
                  }}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition"
                >
                  <RefreshCw size={14} className="sm:w-4 sm:h-4" />
                  {editingPassword ? 'Bekor qilish' : 'Yangilash'}
                </button>
              </div>
              {editingPassword ? (
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 text-base sm:text-lg bg-white/5 border border-amber-500/50 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition" 
                    placeholder="Yangi parol (kamida 6 ta belgi)" 
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showNewPassword ? <EyeOff size={20} className="sm:w-[22px] sm:h-[22px]" /> : <Eye size={20} className="sm:w-[22px] sm:h-[22px]" />}
                  </button>
                </div>
              ) : (
                <div className="px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border border-white/10 rounded-xl text-slate-400">
                  ••••••••
                </div>
              )}
            </div>
          )}

          {/* Vehicle - yangi va tahrirlash uchun */}
          <div className="pt-4 sm:pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <Truck className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg sm:text-xl font-semibold text-white">Mashina ma'lumotlari</h3>
              {loadingVehicle && <span className="text-xs text-slate-400">Yuklanmoqda...</span>}
            </div>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">Davlat raqami {!editingDriver && '*'}</label>
                <input 
                  type="text" 
                  value={form.plateNumber} 
                  onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} 
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition uppercase" 
                  placeholder="01 A 123 AB" 
                  required={!editingDriver}
                  disabled={editingDriver && !vehicleData}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">Marka</label>
                  <input 
                    type="text" 
                    value={form.brand} 
                    onChange={(e) => setForm({ ...form, brand: e.target.value })} 
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="MAN, Volvo..." 
                    disabled={editingDriver && !vehicleData}
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">Yil</label>
                  <input 
                    type="number" 
                    value={form.year} 
                    onChange={(e) => setForm({ ...form, year: e.target.value })} 
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="2020" 
                    disabled={editingDriver && !vehicleData}
                  />
                </div>
              </div>

              {/* Moy almashtirish sozlamalari */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">Moy almashtirish sozlamalari</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-amber-200/70 mb-1.5">Har necha km da</label>
                    <input 
                      type="number" 
                      value={form.oilChangeIntervalKm || ''} 
                      onChange={(e) => setForm({ ...form, oilChangeIntervalKm: e.target.value })} 
                      className="w-full px-3 py-2.5 text-sm bg-white/5 border border-amber-500/30 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition" 
                      placeholder="15000" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-200/70 mb-1.5">Oxirgi almashtirish (km)</label>
                    <input 
                      type="number" 
                      value={form.lastOilChangeOdometer || ''} 
                      onChange={(e) => setForm({ ...form, lastOilChangeOdometer: e.target.value })} 
                      className="w-full px-3 py-2.5 text-sm bg-white/5 border border-amber-500/30 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition" 
                      placeholder="800000" 
                    />
                  </div>
                </div>
                {form.oilChangeIntervalKm && form.lastOilChangeOdometer && (
                  <p className="text-xs text-amber-300/80">
                    Keyingi almashtirish: <span className="font-bold">{(Number(form.lastOilChangeOdometer) + Number(form.oilChangeIntervalKm)).toLocaleString()} km</span> da
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-4 sm:py-5 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {saving ? 'Saqlanmoqda...' : (editingDriver ? 'Saqlash' : "Qo'shish")}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
