import { Banknote, Download, Calculator } from 'lucide-react'

export function SalaryHeader({ onOpenModal }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Banknote className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-sm border border-white/20">Moliya boshqaruvi</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Maoshlar markazi</h1>
          <p className="text-blue-200 max-w-md">Shofyorlar maoshini hisoblang, tasdiqlang va tolovlarni kuzating</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="px-5 py-3 bg-white/10 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20">
            <Download size={18} /> Export
          </button>
          <button onClick={onOpenModal} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-xl shadow-black/20">
            <Calculator size={18} /> Maosh hisoblash
          </button>
        </div>
      </div>
    </div>
  )
}
