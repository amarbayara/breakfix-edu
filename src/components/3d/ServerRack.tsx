'use client'

import { POSITIONS, COLORS } from '@/lib/constants'
import { PDUUnit } from './PDUUnit'
import { PSUUnit } from './PSUUnit'
import { BMCUnit } from './BMCUnit'
import { ServerUnit } from './ServerUnit'
import { PowerFlowParticles } from './PowerFlowParticles'
import { FleaDrainIndicator } from './FleaDrainIndicator'
import { useVisualState } from '@/stores/visualState.store'

export function ServerRack() {
  const powerFlows = useVisualState((s) => s.powerFlows)
  const fleaDrainProgress = useVisualState((s) => s.fleaDrainProgress)
  const activeLayer = useVisualState((s) => s.activeLayer)

  const { width, height, depth } = POSITIONS.RACK

  // Show flea drain indicator during AC power cycle
  const showFleaDrain = activeLayer === 0 && fleaDrainProgress < 1

  return (
    <group>
      {/* Rack Frame - Wireframe style */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color={COLORS.RACK_FRAME} linewidth={2} />
      </lineSegments>

      {/* Rack back panel */}
      <mesh position={[0, 0, -depth / 2 - 0.01]}>
        <planeGeometry args={[width - 0.1, height - 0.1]} />
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Components */}
      <PDUUnit />
      <PSUUnit />
      <BMCUnit />
      <ServerUnit />

      {/* Power Flow Particles */}
      {/* AC to PDU */}
      <PowerFlowParticles
        start={[0, 2.5, 0]}
        end={[0, POSITIONS.PDU.position.y + 0.15, 0]}
        color={COLORS.POWER_AC}
        active={powerFlows.acToPdu}
        particleCount={50}
      />

      {/* PDU to PSU */}
      <PowerFlowParticles
        start={[POSITIONS.PDU.position.x - 0.5, POSITIONS.PDU.position.y - 0.15, 0]}
        end={[POSITIONS.PSU.position.x, POSITIONS.PSU.position.y + 0.2, 0]}
        color={COLORS.POWER_AC}
        active={powerFlows.pduToPsu}
        particleCount={40}
      />

      {/* PSU Standby to BMC */}
      <PowerFlowParticles
        start={[POSITIONS.PSU.position.x + 0.3, POSITIONS.PSU.position.y, 0]}
        end={[POSITIONS.BMC.position.x - 0.2, POSITIONS.BMC.position.y, 0]}
        color={COLORS.POWER_STANDBY}
        active={powerFlows.psuStandbyToBmc}
        particleCount={30}
      />

      {/* PSU Main to Server */}
      <PowerFlowParticles
        start={[POSITIONS.PSU.position.x, POSITIONS.PSU.position.y - 0.2, 0]}
        end={[POSITIONS.SERVER.position.x - 0.4, POSITIONS.SERVER.position.y + 0.3, 0]}
        color={COLORS.POWER_MAIN}
        active={powerFlows.psuMainToServer}
        particleCount={60}
      />

      {/* Flea Drain Indicator */}
      {showFleaDrain && (
        <FleaDrainIndicator progress={fleaDrainProgress} />
      )}

      {/* Layer labels */}
      <LayerLabels activeLayer={activeLayer} />
    </group>
  )
}

// Import THREE for the rack frame geometry
import * as THREE from 'three'
import { Text } from '@react-three/drei'

function LayerLabels({ activeLayer }: { activeLayer: number }) {
  const labelStyle = (layer: number) => ({
    color: activeLayer === layer ? '#ffffff' : '#64748b',
    fontSize: 0.08,
  })

  return (
    <>
      {/* Layer 0 - AC Power */}
      <Text
        position={[-1.3, POSITIONS.PDU.position.y, 0]}
        {...labelStyle(0)}
        anchorX="right"
        anchorY="middle"
      >
        L0: AC
      </Text>

      {/* Layer 1 - BMC */}
      <Text
        position={[-1.3, POSITIONS.BMC.position.y, 0]}
        {...labelStyle(1)}
        anchorX="right"
        anchorY="middle"
      >
        L1: BMC
      </Text>

      {/* Layer 2 - Chassis */}
      <Text
        position={[-1.3, (POSITIONS.PSU.position.y + POSITIONS.SERVER.position.y) / 2, 0]}
        {...labelStyle(2)}
        anchorX="right"
        anchorY="middle"
      >
        L2: DC
      </Text>

      {/* Layer 3 - Platform */}
      <Text
        position={[-1.3, POSITIONS.SERVER.position.y - 0.3, 0]}
        {...labelStyle(3)}
        anchorX="right"
        anchorY="middle"
      >
        L3: CPU
      </Text>
    </>
  )
}
