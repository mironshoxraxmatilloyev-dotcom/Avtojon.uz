import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

// Mobile-friendly toast
export const showToast = {
  success: (message, options = {}) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-[90vw] max-w-sm bg-white shadow-xl rounded-xl pointer-events-auto flex items-center gap-3 p-3 ring-1 ring-black/5`}>
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm text-gray-700 flex-1">{message}</p>
      </div>
    ), { duration: options.duration || 3000, ...options })
  },

  error: (message, options = {}) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-[90vw] max-w-sm bg-white shadow-xl rounded-xl pointer-events-auto flex items-center gap-3 p-3 ring-1 ring-black/5`}>
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <XCircle className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm text-gray-700 flex-1">{message}</p>
      </div>
    ), { duration: options.duration || 4000, ...options })
  },

  warning: (message, options = {}) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-[90vw] max-w-sm bg-white shadow-xl rounded-xl pointer-events-auto flex items-center gap-3 p-3 ring-1 ring-black/5`}>
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm text-gray-700 flex-1">{message}</p>
      </div>
    ), { duration: options.duration || 3500, ...options })
  },

  info: (message, options = {}) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-[90vw] max-w-sm bg-white shadow-xl rounded-xl pointer-events-auto flex items-center gap-3 p-3 ring-1 ring-black/5`}>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm text-gray-700 flex-1">{message}</p>
      </div>
    ), { duration: options.duration || 3000, ...options })
  },

  loading: (message, options = {}) => {
    return toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-[90vw] max-w-sm bg-white shadow-xl rounded-xl pointer-events-auto flex items-center gap-3 p-3 ring-1 ring-black/5`}>
        <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
        <p className="text-sm text-gray-700 flex-1">{message}</p>
      </div>
    ), { duration: Infinity, ...options })
  },

  dismiss: toast.dismiss
}

export default showToast
