import { Target, History } from 'lucide-react'

export default function DriverTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', label: 'Asosiy', icon: Target },
    { id: 'history', label: 'Tarix', icon: History },
  ]

  return (
    <nav className="relative z-20 px-3 sm:px-4 py-3 sticky top-0">
      <div className="max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-1.5 sm:p-2 flex gap-1 shadow-lg shadow-slate-200/50 border border-slate-200">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button 
              key={id} 
              onClick={() => onTabChange(id)}
              className={`flex-1 py-3 sm:py-3.5 px-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === id 
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
