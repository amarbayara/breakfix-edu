'use client'

import { useEffect } from 'react'
import { usePowerMachine } from './usePowerMachine'
import { useVisualState } from '@/stores/visualState.store'

/**
 * Bridge hook that synchronizes XState machine state to Zustand visual state store.
 * This allows R3F components to subscribe to visual state changes without causing
 * unnecessary React re-renders.
 */
export function usePowerMachineSync() {
  const { state } = usePowerMachine()
  const syncFromMachineState = useVisualState((s) => s.syncFromMachineState)

  useEffect(() => {
    // Sync the visual state whenever the machine state changes
    syncFromMachineState({
      powerRails: state.context.powerRails,
      componentStates: state.context.componentStates,
      fleaDrainRemaining: state.context.fleaDrainRemaining,
      currentOperation: state.context.currentOperation,
    })
  }, [
    state.context.powerRails,
    state.context.componentStates,
    state.context.fleaDrainRemaining,
    state.context.currentOperation,
    syncFromMachineState,
  ])

  return state
}
