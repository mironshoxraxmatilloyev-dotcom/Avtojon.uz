import { LayoutDashboard, BarChart3, Users, UserCircle, Truck, Car, LogOut, X, Menu, Zap, MessageSquare } from "lucide-react"

const MENU_ITEMS = [
  { id: "dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { id: "stats", label: "Statistika", icon: BarChart3 },
  { id: "sms", label: "SMS Gateway", icon: MessageSquare },
]

const MANAGEMENT_ITEMS = [
  { id: "businessmen", label: "Biznesmenlar", icon: Users },
  { id: "users", label: "Individual", icon: UserCircle },
  { id: "drivers", label: "Haydovchilar", icon: Truck },
  { id: "vehicles", label: "Mashinalar", icon: Car },
]

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, onLogout }) {
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ height: "100vh", maxHeight: "100vh", overflow: "hidden" }}
      >
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white"><span>avto</span><span className="text-amber-400">JON</span>.uz</h1>
                <p className="text-[10px] text-violet-400">Super Admin</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-hidden">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase">Asosiy</p>
          <div className="space-y-1 mb-4">
            {MENU_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${activeTab === item.id ? "bg-violet-500/15 text-violet-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                <item.icon size={18} /><span>{item.label}</span>
              </button>
            ))}
          </div>
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase">Boshqaruv</p>
          <div className="space-y-1">
            {MANAGEMENT_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${activeTab === item.id ? "bg-violet-500/15 text-violet-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                <item.icon size={18} /><span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-emerald-500/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Tizim faol</span>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm">
            <LogOut size={18} /><span>Chiqish</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileHeader({ setSidebarOpen, onLogout }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white"><Menu size={22} /></button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-white"><span>avto</span><span className="text-amber-400">JON</span>.uz</span>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-400"><LogOut size={18} /></button>
      </div>
    </header>
  )
}
