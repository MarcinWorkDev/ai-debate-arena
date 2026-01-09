import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import { RoundTable } from './RoundTable'
import { AgentAvatar } from './AgentAvatar'
import { Environment } from './Environment'
import { getAllParticipantsWithUser } from '../../lib/agents'
import { useDebateStore } from '../../stores/debateStore'

export function Scene() {
  const activeAgent = useDebateStore((state) => state.activeAgent)
  const userName = useDebateStore((state) => state.userName)
  
  // Get all participants including user
  const participants = getAllParticipantsWithUser(userName)

  return (
    <div className="absolute inset-0 z-0">
      <Canvas gl={{ antialias: true, alpha: false }}>
        <PerspectiveCamera
          makeDefault
          position={[0, 6, 7]}
          fov={50}
          near={0.1}
          far={100}
        />

        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 12, 30]} />

        <Environment />

        <RoundTable />

        {participants.map((agent) => (
          <AgentAvatar
            key={agent.id}
            agent={agent}
            isActive={activeAgent?.id === agent.id}
          />
        ))}

        {/* Contact shadows for grounding */}
        <ContactShadows
          position={[0, -0.69, 0]}
          opacity={0.4}
          scale={12}
          blur={2}
          far={4}
          color="#000"
        />

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={16}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.3}
          target={[0, 0.3, 0]}
          enableDamping
          dampingFactor={0.05}
        />

        <EffectComposer>
          <SMAA />
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.15} darkness={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
