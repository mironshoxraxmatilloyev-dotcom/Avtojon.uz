import { Search } from 'lucide-react'

export default function DriversSearch({ searchQuery, setSearchQuery, filterStatus, setFilterStatus }) {
  const filters = [
    { value: 'all', label: 'Barchasi' },
    { value: 'free', label: "Bo'sh" },
    { value: 'busy', label: 'Marshrutda' }
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Qidirish..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base" 
        />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map(({ value, label }) => (
          <button 
            key={value} 
            onClick={() => setFilterStatus(value)} 
            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
              filterStatus === value 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
