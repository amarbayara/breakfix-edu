'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface OperationButtonProps {
  label: string
  description?: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger' | 'warning'
  layer?: 0 | 1 | 2 | 3
}

const layerColors = {
  0: { bg: 'bg-blue-600/20', border: 'border-blue-500/50', hover: 'hover:bg-blue-600/30' },
  1: { bg: 'bg-yellow-600/20', border: 'border-yellow-500/50', hover: 'hover:bg-yellow-600/30' },
  2: { bg: 'bg-orange-600/20', border: 'border-orange-500/50', hover: 'hover:bg-orange-600/30' },
  3: { bg: 'bg-purple-600/20', border: 'border-purple-500/50', hover: 'hover:bg-purple-600/30' },
}

export function OperationButton({
  label,
  description,
  icon: Icon,
  onClick,
  disabled = false,
  variant = 'default',
  layer,
}: OperationButtonProps) {
  const colors = layer !== undefined ? layerColors[layer] : null

  const baseClasses = `
    w-full px-4 py-3 rounded-lg border text-left transition-all duration-200
    flex items-center gap-3
  `

  const enabledClasses = colors
    ? `${colors.bg} ${colors.border} ${colors.hover} cursor-pointer`
    : variant === 'danger'
      ? 'bg-red-600/20 border-red-500/50 hover:bg-red-600/30 cursor-pointer'
      : variant === 'warning'
        ? 'bg-amber-600/20 border-amber-500/50 hover:bg-amber-600/30 cursor-pointer'
        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 cursor-pointer'

  const disabledClasses = 'bg-slate-800/50 border-slate-700 cursor-not-allowed opacity-50'

  return (
    <motion.button
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
    >
      {Icon && (
        <Icon
          className={`w-5 h-5 ${disabled ? 'text-slate-500' : 'text-slate-300'}`}
        />
      )}
      <div className="flex-1">
        <div className={`text-sm font-medium ${disabled ? 'text-slate-500' : 'text-slate-200'}`}>
          {label}
        </div>
        {description && (
          <div className={`text-xs ${disabled ? 'text-slate-600' : 'text-slate-400'}`}>
            {description}
          </div>
        )}
      </div>
    </motion.button>
  )
}
