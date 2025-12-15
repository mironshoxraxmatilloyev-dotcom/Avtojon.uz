// 🎯 Error State Components
import { WifiOff, RefreshCw, AlertTriangle, ServerCrash, Lock, FileQuestion } from 'lucide-react'

// Network error
export function NetworkError({ onRetry, message }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Internet aloqasi yo'q</h3>
        <p className="text-gray-500 mb-6">
          {message || "Tarmoq bilan bog'lanishda muammo yuz berdi. Internet aloqangizni tekshiring va qaytadan urinib ko'ring."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={18} />
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  )
}

// Server error
export function ServerError({ onRetry, message }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ServerCrash className="w-10 h-10 text-orange-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Serverda xatolik</h3>
        <p className="text-gray-500 mb-6">
          {message || "Serverda vaqtinchalik xatolik yuz berdi. Iltimos, biroz kutib qaytadan urinib ko'ring."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
          >
            <RefreshCw size={18} />
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  )
}

// Auth error
export function AuthError({ onLogin }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Sessiya tugadi</h3>
        <p className="text-gray-500 mb-6">
          Xavfsizlik maqsadida sessiyangiz tugadi. Iltimos, qaytadan tizimga kiring.
        </p>
        {onLogin && (
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Tizimga kirish
          </button>
        )}
      </div>
    </div>
  )
}

// Not found error
export function NotFoundError({ title, message, onBack }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title || "Ma'lumot topilmadi"}</h3>
        <p className="text-gray-500 mb-6">
          {message || "Siz qidirayotgan ma'lumot topilmadi yoki o'chirilgan bo'lishi mumkin."}
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
          >
            Orqaga qaytish
          </button>
        )}
      </div>
    </div>
  )
}

// Generic error
export function GenericError({ title, message, onRetry, icon: Icon = AlertTriangle }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title || 'Xatolik yuz berdi'}</h3>
        <p className="text-gray-500 mb-6">
          {message || "Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={18} />
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  )
}

// Inline error message
export function InlineError({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-700 text-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-600 hover:text-red-700 p-1"
        >
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  )
}

export default GenericError
