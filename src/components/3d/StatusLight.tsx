'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, ANIMATION } from '@/lib/constants'

interface StatusLightProps {
  position: THREE.Vector3 | [number, number, number]
  state: 'on' | 'off' | 'booting' | 'resetting'
  color?: string
  size?: number
}

export function StatusLight({
  position,
  state,
  color,
  size = 0.05,
}: StatusLightProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // Determine base color based on state
  const getBaseColor = () => {
    if (color) return color
    switch (state) {
      case 'on':
        return COLORS.STATUS_ON
      case 'off':
        return COLORS.STATUS_OFF
      case 'booting':
        return COLORS.STATUS_BOOTING
      case 'resetting':
        return COLORS.STATUS_RESETTING
      default:
        return COLORS.STATUS_OFF
    }
  }

  const baseColor = getBaseColor()
  const shouldBlink = state === 'booting' || state === 'resetting'
  const isActive = state !== 'off'

  useFrame((frameState) => {
    if (!materialRef.current) return

    if (shouldBlink) {
      // Blink effect
      const blink = Math.sin(frameState.clock.elapsedTime * ANIMATION.LED_BLINK_SPEED * Math.PI) * 0.5 + 0.5
      materialRef.current.emissiveIntensity = blink * 2
    } else if (isActive) {
      // Steady glow
      materialRef.current.emissiveIntensity = 1.5
    } else {
      // Off
      materialRef.current.emissiveIntensity = 0
    }
  })

  const pos = Array.isArray(position) ? position : [position.x, position.y, position.z]

  return (
    <mesh ref={meshRef} position={pos as [number, number, number]}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        ref={materialRef}
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={isActive ? 1.5 : 0}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}
