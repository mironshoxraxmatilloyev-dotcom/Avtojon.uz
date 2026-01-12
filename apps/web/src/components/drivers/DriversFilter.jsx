import { memo } from 'react'
import { Search } from 'lucide-react'

// 🚀 Drivers Search & Filter
export const DriversFilter = memo(function DriversFilter({ 
  searchQuery, 
  onSearchChange, 
  filterStatus, 
  onFilterChange 
}) {
  const filters = [
    { value: 'all', label: 'Barchasi' },
    { value: 'free', label: "Bo'sh" },
    { value: 'busy', label: 'Marshrutda' }
  ]

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Ism yoki telefon orqali qidirish..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>
      
      {/* Filter Buttons */}
      <div className="flex gap-2">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={`px-4 py-3 rounded-xl font-medium transition ${
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
})

export default DriversFilter
