'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { StatusLight } from './StatusLight'
import { POSITIONS, COLORS, LED_OFFSETS } from '@/lib/constants'
import { useVisualState } from '@/stores/visualState.store'

export function PSUUnit() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // Subscribe to visual state
  const componentState = useVisualState((s) => s.components.psu)
  const standbyVoltage = useVisualState((s) => s.powerRails.standby.voltage)
  const mainVoltage = useVisualState((s) => s.powerRails.main.voltage)
  const activeLayer = useVisualState((s) => s.activeLayer)

  const { position, size } = POSITIONS.PSU
  const isActive = componentState === 'on'
  const standbyActive = standbyVoltage > 0
  const mainActive = mainVoltage > 0
  const isHighlighted = activeLayer === 0 || activeLayer === 2

  // Animate material
  useFrame(() => {
    if (!materialRef.current) return

    const targetEmissive = isHighlighted ? 0.3 : (isActive ? 0.1 : 0)
    materialRef.current.emissiveIntensity +=
      (targetEmissive - materialRef.current.emissiveIntensity) * 0.1
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* PSU Body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial
          ref={materialRef}
          color={isActive ? COLORS.COMPONENT_ACTIVE : COLORS.COMPONENT_INACTIVE}
          emissive={isHighlighted ? COLORS.POWER_STANDBY : '#000000'}
          emissiveIntensity={0}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.05, size.depth / 2 + 0.01]}
        fontSize={0.07}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        PSU
      </Text>

      {/* Standby Rail Label */}
      <Text
        position={[-0.15, -0.08, size.depth / 2 + 0.01]}
        fontSize={0.04}
        color={standbyActive ? COLORS.POWER_STANDBY : '#475569'}
        anchorX="center"
        anchorY="middle"
      >
        STB {standbyVoltage}V
      </Text>

      {/* Main Rail Label */}
      <Text
        position={[0.15, -0.08, size.depth / 2 + 0.01]}
        fontSize={0.04}
        color={mainActive ? COLORS.POWER_MAIN : '#475569'}
        anchorX="center"
        anchorY="middle"
      >
        MAIN {mainVoltage}V
      </Text>

      {/* Standby LED */}
      <StatusLight
        position={LED_OFFSETS.PSU.standby}
        state={standbyActive ? 'on' : 'off'}
        color={COLORS.POWER_STANDBY}
      />

      {/* Main Power LED */}
      <StatusLight
        position={LED_OFFSETS.PSU.main}
        state={mainActive ? 'on' : 'off'}
        color={COLORS.POWER_MAIN}
      />
    </group>
  )
}
