import { LogOut, Truck, Sparkles, Zap } from 'lucide-react'

export default function DriverHeader({ user, onLogout }) {
  return (
    <header className="relative z-20 px-3 sm:px-4 pt-4 sm:pt-5 pb-2">
      <div className="max-w-lg mx-auto">
        <div className="relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 border border-slate-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl sm:rounded-2xl blur-md opacity-40"></div>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl">
                  <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                  <Zap size={10} className="sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  Avtojon <Sparkles className="w-4 h-4 text-amber-500" />
                </h1>
                <p className="text-sm text-slate-500 truncate max-w-[120px] sm:max-w-[160px]">
                  {user?.fullName || 'Haydovchi'}
                </p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="p-2.5 sm:p-3 bg-red-50 hover:bg-red-100 rounded-xl sm:rounded-2xl border border-red-200 transition-all hover:scale-105 active:scale-95"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
