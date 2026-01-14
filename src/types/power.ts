// Power rail states
export type RailState = 'off' | 'ramping' | 'stable'

export interface PowerRail {
  voltage: number
  maxVoltage: number
  state: RailState
}

export interface PowerRails {
  ac: PowerRail
  standby: PowerRail
  main: PowerRail
}

// Component states
export type ComponentState = 'off' | 'booting' | 'on' | 'resetting'

export interface ComponentStates {
  pdu: ComponentState
  psu: ComponentState
  bmc: ComponentState
  server: ComponentState
}

// Operation log entry
export interface LogEntry {
  timestamp: number
  layer: 0 | 1 | 2 | 3
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
}

// Power operation types
export type PowerOperationType =
  | 'AC_POWER_CYCLE'      // Layer 0
  | 'BMC_RESET'           // Layer 1
  | 'CHASSIS_POWER_OFF'   // Layer 2A
  | 'CHASSIS_POWER_ON'    // Layer 2B
  | 'DC_POWER_CYCLE'      // Layer 2C
  | 'WARM_RESET'          // Layer 3

// Machine context
export interface PowerMachineContext {
  fleaDrainRemaining: number
  operationLog: LogEntry[]
  powerRails: PowerRails
  componentStates: ComponentStates
  currentOperation: PowerOperationType | null
}

// Machine events
export type PowerMachineEvent =
  | { type: 'START_AC_POWER_CYCLE' }
  | { type: 'START_BMC_RESET' }
  | { type: 'START_CHASSIS_POWER_OFF' }
  | { type: 'START_CHASSIS_POWER_ON' }
  | { type: 'START_DC_POWER_CYCLE' }
  | { type: 'START_WARM_RESET' }
  | { type: 'CANCEL_OPERATION' }
  | { type: 'FLEA_DRAIN_TICK' }
  | { type: 'OPERATION_COMPLETE' }
  | { type: 'TERMINAL_COMMAND'; command: string }

// Timing constants (in milliseconds)
export const TIMING = {
  FLEA_DRAIN_DURATION: 300000, // 300 seconds for demo, use 30000 for faster demo
  FLEA_DRAIN_TICK: 1000,       // 1 second tick
  BMC_RESET_DURATION: 60000,   // 60 seconds
  BMC_BOOT_DURATION: 30000,    // 30 seconds
  CHASSIS_POWER_OFF_DURATION: 2000,
  CHASSIS_POWER_ON_DURATION: 3000,
  POST_DURATION: 10000,        // 10 seconds for POST/BIOS
  OS_BOOT_DURATION: 15000,     // 15 seconds for OS boot
  WARM_RESET_DURATION: 5000,   // 5 seconds
  POWER_RAMP_DURATION: 2000,   // 2 seconds for voltage ramp
} as const

// For demo purposes, use faster timings
export const DEMO_TIMING = {
  FLEA_DRAIN_DURATION: 30000,  // 30 seconds
  FLEA_DRAIN_TICK: 1000,
  BMC_RESET_DURATION: 6000,
  BMC_BOOT_DURATION: 4000,
  CHASSIS_POWER_OFF_DURATION: 1000,
  CHASSIS_POWER_ON_DURATION: 1500,
  POST_DURATION: 3000,
  OS_BOOT_DURATION: 4000,
  WARM_RESET_DURATION: 2000,
  POWER_RAMP_DURATION: 1000,
} as const
