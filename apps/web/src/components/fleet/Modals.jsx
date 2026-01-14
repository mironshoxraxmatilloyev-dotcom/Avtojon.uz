import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Crown, AlertTriangle, Phone, Truck, Fuel, Wrench, BarChart3, Headphones, Check, CreditCard } from 'lucide-react'

const SUPPORT_PHONE = '+998 88 019 91 19'

export const VehicleModal = memo(({ form, setForm, onSubmit, onClose, isEdit }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-slide-up sm:animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {isEdit ? 'Tahrirlash' : 'Yangi mashina'}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-80px)]">
        <FormInput
          label="Davlat raqami"
          value={form.plateNumber}
          onChange={v => setForm(f => ({ ...f, plateNumber: v.toUpperCase() }))}
          placeholder="01A123BC"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Marka"
            value={form.brand}
            onChange={v => setForm(f => ({ ...f, brand: v }))}
            placeholder="MAN"
            required
          />
          <FormInput
            label="Yil"
            type="number"
            value={form.year}
            onChange={v => setForm(f => ({ ...f, year: v }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Yoqilg'i"
            value={form.fuelType}
            onChange={v => setForm(f => ({ ...f, fuelType: v }))}
            options={[
              { value: 'diesel', label: 'Dizel' },
              { value: 'petrol', label: 'Benzin' },
              { value: 'gas', label: 'Gaz' },
              { value: 'metan', label: 'Metan' }
            ]}
          />
          <FormInput
            label={`Bak (${form.fuelType === 'metan' ? 'kub' : 'L'})`}
            type="number"
            value={form.fuelTankCapacity}
            onChange={v => setForm(f => ({ ...f, fuelTankCapacity: v }))}
            placeholder="400"
          />
        </div>
        <FormInput
          label="Spidometr (km)"
          type="number"
          value={form.currentOdometer}
          onChange={v => setForm(f => ({ ...f, currentOdometer: v }))}
          placeholder="0"
        />

        <button
          type="submit"
          className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-bold text-base shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
        >
          {isEdit ? 'Yangilash' : 'Qo\'shish'}
        </button>
      </form>
    </div>
  </div>
))

export const UpgradeModal = memo(({ onClose, canClose }) => {
  const navigate = useNavigate()
  
  const handlePayment = () => {
    onClose?.()
    navigate('/payment')
  }
  
  const handleCall = () => {
    window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`
  }
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-[420px] sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-visible max-h-[95vh] sm:max-h-none animate-slide-up sm:animate-scale-in">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 px-5 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6 rounded-t-3xl sm:rounded-t-2xl">
          {/* Close button */}
          {canClose && (
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors backdrop-blur-sm z-10"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content - scrollable on mobile */}
        <div className="px-5 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-5 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-none">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Pro tarifga o'ting</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Barcha imkoniyatlardan foydalaning</p>
          </div>

          {/* Features - compact */}
          <div className="space-y-2 mb-4">
            <FeatureCompact icon={Truck} text="Cheksiz mashinalar" color="indigo" />
            <FeatureCompact icon={Fuel} text="Yoqilg'i nazorati" color="blue" />
            <FeatureCompact icon={Wrench} text="Xizmat tarixi" color="purple" />
            <FeatureCompact icon={BarChart3} text="Hisobotlar" color="emerald" />
            <FeatureCompact icon={Headphones} text="24/7 yordam" color="orange" />
          </div>

          {/* Price card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3.5 mb-4 border border-slate-200">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-slate-600 text-xs font-medium">Har bir mashina</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900">10,000</span>
                <span className="text-slate-500 text-[11px] ml-1">so'm/oy</span>
              </div>
            </div>
            
            {/* Payment button */}
            <button
              onClick={handlePayment}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 sm:py-2.5 rounded-lg shadow-lg shadow-indigo-500/30 mb-2 active:scale-[0.98] transition-all text-sm"
            >
              <CreditCard size={16} />
              <span>Online to'lash</span>
            </button>
            
            {/* Call button */}
            <button
              onClick={handleCall}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all text-xs"
            >
              <Phone size={14} />
              <span>{SUPPORT_PHONE}</span>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pb-safe">
            <p className="text-[11px] text-slate-400">
              Telegram:{' '}
              <a 
                href="https://t.me/Murodjon_PM" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-500 font-semibold hover:text-indigo-600 transition-colors"
              >
                @Murodjon_PM
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})

export const ExpiredView = memo(({ showModal, setShowModal }) => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        {/* Icon - compact */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/30">
            <AlertTriangle className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Title - compact */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Obuna tugadi</h1>
        <p className="text-slate-500 mb-8">Davom ettirish uchun obunani yangilang</p>
        
        {/* Card - compact */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl">
          {/* Pro info - compact */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-900">Pro tarif</h3>
              <p className="text-slate-500 text-sm">Barcha imkoniyatlar</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-slate-900">10K</div>
              <div className="text-slate-500 text-xs">so'm/oy</div>
            </div>
          </div>

          {/* Buttons - compact */}
          <button
            onClick={() => navigate('/payment')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all mb-2.5"
          >
            <CreditCard size={18} />
            <span>Online to'lash</span>
          </button>
          
          <button
            onClick={() => window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
          >
            <Phone size={16} />
            <span className="text-sm">{SUPPORT_PHONE}</span>
          </button>
        </div>
        
        {/* Footer - compact */}
        <p className="text-xs text-slate-400 mt-5">
          Telegram:{' '}
          <a 
            href="https://t.me/Murodjon_PM" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-500 font-semibold hover:text-indigo-600 transition-colors"
          >
            @Murodjon_PM
          </a>
        </p>
      </div>
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} canClose={false} />}
    </div>
  )
})

const Feature = ({ icon: Icon, text, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600'
  }
  
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className={`w-10 h-10 ${colorClasses[color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <span className="text-slate-700 font-medium flex-1">{text}</span>
      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Check size={14} className="text-emerald-600" strokeWidth={3} />
      </div>
    </div>
  )
}

// Compact version for modal
const FeatureCompact = ({ icon: Icon, text, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600'
  }
  
  return (
    <div className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
      <div className={`w-8 h-8 ${colorClasses[color]} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon size={16} />
      </div>
      <span className="text-slate-700 text-sm font-medium flex-1">{text}</span>
      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Check size={12} className="text-emerald-600" strokeWidth={3} />
      </div>
    </div>
  )
}

const FormInput = memo(({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
    />
  </div>
))

const FormSelect = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))
