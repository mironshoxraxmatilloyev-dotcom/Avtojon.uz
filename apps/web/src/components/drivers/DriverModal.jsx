import { createPortal } from 'react-dom'
import { X, User } from 'lucide-react'
import { PhoneInputDark } from '../PhoneInput'

export default function DriverModal({ 
  show, 
  onClose, 
  onSubmit, 
  form, 
  setForm, 
  editingDriver 
}) {
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
                  {editingDriver ? 'Malumotlarni yangilang' : 'Yangi shofyor qoshing'}
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
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                  placeholder="********" 
                  required 
                />
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

          {/* Payment type */}
          <div>
            <label className="block text-sm font-semibold text-blue-200 mb-2">To'lov turi *</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setForm({ ...form, paymentType: 'monthly' })} 
                className={`p-4 rounded-xl border-2 transition-all ${
                  form.paymentType === 'monthly' 
                    ? 'border-blue-500 bg-blue-500/20 text-white' 
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="text-2xl mb-1">💰</div>
                <div className="font-semibold text-sm">Oylik</div>
              </button>
              <button 
                type="button" 
                onClick={() => setForm({ ...form, paymentType: 'per_trip' })} 
                className={`p-4 rounded-xl border-2 transition-all ${
                  form.paymentType === 'per_trip' 
                    ? 'border-blue-500 bg-blue-500/20 text-white' 
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="text-2xl mb-1">🚛</div>
                <div className="font-semibold text-sm">Reys uchun</div>
              </button>
            </div>
          </div>

          {/* Salary input */}
          {form.paymentType === 'monthly' ? (
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">Oylik maosh</label>
              <input 
                type="number" 
                value={form.baseSalary} 
                onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} 
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                placeholder="5000000" 
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">Reys uchun to'lov</label>
              <input 
                type="number" 
                value={form.perTripRate} 
                onChange={(e) => setForm({ ...form, perTripRate: e.target.value })} 
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                placeholder="500000" 
              />
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
