import { LogOut, Sparkles } from 'lucide-react'

export default function DriverHeader({ user, onLogout }) {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Avtojon" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <h1 className="text-white font-semibold flex items-center gap-1.5">
              Avtojon <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h1>
            <p className="text-slate-400 text-xs">{user?.fullName || 'Haydovchi'}</p>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
