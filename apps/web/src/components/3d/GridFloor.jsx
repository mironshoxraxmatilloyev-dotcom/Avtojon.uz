import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function GridFloor({ size = 50, divisions = 30 }) {
  const gridRef = useRef()
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.5
    }
  })

  return (
    <group ref={gridRef} position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper 
        args={[size, divisions, '#8b5cf6', '#3730a3']} 
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial 
          color="#8b5cf6" 
          transparent 
          opacity={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
