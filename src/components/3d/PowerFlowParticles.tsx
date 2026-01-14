'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ANIMATION } from '@/lib/constants'

interface PowerFlowParticlesProps {
  start: [number, number, number]
  end: [number, number, number]
  color: string
  active: boolean
  particleCount?: number
  speed?: number
}

export function PowerFlowParticles({
  start,
  end,
  color,
  active,
  particleCount = ANIMATION.PARTICLE_COUNT,
  speed = ANIMATION.PARTICLE_SPEED,
}: PowerFlowParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Pre-calculate particle data
  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      offset: i / particleCount,
      speed: speed * (0.8 + Math.random() * 0.4), // Slight speed variation
      size: ANIMATION.PARTICLE_SIZE * (0.8 + Math.random() * 0.4),
    }))
  }, [particleCount, speed])

  // Convert positions to Vector3
  const startVec = useMemo(() => new THREE.Vector3(...start), [start])
  const endVec = useMemo(() => new THREE.Vector3(...end), [end])

  // Calculate control point for bezier curve (adds arc to the path)
  const controlPoint = useMemo(() => {
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5)
    // Add offset perpendicular to the line for arc effect
    const direction = endVec.clone().sub(startVec).normalize()
    const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0)
    mid.add(perpendicular.multiplyScalar(0.15))
    return mid
  }, [startVec, endVec])

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime

    particleData.forEach((particle, i) => {
      if (!active) {
        // Hide particles when inactive
        dummy.scale.setScalar(0)
      } else {
        // Calculate position along quadratic bezier curve
        const t = (time * particle.speed + particle.offset) % 1

        // Quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        const oneMinusT = 1 - t
        const x =
          oneMinusT * oneMinusT * startVec.x +
          2 * oneMinusT * t * controlPoint.x +
          t * t * endVec.x
        const y =
          oneMinusT * oneMinusT * startVec.y +
          2 * oneMinusT * t * controlPoint.y +
          t * t * endVec.y
        const z =
          oneMinusT * oneMinusT * startVec.z +
          2 * oneMinusT * t * controlPoint.z +
          t * t * endVec.z

        dummy.position.set(x, y, z)
        dummy.scale.setScalar(particle.size)
      }

      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const threeColor = useMemo(() => new THREE.Color(color), [color])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color={threeColor}
        transparent
        opacity={active ? 0.9 : 0}
      />
    </instancedMesh>
  )
}
