import { Truck } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="relative overflow-hidden bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 sm:p-10 text-center border border-white/10 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-transparent"></div>
      <div className="relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 border border-violet-500/20">
          <Truck size={40} className="sm:w-12 sm:h-12 text-violet-400" />
        </div>
        <h3 className="text-white font-bold text-xl sm:text-2xl mb-2 sm:mb-3">Reys yoq</h3>
        <p className="text-slate-400 text-sm sm:text-base max-w-xs mx-auto">
          Hozirda sizga biriktirilgan reys yoq. Yangi reys tayinlanganda xabar olasiz.
        </p>
      </div>
    </div>
  )
}
