'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { StatusLight } from './StatusLight'
import { POSITIONS, COLORS, LED_OFFSETS } from '@/lib/constants'
import { useVisualState } from '@/stores/visualState.store'

export function PDUUnit() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // Subscribe to visual state
  const componentState = useVisualState((s) => s.components.pdu)
  const acVoltage = useVisualState((s) => s.powerRails.ac.voltage)
  const activeLayer = useVisualState((s) => s.activeLayer)

  const { position, size } = POSITIONS.PDU
  const isActive = componentState === 'on'
  const isHighlighted = activeLayer === 0

  // Animate material based on state
  useFrame(() => {
    if (!materialRef.current) return

    const targetEmissive = isHighlighted ? 0.3 : (isActive ? 0.1 : 0)
    materialRef.current.emissiveIntensity +=
      (targetEmissive - materialRef.current.emissiveIntensity) * 0.1
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* PDU Body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial
          ref={materialRef}
          color={isActive ? COLORS.COMPONENT_ACTIVE : COLORS.COMPONENT_INACTIVE}
          emissive={isHighlighted ? COLORS.POWER_AC : '#000000'}
          emissiveIntensity={0}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0, size.depth / 2 + 0.01]}
        fontSize={0.08}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        PDU
      </Text>

      {/* AC Input Label */}
      <Text
        position={[-0.6, 0.05, size.depth / 2 + 0.01]}
        fontSize={0.05}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
        AC IN
      </Text>

      {/* Voltage Display */}
      <Text
        position={[-0.6, -0.05, size.depth / 2 + 0.01]}
        fontSize={0.06}
        color={isActive ? COLORS.POWER_AC : '#475569'}
        anchorX="center"
        anchorY="middle"
      >
        {acVoltage}V
      </Text>

      {/* Power LED */}
      <StatusLight
        position={LED_OFFSETS.PDU.power}
        state={componentState}
        color={COLORS.STATUS_ON}
      />

      {/* Outlet indicator */}
      <StatusLight
        position={LED_OFFSETS.PDU.outlet}
        state={isActive ? 'on' : 'off'}
        color={COLORS.POWER_AC}
      />

      {/* AC Power connector visualization */}
      <mesh position={[-0.8, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial
          color={isActive ? COLORS.POWER_AC : COLORS.STATUS_OFF}
          emissive={isActive ? COLORS.POWER_AC : '#000000'}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </mesh>
    </group>
  )
}
