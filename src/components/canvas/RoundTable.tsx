import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

export function RoundTable() {
  const indicatorRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (indicatorRef.current) {
      indicatorRef.current.rotation.y = state.clock.elapsedTime * 0.15
    }
  })

  return (
    <group>
      {/* Table base/pedestal */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.7, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Table column */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.15, 0.3, 0.6, 24]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Main table surface */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.08, 64]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Table top - polished surface */}
      <mesh position={[0, 0.145, 0]}>
        <cylinderGeometry args={[2.35, 2.35, 0.01, 64]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Subtle edge trim */}
      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.38, 0.015, 16, 100]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Center logo/indicator area */}
      <group ref={indicatorRef} position={[0, 0.16, 0]}>
        {/* Outer ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.01, 16, 48]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Inner ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.008, 16, 48]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Center dot */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.01, 24]} />
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#60a5fa"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Floor - subtle gradient */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Subtle grid on floor */}
      <gridHelper
        args={[24, 48, '#1e293b', '#1e293b']}
        position={[0, -0.69, 0]}
      />
    </group>
  )
}

