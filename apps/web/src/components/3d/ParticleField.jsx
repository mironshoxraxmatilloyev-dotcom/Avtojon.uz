import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField({ count = 50 }) {
  const mesh = useRef()
  const frameSkip = useRef(0)

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        time: Math.random() * 100,
        factor: 15 + Math.random() * 60,
        speed: 0.002 + Math.random() * 0.003,
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20
      })
    }
    return temp
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!mesh.current) return
    
    // Skip every 3rd frame for performance
    frameSkip.current++
    if (frameSkip.current % 3 !== 0) return
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.time += p.speed
      
      dummy.position.set(
        p.x + Math.sin(p.time * 0.5) * 2,
        p.y + Math.cos(p.time * 0.5) * 2,
        p.z + Math.sin(p.time * 0.3) * 1.5
      )
      dummy.scale.setScalar(0.3 + Math.abs(Math.sin(p.time)) * 0.3)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled>
      <dodecahedronGeometry args={[0.04, 0]} />
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.35} />
    </instancedMesh>
  )
}
