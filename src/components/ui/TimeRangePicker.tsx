'use client'

import { Clock, X } from 'lucide-react'

interface TimeRangePickerProps {
  startTime: string
  endTime: string
  onStartChange: (time: string) => void
  onEndChange: (time: string) => void
  minHour?: number
  maxHour?: number
  stepMinutes?: number
  disabled?: boolean
}

function generateSlots(minHour: number, maxHour: number, step: number): string[] {
  const slots: string[] = []
  for (let h = minHour; h <= maxHour; h++) {
    for (let m = 0; m < 60; m += step) {
      if (h === maxHour && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

export default function TimeRangePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  minHour = 7,
  maxHour = 22,
  stepMinutes = 30,
  disabled,
}: TimeRangePickerProps) {
  const slots = generateSlots(minHour, maxHour, stepMinutes)

  function handleSlotClick(slot: string) {
    if (disabled) return

    // Both already set → reset and start new selection
    if (startTime && endTime) {
      onStartChange(slot)
      onEndChange('')
      return
    }

    // Start set, no end
    if (startTime && !endTime) {
      if (slot > startTime) {
        onEndChange(slot)
      } else {
        // Click on same or earlier slot → move start
        onStartChange(slot)
      }
      return
    }

    // Nothing set → set start
    onStartChange(slot)
  }

  function clear() {
    onStartChange('')
    onEndChange('')
  }

  const hasSelection = startTime || endTime
  const selectionComplete = startTime && endTime

  const hint = !startTime
    ? 'Toca un bloque para fijar la hora de inicio'
    : !endTime
      ? 'Ahora toca un bloque posterior para la hora de fin'
      : null

  return (
    <div className="space-y-2">
      {/* Summary bar */}
      <div className={[
        'flex items-center justify-between px-3 py-2.5 rounded-xl border smooth-transition',
        selectionComplete
          ? 'bg-brand-primary-100 border-brand-primary-500/30'
          : 'bg-slate-50 border-slate-200',
      ].join(' ')}>
        <div className="flex items-center gap-3">
          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${selectionComplete ? 'text-brand-primary-600' : 'text-slate-400'}`} />
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black tabular-nums ${startTime ? 'text-slate-900' : 'text-slate-400'}`}>
              {startTime || '--:--'}
            </span>
            <span className={`text-xs font-bold ${selectionComplete ? 'text-brand-primary-500' : 'text-slate-300'}`}>→</span>
            <span className={`text-xs font-black tabular-nums ${endTime ? 'text-slate-900' : 'text-slate-400'}`}>
              {endTime || '--:--'}
            </span>
          </div>
          {selectionComplete && (
            <span className="text-[10px] font-bold text-brand-primary-600 bg-brand-primary-100 px-2 py-0.5 rounded-full border border-brand-primary-500/20">
              {(() => {
                const [sh, sm] = startTime.split(':').map(Number)
                const [eh, em] = endTime.split(':').map(Number)
                const mins = (eh * 60 + em) - (sh * 60 + sm)
                return mins >= 60
                  ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`
                  : `${mins}m`
              })()}
            </span>
          )}
        </div>
        {hasSelection && (
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="text-slate-400 hover:text-slate-700 smooth-transition p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Hint text */}
      {hint && (
        <p className="text-[10px] text-slate-500 font-medium px-1">{hint}</p>
      )}

      {/* Time slots grid */}
      <div className={[
        'grid grid-cols-4 gap-1.5 max-h-[156px] overflow-y-auto p-2.5 rounded-xl border',
        'bg-slate-50/80 border-slate-200',
        disabled ? 'opacity-50 pointer-events-none' : '',
      ].join(' ')}>
        {slots.map(slot => {
          const isStart = slot === startTime
          const isEnd = slot === endTime
          const inRange = startTime && endTime && slot > startTime && slot < endTime

          return (
            <button
              key={slot}
              type="button"
              onClick={() => handleSlotClick(slot)}
              className={[
                'py-1.5 rounded-lg text-[11px] font-bold text-center border smooth-transition select-none',
                isStart || isEnd
                  ? 'bg-brand-primary border-brand-primary text-white shadow-sm scale-[1.04]'
                  : inRange
                    ? 'bg-brand-primary-100 border-brand-primary-500/25 text-brand-primary-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 cursor-pointer',
              ].join(' ')}
            >
              {slot}
            </button>
          )
        })}
      </div>
    </div>
  )
}