import { useEffect, createContext, useContext, useCallback, useState } from 'react'
import { X, AlertTriangle, CheckCircle, XCircle, Info, Trash2, AlertCircle } from 'lucide-react'

// Alert Context
const AlertContext = createContext(null)

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }
  return context
}

// Alert Provider
export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)

  const showAlert = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { id, type, title, message }])
    
    if (duration > 0) {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const success = useCallback((title, message) => showAlert('success', title, message), [showAlert])
  const error = useCallback((title, message) => showAlert('error', title, message, 6000), [showAlert])
  const warning = useCallback((title, message) => showAlert('warning', title, message, 5000), [showAlert])
  const info = useCallback((title, message) => showAlert('info', title, message), [showAlert])

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...options,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        }
      })
    })
  }, [])

  return (
    <AlertContext.Provider value={{ success, error, warning, info, confirm, removeAlert }}>
      {children}
      <AlertContainer alerts={alerts} onRemove={removeAlert} />
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </AlertContext.Provider>
  )
}

// Alert Container - fixed position with inline styles for consistency
function AlertContainer({ alerts, onRemove }) {
  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      {alerts.map((alert) => (
        <AlertItem key={alert.id} {...alert} onRemove={() => onRemove(alert.id)} />
      ))}
    </div>
  )
}

// Single Alert Item with inline styles
function AlertItem({ type, title, message, onRemove }) {
  const handleRemove = () => {
    onRemove()
  }

  const config = {
    success: {
      icon: CheckCircle,
      bg: '#ecfdf5',
      border: '#a7f3d0',
      iconColor: '#10b981',
      titleColor: '#065f46',
      messageColor: '#047857'
    },
    error: {
      icon: XCircle,
      bg: '#fef2f2',
      border: '#fecaca',
      iconColor: '#ef4444',
      titleColor: '#991b1b',
      messageColor: '#b91c1c'
    },
    warning: {
      icon: AlertTriangle,
      bg: '#fffbeb',
      border: '#fde68a',
      iconColor: '#f59e0b',
      titleColor: '#92400e',
      messageColor: '#b45309'
    },
    info: {
      icon: Info,
      bg: '#eff6ff',
      border: '#bfdbfe',
      iconColor: '#3b82f6',
      titleColor: '#1e40af',
      messageColor: '#1d4ed8'
    }
  }

  const { icon: Icon, bg, border, iconColor, titleColor, messageColor } = config[type] || config.info

  return (
    <div
      style={{
        pointerEvents: 'auto',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        opacity: 1
      }}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        <Icon style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }} size={20} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ 
            fontWeight: 600, 
            color: titleColor, 
            margin: 0,
            fontSize: '15px',
            lineHeight: '1.4'
          }}>
            {title}
          </h4>
          {message && (
            <p style={{ 
              fontSize: '14px', 
              color: messageColor, 
              marginTop: '4px',
              marginBottom: 0,
              lineHeight: '1.5'
            }}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#6b7280'}
          onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

// Confirm Dialog with inline styles
function ConfirmDialog({ 
  title = "Tasdiqlash", 
  message = "Davom etishni xohlaysizmi?",
  confirmText = "Ha, davom etish",
  cancelText = "Bekor qilish",
  type = "danger",
  icon: CustomIcon,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleCancel = () => {
    onCancel()
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      confirmBg: '#dc2626',
      confirmHover: '#b91c1c'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      confirmBg: '#d97706',
      confirmHover: '#b45309'
    },
    info: {
      icon: AlertCircle,
      iconBg: '#dbeafe',
      iconColor: '#2563eb',
      confirmBg: '#2563eb',
      confirmHover: '#1d4ed8'
    }
  }

  const cfg = typeConfig[type] || typeConfig.danger
  const Icon = CustomIcon || cfg.icon

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}
      onClick={handleCancel}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '400px',
          width: '100%',
          padding: '24px'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          backgroundColor: cfg.iconBg,
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Icon style={{ color: cfg.iconColor }} size={28} />
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: '#111827', 
            marginBottom: '8px',
            marginTop: 0
          }}>
            {title}
          </h3>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: '15px',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: cfg.confirmBg,
              color: '#ffffff',
              borderRadius: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = cfg.confirmHover}
            onMouseLeave={(e) => e.target.style.backgroundColor = cfg.confirmBg}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Standalone Confirm Dialog
export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Ha",
  cancelText = "Yo'q",
  type = "danger"
}) {
  if (!isOpen) return null

  return (
    <ConfirmDialog
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      type={type}
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  )
}

export default AlertProvider
