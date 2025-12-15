import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 🚀 Optimized Particle Field
export default memo(function ParticleField({ count = 30 }) {
  const mesh = useRef()
  const frameSkip = useRef(0)

  // 🎯 Particles - kamroq hisoblash
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        time: Math.random() * 100,
        speed: 0.001 + Math.random() * 0.002, // Sekinroq
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 15
      })
    }
    return temp
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!mesh.current) return
    
    // 🚀 Har 4-frame da yangilash - 60fps -> 15fps animatsiya
    frameSkip.current++
    if (frameSkip.current % 4 !== 0) return
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.time += p.speed
      
      // Soddalashtirilgan harakat
      dummy.position.set(
        p.x + Math.sin(p.time) * 1.5,
        p.y + Math.cos(p.time) * 1.5,
        p.z
      )
      dummy.scale.setScalar(0.4)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled>
      <sphereGeometry args={[0.03, 4, 4]} /> {/* Oddiy sphere - tezroq */}
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.4} />
    </instancedMesh>
  )
})
