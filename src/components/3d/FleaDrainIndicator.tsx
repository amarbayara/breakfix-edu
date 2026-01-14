'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { COLORS } from '@/lib/constants'

interface FleaDrainIndicatorProps {
  progress: number // 0-1, where 1 means drain complete
}

export function FleaDrainIndicator({ progress }: FleaDrainIndicatorProps) {
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Calculate remaining seconds (assuming 30 second drain)
  const remainingSeconds = Math.ceil(progress * 30)

  useFrame((state) => {
    if (ringRef.current) {
      // Pulse effect
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1
      ringRef.current.scale.setScalar(pulse)
    }

    if (glowRef.current) {
      // Fade glow as capacitors discharge
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = progress * 0.5
    }
  })

  return (
    <group position={[0, 0.5, 0.6]}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[1.5, 0.6]} />
        <meshBasicMaterial
          color="#0f172a"
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.18, 0]}
        fontSize={0.08}
        color={COLORS.STATUS_WARNING}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        FLEA DRAIN
      </Text>

      {/* Countdown */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.15}
        color={COLORS.STATUS_WARNING}
        anchorX="center"
        anchorY="middle"
      >
        {remainingSeconds}s
      </Text>

      {/* Progress bar background */}
      <mesh position={[0, -0.18, 0]}>
        <planeGeometry args={[1.2, 0.08]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Progress bar fill */}
      <mesh position={[(1 - progress) * -0.6, -0.18, 0.01]}>
        <planeGeometry args={[1.2 * progress, 0.08]} />
        <meshBasicMaterial color={COLORS.STATUS_WARNING} />
      </mesh>

      {/* Pulsing ring indicator */}
      <mesh ref={ringRef} position={[0, 0, 0.02]}>
        <ringGeometry args={[0.25, 0.28, 32]} />
        <meshBasicMaterial
          color={COLORS.STATUS_WARNING}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Capacitor glow effect */}
      <mesh ref={glowRef} position={[0, 0, 0.01]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial
          color={COLORS.POWER_MAIN}
          transparent
          opacity={progress * 0.5}
        />
      </mesh>

      {/* Status text */}
      <Text
        position={[0, -0.25, 0]}
        fontSize={0.04}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
        Discharging capacitors...
      </Text>
    </group>
  )
}
