import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'

// 🚀 Optimized Glowing Sphere - MeshDistortMaterial o'chirildi (og'ir)
export default memo(function GlowingSphere({ position = [0, 0, 0], color = '#8b5cf6', size = 1 }) {
  const meshRef = useRef()
  const frame = useRef(0)

  useFrame((state) => {
    frame.current++
    // Har 6-frame da yangilash
    if (frame.current % 6 !== 0) return
    
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.03
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.04
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 12, 12]} /> {/* Kamroq segment */}
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.3}
      />
    </mesh>
  )
})
