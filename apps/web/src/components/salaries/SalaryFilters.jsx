import { Search } from 'lucide-react'

export function SalaryFilters({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, salaries }) {
  const filterOptions = [
    { value: 'all', label: 'Barchasi', count: salaries.length },
    { value: 'calculated', label: 'Hisoblangan', count: salaries.filter(s => s.status === 'calculated').length },
    { value: 'approved', label: 'Tasdiqlangan', count: salaries.filter(s => s.status === 'approved').length },
    { value: 'paid', label: "Tolangan", count: salaries.filter(s => s.status === 'paid').length }
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Shofyor nomini qidiring..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Status:</span>
          {filterOptions.map(item => (
            <button 
              key={item.value} 
              onClick={() => setStatusFilter(item.value)} 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                statusFilter === item.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === item.value ? 'bg-white/20' : 'bg-gray-200'}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
