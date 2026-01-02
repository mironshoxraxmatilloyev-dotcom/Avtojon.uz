import { LogOut, Sparkles } from 'lucide-react'
import { useTranslation } from '../../store/langStore'

export default function DriverHeader({ user, onLogout }) {
  const { lang, setLang } = useTranslation()

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 sm:px-4 py-3">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src="/main_logo.jpg" alt="Avtojon" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-white font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span>avto</span><span className="text-amber-400">JON</span> <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            </h1>
            <p className="text-slate-400 text-[10px] sm:text-xs truncate">{user?.fullName || 'Haydovchi'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Til tanlash - kompakt */}
          <div className="flex items-center bg-white/10 rounded-md p-0.5">
            <button
              onClick={() => setLang('uz')}
              className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-medium rounded transition-all ${
                lang === 'uz' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              UZ
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-medium rounded transition-all ${
                lang === 'ru' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ЎЗ
            </button>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  )
}
