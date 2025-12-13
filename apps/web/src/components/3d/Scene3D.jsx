import { Suspense, useMemo, useEffect, useState, lazy, Component } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, PerspectiveCamera, Stars, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'

// Error Boundary for 3D Scene
class Scene3DErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Scene Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/30 via-transparent to-indigo-900/20" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
        </div>
      )
    }
    return this.props.children
  }
}

// Lazy load heavy components
const FloatingTruck = lazy(() => import('./FloatingTruck'))
const ParticleField = lazy(() => import('./ParticleField'))
const GlowingSphere = lazy(() => import('./GlowingSphere'))
const FloatingShapes = lazy(() => import('./FloatingShapes'))

// Performance detection
const getDevicePerformance = () => {
  if (typeof window === 'undefined') return 'high'
  
  const isMobile = window.innerWidth < 768
  const isSmallMobile = window.innerWidth < 400
  const isLowEnd = navigator.hardwareConcurrency <= 4
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4
  
  if (hasReducedMotion) return 'minimal'
  if (isSmallMobile) return 'minimal'
  if (isMobile || isLowEnd || isLowMemory) return 'low'
  return 'high'
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#8b5cf6" />
    </>
  )
}

function HeroScene({ performance }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  const config = useMemo(() => ({
    particles: performance === 'high' ? 80 : performance === 'low' ? 25 : 10,
    shapes: performance === 'high' ? 8 : performance === 'low' ? 3 : 0,
    stars: performance === 'high' ? 1500 : performance === 'low' ? 600 : 300,
    showSpheres: performance !== 'minimal',
    spherePos1: isMobile ? [-3, 1.5, -5] : [-5, 2, -6],
    spherePos2: isMobile ? [3, -0.5, -6] : [5, -1, -8],
    sphereSize1: isMobile ? 0.9 : 1.2,
    sphereSize2: isMobile ? 1.1 : 1.5
  }), [performance, isMobile])

  return (
    <>
      <Lights />
      <Stars 
        radius={isMobile ? 60 : 80} 
        depth={isMobile ? 30 : 40} 
        count={config.stars} 
        factor={isMobile ? 2.5 : 3} 
        saturation={0} 
        fade 
        speed={0.3}
      />
      <Suspense fallback={null}>
        <ParticleField count={config.particles} />
        {config.shapes > 0 && <FloatingShapes count={config.shapes} />}
        {config.showSpheres && (
          <>
            <GlowingSphere position={config.spherePos1} color="#8b5cf6" size={config.sphereSize1} />
            <GlowingSphere position={config.spherePos2} color="#6366f1" size={config.sphereSize2} />
          </>
        )}
      </Suspense>
      <Environment preset="night" />
    </>
  )
}

function AuthScene({ performance }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  const config = useMemo(() => ({
    particles: performance === 'high' ? 30 : performance === 'low' ? 15 : 8,
    stars: performance === 'high' ? 800 : performance === 'low' ? 400 : 200,
    sphereSize1: isMobile ? 1.0 : 1.5,
    sphereSize2: isMobile ? 1.2 : 1.8,
    spherePos1: isMobile ? [-3, 0.5, -5] : [-4, 1, -6],
    spherePos2: isMobile ? [3, -0.5, -6] : [4, -1, -8]
  }), [performance, isMobile])

  return (
    <>
      <Lights />
      <Stars 
        radius={isMobile ? 60 : 80} 
        depth={isMobile ? 30 : 40} 
        count={config.stars} 
        factor={isMobile ? 2 : 3} 
        saturation={0} 
        fade 
        speed={0.2}
      />
      <Suspense fallback={null}>
        <ParticleField count={config.particles} />
        <GlowingSphere position={config.spherePos1} color="#8b5cf6" size={config.sphereSize1} />
        <GlowingSphere position={config.spherePos2} color="#6366f1" size={config.sphereSize2} />
      </Suspense>
      <Environment preset="night" />
    </>
  )
}

function MinimalScene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <Stars radius={60} depth={30} count={300} factor={2} saturation={0} fade speed={0.1} />
    </>
  )
}

function Scene3DInner({ variant = 'hero' }) {
  const [performance, setPerformance] = useState('high')
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    setPerformance(getDevicePerformance())
    
    const handleVisibility = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  if (performance === 'minimal' && variant !== 'minimal') {
    return (
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/30 via-transparent to-indigo-900/20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>
    )
  }

  const SceneContent = useMemo(() => {
    switch (variant) {
      case 'hero': return () => <HeroScene performance={performance} />
      case 'auth': return () => <AuthScene performance={performance} />
      case 'minimal': return () => <MinimalScene />
      default: return () => <HeroScene performance={performance} />
    }
  }, [variant, performance])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        dpr={performance === 'high' ? [1, 1.5] : [1, 1]}
        gl={{ 
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        style={{ background: 'transparent' }}
        performance={{ min: 0.3 }}
        frameloop={isVisible ? 'always' : 'never'}
      >
        <PerspectiveCamera makeDefault position={[0, 0, isMobile ? 10 : 8]} fov={isMobile ? 45 : 50} />
        
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        <fog attach="fog" args={['#0a0a1a', 15, 40]} />
        
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
        
        {variant !== 'minimal' && (
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.1}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
            enableDamping
            dampingFactor={0.01}
          />
        )}
      </Canvas>
    </div>
  )
}

export default function Scene3D(props) {
  return (
    <Scene3DErrorBoundary>
      <Scene3DInner {...props} />
    </Scene3DErrorBoundary>
  )
}
