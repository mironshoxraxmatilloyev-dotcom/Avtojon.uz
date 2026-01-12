import { useEffect, useState, memo } from 'react'

// Page wrapper with entrance animation - TEZLASHTIRILGAN
export const PageWrapper = memo(function PageWrapper({ children, className = '' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Darhol ko'rsatish
    setMounted(true)
  }, [])

  return (
    <div 
      className={`transition-all duration-150 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${className}`}
    >
      {children}
    </div>
  )
})

// Staggered list - TEZLASHTIRILGAN
export const StaggeredList = memo(function StaggeredList({ children, className = '', delay = 20 }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={className}>
      {Array.isArray(children) ? children.map((child, index) => (
        <div
          key={index}
          className={`transition-all duration-150 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          style={{ transitionDelay: `${index * delay}ms` }}
        >
          {child}
        </div>
      )) : children}
    </div>
  )
})

// Animated stat card - TEZLASHTIRILGAN (animatsiyasiz)
export const AnimatedStatCard = memo(function AnimatedStatCard({ 
  icon: Icon, 
  label, 
  value, 
  gradient = 'from-blue-500 to-blue-600',
  bgColor = 'bg-blue-50',
  onClick,
  delay = 0 
}) {
  return (
    <div 
      onClick={onClick}
      className={`stat-card ${bgColor} p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow duration-100 border border-transparent hover:border-gray-200`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`stat-icon w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="text-white" size={22} />
      </div>
      <p className="text-4xl font-bold text-gray-900 mb-1 tabular-nums">{value}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  )
})

// Animated table row
export const AnimatedTableRow = memo(function AnimatedTableRow({ children, onClick, delay = 0, className = '' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <tr 
      onClick={onClick}
      className={`table-row-hover cursor-pointer ${mounted ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        willChange: mounted ? 'auto' : 'opacity'
      }}
    >
      {children}
    </tr>
  )
})

// Animated card - TEZLASHTIRILGAN
export const AnimatedCard = memo(function AnimatedCard({ children, className = '', delay = 0, hover = true }) {
  return (
    <div 
      className={`${hover ? 'card-hover' : ''} transition-all duration-100 ease-out ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
})

// Animated button
export const AnimatedButton = memo(function AnimatedButton({ children, className = '', onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-press ${className}`}
    >
      {children}
    </button>
  )
})

// Empty state - TEZLASHTIRILGAN
export const EmptyState = memo(function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon size={40} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  )
})

// Loading skeleton
export const LoadingSkeleton = memo(function LoadingSkeleton({ type = 'card', count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (type === 'card') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {skeletons.map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl mb-4 skeleton-shimmer"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2 skeleton-shimmer"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4 skeleton-shimmer"></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/4 skeleton-shimmer"></div>
        </div>
        {skeletons.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-gray-200 rounded-xl skeleton-shimmer"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 skeleton-shimmer"></div>
              <div className="h-3 bg-gray-100 rounded w-1/4 skeleton-shimmer"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-20 skeleton-shimmer"></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl skeleton-shimmer"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 skeleton-shimmer"></div>
                <div className="h-3 bg-gray-100 rounded w-1/3 skeleton-shimmer"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
})
