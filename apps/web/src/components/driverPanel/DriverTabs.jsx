import { Home, History } from 'lucide-react'
import { useTranslation } from '../../store/langStore'

export default function DriverTabs({ activeTab, onTabChange }) {
  const { t } = useTranslation()

  const TABS = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'history', label: t('tripHistory'), icon: History },
  ]

  return (
    <nav className="bg-white sticky top-0 z-10 px-4 py-2 border-b border-slate-100">
      <div className="flex bg-slate-100 rounded-lg p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
