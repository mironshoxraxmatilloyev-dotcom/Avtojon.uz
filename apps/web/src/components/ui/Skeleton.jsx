// 🎯 Skeleton Loading Components

// Base skeleton
export function Skeleton({ className = '', animate = true }) {
  return (
    <div 
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  )
}

// Text skeleton
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  )
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  }
  return <Skeleton className={`${sizes[size]} rounded-full ${className}`} />
}

// Card skeleton
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div>
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Stat card skeleton
export function SkeletonStatCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

// Table row skeleton
export function SkeletonTableRow({ cols = 4, className = '' }) {
  return (
    <tr className={className}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-slate-200 to-slate-100 rounded-3xl p-8">
        <Skeleton className="h-4 w-32 mb-2 bg-slate-300" />
        <Skeleton className="h-10 w-64 mb-2 bg-slate-300" />
        <Skeleton className="h-5 w-48 bg-slate-300" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// Drivers list skeleton
export function DriversListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-slate-200 to-slate-100 rounded-3xl p-8">
        <Skeleton className="h-4 w-32 mb-2 bg-slate-300" />
        <Skeleton className="h-10 w-64 mb-2 bg-slate-300" />
        <Skeleton className="h-5 w-48 bg-slate-300" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-24 rounded-xl" />
        <Skeleton className="h-12 w-24 rounded-xl" />
        <Skeleton className="h-12 w-24 rounded-xl" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

// Flight detail skeleton
export function FlightDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
            <Skeleton className="h-5 w-24 mb-3" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Driver detail skeleton
export function DriverDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button */}
      <Skeleton className="h-10 w-32 rounded-xl" />

      {/* Driver info card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-start gap-4">
          <Skeleton className="w-20 h-20 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <Skeleton className="w-10 h-10 rounded-xl mb-3" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Vehicle info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Trips list */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Skeleton


// Driver Home skeleton (shofyor paneli uchun - dark theme)
export function DriverHomeSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header skeleton */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/50 to-indigo-600/50 rounded-full animate-pulse"></div>
            <div>
              <div className="h-4 w-20 bg-white/20 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-24 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Tabs skeleton */}
        <nav className="bg-white sticky top-0 z-10 px-4 py-2 border-b border-slate-100">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <div className="flex-1 py-2 px-3 bg-white rounded-md shadow-sm">
              <div className="h-4 w-14 bg-slate-200 rounded animate-pulse mx-auto"></div>
            </div>
            <div className="flex-1 py-2 px-3">
              <div className="h-4 w-10 bg-slate-200 rounded animate-pulse mx-auto"></div>
            </div>
          </div>
        </nav>

        {/* Content skeleton */}
        <main className="p-4 pb-8">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Main card skeleton */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl animate-pulse mb-3"></div>
                  <div className="h-5 w-28 bg-slate-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-44 bg-slate-100 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-5 w-8 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-16 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-5 w-20 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-14 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent flights skeleton */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-10 bg-slate-100 rounded animate-pulse"></div>
              </div>
              <div className="divide-y divide-slate-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 w-36 bg-slate-200 rounded animate-pulse mb-1.5"></div>
                      <div className="h-3 w-28 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                    <div className="w-5 h-5 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
