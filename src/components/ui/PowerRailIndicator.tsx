'use client'

import { motion } from 'framer-motion'

interface PowerRailIndicatorProps {
  label: string
  voltage: number
  maxVoltage: number
  color: string
  unit?: string
}

export function PowerRailIndicator({
  label,
  voltage,
  maxVoltage,
  color,
  unit = 'V',
}: PowerRailIndicatorProps) {
  const percentage = (voltage / maxVoltage) * 100
  const isActive = voltage > 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-16">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: isActive ? color : '#475569' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span
        className="text-xs font-mono w-12 text-right"
        style={{ color: isActive ? color : '#64748b' }}
      >
        {voltage}{unit}
      </span>
    </div>
  )
}
