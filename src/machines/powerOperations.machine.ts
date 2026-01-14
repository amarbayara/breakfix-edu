import { setup, assign, fromCallback } from 'xstate'
import type { PowerMachineContext, LogEntry, PowerOperationType } from '@/types/power'
import { DEMO_TIMING as TIMING } from '@/types/power'

// Helper to create a log entry
const createLogEntry = (
  layer: 0 | 1 | 2 | 3,
  message: string,
  type: LogEntry['type'] = 'info'
): LogEntry => ({
  timestamp: Date.now(),
  layer,
  message,
  type,
})

// Initial context
const initialContext: PowerMachineContext = {
  fleaDrainRemaining: 30, // 30 seconds for demo
  operationLog: [],
  powerRails: {
    ac: { voltage: 120, maxVoltage: 120, state: 'stable' },
    standby: { voltage: 12, maxVoltage: 12, state: 'stable' },
    main: { voltage: 54, maxVoltage: 54, state: 'stable' },
  },
  componentStates: {
    pdu: 'on',
    psu: 'on',
    bmc: 'on',
    server: 'on',
  },
  currentOperation: null,
}

// Timer callback actor for flea drain
const fleaDrainTimer = fromCallback(({ sendBack }) => {
  const interval = setInterval(() => {
    sendBack({ type: 'FLEA_DRAIN_TICK' })
  }, TIMING.FLEA_DRAIN_TICK)

  return () => clearInterval(interval)
})

export const powerOperationsMachine = setup({
  types: {
    context: {} as PowerMachineContext,
    events: {} as
      | { type: 'START_AC_POWER_CYCLE' }
      | { type: 'START_BMC_RESET' }
      | { type: 'START_CHASSIS_POWER_OFF' }
      | { type: 'START_CHASSIS_POWER_ON' }
      | { type: 'START_DC_POWER_CYCLE' }
      | { type: 'START_WARM_RESET' }
      | { type: 'CANCEL_OPERATION' }
      | { type: 'FLEA_DRAIN_TICK' }
      | { type: 'PHASE_COMPLETE' }
      | { type: 'TERMINAL_COMMAND'; command: string },
  },
  actors: {
    fleaDrainTimer,
  },
  actions: {
    logOperation: assign({
      operationLog: ({ context }, params: { layer: 0 | 1 | 2 | 3; message: string; type?: LogEntry['type'] }) => [
        ...context.operationLog.slice(-50), // Keep last 50 entries
        createLogEntry(params.layer, params.message, params.type || 'info'),
      ],
    }),
    setCurrentOperation: assign({
      currentOperation: (_, params: { operation: PowerOperationType | null }) => params.operation,
    }),
    // AC Power actions
    cutAcPower: assign({
      powerRails: ({ context }) => ({
        ...context.powerRails,
        ac: { ...context.powerRails.ac, voltage: 0, state: 'off' as const },
        standby: { ...context.powerRails.standby, voltage: 0, state: 'off' as const },
        main: { ...context.powerRails.main, voltage: 0, state: 'off' as const },
      }),
      componentStates: () => ({
        pdu: 'off' as const,
        psu: 'off' as const,
        bmc: 'off' as const,
        server: 'off' as const,
      }),
    }),
    decrementFleaDrain: assign({
      fleaDrainRemaining: ({ context }) => Math.max(0, context.fleaDrainRemaining - 1),
    }),
    resetFleaDrainCounter: assign({
      fleaDrainRemaining: () => 30, // 30 seconds for demo
    }),
    restoreAcPower: assign({
      powerRails: ({ context }) => ({
        ...context.powerRails,
        ac: { ...context.powerRails.ac, voltage: 120, state: 'stable' as const },
      }),
      componentStates: ({ context }) => ({
        ...context.componentStates,
        pdu: 'on' as const,
      }),
    }),
    restoreStandbyPower: assign({
      powerRails: ({ context }) => ({
        ...context.powerRails,
        standby: { ...context.powerRails.standby, voltage: 12, state: 'stable' as const },
      }),
      componentStates: ({ context }) => ({
        ...context.componentStates,
        psu: 'on' as const,
      }),
    }),
    setBmcBooting: assign({
      componentStates: ({ context }) => ({
        ...context.componentStates,
        bmc: 'booting' as const,
      }),
    }),
    setBmcOn: assign({
      componentStates: ({ context }) => ({
        ...context.componentStates,
        bmc: 'on' as const,
      }),
    }),
    setBmcResetting: assign({
      componentStates: ({ context }) => ({
        ...context.componentStates,
        bmc: 'resetting' as const,
      }),
    }),
    // Chassis power actions
    cutMainPower: assign({
      powerRails: ({ context }) => ({
        ...context.powerRails,
        main: { ...context.powerRails.main, voltage: 0, state: 'off' as const },
      }),
      componentStates: ({ context }) => ({
        ...context.componentStates,
        server: 'off' as const,
      }),
    }),
    restoreMainPower: assign({
      powerRails: ({ context }) => ({
        ...context.powerRails,
        main: { ...context.powerRails.main, voltage: 54, state: 'ramping' as const },
      }),
    }),
    stabilizeMainPower: assign({
      powerRails: ({ context }) => ({
        ...context.powerRails,
        main: { ...context.powerRails.main, state: 'stable' as const },
      }),
    }),
    setServerBooting: assign({
      componentStates: ({ context }) => ({
        ...context.componentStates,
        server: 'booting' as const,
      }),
    }),
    setServerOn: assign({
      componentStates: ({ context }) => ({
        ...context.componentStates,
        server: 'on' as const,
      }),
    }),
    setServerResetting: assign({
      componentStates: ({ context }) => ({
        ...context.componentStates,
        server: 'resetting' as const,
      }),
    }),
    clearCurrentOperation: assign({
      currentOperation: () => null,
    }),
  },
  guards: {
    fleaDrainComplete: ({ context }) => context.fleaDrainRemaining <= 0,
    fleaDrainNotComplete: ({ context }) => context.fleaDrainRemaining > 0,
    isChassisOn: ({ context }) => context.componentStates.server === 'on',
    isChassisOff: ({ context }) => context.componentStates.server === 'off',
    isBmcReady: ({ context }) => context.componentStates.bmc === 'on',
  },
}).createMachine({
  id: 'powerOperations',
  initial: 'idle',
  context: initialContext,
  states: {
    // Idle state - all systems operational
    idle: {
      entry: [
        { type: 'clearCurrentOperation' },
      ],
      on: {
        START_AC_POWER_CYCLE: {
          target: 'layer0_acPowerCycle',
          actions: [
            { type: 'setCurrentOperation', params: { operation: 'AC_POWER_CYCLE' } },
            { type: 'logOperation', params: { layer: 0, message: 'Initiating AC Power Cycle (Flea Drain)', type: 'warning' } },
          ],
        },
        START_BMC_RESET: {
          target: 'layer1_bmcReset',
          guard: 'isBmcReady',
          actions: [
            { type: 'setCurrentOperation', params: { operation: 'BMC_RESET' } },
            { type: 'logOperation', params: { layer: 1, message: 'Initiating BMC Reset', type: 'info' } },
          ],
        },
        START_CHASSIS_POWER_OFF: {
          target: 'layer2_chassisPowerOff',
          guard: 'isChassisOn',
          actions: [
            { type: 'setCurrentOperation', params: { operation: 'CHASSIS_POWER_OFF' } },
            { type: 'logOperation', params: { layer: 2, message: 'Initiating Chassis Power Off', type: 'info' } },
          ],
        },
        START_CHASSIS_POWER_ON: {
          target: 'layer2_chassisPowerOn',
          guard: 'isChassisOff',
          actions: [
            { type: 'setCurrentOperation', params: { operation: 'CHASSIS_POWER_ON' } },
            { type: 'logOperation', params: { layer: 2, message: 'Initiating Chassis Power On', type: 'info' } },
          ],
        },
        START_DC_POWER_CYCLE: {
          target: 'layer2_dcPowerCycle',
          guard: 'isChassisOn',
          actions: [
            { type: 'setCurrentOperation', params: { operation: 'DC_POWER_CYCLE' } },
            { type: 'logOperation', params: { layer: 2, message: 'Initiating DC Power Cycle (Cold Reboot)', type: 'info' } },
          ],
        },
        START_WARM_RESET: {
          target: 'layer3_warmReset',
          guard: 'isChassisOn',
          actions: [
            { type: 'setCurrentOperation', params: { operation: 'WARM_RESET' } },
            { type: 'logOperation', params: { layer: 3, message: 'Initiating Warm Reset', type: 'info' } },
          ],
        },
      },
    },

    // Layer 0: AC Power Cycle (Flea Drain)
    layer0_acPowerCycle: {
      initial: 'cuttingPower',
      states: {
        cuttingPower: {
          entry: [
            { type: 'cutAcPower' },
            { type: 'resetFleaDrainCounter' },
            { type: 'logOperation', params: { layer: 0, message: 'AC power cut - all rails at 0V', type: 'warning' } },
          ],
          after: {
            1000: 'fleaDrain',
          },
        },
        fleaDrain: {
          entry: [
            { type: 'logOperation', params: { layer: 0, message: 'Flea drain in progress - discharging capacitors', type: 'info' } },
          ],
          invoke: {
            src: 'fleaDrainTimer',
            id: 'fleaDrainTimer',
          },
          on: {
            FLEA_DRAIN_TICK: [
              {
                guard: 'fleaDrainNotComplete',
                actions: ['decrementFleaDrain'],
              },
              {
                guard: 'fleaDrainComplete',
                target: 'restoringPower',
              },
            ],
          },
          always: {
            guard: 'fleaDrainComplete',
            target: 'restoringPower',
          },
        },
        restoringPower: {
          entry: [
            { type: 'restoreAcPower' },
            { type: 'logOperation', params: { layer: 0, message: 'AC power restored - PDU energized', type: 'success' } },
          ],
          after: {
            1500: 'restoringStandby',
          },
        },
        restoringStandby: {
          entry: [
            { type: 'restoreStandbyPower' },
            { type: 'logOperation', params: { layer: 0, message: 'Standby rail energized - PSU online', type: 'info' } },
          ],
          after: {
            1500: 'bmcBooting',
          },
        },
        bmcBooting: {
          entry: [
            { type: 'setBmcBooting' },
            { type: 'logOperation', params: { layer: 0, message: 'BMC booting...', type: 'info' } },
          ],
          after: {
            [TIMING.BMC_BOOT_DURATION]: 'bmcReady',
          },
        },
        bmcReady: {
          entry: [
            { type: 'setBmcOn' },
            { type: 'logOperation', params: { layer: 0, message: 'BMC online - ready for chassis power on', type: 'success' } },
          ],
          after: {
            500: 'complete',
          },
        },
        complete: {
          type: 'final',
        },
      },
      onDone: {
        target: 'idle',
        actions: [
          { type: 'logOperation', params: { layer: 0, message: 'AC Power Cycle complete', type: 'success' } },
        ],
      },
    },

    // Layer 1: BMC Reset
    layer1_bmcReset: {
      initial: 'resetting',
      states: {
        resetting: {
          entry: [
            { type: 'setBmcResetting' },
            { type: 'logOperation', params: { layer: 1, message: 'BMC resetting - management access lost', type: 'warning' } },
          ],
          after: {
            [TIMING.BMC_RESET_DURATION]: 'recovering',
          },
        },
        recovering: {
          entry: [
            { type: 'setBmcBooting' },
            { type: 'logOperation', params: { layer: 1, message: 'BMC recovering...', type: 'info' } },
          ],
          after: {
            [TIMING.BMC_BOOT_DURATION]: 'complete',
          },
        },
        complete: {
          entry: [
            { type: 'setBmcOn' },
          ],
          type: 'final',
        },
      },
      onDone: {
        target: 'idle',
        actions: [
          { type: 'logOperation', params: { layer: 1, message: 'BMC Reset complete - management access restored', type: 'success' } },
        ],
      },
    },

    // Layer 2A: Chassis Power Off
    layer2_chassisPowerOff: {
      entry: [
        { type: 'cutMainPower' },
        { type: 'logOperation', params: { layer: 2, message: 'Main rail de-energized - chassis powered off', type: 'info' } },
      ],
      after: {
        [TIMING.CHASSIS_POWER_OFF_DURATION]: 'idle',
      },
      exit: [
        { type: 'logOperation', params: { layer: 2, message: 'Chassis Power Off complete - system in standby', type: 'success' } },
      ],
    },

    // Layer 2B: Chassis Power On
    layer2_chassisPowerOn: {
      initial: 'poweringOn',
      states: {
        poweringOn: {
          entry: [
            { type: 'restoreMainPower' },
            { type: 'logOperation', params: { layer: 2, message: 'BMC asserting PS_ON# - main rail ramping', type: 'info' } },
          ],
          after: {
            [TIMING.POWER_RAMP_DURATION]: 'stabilizing',
          },
        },
        stabilizing: {
          entry: [
            { type: 'stabilizeMainPower' },
            { type: 'logOperation', params: { layer: 2, message: 'Main rail stable at 54V', type: 'info' } },
          ],
          after: {
            500: 'postBios',
          },
        },
        postBios: {
          entry: [
            { type: 'setServerBooting' },
            { type: 'logOperation', params: { layer: 2, message: 'POST/BIOS sequence started', type: 'info' } },
          ],
          after: {
            [TIMING.POST_DURATION]: 'osBoot',
          },
        },
        osBoot: {
          entry: [
            { type: 'logOperation', params: { layer: 2, message: 'OS boot in progress...', type: 'info' } },
          ],
          after: {
            [TIMING.OS_BOOT_DURATION]: 'complete',
          },
        },
        complete: {
          entry: [
            { type: 'setServerOn' },
          ],
          type: 'final',
        },
      },
      onDone: {
        target: 'idle',
        actions: [
          { type: 'logOperation', params: { layer: 2, message: 'Chassis Power On complete - system operational', type: 'success' } },
        ],
      },
    },

    // Layer 2C: DC Power Cycle (Cold Reboot)
    layer2_dcPowerCycle: {
      initial: 'poweringOff',
      states: {
        poweringOff: {
          entry: [
            { type: 'cutMainPower' },
            { type: 'logOperation', params: { layer: 2, message: 'Main rail dropping to 0V - clearing volatile states', type: 'info' } },
          ],
          after: {
            [TIMING.CHASSIS_POWER_OFF_DURATION]: 'poweringOn',
          },
        },
        poweringOn: {
          entry: [
            { type: 'restoreMainPower' },
            { type: 'logOperation', params: { layer: 2, message: 'Main rail ramping back to 54V', type: 'info' } },
          ],
          after: {
            [TIMING.POWER_RAMP_DURATION]: 'stabilizing',
          },
        },
        stabilizing: {
          entry: [
            { type: 'stabilizeMainPower' },
            { type: 'logOperation', params: { layer: 2, message: 'Main rail stable - hardware registers cleared', type: 'info' } },
          ],
          after: {
            500: 'postBios',
          },
        },
        postBios: {
          entry: [
            { type: 'setServerBooting' },
            { type: 'logOperation', params: { layer: 2, message: 'POST/BIOS sequence started', type: 'info' } },
          ],
          after: {
            [TIMING.POST_DURATION]: 'osBoot',
          },
        },
        osBoot: {
          entry: [
            { type: 'logOperation', params: { layer: 2, message: 'OS boot in progress...', type: 'info' } },
          ],
          after: {
            [TIMING.OS_BOOT_DURATION]: 'complete',
          },
        },
        complete: {
          entry: [
            { type: 'setServerOn' },
          ],
          type: 'final',
        },
      },
      onDone: {
        target: 'idle',
        actions: [
          { type: 'logOperation', params: { layer: 2, message: 'DC Power Cycle complete - cold boot finished', type: 'success' } },
        ],
      },
    },

    // Layer 3: Warm Reset
    layer3_warmReset: {
      initial: 'resetting',
      states: {
        resetting: {
          entry: [
            { type: 'setServerResetting' },
            { type: 'logOperation', params: { layer: 3, message: 'CPU reset signal asserted - power rails constant', type: 'info' } },
            { type: 'logOperation', params: { layer: 3, message: 'Note: PCIe devices may retain internal state', type: 'warning' } },
          ],
          after: {
            [TIMING.WARM_RESET_DURATION]: 'postBios',
          },
        },
        postBios: {
          entry: [
            { type: 'setServerBooting' },
            { type: 'logOperation', params: { layer: 3, message: 'POST/BIOS sequence started', type: 'info' } },
          ],
          after: {
            [TIMING.POST_DURATION]: 'osBoot',
          },
        },
        osBoot: {
          entry: [
            { type: 'logOperation', params: { layer: 3, message: 'OS boot in progress...', type: 'info' } },
          ],
          after: {
            [TIMING.OS_BOOT_DURATION]: 'complete',
          },
        },
        complete: {
          entry: [
            { type: 'setServerOn' },
          ],
          type: 'final',
        },
      },
      onDone: {
        target: 'idle',
        actions: [
          { type: 'logOperation', params: { layer: 3, message: 'Warm Reset complete - OS running', type: 'success' } },
        ],
      },
    },
  },
})

export type PowerOperationsMachine = typeof powerOperationsMachine
