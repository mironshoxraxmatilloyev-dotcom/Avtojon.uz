import { Plus, Calendar, ArrowUpRight, Users, Activity, User, Truck, Mic } from 'lucide-react'

export default function DriversHeader({ user, drivers, vehicles, onAddDriver, onVoiceFlight }) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

  const stats = [
    { label: 'Jami haydovchilar', value: drivers.length, icon: Users, color: 'from-blue-400 to-blue-600' },
    { label: 'Marshrutda', value: drivers.filter(d => d.status === 'busy').length, icon: Activity, color: 'from-orange-400 to-orange-600' },
    { label: "Bo'sh haydovchilar", value: drivers.filter(d => d.status === 'free').length, icon: User, color: 'from-green-400 to-green-600' },
    { label: 'Mashinalar', value: vehicles.length, icon: Truck, color: 'from-purple-400 to-purple-600' },
  ]

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl lg:rounded-3xl">
      <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-24 sm:-mr-32 md:-mr-48 -mt-24 sm:-mt-32 md:-mt-48" />
      <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 sm:-ml-24 md:-ml-32 -mb-16 sm:-mb-24 md:-mb-32" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs sm:text-sm mb-1 sm:mb-2">
            <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
            <span>{(() => {
              const date = new Date()
              const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
              const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
              return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}`
            })()}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
            {getGreeting()}, {user?.companyName || user?.fullName || 'Foydalanuvchi'}!
          </h1>
          <p className="text-blue-200 text-sm sm:text-base">Haydovchilarni boshqaring va kuzating</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          {/* Ovoz bilan reys ochish */}
          <button 
            onClick={onVoiceFlight} 
            className="group px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-violet-500/25 text-sm sm:text-base"
          >
            <Mic size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Ovoz bilan</span>
          </button>
          {/* Yangi haydovchi */}
          <button 
            onClick={onAddDriver} 
            className="group px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-slate-900 rounded-lg sm:rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg text-sm sm:text-base"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Yangi haydovchi</span>
            <span className="sm:hidden">Qo'shish</span>
            <ArrowUpRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform hidden sm:block" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
        {stats.map((item, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                <item.icon size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{item.value}</p>
                <p className="text-blue-200 text-[10px] sm:text-xs">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
