'use client'

import { PowerRailIndicator } from './PowerRailIndicator'
import { OperationLog } from './OperationLog'
import { usePowerRails, useComponentStates } from '@/hooks/usePowerMachine'
import { COLORS } from '@/lib/constants'

function ComponentStatus({ name, state }: { name: string; state: string }) {
  const getColor = () => {
    switch (state) {
      case 'on': return '#22c55e'
      case 'booting': return '#f59e0b'
      case 'resetting': return '#ef4444'
      default: return '#64748b'
    }
  }

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{name}</span>
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getColor() }}
        />
        <span
          className="font-mono uppercase"
          style={{ color: getColor() }}
        >
          {state}
        </span>
      </div>
    </div>
  )
}

export default function StatusPanel() {
  const powerRails = usePowerRails()
  const components = useComponentStates()

  return (
    <div className="h-full flex flex-col bg-slate-800/80 backdrop-blur-sm">
      {/* Header */}
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">System Status</h3>
      </div>

      {/* Power Rails */}
      <div className="p-3 border-b border-slate-700">
        <div className="text-xs font-medium text-slate-400 mb-2">POWER RAILS</div>
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

      {/* Component States */}
      <div className="p-3 border-b border-slate-700">
        <div className="text-xs font-medium text-slate-400 mb-2">COMPONENTS</div>
        <div className="space-y-1.5">
          <ComponentStatus name="PDU" state={components.pdu} />
          <ComponentStatus name="PSU" state={components.psu} />
          <ComponentStatus name="BMC" state={components.bmc} />
          <ComponentStatus name="Server" state={components.server} />
        </div>
      </div>

      {/* Operation Log */}
      <div className="flex-1 min-h-0">
        <OperationLog />
      </div>
    </div>
  )
}
