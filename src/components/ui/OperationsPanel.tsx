'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  RotateCcw,
  Power,
  PowerOff,
  RefreshCw,
  Cpu,
  type LucideIcon,
} from 'lucide-react'
import {
  usePowerMachine,
  useAvailableOperations,
  useCurrentOperation,
  useFleaDrainRemaining,
} from '@/hooks/usePowerMachine'

interface OperationCardProps {
  layer: 0 | 1 | 2 | 3
  title: string
  color: string
  children: React.ReactNode
}

function OperationCard({ layer, title, color, children }: OperationCardProps) {
  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <div
        className="px-4 py-2 border-b border-slate-700 flex items-center gap-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold" style={{ color }}>
          LAYER {layer}
        </span>
        <span className="text-xs text-slate-400">- {title}</span>
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  )
}

interface BigButtonProps {
  label: string
  description?: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  color: string
  active?: boolean
}

function BigButton({ label, description, icon: Icon, onClick, disabled, color, active }: BigButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 rounded-lg border-2 text-left transition-all
        flex items-center gap-4
        ${disabled
          ? 'bg-slate-800/50 border-slate-700 cursor-not-allowed opacity-40'
          : 'bg-slate-800 hover:bg-slate-700 cursor-pointer'
        }
        ${active ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''}
      `}
      style={{
        borderColor: disabled ? '#334155' : `${color}60`,
        ...(active ? { ringColor: color } : {})
      }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      <div
        className={`p-3 rounded-lg ${disabled ? 'bg-slate-700' : ''}`}
        style={{ backgroundColor: disabled ? undefined : `${color}20` }}
      >
        <Icon
          className="w-6 h-6"
          style={{ color: disabled ? '#64748b' : color }}
        />
      </div>
      <div className="flex-1">
        <div
          className="text-base font-semibold"
          style={{ color: disabled ? '#64748b' : '#e2e8f0' }}
        >
          {label}
        </div>
        {description && (
          <div className="text-xs text-slate-400 mt-0.5">
            {description}
          </div>
        )}
      </div>
    </motion.button>
  )
}

export default function OperationsPanel() {
  const { send } = usePowerMachine()
  const available = useAvailableOperations()
  const currentOperation = useCurrentOperation()
  const fleaDrainRemaining = useFleaDrainRemaining()

  const isOperationActive = (op: string) => currentOperation === op

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white">Power Operations</h2>
        <p className="text-sm text-slate-400 mt-1">
          Click to trigger operations
        </p>
      </div>

      {/* Current Operation Status */}
      {currentOperation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 text-center"
        >
          <div className="text-amber-400 font-semibold">
            {currentOperation.replace(/_/g, ' ')}
          </div>
          {currentOperation === 'AC_POWER_CYCLE' && (
            <div className="text-amber-300 text-2xl font-mono mt-1">
              {fleaDrainRemaining}s
            </div>
          )}
        </motion.div>
      )}

      {/* Layer 0 - AC Power */}
      <OperationCard layer={0} title="AC POWER" color="#3b82f6">
        <BigButton
          label="AC Power Cycle"
          description="Flea drain - cuts ALL power (30s)"
          icon={Zap}
          onClick={() => send({ type: 'START_AC_POWER_CYCLE' })}
          disabled={!available.canAcPowerCycle}
          color="#3b82f6"
          active={isOperationActive('AC_POWER_CYCLE')}
        />
      </OperationCard>

      {/* Layer 1 - BMC */}
      <OperationCard layer={1} title="MANAGEMENT" color="#eab308">
        <BigButton
          label="BMC Reset"
          description="Resets management controller only"
          icon={RotateCcw}
          onClick={() => send({ type: 'START_BMC_RESET' })}
          disabled={!available.canBmcReset}
          color="#eab308"
          active={isOperationActive('BMC_RESET')}
        />
      </OperationCard>

      {/* Layer 2 - Chassis */}
      <OperationCard layer={2} title="CHASSIS / DC POWER" color="#f97316">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <BigButton
              label="Power OFF"
              icon={PowerOff}
              onClick={() => send({ type: 'START_CHASSIS_POWER_OFF' })}
              disabled={!available.canChassisPowerOff}
              color="#f97316"
              active={isOperationActive('CHASSIS_POWER_OFF')}
            />
            <BigButton
              label="Power ON"
              icon={Power}
              onClick={() => send({ type: 'START_CHASSIS_POWER_ON' })}
              disabled={!available.canChassisPowerOn}
              color="#f97316"
              active={isOperationActive('CHASSIS_POWER_ON')}
            />
          </div>
          <BigButton
            label="DC Power Cycle"
            description="Cold reboot - clears volatile states"
            icon={RefreshCw}
            onClick={() => send({ type: 'START_DC_POWER_CYCLE' })}
            disabled={!available.canDcPowerCycle}
            color="#f97316"
            active={isOperationActive('DC_POWER_CYCLE')}
          />
        </div>
      </OperationCard>

      {/* Layer 3 - Platform */}
      <OperationCard layer={3} title="PLATFORM / CPU" color="#a855f7">
        <BigButton
          label="Warm Reset"
          description="CPU reset only - power stays on"
          icon={Cpu}
          onClick={() => send({ type: 'START_WARM_RESET' })}
          disabled={!available.canWarmReset}
          color="#a855f7"
          active={isOperationActive('WARM_RESET')}
        />
      </OperationCard>
    </div>
  )
}
