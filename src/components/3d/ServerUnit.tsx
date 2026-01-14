'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { StatusLight } from './StatusLight'
import { POSITIONS, COLORS, LED_OFFSETS } from '@/lib/constants'
import { useVisualState } from '@/stores/visualState.store'

export function ServerUnit() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // Subscribe to visual state
  const componentState = useVisualState((s) => s.components.server)
  const mainVoltage = useVisualState((s) => s.powerRails.main.voltage)
  const activeLayer = useVisualState((s) => s.activeLayer)

  const { position, size } = POSITIONS.SERVER
  const isActive = componentState === 'on'
  const isBooting = componentState === 'booting'
  const isResetting = componentState === 'resetting'
  const isPowered = mainVoltage > 0
  const isHighlighted = activeLayer === 2 || activeLayer === 3

  // Animate material
  useFrame(() => {
    if (!materialRef.current) return

    const targetEmissive = isHighlighted ? 0.3 : (isActive ? 0.1 : 0)
    materialRef.current.emissiveIntensity +=
      (targetEmissive - materialRef.current.emissiveIntensity) * 0.1
  })

  // Determine power LED state
  const getPowerLedState = (): 'on' | 'off' | 'booting' | 'resetting' => {
    if (isResetting) return 'resetting'
    if (isBooting) return 'booting'
    if (isActive) return 'on'
    return 'off'
  }

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Server Body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial
          ref={materialRef}
          color={isPowered ? COLORS.COMPONENT_ACTIVE : COLORS.COMPONENT_INACTIVE}
          emissive={isHighlighted ? COLORS.POWER_MAIN : '#000000'}
          emissiveIntensity={0}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Main Label */}
      <Text
        position={[0, 0.15, size.depth / 2 + 0.01]}
        fontSize={0.08}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        COMPUTE TRAY
      </Text>

      {/* Status text */}
      <Text
        position={[0, 0, size.depth / 2 + 0.01]}
        fontSize={0.05}
        color={isActive ? COLORS.STATUS_ON : (isBooting ? COLORS.STATUS_BOOTING : '#475569')}
        anchorX="center"
        anchorY="middle"
      >
        {isResetting ? 'RESETTING' : (isBooting ? 'POST/BIOS' : (isActive ? 'RUNNING' : 'STANDBY'))}
      </Text>

      {/* Main Rail Label */}
      <Text
        position={[0, -0.15, size.depth / 2 + 0.01]}
        fontSize={0.04}
        color={isPowered ? COLORS.POWER_MAIN : '#475569'}
        anchorX="center"
        anchorY="middle"
      >
        {isPowered ? `54V DC` : '0V DC'}
      </Text>

      {/* Power LED */}
      <StatusLight
        position={LED_OFFSETS.SERVER.power}
        state={getPowerLedState()}
        color={COLORS.STATUS_ON}
      />

      {/* Activity LED */}
      <StatusLight
        position={LED_OFFSETS.SERVER.activity}
        state={isActive ? 'booting' : 'off'} // Blink when active to simulate activity
        color={COLORS.POWER_MAIN}
        size={0.03}
      />

      {/* CPU/GPU representation */}
      <group position={[0.3, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.3]} />
          <meshStandardMaterial
            color={isPowered ? '#1e40af' : '#1e293b'}
            emissive={isPowered ? '#3b82f6' : '#000000'}
            emissiveIntensity={isPowered ? 0.3 : 0}
          />
        </mesh>
        <Text
          position={[0, 0, 0.16]}
          fontSize={0.04}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          CPU
        </Text>
      </group>

      {/* GPU representation */}
      <group position={[-0.3, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.4, 0.15, 0.3]} />
          <meshStandardMaterial
            color={isPowered ? '#065f46' : '#1e293b'}
            emissive={isPowered ? '#10b981' : '#000000'}
            emissiveIntensity={isPowered ? 0.3 : 0}
          />
        </mesh>
        <Text
          position={[0, 0, 0.16]}
          fontSize={0.04}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          GPU
        </Text>
      </group>
    </group>
  )
}
