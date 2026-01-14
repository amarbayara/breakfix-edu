'use client'

import { useEffect, useRef, useState } from 'react'
import { usePowerMachine } from '@/hooks/usePowerMachine'
import { parseCommand } from './commandParser'

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system'
  content: string
}

export default function TerminalComponent() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: '=== DC Power Operations Console ===' },
    { type: 'system', content: 'Type "help" for available commands.' },
    { type: 'system', content: '' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { send } = usePowerMachine()

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  // Focus input on click
  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  const handleSubmit = () => {
    if (!input.trim()) return

    // Add input to history
    setHistory(prev => [...prev, input])
    setHistoryIndex(-1)

    // Add input line
    setLines(prev => [...prev, { type: 'input', content: `$ ${input}` }])

    // Parse and execute command
    const result = parseCommand(input)

    // Handle clear command
    if (result.output === '__CLEAR__') {
      setLines([
        { type: 'system', content: '=== DC Power Operations Console ===' },
        { type: 'system', content: '' },
      ])
    } else {
      // Add output lines
      const outputLines = result.output.split('\n').map(line => ({
        type: (result.isError ? 'error' : 'output') as TerminalLine['type'],
        content: line,
      }))
      setLines(prev => [...prev, ...outputLines, { type: 'system', content: '' }])

      // Dispatch event if present
      if (result.event) {
        send(result.event)
      }
    }

    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex] || '')
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Simple tab completion for common commands
      const completions = [
        'ipmitool chassis power ',
        'ipmitool mc ',
        'help',
        'status',
        'clear',
        'flea-drain',
        'GET /redfish/v1/',
        'POST /redfish/v1/',
      ]
      const match = completions.find(c => c.startsWith(input.toLowerCase()))
      if (match) {
        setInput(match)
      }
    }
  }

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return 'text-green-400'
      case 'output':
        return 'text-slate-300'
      case 'error':
        return 'text-red-400'
      case 'system':
        return 'text-amber-400'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full bg-slate-900 font-mono text-sm overflow-y-auto cursor-text"
      onClick={handleContainerClick}
    >
      <div className="p-3 min-h-full">
        {/* Output lines */}
        {lines.map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} whitespace-pre-wrap`}>
            {line.content}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center">
          <span className="text-green-400">$&nbsp;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-slate-200 caret-green-400"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  )
}
