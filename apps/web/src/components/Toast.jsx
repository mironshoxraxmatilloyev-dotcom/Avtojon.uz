import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react'

// Custom toast funksiyalari
export const showToast = {
  success: (message, options = {}) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden`}
      >
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold text-gray-900">Muvaffaqiyat!</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="w-1 bg-gradient-to-b from-emerald-500 to-teal-600"></div>
      </div>
    ), { duration: options.duration || 4000, ...options })
  },

  error: (message, options = {}) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden`}
      >
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <XCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold text-gray-900">Xatolik!</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="w-1 bg-gradient-to-b from-red-500 to-rose-600"></div>
      </div>
    ), { duration: options.duration || 5000, ...options })
  },

  warning: (message, options = {}) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden`}
      >
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold text-gray-900">Diqqat!</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="w-1 bg-gradient-to-b from-amber-500 to-orange-600"></div>
      </div>
    ), { duration: options.duration || 4000, ...options })
  },

  info: (message, options = {}) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden`}
      >
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Info className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold text-gray-900">Ma'lumot</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="w-1 bg-gradient-to-b from-blue-500 to-indigo-600"></div>
      </div>
    ), { duration: options.duration || 4000, ...options })
  },

  loading: (message, options = {}) => {
    return toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden`}
      >
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold text-gray-900">Yuklanmoqda...</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
          </div>
        </div>
        <div className="w-1 bg-gradient-to-b from-violet-500 to-purple-600"></div>
      </div>
    ), { duration: Infinity, ...options })
  },

  // Promise uchun
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Yuklanmoqda...',
      success: messages.success || 'Muvaffaqiyat!',
      error: messages.error || 'Xatolik yuz berdi'
    }, {
      style: {
        minWidth: '280px',
        padding: '16px',
        borderRadius: '16px',
      },
      success: {
        icon: '✅',
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
        },
      },
      error: {
        icon: '❌',
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
        },
      },
    })
  },

  dismiss: toast.dismiss
}

export default showToast
