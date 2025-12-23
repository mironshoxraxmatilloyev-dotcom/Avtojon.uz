import { Users, Truck, Route, Key, BarChart3, ChevronRight, Zap, Sparkles, TrendingUp, Car } from "lucide-react"

export default function DashboardTab({ stats, setActiveTab }) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 lg:p-10">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Avtojon.uz</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">Xush kelibsiz! <Sparkles className="w-7 h-7 text-amber-300" /></h1>
            </div>
          </div>
          <p className="text-white/80 text-base lg:text-lg mb-6 max-w-2xl">Bugun tizimda <span className="font-bold text-white">{stats?.businessmen?.total || 0}</span> ta biznesmen va <span className="font-bold text-white">{stats?.drivers?.total || 0}</span> ta shofyor faoliyat yuritmoqda.</p>
          <div className="flex flex-wrap gap-4">
            <div className="px-5 py-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
              <span className="text-white/70 text-sm block mb-1">Faol reyslar</span>
              <p className="text-white font-bold text-2xl lg:text-3xl">{stats?.flights?.active || 0}</p>
            </div>
            <div className="px-5 py-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
              <span className="text-white/70 text-sm block mb-1">Jami reyslar</span>
              <p className="text-white font-bold text-2xl lg:text-3xl">{stats?.flights?.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <button onClick={() => setActiveTab("businessmen")} className="group bg-slate-800/40 hover:bg-slate-800/60 rounded-2xl p-6 lg:p-8 text-left border border-white/5 hover:border-white/10 transition-all">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform"><Key className="w-7 h-7 text-white" /></div>
          <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Parollar</h3>
          <p className="text-sm lg:text-base text-slate-400 mb-4">Biznesmenlar parollarini boshqaring</p>
          <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors"><span className="text-sm font-medium">Ochish</span><ChevronRight className="w-5 h-5" /></div>
        </button>
        <button onClick={() => setActiveTab("stats")} className="group bg-slate-800/40 hover:bg-slate-800/60 rounded-2xl p-6 lg:p-8 text-left border border-white/5 hover:border-white/10 transition-all">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform"><BarChart3 className="w-7 h-7 text-white" /></div>
          <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Statistika</h3>
          <p className="text-sm lg:text-base text-slate-400 mb-4">Batafsil grafiklar va hisobotlar</p>
          <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors"><span className="text-sm font-medium">Ochish</span><ChevronRight className="w-5 h-5" /></div>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Route} value={stats?.flights?.total || 0} label="Jami reyslar" trend={`${stats?.flights?.active || 0} faol`} trendUp={true} gradient="from-violet-500 to-purple-500" onClick={() => setActiveTab("stats")} />
        <StatCard icon={Users} value={stats?.businessmen?.total || 0} label="Biznesmenlar" trend={`${stats?.businessmen?.active || 0} faol`} trendUp={true} gradient="from-blue-500 to-cyan-500" onClick={() => setActiveTab("businessmen")} />
        <StatCard icon={Truck} value={stats?.drivers?.total || 0} label="Shofyorlar" trend={`${stats?.drivers?.busy || 0} band`} trendUp={false} gradient="from-pink-500 to-rose-500" onClick={() => setActiveTab("drivers")} />
        <StatCard icon={Car} value={stats?.vehicles?.total || 0} label="Mashinalar" trend="Barcha faol" trendUp={true} gradient="from-indigo-500 to-violet-500" onClick={() => setActiveTab("vehicles")} />
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />Songgi faoliyat</h3>
          <span className="text-sm text-slate-500">Bugun</span>
        </div>
        <div className="space-y-3">
          <ActivityItem icon={Users} color="violet" title="Yangi biznesmen qoshildi" time="5 daqiqa oldin" />
          <ActivityItem icon={Truck} color="blue" title="Shofyor holati yangilandi" time="1 soat oldin" />
          <ActivityItem icon={Route} color="emerald" title="Yangi reys yaratildi" time="3 soat oldin" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, trend, trendUp, gradient, onClick }) {
  return (
    <button onClick={onClick} className="group bg-slate-800/40 hover:bg-slate-800/60 rounded-2xl p-5 text-left border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><Icon className="w-5 h-5 text-white" /></div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trendUp ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}><TrendingUp className={`w-3 h-3 ${!trendUp && "rotate-180"}`} />{trend}</div>
      </div>
      <p className="text-3xl lg:text-4xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </button>
  )
}

function ActivityItem({ icon: Icon, color, title, time }) {
  const colors = { violet: "bg-violet-500/10 text-violet-400", blue: "bg-blue-500/10 text-blue-400", emerald: "bg-emerald-500/10 text-emerald-400" }
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors">
      <div className={`w-11 h-11 ${colors[color]} rounded-xl flex items-center justify-center shrink-0`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-base text-white font-medium truncate">{title}</p>
        <p className="text-sm text-slate-500">{time}</p>
      </div>
    </div>
  )
}
