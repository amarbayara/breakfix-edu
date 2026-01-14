import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Power flow states for particle animations
interface PowerFlowState {
  acToPdu: boolean
  pduToPsu: boolean
  psuStandbyToBmc: boolean
  psuMainToServer: boolean
}

// Component visual states
type ComponentVisualState = 'on' | 'off' | 'booting' | 'resetting'

interface ComponentVisualStates {
  pdu: ComponentVisualState
  psu: ComponentVisualState
  bmc: ComponentVisualState
  server: ComponentVisualState
}

// Power rail visual states
interface PowerRailVisual {
  voltage: number
  maxVoltage: number
  active: boolean
}

interface PowerRailVisuals {
  ac: PowerRailVisual
  standby: PowerRailVisual
  main: PowerRailVisual
}

// Active layer for highlighting
type ActiveLayer = 0 | 1 | 2 | 3 | -1

// Full visual state interface
interface VisualState {
  // Power flow animation states
  powerFlows: PowerFlowState

  // Component states for LEDs and colors
  components: ComponentVisualStates

  // Power rail values for bars and colors
  powerRails: PowerRailVisuals

  // Currently active layer (for highlighting)
  activeLayer: ActiveLayer

  // Flea drain progress (0-1)
  fleaDrainProgress: number

  // Whether an operation is in progress
  operationInProgress: boolean

  // Actions
  setPowerFlows: (flows: Partial<PowerFlowState>) => void
  setComponents: (components: Partial<ComponentVisualStates>) => void
  setPowerRails: (rails: Partial<PowerRailVisuals>) => void
  setActiveLayer: (layer: ActiveLayer) => void
  setFleaDrainProgress: (progress: number) => void
  setOperationInProgress: (inProgress: boolean) => void

  // Bulk update for syncing from XState
  syncFromMachineState: (state: {
    powerRails: {
      ac: { voltage: number; maxVoltage: number; state: string }
      standby: { voltage: number; maxVoltage: number; state: string }
      main: { voltage: number; maxVoltage: number; state: string }
    }
    componentStates: {
      pdu: string
      psu: string
      bmc: string
      server: string
    }
    fleaDrainRemaining: number
    currentOperation: string | null
  }) => void
}

// Initial state
const initialPowerFlows: PowerFlowState = {
  acToPdu: true,
  pduToPsu: true,
  psuStandbyToBmc: true,
  psuMainToServer: true,
}

const initialComponents: ComponentVisualStates = {
  pdu: 'on',
  psu: 'on',
  bmc: 'on',
  server: 'on',
}

const initialPowerRails: PowerRailVisuals = {
  ac: { voltage: 120, maxVoltage: 120, active: true },
  standby: { voltage: 12, maxVoltage: 12, active: true },
  main: { voltage: 54, maxVoltage: 54, active: true },
}

// Create the store with subscribeWithSelector middleware
export const useVisualState = create<VisualState>()(
  subscribeWithSelector((set) => ({
    powerFlows: initialPowerFlows,
    components: initialComponents,
    powerRails: initialPowerRails,
    activeLayer: -1,
    fleaDrainProgress: 1,
    operationInProgress: false,

    setPowerFlows: (flows) =>
      set((state) => ({
        powerFlows: { ...state.powerFlows, ...flows },
      })),

    setComponents: (components) =>
      set((state) => ({
        components: { ...state.components, ...components },
      })),

    setPowerRails: (rails) =>
      set((state) => ({
        powerRails: { ...state.powerRails, ...rails },
      })),

    setActiveLayer: (layer) => set({ activeLayer: layer }),

    setFleaDrainProgress: (progress) => set({ fleaDrainProgress: progress }),

    setOperationInProgress: (inProgress) => set({ operationInProgress: inProgress }),

    // Sync from XState machine state
    syncFromMachineState: (machineState) =>
      set(() => {
        const { powerRails, componentStates, fleaDrainRemaining, currentOperation } = machineState

        // Determine active layer based on current operation
        let activeLayer: ActiveLayer = -1
        if (currentOperation) {
          if (currentOperation === 'AC_POWER_CYCLE') activeLayer = 0
          else if (currentOperation === 'BMC_RESET') activeLayer = 1
          else if (currentOperation.includes('CHASSIS') || currentOperation === 'DC_POWER_CYCLE') activeLayer = 2
          else if (currentOperation === 'WARM_RESET') activeLayer = 3
        }

        // Calculate power flows based on component states and rail voltages
        const acActive = powerRails.ac.voltage > 0
        const standbyActive = powerRails.standby.voltage > 0
        const mainActive = powerRails.main.voltage > 0

        return {
          powerFlows: {
            acToPdu: acActive,
            pduToPsu: acActive,
            psuStandbyToBmc: standbyActive,
            psuMainToServer: mainActive,
          },
          components: {
            pdu: componentStates.pdu as ComponentVisualState,
            psu: componentStates.psu as ComponentVisualState,
            bmc: componentStates.bmc as ComponentVisualState,
            server: componentStates.server as ComponentVisualState,
          },
          powerRails: {
            ac: {
              voltage: powerRails.ac.voltage,
              maxVoltage: powerRails.ac.maxVoltage,
              active: acActive,
            },
            standby: {
              voltage: powerRails.standby.voltage,
              maxVoltage: powerRails.standby.maxVoltage,
              active: standbyActive,
            },
            main: {
              voltage: powerRails.main.voltage,
              maxVoltage: powerRails.main.maxVoltage,
              active: mainActive,
            },
          },
          activeLayer,
          fleaDrainProgress: fleaDrainRemaining / 30, // 30 seconds for demo
          operationInProgress: currentOperation !== null,
        }
      }),
  }))
)

// Selector hooks for specific parts of state (for R3F components)
export const selectPowerFlows = (state: VisualState) => state.powerFlows
export const selectComponents = (state: VisualState) => state.components
export const selectPowerRails = (state: VisualState) => state.powerRails
export const selectActiveLayer = (state: VisualState) => state.activeLayer
export const selectFleaDrainProgress = (state: VisualState) => state.fleaDrainProgress
