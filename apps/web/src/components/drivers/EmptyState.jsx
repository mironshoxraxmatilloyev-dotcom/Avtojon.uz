import { Users } from 'lucide-react'

export default function EmptyState({ searchQuery, onAddDriver }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Users size={40} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Haydovchilar topilmadi</h3>
      <p className="text-gray-500 mb-6">
        {searchQuery ? 'Qidiruv natijasi bosh' : 'Hozircha haydovchilar yoq'}
      </p>
      <button 
        onClick={onAddDriver} 
        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
      >
        Birinchi haydovchini qo'shing
      </button>
    </div>
  )
}
