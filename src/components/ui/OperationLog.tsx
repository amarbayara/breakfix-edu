'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOperationLog } from '@/hooks/usePowerMachine'
import type { LogEntry } from '@/types/power'

const layerLabels: Record<number, string> = {
  0: 'L0',
  1: 'L1',
  2: 'L2',
  3: 'L3',
}

const layerColors: Record<number, string> = {
  0: 'text-blue-400',
  1: 'text-yellow-400',
  2: 'text-orange-400',
  3: 'text-purple-400',
}

const typeColors: Record<LogEntry['type'], string> = {
  info: 'text-slate-300',
  warning: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-green-400',
}

export function OperationLog() {
  const logs = useOperationLog()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  // Show last 20 logs
  const recentLogs = logs.slice(-20)

  return (
    <div className="h-full flex flex-col">
      <div className="text-xs font-medium text-slate-400 px-3 py-2 border-b border-slate-700">
        OPERATION LOG
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs"
      >
        <AnimatePresence initial={false}>
          {recentLogs.map((log, index) => (
            <motion.div
              key={log.timestamp + index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2"
            >
              <span className={layerColors[log.layer]}>
                [{layerLabels[log.layer]}]
              </span>
              <span className={typeColors[log.type]}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {recentLogs.length === 0 && (
          <div className="text-slate-500 text-center py-4">
            No operations yet
          </div>
        )}
      </div>
    </div>
  )
}
