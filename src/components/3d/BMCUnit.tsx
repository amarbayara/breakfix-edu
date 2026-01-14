'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { StatusLight } from './StatusLight'
import { POSITIONS, COLORS, LED_OFFSETS } from '@/lib/constants'
import { useVisualState } from '@/stores/visualState.store'

export function BMCUnit() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // Subscribe to visual state
  const componentState = useVisualState((s) => s.components.bmc)
  const activeLayer = useVisualState((s) => s.activeLayer)

  const { position, size } = POSITIONS.BMC
  const isActive = componentState === 'on'
  const isBooting = componentState === 'booting'
  const isResetting = componentState === 'resetting'
  const isHighlighted = activeLayer === 1

  // Animate material
  useFrame(() => {
    if (!materialRef.current) return

    const targetEmissive = isHighlighted ? 0.4 : (isActive ? 0.15 : 0)
    materialRef.current.emissiveIntensity +=
      (targetEmissive - materialRef.current.emissiveIntensity) * 0.1
  })

  // Determine LED state
  const getLedState = (): 'on' | 'off' | 'booting' | 'resetting' => {
    if (isResetting) return 'resetting'
    if (isBooting) return 'booting'
    if (isActive) return 'on'
    return 'off'
  }

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* BMC Body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial
          ref={materialRef}
          color={isActive || isBooting ? COLORS.COMPONENT_ACTIVE : COLORS.COMPONENT_INACTIVE}
          emissive={isHighlighted ? COLORS.POWER_STANDBY : '#000000'}
          emissiveIntensity={0}
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.05, size.depth / 2 + 0.01]}
        fontSize={0.06}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        BMC
      </Text>

      {/* Status text */}
      <Text
        position={[0, -0.05, size.depth / 2 + 0.01]}
        fontSize={0.035}
        color={isActive ? COLORS.STATUS_ON : (isBooting ? COLORS.STATUS_BOOTING : '#475569')}
        anchorX="center"
        anchorY="middle"
      >
        {isResetting ? 'RESET' : (isBooting ? 'BOOT' : (isActive ? 'READY' : 'OFF'))}
      </Text>

      {/* Status LED */}
      <StatusLight
        position={LED_OFFSETS.BMC.status}
        state={getLedState()}
        color={COLORS.STATUS_ON}
      />

      {/* Network activity LED */}
      <StatusLight
        position={LED_OFFSETS.BMC.network}
        state={isActive ? 'on' : 'off'}
        color={COLORS.POWER_STANDBY}
        size={0.03}
      />

      {/* Ethernet port visualization */}
      <mesh position={[0, -0.1, size.depth / 2 + 0.02]}>
        <boxGeometry args={[0.08, 0.05, 0.02]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive={isActive ? COLORS.STATUS_ON : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}
