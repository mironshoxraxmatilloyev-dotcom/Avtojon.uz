import { memo } from 'react'

// 🎯 CSS Fallback - 3D o'rniga CSS animatsiyalar
const CSSFallback = memo(() => (
  <div className="absolute inset-0 z-0">
    <div className="absolute inset-0 bg-gradient-to-b from-violet-900/30 via-transparent to-indigo-900/20" />
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
    {/* Floating particles - CSS */}
    <div className="absolute top-20 left-20 w-2 h-2 bg-violet-400/40 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
    <div className="absolute top-40 right-32 w-3 h-3 bg-indigo-400/30 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
    <div className="absolute bottom-32 left-40 w-2 h-2 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
    <div className="absolute top-60 left-1/3 w-1.5 h-1.5 bg-violet-300/50 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
    <div className="absolute bottom-40 right-1/4 w-2 h-2 bg-indigo-300/40 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.7s' }} />
  </div>
))



// 🚀 Scene3D - Faqat CSS Fallback (3D o'chirilgan - versiya muammosi tufayli)
// Three.js va @react-three/fiber versiyalari mos kelmayapti
// CSS animatsiyalar yetarli va tezroq ishlaydi
export default function Scene3D() {
  return <CSSFallback />
}
