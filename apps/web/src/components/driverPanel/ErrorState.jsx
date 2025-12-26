import { WifiOff, RefreshCw } from 'lucide-react'

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {error.type === 'network' ? 'Internet aloqasi yo\'q' : 'Xatolik yuz berdi'}
        </h3>
        <p className="text-gray-500 mb-6">{error.message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          Qayta urinish
        </button>
      </div>
    </div>
  )
}
