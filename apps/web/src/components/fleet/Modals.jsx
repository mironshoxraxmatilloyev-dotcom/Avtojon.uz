import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Crown, Zap, AlertTriangle, Phone, Truck, Fuel, Wrench, BarChart3, Headphones, Check, Sparkles, CreditCard } from 'lucide-react'

const SUPPORT_PHONE = '+998 88 019 19 09'

export const VehicleModal = memo(({ form, setForm, onSubmit, onClose, isEdit }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border-t-2 sm:border-2 border-slate-200 overflow-hidden max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Mashinani tahrirlash' : 'Yangi mashina'}
            </h2>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-70px)]">
        <ProInput
          label="Davlat raqami"
          value={form.plateNumber}
          onChange={v => setForm(f => ({ ...f, plateNumber: v.toUpperCase() }))}
          placeholder="01A123BC"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <ProInput
            label="Marka"
            value={form.brand}
            onChange={v => setForm(f => ({ ...f, brand: v }))}
            placeholder="MAN"
            required
          />
          <ProInput
            label="Yil"
            type="number"
            value={form.year}
            onChange={v => setForm(f => ({ ...f, year: v }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ProSelect
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
          <ProInput
            label={`Bak hajmi (${form.fuelType === 'metan' ? 'kub' : 'L'})`}
            type="number"
            value={form.fuelTankCapacity}
            onChange={v => setForm(f => ({ ...f, fuelTankCapacity: v }))}
            placeholder="400"
          />
        </div>
        <ProInput
          label="Spidometr (km)"
          type="number"
          value={form.currentOdometer}
          onChange={v => setForm(f => ({ ...f, currentOdometer: v }))}
          placeholder="0"
        />

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 rounded-lg text-white font-bold text-base transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
        >
          {isEdit ? 'Yangilash' : 'Qo\'shish'}
        </button>
      </form>
    </div>
  </div>
))

const handleCall = () => {
  window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`
}

export const UpgradeModal = memo(({ onClose, canClose }) => {
  const navigate = useNavigate()
  
  const handlePayment = () => {
    onClose?.()
    navigate('/payment')
  }
  
  return (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border-2 border-slate-200">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 p-8 pb-20">
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-2xl shadow-amber-500/40 flex items-center justify-center border-4 border-white">
          <Crown className="w-14 h-14 text-white" />
        </div>
        {canClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors">
            <X size={20} />
          </button>
        )}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-sm text-white font-semibold">
            <Sparkles className="w-4 h-4" />
            Premium
          </span>
        </div>
      </div>

      <div className="pt-20 pb-8 px-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Pro tarifga o'ting</h2>
        <p className="text-slate-500 text-center text-sm mb-8">Barcha imkoniyatlardan foydalaning</p>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <ProFeature icon={Truck} text="Cheksiz mashinalar qo'shish" />
          <ProFeature icon={Fuel} text="Yoqilg'i va moy nazorati" />
          <ProFeature icon={Wrench} text="Xizmat va ta'mirlash tarixi" />
          <ProFeature icon={BarChart3} text="Batafsil hisobotlar" />
          <ProFeature icon={Headphones} text="24/7 texnik yordam" />
        </div>

        {/* Price */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 mb-6 border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 font-medium">Oylik obuna</span>
            <div className="text-right">
              <span className="text-4xl font-bold text-slate-900">99,000</span>
              <span className="text-slate-500 ml-1">so'm/oy</span>
            </div>
          </div>
          
          {/* Online to'lov tugmasi */}
          <button
            onClick={handlePayment}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 mb-3"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-lg">Online to'lash</span>
          </button>
          
          {/* Telefon orqali */}
          <button
            onClick={handleCall}
            className="w-full flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all"
          >
            <Phone className="w-5 h-5" />
            <span>{SUPPORT_PHONE}</span>
          </button>
        </div>

        <p className="text-sm text-slate-400 text-center">
          Telegram: <span className="text-indigo-500 font-semibold">@avtojon_support</span>
        </p>
      </div>
    </div>
  </div>
  )
})

export const ExpiredView = memo(({ showModal, setShowModal }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30 flex items-center justify-center p-4">
    <div className="text-center max-w-lg w-full">
      {/* Animated icon */}
      <div className="relative mb-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-36 h-36 bg-red-100 rounded-full animate-ping opacity-50" />
        </div>
        <div className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/40 rotate-3">
          <AlertTriangle className="w-16 h-16 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">Obuna muddati tugadi</h1>
      <p className="text-slate-500 mb-10 text-lg">
        Avtopark tizimidan foydalanishni davom ettirish uchun obunani yangilang
      </p>
      
      {/* Card */}
      <div className="bg-white rounded-3xl p-8 mb-8 border-2 border-slate-200 shadow-xl">
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-900">Pro tarif</h3>
            <p className="text-slate-500">Barcha imkoniyatlar</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-3xl font-bold text-slate-900">50,000</span>
            <span className="text-slate-500 text-sm"> so'm/oy</span>
          </div>
        </div>

        <p className="text-slate-600 mb-5">
          Obunani yangilash uchun quyidagi raqamga qo'ng'iroq qiling:
        </p>
        
        <button
          onClick={handleCall}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 mb-6"
        >
          <Phone className="w-6 h-6" />
          <span className="text-xl">{SUPPORT_PHONE}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 border border-slate-100">
            <Truck className="w-5 h-5 text-indigo-500" />
            <p className="text-sm text-slate-600 font-medium">Cheksiz mashinalar</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 border border-slate-100">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <p className="text-sm text-slate-600 font-medium">Hisobotlar</p>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-slate-400">
        Telegram: <span className="text-indigo-500 font-semibold">@avtojon_support</span>
      </p>
    </div>
    {showModal && (
      <UpgradeModal
        onClose={() => setShowModal(false)}
        canClose={false}
      />
    )}
  </div>
))

const ProFeature = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
      <Icon size={20} className="text-indigo-600" />
    </div>
    <span className="text-slate-700 font-medium flex-1">{text}</span>
    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
      <Check size={14} className="text-emerald-600" />
    </div>
  </div>
)

const ProInput = memo(({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-base bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
    />
  </div>
))

const ProSelect = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-base bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))
