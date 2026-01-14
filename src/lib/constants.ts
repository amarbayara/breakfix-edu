import * as THREE from 'three'

// Colors for power rails
export const COLORS = {
  // Power rail colors
  POWER_AC: '#3b82f6',      // Blue
  POWER_STANDBY: '#eab308', // Yellow
  POWER_MAIN: '#f97316',    // Orange

  // Status colors
  STATUS_ON: '#22c55e',     // Green
  STATUS_OFF: '#374151',    // Dark gray
  STATUS_BOOTING: '#f59e0b', // Amber (blinking)
  STATUS_RESETTING: '#ef4444', // Red (blinking)
  STATUS_WARNING: '#f59e0b',
  STATUS_ERROR: '#ef4444',

  // Component colors
  RACK_FRAME: '#1e293b',
  COMPONENT_BODY: '#334155',
  COMPONENT_ACTIVE: '#475569',
  COMPONENT_INACTIVE: '#1e293b',

  // Background
  SCENE_BG: '#0f172a',
} as const

// Three.js color objects
export const THREE_COLORS = {
  POWER_AC: new THREE.Color(COLORS.POWER_AC),
  POWER_STANDBY: new THREE.Color(COLORS.POWER_STANDBY),
  POWER_MAIN: new THREE.Color(COLORS.POWER_MAIN),
  STATUS_ON: new THREE.Color(COLORS.STATUS_ON),
  STATUS_OFF: new THREE.Color(COLORS.STATUS_OFF),
  STATUS_BOOTING: new THREE.Color(COLORS.STATUS_BOOTING),
  STATUS_RESETTING: new THREE.Color(COLORS.STATUS_RESETTING),
} as const

// Positions for components in the rack
export const POSITIONS = {
  // Rack dimensions
  RACK: {
    width: 2,
    height: 4,
    depth: 1,
    position: new THREE.Vector3(0, 0, 0),
  },

  // PDU at the top of the rack
  PDU: {
    position: new THREE.Vector3(0, 1.6, 0),
    size: { width: 1.8, height: 0.3, depth: 0.6 },
  },

  // PSU in the middle area
  PSU: {
    position: new THREE.Vector3(-0.5, 0.6, 0),
    size: { width: 0.6, height: 0.4, depth: 0.6 },
  },

  // BMC small box
  BMC: {
    position: new THREE.Vector3(0.5, 0.6, 0),
    size: { width: 0.4, height: 0.3, depth: 0.4 },
  },

  // Server/Compute tray
  SERVER: {
    position: new THREE.Vector3(0, -0.4, 0),
    size: { width: 1.6, height: 0.6, depth: 0.8 },
  },
} as const

// Power flow paths (start -> end positions)
export const POWER_FLOW_PATHS = {
  // AC to PDU (from top)
  AC_TO_PDU: {
    start: new THREE.Vector3(0, 2.5, 0),
    end: POSITIONS.PDU.position.clone(),
    color: COLORS.POWER_AC,
  },

  // PDU to PSU
  PDU_TO_PSU: {
    start: POSITIONS.PDU.position.clone().add(new THREE.Vector3(-0.5, -0.15, 0)),
    end: POSITIONS.PSU.position.clone().add(new THREE.Vector3(0, 0.2, 0)),
    color: COLORS.POWER_AC,
  },

  // PSU Standby to BMC
  PSU_STANDBY_TO_BMC: {
    start: POSITIONS.PSU.position.clone().add(new THREE.Vector3(0.3, 0, 0)),
    end: POSITIONS.BMC.position.clone().add(new THREE.Vector3(-0.2, 0, 0)),
    color: COLORS.POWER_STANDBY,
  },

  // PSU Main to Server
  PSU_MAIN_TO_SERVER: {
    start: POSITIONS.PSU.position.clone().add(new THREE.Vector3(0, -0.2, 0)),
    end: POSITIONS.SERVER.position.clone().add(new THREE.Vector3(-0.4, 0.3, 0)),
    color: COLORS.POWER_MAIN,
  },
} as const

// LED positions relative to component
export const LED_OFFSETS = {
  PDU: {
    power: new THREE.Vector3(0.7, 0.16, 0.31),
    outlet: new THREE.Vector3(0.5, 0.16, 0.31),
  },
  PSU: {
    standby: new THREE.Vector3(-0.2, 0.21, 0.31),
    main: new THREE.Vector3(0.1, 0.21, 0.31),
  },
  BMC: {
    status: new THREE.Vector3(0, 0.16, 0.21),
    network: new THREE.Vector3(0.1, 0.16, 0.21),
  },
  SERVER: {
    power: new THREE.Vector3(-0.6, 0.31, 0.41),
    activity: new THREE.Vector3(-0.45, 0.31, 0.41),
  },
} as const

// Animation settings
export const ANIMATION = {
  PARTICLE_COUNT: 100,
  PARTICLE_SPEED: 0.5,
  PARTICLE_SIZE: 0.03,
  LED_BLINK_SPEED: 2,
  POWER_RAMP_SPEED: 2,
} as const
