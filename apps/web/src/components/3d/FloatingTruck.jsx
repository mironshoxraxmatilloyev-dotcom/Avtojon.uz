import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'

function TruckModel({ scale = 1 }) {
    const groupRef = useRef()
    const wheelsRef = useRef([])
    const frame = useRef(0)

    useFrame((state) => {
        frame.current++
        if (frame.current % 3 !== 0) return

        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.06
        }

        wheelsRef.current.forEach(w => w && (w.rotation.x += 0.015))
    })

    return (
        <group ref={groupRef} scale={scale}>
            {/* Body */}
            <RoundedBox args={[2.2, 1.3, 1.1]} radius={0.08} position={[0.3, 0.5, 0]}>
                <meshStandardMaterial color="#8b5cf6" metalness={0.2} roughness={0.5} emissive="#8b5cf6" emissiveIntensity={0.08} />
            </RoundedBox>

            {/* Cabin */}
            <RoundedBox args={[0.9, 1, 1]} radius={0.12} position={[-1.1, 0.35, 0]}>
                <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.4} emissive="#6366f1" emissiveIntensity={0.1} />
            </RoundedBox>

            {/* Windshield */}
            <RoundedBox args={[0.08, 0.5, 0.8]} radius={0.04} position={[-1.5, 0.5, 0]}>
                <meshBasicMaterial color="#a5b4fc" transparent opacity={0.4} />
            </RoundedBox>

            {/* Headlights */}
            <mesh position={[-1.55, 0.1, 0.3]}><sphereGeometry args={[0.08, 6, 6]} /><meshBasicMaterial color="#fef08a" /></mesh>
            <mesh position={[-1.55, 0.1, -0.3]}><sphereGeometry args={[0.08, 6, 6]} /><meshBasicMaterial color="#fef08a" /></mesh>

            {/* Wheels */}
            {[[-1.1, -0.3, 0.55], [-1.1, -0.3, -0.55], [0.7, -0.3, 0.55], [0.7, -0.3, -0.55]].map((pos, i) => (
                <mesh key={i} ref={el => wheelsRef.current[i] = el} position={pos} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.25, 0.25, 0.14, 12]} />
                    <meshStandardMaterial color="#1e1b4b" metalness={0.3} roughness={0.5} />
                </mesh>
            ))}

            {/* Chassis */}
            <RoundedBox args={[3.2, 0.1, 0.8]} radius={0.02} position={[-0.2, -0.15, 0]}>
                <meshStandardMaterial color="#18181b" metalness={0.5} roughness={0.4} />
            </RoundedBox>
        </group>
    )
}

export default function FloatingTruck() {
    return (
        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.05, 0.05]}>
            <TruckModel scale={0.75} />
        </Float>
    )
}
