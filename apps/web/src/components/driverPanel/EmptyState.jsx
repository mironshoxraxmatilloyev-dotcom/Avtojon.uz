import { Truck, Bell } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Truck size={32} className="text-blue-500" />
      </div>
      <h3 className="text-slate-800 font-semibold text-lg mb-2">Reys yo'q</h3>
      <p className="text-slate-500 text-sm mb-4">
        Hozirda sizga biriktirilgan reys yo'q
      </p>
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
        <Bell size={12} />
        Yangi reys tayinlanganda xabar olasiz
      </div>
    </div>
  )
}
