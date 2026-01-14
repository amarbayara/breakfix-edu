'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { ServerRack } from './ServerRack'
import { usePowerMachineSync } from '@/hooks/usePowerMachineSync'
import { COLORS } from '@/lib/constants'

function Scene() {
  // Sync XState to Zustand for visual state updates
  usePowerMachineSync()

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[3, 2, 4]}
        fov={50}
      />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={10}
        target={[0, 0.5, 0]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        castShadow
      />
      <directionalLight
        position={[-3, 3, -3]}
        intensity={0.3}
      />

      {/* Point lights for component highlights */}
      <pointLight
        position={[0, 2, 2]}
        intensity={0.5}
        color="#3b82f6"
      />

      {/* Server Rack */}
      <ServerRack />

      {/* Floor grid */}
      <gridHelper
        args={[10, 20, '#1e293b', '#0f172a']}
        position={[0, -2.1, 0]}
      />
    </>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#475569" />
    </mesh>
  )
}

export default function DataCenterScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
        }}
        style={{ background: COLORS.SCENE_BG }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Overlay with scene info */}
      <div className="absolute top-4 left-4 text-sm text-slate-400">
        <p>Drag to rotate | Scroll to zoom | Shift+drag to pan</p>
      </div>
    </div>
  )
}
