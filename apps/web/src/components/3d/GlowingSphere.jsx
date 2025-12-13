import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'

export default function GlowingSphere({ position = [0, 0, 0], color = '#8b5cf6', size = 1 }) {
  const meshRef = useRef()
  const frame = useRef(0)

  useFrame((state) => {
    frame.current++
    if (frame.current % 4 !== 0) return
    
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.05
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.07
    }
  })

  return (
    <Sphere ref={meshRef} args={[size, 16, 16]} position={position}>
      <MeshDistortMaterial
        color={color}
        distort={0.2}
        speed={0.8}
        roughness={0.5}
        metalness={0.4}
        emissive={color}
        emissiveIntensity={0.1}
        transparent
        opacity={0.5}
      />
    </Sphere>
  )
}
