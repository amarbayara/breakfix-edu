'use client'

import dynamic from 'next/dynamic'
import { PowerMachineProvider } from '@/hooks/usePowerMachine'

// Dynamic imports for client-side only components
const DataCenterScene = dynamic(
  () => import('@/components/3d/DataCenterScene'),
  { ssr: false }
)

const OperationsPanel = dynamic(
  () => import('@/components/ui/OperationsPanel'),
  { ssr: false }
)

const StatusPanel = dynamic(
  () => import('@/components/ui/StatusPanel'),
  { ssr: false }
)

const TerminalComponent = dynamic(
  () => import('@/components/terminal/TerminalComponent'),
  { ssr: false }
)

export default function Home() {
  return (
    <PowerMachineProvider>
      <main className="h-screen w-screen flex flex-col bg-slate-900">
        {/* Top bar */}
        <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4">
          <h1 className="text-lg font-bold text-white">
            DC Power Operations Simulator
          </h1>
          <span className="text-sm text-slate-400 ml-4">
            Interactive visualization of data center power operations
          </span>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex min-h-0">
          {/* Left panel - Operations */}
          <div className="w-[380px] border-r border-slate-700 overflow-y-auto bg-slate-900/50">
            <OperationsPanel />
          </div>

          {/* Center - 3D Scene */}
          <div className="flex-1 relative">
            <DataCenterScene />
          </div>

          {/* Right panel - Status */}
          <div className="w-[280px] border-l border-slate-700 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <StatusPanel />
            </div>
          </div>
        </div>

        {/* Bottom - Terminal */}
        <div className="h-[200px] border-t border-slate-700">
          <TerminalComponent />
        </div>
      </main>
    </PowerMachineProvider>
  )
}
