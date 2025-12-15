import { useRef, useEffect } from 'react'

// 3D Tilt card effect
export function TiltCard({ children, className = '', intensity = 10 }) {
  const cardRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * intensity
      const rotateY = ((centerX - x) / centerX) * intensity

      card.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    }

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [intensity])

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}

// Hover lift card - TEZLASHTIRILGAN
export function HoverCard({ children, className = '' }) {
  return (
    <div className={`transition-all duration-150 hover:-translate-y-1 hover:shadow-lg ${className}`}>
      {children}
    </div>
  )
}

// Glow card on hover - TEZLASHTIRILGAN
export function GlowCard({ children, className = '', glowColor = 'violet' }) {
  const glowClasses = {
    violet: 'hover:shadow-violet-500/20',
    blue: 'hover:shadow-blue-500/20',
    green: 'hover:shadow-emerald-500/20',
    amber: 'hover:shadow-amber-500/20',
    red: 'hover:shadow-red-500/20'
  }

  return (
    <div className={`transition-all duration-150 hover:shadow-xl ${glowClasses[glowColor]} ${className}`}>
      {children}
    </div>
  )
}

// Animated counter
export function AnimatedNumber({ value, duration = 1000, className = '' }) {
  const ref = useRef(null)
  const startValue = useRef(0)
  const startTime = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(startValue.current + (value - startValue.current) * easeOutQuart)
      
      element.textContent = current.toLocaleString()

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        element.textContent = value.toLocaleString()
      }
    }

    startTime.current = null
    requestAnimationFrame(animate)

    return () => {
      startValue.current = value
    }
  }, [value, duration])

  return <span ref={ref} className={className}>0</span>
}

// Pulse dot indicator
export function PulseDot({ color = 'green', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const colorClasses = {
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    yellow: 'bg-amber-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500'
  }

  return (
    <span className="relative flex">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`}></span>
      <span className={`relative inline-flex rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}></span>
    </span>
  )
}

// Skeleton loader
export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32 rounded-xl',
    button: 'h-10 w-24 rounded-lg'
  }

  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${variants[variant]} ${className}`} />
  )
}

// Fade in on scroll - TEZLASHTIRILGAN
export function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('opacity-100', 'translate-y-0')
              entry.target.classList.remove('opacity-0', 'translate-y-2')
            }, delay)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-2 transition-all duration-200 ease-out ${className}`}
    >
      {children}
    </div>
  )
}
