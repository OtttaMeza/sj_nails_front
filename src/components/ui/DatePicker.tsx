'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameDay,
  isBefore,
  isToday,
  parseISO,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

export default function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Selecciona una fecha',
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) return startOfMonth(parseISO(value))
    if (min) return startOfMonth(parseISO(min))
    return startOfMonth(new Date())
  })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? parseISO(value) : null
  const minDate = min ? startOfDay(parseISO(min)) : null

  const firstDay = startOfMonth(viewDate)
  const lastDay = endOfMonth(viewDate)
  const gridStart = startOfWeek(firstDay, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(lastDay, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const openCalendar = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const calendarHeight = 340
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= calendarHeight
      ? rect.bottom + window.scrollY + 6
      : rect.top + window.scrollY - calendarHeight - 6

    setCoords({ top, left: rect.left + window.scrollX, width: rect.width })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleOutsideClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        calendarRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }

    function handleScroll() { setOpen(false) }
    function handleResize() { setOpen(false) }

    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  function selectDay(day: Date) {
    if (minDate && isBefore(startOfDay(day), minDate)) return
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function goToday() {
    const today = new Date()
    if (!minDate || !isBefore(startOfDay(today), minDate)) {
      onChange(format(today, 'yyyy-MM-dd'))
      setViewDate(startOfMonth(today))
      setOpen(false)
    } else {
      setViewDate(startOfMonth(minDate))
    }
  }

  return (
    <div className={className}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openCalendar()}
        className={[
          'w-full flex items-center gap-2.5 rounded-xl border px-3 py-3 text-xs smooth-transition shadow-sm text-left cursor-pointer',
          open
            ? 'border-brand-primary-600 ring-2 ring-brand-primary-500/20 bg-white'
            : 'border-slate-300 bg-white hover:border-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600',
          'disabled:opacity-60 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <CalendarDays className={`w-4 h-4 flex-shrink-0 smooth-transition ${open ? 'text-brand-primary-600' : 'text-slate-400'}`} />

        <span className={`flex-1 ${selectedDate ? 'font-semibold text-slate-950' : 'font-normal text-slate-400'}`}>
          {selectedDate
            ? format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
            : placeholder}
        </span>

        {selectedDate && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), onChange(''))}
            className="text-slate-400 hover:text-slate-700 smooth-transition rounded p-0.5 -mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Floating calendar portal */}
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={calendarRef}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            width: Math.max(coords.width, 280),
            zIndex: 9999,
          }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-4"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 smooth-transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-900 capitalize tracking-wide">
              {format(viewDate, 'MMMM yyyy', { locale: es })}
            </span>

            <button
              type="button"
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 smooth-transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-extrabold text-slate-400 uppercase py-1 tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map(day => {
              const isCurrentMonth = day.getMonth() === viewDate.getMonth()
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const isDisabled = minDate ? isBefore(startOfDay(day), minDate) : false
              const isTodayDate = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={[
                    'h-8 w-full flex items-center justify-center rounded-lg text-[11px] font-bold smooth-transition',
                    isSelected
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30 scale-105'
                      : isDisabled
                        ? 'text-slate-200 cursor-not-allowed'
                        : isCurrentMonth
                          ? 'text-slate-800 hover:bg-brand-primary-100 hover:text-brand-primary-700 cursor-pointer'
                          : 'text-slate-300 hover:bg-slate-50 cursor-pointer',
                    isTodayDate && !isSelected ? 'ring-1 ring-brand-primary ring-inset font-extrabold' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goToday}
              className="text-[11px] font-bold text-brand-primary-600 hover:text-brand-primary-700 smooth-transition cursor-pointer px-2 py-1 rounded-lg hover:bg-brand-primary-100"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 smooth-transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}