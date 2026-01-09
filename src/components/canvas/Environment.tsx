export function Environment() {
  return (
    <>
      {/* Soft ambient */}
      <ambientLight intensity={0.3} color="#e2e8f0" />

      {/* Main key light - soft white */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.6}
        color="#f8fafc"
        castShadow
      />

      {/* Fill light - cooler */}
      <directionalLight
        position={[-5, 8, -5]}
        intensity={0.3}
        color="#cbd5e1"
      />

      {/* Rim lights for depth */}
      <pointLight position={[-6, 4, 6]} intensity={0.4} color="#94a3b8" distance={15} />
      <pointLight position={[6, 4, -6]} intensity={0.4} color="#94a3b8" distance={15} />

      {/* Subtle accent light on table */}
      <spotLight
        position={[0, 6, 0]}
        intensity={0.5}
        color="#e2e8f0"
        angle={0.5}
        penumbra={0.5}
        target-position={[0, 0, 0]}
      />

      {/* Subtle blue accent for modern feel */}
      <pointLight position={[0, 2, 0]} intensity={0.2} color="#60a5fa" distance={8} />
    </>
  )
}
