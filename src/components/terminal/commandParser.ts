// Events that can be triggered from terminal commands
type TerminalTriggerableEvent =
  | { type: 'START_AC_POWER_CYCLE' }
  | { type: 'START_BMC_RESET' }
  | { type: 'START_CHASSIS_POWER_OFF' }
  | { type: 'START_CHASSIS_POWER_ON' }
  | { type: 'START_DC_POWER_CYCLE' }
  | { type: 'START_WARM_RESET' }

export interface CommandResult {
  output: string
  event?: TerminalTriggerableEvent
  isError?: boolean
}

// IPMI command patterns
const IPMI_COMMANDS: Record<string, (args: string[]) => CommandResult> = {
  'chassis power status': () => ({
    output: 'Checking chassis power status...',
  }),
  'chassis power on': () => ({
    output: 'Chassis Power Control: Up/On\nCommand initiated successfully.',
    event: { type: 'START_CHASSIS_POWER_ON' },
  }),
  'chassis power off': () => ({
    output: 'Chassis Power Control: Down/Off\nCommand initiated successfully.',
    event: { type: 'START_CHASSIS_POWER_OFF' },
  }),
  'chassis power cycle': () => ({
    output: 'Chassis Power Control: Cycle\nCommand initiated successfully.',
    event: { type: 'START_DC_POWER_CYCLE' },
  }),
  'chassis power reset': () => ({
    output: 'Chassis Power Control: Reset\nCommand initiated successfully.',
    event: { type: 'START_WARM_RESET' },
  }),
  'mc reset cold': () => ({
    output: 'Sent cold reset command to MC\nWaiting for BMC to come back online...',
    event: { type: 'START_BMC_RESET' },
  }),
  'mc info': () => ({
    output: `Device ID                 : 32
Device Revision           : 1
Firmware Revision         : 2.14
IPMI Version              : 2.0
Manufacturer ID           : 11129 (OpenBMC)
Product ID                : 0
Device Available          : yes
Provides Device SDRs      : no
Additional Device Support :
    Sensor Device
    SDR Repository Device
    SEL Device
    FRU Inventory Device`,
  }),
}

// Redfish patterns
const REDFISH_ENDPOINTS: Record<string, (method: string, body?: string) => CommandResult> = {
  '/redfish/v1/Systems/Self': (method) => {
    if (method === 'GET') {
      return {
        output: `{
  "@odata.id": "/redfish/v1/Systems/Self",
  "Id": "Self",
  "Name": "Compute System",
  "SystemType": "Physical",
  "PowerState": "On",
  "Status": {
    "State": "Enabled",
    "Health": "OK"
  }
}`,
      }
    }
    return { output: 'Method not supported', isError: true }
  },
  '/redfish/v1/Systems/Self/Actions/ComputerSystem.Reset': (method, body) => {
    if (method !== 'POST') {
      return { output: 'Method not allowed. Use POST.', isError: true }
    }

    try {
      const parsed = body ? JSON.parse(body) : {}
      const resetType = parsed.ResetType

      switch (resetType) {
        case 'On':
          return {
            output: '{"Message": "Reset action initiated", "ResetType": "On"}',
            event: { type: 'START_CHASSIS_POWER_ON' },
          }
        case 'ForceOff':
          return {
            output: '{"Message": "Reset action initiated", "ResetType": "ForceOff"}',
            event: { type: 'START_CHASSIS_POWER_OFF' },
          }
        case 'PowerCycle':
          return {
            output: '{"Message": "Reset action initiated", "ResetType": "PowerCycle"}',
            event: { type: 'START_DC_POWER_CYCLE' },
          }
        case 'ForceRestart':
          return {
            output: '{"Message": "Reset action initiated", "ResetType": "ForceRestart"}',
            event: { type: 'START_WARM_RESET' },
          }
        default:
          return {
            output: `{"error": "Invalid ResetType: ${resetType}"}`,
            isError: true,
          }
      }
    } catch {
      return { output: '{"error": "Invalid JSON body"}', isError: true }
    }
  },
  '/redfish/v1/Managers/Self/Actions/Manager.Reset': (method, body) => {
    if (method !== 'POST') {
      return { output: 'Method not allowed. Use POST.', isError: true }
    }

    try {
      const parsed = body ? JSON.parse(body) : {}
      if (parsed.ResetType === 'ForceRestart') {
        return {
          output: '{"Message": "BMC Reset initiated", "ResetType": "ForceRestart"}',
          event: { type: 'START_BMC_RESET' },
        }
      }
      return { output: `{"error": "Invalid ResetType"}`, isError: true }
    } catch {
      return { output: '{"error": "Invalid JSON body"}', isError: true }
    }
  },
}

export function parseCommand(input: string): CommandResult {
  const trimmed = input.trim().toLowerCase()

  // Help command
  if (trimmed === 'help') {
    return {
      output: `
Available Commands:
-------------------

IPMI Commands:
  ipmitool chassis power status  - Show power status
  ipmitool chassis power on      - Power on (Layer 2B)
  ipmitool chassis power off     - Power off (Layer 2A)
  ipmitool chassis power cycle   - DC Power Cycle (Layer 2C)
  ipmitool chassis power reset   - Warm Reset (Layer 3)
  ipmitool mc reset cold         - BMC Reset (Layer 1)
  ipmitool mc info               - Show BMC info

Redfish Commands:
  GET /redfish/v1/Systems/Self
  POST /redfish/v1/Systems/Self/Actions/ComputerSystem.Reset
    {"ResetType": "On|ForceOff|PowerCycle|ForceRestart"}
  POST /redfish/v1/Managers/Self/Actions/Manager.Reset
    {"ResetType": "ForceRestart"}

Custom Commands:
  flea-drain                     - AC Power Cycle (Layer 0)
  status                         - Show current state
  clear                          - Clear terminal
  help                           - Show this help
`,
    }
  }

  // Status command
  if (trimmed === 'status') {
    return {
      output: 'Use the control panel to view current state.',
    }
  }

  // Clear command
  if (trimmed === 'clear') {
    return {
      output: '__CLEAR__',
    }
  }

  // Flea drain / AC power cycle
  if (trimmed === 'flea-drain' || trimmed === 'ac-power-cycle') {
    return {
      output: 'Initiating AC Power Cycle (Flea Drain)...\nThis will take 30 seconds.',
      event: { type: 'START_AC_POWER_CYCLE' },
    }
  }

  // Parse IPMI commands
  if (trimmed.startsWith('ipmitool ')) {
    const ipmiCmd = trimmed.replace('ipmitool ', '')
    const handler = IPMI_COMMANDS[ipmiCmd]
    if (handler) {
      return handler([])
    }
    return {
      output: `Unknown ipmitool command: ${ipmiCmd}\nType 'help' for available commands.`,
      isError: true,
    }
  }

  // Parse Redfish commands (GET/POST)
  const redfishMatch = trimmed.match(/^(get|post)\s+(\/redfish\/v1\/[^\s]+)(?:\s+(.*))?$/i)
  if (redfishMatch) {
    const [, method, endpoint, body] = redfishMatch
    const handler = REDFISH_ENDPOINTS[endpoint.toLowerCase()]
    if (handler) {
      return handler(method.toUpperCase(), body)
    }
    return {
      output: `Endpoint not found: ${endpoint}`,
      isError: true,
    }
  }

  // Unknown command
  return {
    output: `Unknown command: ${input}\nType 'help' for available commands.`,
    isError: true,
  }
}
