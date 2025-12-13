// Beautiful loading spinners for dashboard

// Truck loading animation
export function TruckLoader({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Road */}
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="8 4">
          <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="0.5s" repeatCount="indefinite" />
        </line>
        
        {/* Truck body */}
        <g className="animate-bounce" style={{ animationDuration: '0.5s' }}>
          <rect x="25" y="45" width="40" height="25" rx="3" fill="#8b5cf6" />
          <rect x="10" y="50" width="20" height="20" rx="3" fill="#6366f1" />
          <rect x="5" y="55" width="8" height="12" rx="2" fill="#a5b4fc" opacity="0.6" />
          
          {/* Wheels */}
          <circle cx="22" cy="70" r="6" fill="#1e1b4b">
            <animateTransform attributeName="transform" type="rotate" from="0 22 70" to="360 22 70" dur="0.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="55" cy="70" r="6" fill="#1e1b4b">
            <animateTransform attributeName="transform" type="rotate" from="0 55 70" to="360 55 70" dur="0.3s" repeatCount="indefinite" />
          </circle>
          
          {/* Headlight */}
          <circle cx="8" cy="60" r="2" fill="#fef08a">
            <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  )
}

// Spinning circle loader
export function SpinnerLoader({ size = 'md', color = 'violet', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const colors = {
    violet: 'border-violet-500',
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500'
  }

  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className={`w-full h-full border-2 border-gray-200 dark:border-gray-700 ${colors[color]} border-t-transparent rounded-full animate-spin`} />
    </div>
  )
}

// Dots loader
export function DotsLoader({ color = 'violet', className = '' }) {
  const colorClasses = {
    violet: 'bg-violet-500',
    blue: 'bg-blue-500',
    white: 'bg-white',
    gray: 'bg-gray-500'
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${colorClasses[color]} animate-bounce`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

// Progress bar loader
export function ProgressLoader({ progress = 0, color = 'violet', className = '' }) {
  const colorClasses = {
    violet: 'bg-violet-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500'
  }

  return (
    <div className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
        style={{ width: `${progress}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
    </div>
  )
}

// Full page loader
export function PageLoader({ message = 'Yuklanmoqda...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <TruckLoader size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">{message}</p>
    </div>
  )
}

// Skeleton card loader
export function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-100 dark:bg-gray-800 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
