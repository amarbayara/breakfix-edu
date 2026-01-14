'use client'

import { createContext, useContext, type ReactNode, useSyncExternalStore, useCallback } from 'react'
import { createActor, type ActorRefFrom, type SnapshotFrom } from 'xstate'
import { useSelector } from '@xstate/react'
import { powerOperationsMachine, type PowerOperationsMachine } from '@/machines/powerOperations.machine'

// Create the actor once at module level for singleton behavior
const powerActor = createActor(powerOperationsMachine)
powerActor.start()

// Context type
type PowerMachineContextType = ActorRefFrom<PowerOperationsMachine>

// Create context
const PowerMachineContext = createContext<PowerMachineContextType | null>(null)

// Provider component
export function PowerMachineProvider({ children }: { children: ReactNode }) {
  return (
    <PowerMachineContext.Provider value={powerActor}>
      {children}
    </PowerMachineContext.Provider>
  )
}

// Hook to get the actor reference
export function usePowerMachineActor() {
  const actor = useContext(PowerMachineContext)
  if (!actor) {
    throw new Error('usePowerMachineActor must be used within PowerMachineProvider')
  }
  return actor
}

// Hook to get state and send function
export function usePowerMachine() {
  const actor = usePowerMachineActor()

  // Subscribe to state changes using useSyncExternalStore
  const subscribe = useCallback(
    (callback: () => void) => {
      const subscription = actor.subscribe(callback)
      return () => subscription.unsubscribe()
    },
    [actor]
  )

  const getSnapshot = useCallback(() => actor.getSnapshot(), [actor])

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const send = actor.send.bind(actor)

  return { state, send, actor }
}

// Selector hooks for specific parts of state
export function usePowerRails() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => state.context.powerRails)
}

export function useComponentStates() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => state.context.componentStates)
}

export function useFleaDrainRemaining() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => state.context.fleaDrainRemaining)
}

export function useOperationLog() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => state.context.operationLog)
}

export function useCurrentOperation() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => state.context.currentOperation)
}

export function useIsIdle() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => state.matches('idle'))
}

export function useCurrentState() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => state.value)
}

// Check if operations are available based on current state
export function useAvailableOperations() {
  const actor = usePowerMachineActor()
  return useSelector(actor, (state) => {
    const isIdle = state.matches('idle')
    const bmcReady = state.context.componentStates.bmc === 'on'
    const chassisOn = state.context.componentStates.server === 'on'
    const chassisOff = state.context.componentStates.server === 'off'

    return {
      canAcPowerCycle: isIdle,
      canBmcReset: isIdle && bmcReady,
      canChassisPowerOff: isIdle && chassisOn,
      canChassisPowerOn: isIdle && chassisOff && bmcReady,
      canDcPowerCycle: isIdle && chassisOn,
      canWarmReset: isIdle && chassisOn,
    }
  })
}
