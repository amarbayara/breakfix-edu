'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  RotateCcw,
  Power,
  PowerOff,
  RefreshCw,
  Cpu,
} from 'lucide-react'
import { PowerRailIndicator } from './PowerRailIndicator'
import { OperationButton } from './OperationButton'
import { OperationLog } from './OperationLog'
import {
  usePowerMachine,
  usePowerRails,
  useAvailableOperations,
  useCurrentOperation,
  useFleaDrainRemaining,
  useCurrentState,
} from '@/hooks/usePowerMachine'
import { COLORS } from '@/lib/constants'

export default function ControlPanel() {
  const { send } = usePowerMachine()
  const powerRails = usePowerRails()
  const available = useAvailableOperations()
  const currentOperation = useCurrentOperation()
  const fleaDrainRemaining = useFleaDrainRemaining()
  const currentState = useCurrentState()

  // Format current state for display
  const formatState = (state: unknown): string => {
    if (typeof state === 'string') return state
    if (typeof state === 'object' && state !== null) {
      const keys = Object.keys(state)
      if (keys.length > 0) {
        return keys.map(k => `${k}: ${formatState((state as Record<string, unknown>)[k])}`).join(', ')
      }
    }
    return 'unknown'
  }

  const stateDisplay = formatState(currentState)

  return (
    <div className="h-full flex flex-col bg-slate-800/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-semibold text-slate-200">
          Power Operations Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Interactive data center power operations demo
        </p>
      </div>

      {/* Current State */}
      <div className="p-4 border-b border-slate-700">
        <div className="text-xs font-medium text-slate-400 mb-2">CURRENT STATE</div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="text-sm font-mono text-slate-300 break-all">
            {currentOperation ? (
              <span className="text-amber-400">
                {currentOperation.replace(/_/g, ' ')}
                {currentOperation === 'AC_POWER_CYCLE' && fleaDrainRemaining > 0 && (
                  <span className="ml-2 text-amber-300">
                    ({fleaDrainRemaining}s remaining)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-green-400">IDLE - System Operational</span>
            )}
          </div>
        </div>
      </div>

      {/* Power Rails */}
      <div className="p-4 border-b border-slate-700">
        <div className="text-xs font-medium text-slate-400 mb-3">POWER RAILS</div>
        <div className="space-y-2">
          <PowerRailIndicator
            label="AC"
            voltage={powerRails.ac.voltage}
            maxVoltage={powerRails.ac.maxVoltage}
            color={COLORS.POWER_AC}
          />
          <PowerRailIndicator
            label="Standby"
            voltage={powerRails.standby.voltage}
            maxVoltage={powerRails.standby.maxVoltage}
            color={COLORS.POWER_STANDBY}
          />
          <PowerRailIndicator
            label="Main"
            voltage={powerRails.main.voltage}
            maxVoltage={powerRails.main.maxVoltage}
            color={COLORS.POWER_MAIN}
          />
        </div>
      </div>

      {/* Operations */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Layer 0 - AC Power */}
        <div>
          <div className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            LAYER 0 - AC POWER
          </div>
          <OperationButton
            label="AC Power Cycle"
            description="Flea drain (30s) - cuts all power"
            icon={Zap}
            onClick={() => send({ type: 'START_AC_POWER_CYCLE' })}
            disabled={!available.canAcPowerCycle}
            layer={0}
          />
        </div>

        {/* Layer 1 - BMC */}
        <div>
          <div className="text-xs font-medium text-yellow-400 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            LAYER 1 - MANAGEMENT
          </div>
          <OperationButton
            label="BMC Reset"
            description="Resets management controller"
            icon={RotateCcw}
            onClick={() => send({ type: 'START_BMC_RESET' })}
            disabled={!available.canBmcReset}
            layer={1}
          />
        </div>

        {/* Layer 2 - Chassis */}
        <div>
          <div className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            LAYER 2 - CHASSIS
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <OperationButton
                  label="Power OFF"
                  icon={PowerOff}
                  onClick={() => send({ type: 'START_CHASSIS_POWER_OFF' })}
                  disabled={!available.canChassisPowerOff}
                  layer={2}
                />
              </div>
              <div className="flex-1">
                <OperationButton
                  label="Power ON"
                  icon={Power}
                  onClick={() => send({ type: 'START_CHASSIS_POWER_ON' })}
                  disabled={!available.canChassisPowerOn}
                  layer={2}
                />
              </div>
            </div>
            <OperationButton
              label="DC Power Cycle"
              description="Cold reboot - clears volatile states"
              icon={RefreshCw}
              onClick={() => send({ type: 'START_DC_POWER_CYCLE' })}
              disabled={!available.canDcPowerCycle}
              layer={2}
            />
          </div>
        </div>

        {/* Layer 3 - Platform */}
        <div>
          <div className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            LAYER 3 - PLATFORM
          </div>
          <OperationButton
            label="Warm Reset"
            description="CPU reset - power stays on"
            icon={Cpu}
            onClick={() => send({ type: 'START_WARM_RESET' })}
            disabled={!available.canWarmReset}
            layer={3}
          />
        </div>
      </div>

      {/* Operation Log */}
      <div className="h-48 border-t border-slate-700">
        <OperationLog />
      </div>
    </div>
  )
}
