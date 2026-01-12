import { useState, useEffect } from 'react'

// StatCard komponenti
export const StatCard = ({ icon: Icon, label, value, sub, color, className = '' }) => {
  const colors = {
    indigo: 'from-indigo-900/40 to-indigo-800/20 border-indigo-500/20',
    blue: 'from-blue-900/40 to-blue-800/20 border-blue-500/20',
    green: 'from-green-900/40 to-green-800/20 border-green-500/20',
    purple: 'from-purple-900/40 to-purple-800/20 border-purple-500/20',
  }
  const iconColors = {
    indigo: 'bg-indigo-600/30 text-indigo-400',
    blue: 'bg-blue-600/30 text-blue-400',
    green: 'bg-green-600/30 text-green-400',
    purple: 'bg-purple-600/30 text-purple-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 border transition-all ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 ${iconColors[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs">{sub}</div>}
    </div>
  )
}

// Animated Counter
export const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const end = parseInt(value) || 0
    if (start === end) return
    
    const incrementTime = duration / end
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start >= end) clearInterval(timer)
    }, Math.max(incrementTime, 10))
    
    return () => clearInterval(timer)
  }, [value, duration])
  
  return <span>{count}</span>
}

// GlassCard
export const GlassCard = ({ children, className = '', glow = '' }) => (
  <div className={`relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
    {glow && <div className={`absolute -top-10 -right-10 w-32 h-32 ${glow} rounded-full blur-3xl opacity-30 pointer-events-none`} />}
    <div className="relative z-10">{children}</div>
  </div>
)
