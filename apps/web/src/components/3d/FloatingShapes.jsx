import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'

// 🚀 Optimized Shape - Float o'chirildi (og'ir)
const Shape = memo(function Shape({ position, type, color, size }) {
  const ref = useRef()
  const frame = useRef(0)
  const initialRot = useMemo(() => Math.random() * Math.PI, [])

  useFrame((state) => {
    frame.current++
    // Har 8-frame da yangilash
    if (frame.current % 8 !== 0) return
    if (ref.current) {
      ref.current.rotation.x = initialRot + state.clock.elapsedTime * 0.05
      ref.current.rotation.y = initialRot + state.clock.elapsedTime * 0.03
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[size, 0]} /> {/* Faqat bitta geometry turi */}
      <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
    </mesh>
  )
})

// 🚀 Optimized FloatingShapes
export default memo(function FloatingShapes({ count = 4 }) {
  const shapes = useMemo(() => {
    const colors = ['#8b5cf6', '#6366f1', '#a78bfa']
    return Array.from({ length: Math.min(count, 6) }, (_, i) => ({ // Max 6 ta
      id: i,
      position: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 10, -5 - Math.random() * 8],
      type: i % 3,
      color: colors[i % colors.length],
      size: 0.15 + Math.random() * 0.2
    }))
  }, [count])

  return <>{shapes.map(s => <Shape key={s.id} {...s} />)}</>
})
