import { useRef } from 'react'
import { Mesh, Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import type { Agent } from '../../lib/agents'

interface AgentAvatarProps {
  agent: Agent
  isActive: boolean
}

// Modern minimalist pedestal chair - positioned on ground
function Chair({ color, isActive, isModerator }: { color: string; isActive: boolean; isModerator?: boolean }) {
  return (
    <group position={[0, -0.7, 0]}>
      {/* Chair seat - rounded rectangle */}
      <RoundedBox args={[0.55, 0.06, 0.5]} radius={0.02} position={[0, 0.38, 0]}>
        <meshStandardMaterial color={isModerator ? '#64748b' : '#475569'} metalness={0.4} roughness={0.6} />
      </RoundedBox>
      
      {/* Chair back - thin elegant */}
      <RoundedBox args={[0.55, 0.55, 0.04]} radius={0.02} position={[0, 0.68, -0.23]}>
        <meshStandardMaterial color={isModerator ? '#64748b' : '#475569'} metalness={0.4} roughness={0.6} />
      </RoundedBox>
      
      {/* Subtle accent line on chair back */}
      <mesh position={[0, 0.68, -0.2]}>
        <boxGeometry args={[0.4, 0.02, 0.01]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 1.5 : 0.3}
        />
      </mesh>
      
      {/* Single pedestal leg */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.36, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 0.03, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

// Avatar with colored head and gray body
function Avatar({ color, isActive, isModerator }: { color: string; isActive: boolean; isModerator?: boolean }) {
  const headRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (headRef.current && isActive) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.04
    }
  })

  return (
    <group position={[0, -0.28, 0]} scale={isModerator ? 1.15 : 1}>
      {/* Torso - gray, or dark suit for moderator */}
      <mesh position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.12, 0.2, 8, 16]} />
        <meshStandardMaterial
          color={isModerator ? '#1e293b' : '#64748b'}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* Neck - gray */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.06, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Head - COLORED (white for moderator) */}
      <group ref={headRef} position={[0, 0.62, 0]}>
        <mesh>
          <sphereGeometry args={[0.13, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isActive ? 0.4 : 0.15}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>

        {/* Eyes */}
        {[-0.04, 0.04].map((x, i) => (
          <mesh key={i} position={[x, 0.02, 0.11]}>
            <sphereGeometry args={[0.018, 16, 16]} />
            <meshStandardMaterial
              color={isActive ? '#1e293b' : '#475569'}
              emissive={isActive ? '#fff' : '#000'}
              emissiveIntensity={isActive ? 0.3 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* Shoulders - gray */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.18, 0.38, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.2} roughness={0.8} />
        </mesh>
      ))}

      {/* Arms - gray */}
      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          {/* Upper arm */}
          <mesh position={[side * 0.18, 0.25, 0.05]} rotation={[0.3, 0, side * 0.2]}>
            <capsuleGeometry args={[0.035, 0.14, 8, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.2} roughness={0.8} />
          </mesh>
          {/* Forearm */}
          <mesh position={[side * 0.14, 0.1, 0.22]} rotation={[Math.PI / 2.5, 0, 0]}>
            <capsuleGeometry args={[0.03, 0.12, 8, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.2} roughness={0.8} />
          </mesh>
          {/* Hand */}
          <mesh position={[side * 0.12, 0.02, 0.32]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.1} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function AgentAvatar({ agent, isActive }: AgentAvatarProps) {
  const groupRef = useRef<Group>(null)
  const isModerator = agent.isModerator

  const { positionY } = useSpring({
    positionY: isActive ? 0.05 : 0,
    config: { tension: 200, friction: 25 }
  })

  return (
    <animated.group
      ref={groupRef}
      position-x={agent.position[0]}
      position-y={positionY}
      position-z={agent.position[2]}
      rotation-y={agent.rotation}
    >
      <Chair color={agent.color} isActive={isActive} isModerator={isModerator} />
      <Avatar color={agent.color} isActive={isActive} isModerator={isModerator} />

      {/* Ground glow when active */}
      {isActive && (
        <mesh position={[0, -0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.6, 32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.15} />
        </mesh>
      )}

      {/* Name label with model */}
      <Html
        position={[0, isModerator ? 1.4 : 1.25, 0]}
        center
        distanceFactor={10}
        style={{
          transition: 'all 0.3s',
          opacity: 1,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${isModerator ? 'ring-2 ring-white/50' : ''}`}
            style={{
              backgroundColor: isActive ? agent.color : (isModerator ? '#334155' : '#1e293b'),
              color: isActive ? (isModerator ? '#1e293b' : '#fff') : agent.color,
              border: `1px solid ${agent.color}`,
            }}
          >
            {isModerator && '👔 '}{agent.name}
            {isActive && <span className="ml-1.5 opacity-70">●</span>}
          </div>
          <div className="text-[10px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded">
            {agent.model}
          </div>
        </div>
      </Html>
    </animated.group>
  )
}
