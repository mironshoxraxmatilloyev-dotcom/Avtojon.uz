import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Crown, AlertTriangle, Phone, Truck, Fuel, Wrench, BarChart3, Headphones, Check, CreditCard } from 'lucide-react'

const SUPPORT_PHONE = '+998 88 019 19 09'

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 pb-16">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white">
            <Crown className="w-10 h-10 text-white" />
          </div>
          {canClose && (
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white">
              <X size={18} />
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-lg text-xs text-white font-semibold">
            Premium
          </span>
        </div>

        <div className="pt-14 pb-6 px-5">
          <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Pro tarifga o'ting</h2>
          <p className="text-slate-500 text-center text-sm mb-6">Barcha imkoniyatlardan foydalaning</p>

          {/* Features */}
          <div className="space-y-2 mb-6">
            <Feature icon={Truck} text="Cheksiz mashinalar" />
            <Feature icon={Fuel} text="Yoqilg'i nazorati" />
            <Feature icon={Wrench} text="Xizmat tarixi" />
            <Feature icon={BarChart3} text="Hisobotlar" />
            <Feature icon={Headphones} text="24/7 yordam" />
          </div>

          {/* Price */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 text-sm">Har bir mashina uchun</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900">10,000</span>
                <span className="text-slate-500 text-sm ml-1">so'm/oy</span>
              </div>
            </div>
            
            <button
              onClick={handlePayment}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 mb-2 active:scale-[0.98] transition-transform"
            >
              <CreditCard size={18} />
              Online to'lash
            </button>
            
            <button
              onClick={handleCall}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm"
            >
              <Phone size={16} />
              {SUPPORT_PHONE}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Telegram: <span className="text-indigo-500 font-semibold">@avtojon_support</span>
          </p>
        </div>
      </div>
    </div>
  )
})

export const ExpiredView = memo(({ showModal, setShowModal }) => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/30">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Obuna tugadi</h1>
        <p className="text-slate-500 mb-8">Davom ettirish uchun obunani yangilang</p>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900">Pro tarif</h3>
              <p className="text-slate-500 text-sm">Barcha imkoniyatlar</p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-xl font-bold text-slate-900">10K</span>
              <span className="text-slate-500 text-xs">/mashina/oy</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/payment')}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform mb-3"
          >
            <CreditCard size={20} />
            Online to'lash
          </button>
          
          <button
            onClick={() => window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl"
          >
            <Phone size={18} />
            {SUPPORT_PHONE}
          </button>
        </div>
        
        <p className="text-xs text-slate-400 mt-4">
          Telegram: <span className="text-indigo-500 font-semibold">@avtojon_support</span>
        </p>
      </div>
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} canClose={false} />}
    </div>
  )
})

const Feature = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
      <Icon size={16} className="text-indigo-600" />
    </div>
    <span className="text-slate-700 text-sm font-medium flex-1">{text}</span>
    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
      <Check size={12} className="text-emerald-600" />
    </div>
  </div>
)

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
