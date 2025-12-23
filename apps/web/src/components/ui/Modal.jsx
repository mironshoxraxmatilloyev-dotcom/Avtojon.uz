import { memo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Optimized Modal Component with Portal
const Modal = memo(function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  icon: Icon,
  iconColor = 'from-blue-500 to-indigo-600',
  children,
  size = 'md',
  showCloseButton = true
}) {
  // ESC tugmasi bilan yopish
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[95vw] sm:max-w-4xl'
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full ${sizes[size]} bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl sm:rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-800 to-slate-800/95 backdrop-blur-xl px-4 sm:px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${iconColor} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-xs sm:text-sm text-slate-400">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
})

export default Modal
