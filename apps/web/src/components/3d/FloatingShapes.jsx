import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'

function Shape({ position, type, color, size, speed }) {
  const ref = useRef()
  const frame = useRef(0)
  const rot = useMemo(() => ({ x: Math.random() * Math.PI, y: Math.random() * Math.PI }), [])

  useFrame((state) => {
    frame.current++
    if (frame.current % 4 !== 0) return
    if (ref.current) {
      ref.current.rotation.x = rot.x + state.clock.elapsedTime * speed * 0.2
      ref.current.rotation.y = rot.y + state.clock.elapsedTime * speed * 0.15
    }
  })

  const geo = useMemo(() => {
    switch (type) {
      case 0: return <octahedronGeometry args={[size, 0]} />
      case 1: return <icosahedronGeometry args={[size, 0]} />
      case 2: return <tetrahedronGeometry args={[size, 0]} />
      default: return <dodecahedronGeometry args={[size, 0]} />
    }
  }, [type, size])

  return (
    <Float speed={speed * 0.6} rotationIntensity={0.2} floatIntensity={0.2}>
      <mesh ref={ref} position={position}>
        {geo}
        <meshBasicMaterial color={color} transparent opacity={0.4} wireframe={type % 2 === 0} />
      </mesh>
    </Float>
  )
}

export default function FloatingShapes({ count = 6 }) {
  const shapes = useMemo(() => {
    const colors = ['#8b5cf6', '#6366f1', '#a78bfa', '#818cf8']
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12, -5 - Math.random() * 10],
      type: i % 4,
      color: colors[i % colors.length],
      size: 0.12 + Math.random() * 0.25,
      speed: 0.3 + Math.random() * 0.5
    }))
  }, [count])

  return <>{shapes.map(s => <Shape key={s.id} {...s} />)}</>
}
