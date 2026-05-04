import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay()

export default function CustomDatePicker({ value, onChange, style }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [viewMonth, setViewMonth] = useState(value ? value.getMonth() : new Date().getMonth())
  const [viewYear, setViewYear] = useState(value ? value.getFullYear() : new Date().getFullYear())
  
  const containerRef = useRef(null)

  useEffect(() => {
    if (value) {
      setViewMonth(value.getMonth())
      setViewYear(value.getFullYear())
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleDateSelect = (day) => {
    const newDate = new Date(viewYear, viewMonth, day)
    onChange(newDate)
    setIsOpen(false)
  }

  const renderGrid = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear)
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear)
    
    const prevMonthDays = getDaysInMonth(viewMonth === 0 ? 11 : viewMonth - 1, viewMonth === 0 ? viewYear - 1 : viewYear)
    
    const grid = []
    
    for (let i = 0; i < firstDay; i++) {
      grid.push(
        <div key={`empty-${i}`} className="calendar-day empty">
           {prevMonthDays - firstDay + i + 1}
        </div>
      )
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = value && value.getDate() === i && value.getMonth() === viewMonth && value.getFullYear() === viewYear
      grid.push(
        <div 
          key={`day-${i}`} 
          className={`calendar-day ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateSelect(i)}
        >
          {i}
        </div>
      )
    }

    const totalSlots = Math.ceil(grid.length / 7) * 7
    for (let i = grid.length, j = 1; i < totalSlots; i++, j++) {
      grid.push(
        <div key={`empty-end-${i}`} className="calendar-day empty">
          {j}
        </div>
      )
    }
    
    return grid
  }

  const formatDate = (date) => {
    if (!date) return 'Select date'
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return (
    <div className="custom-datepicker-container" ref={containerRef} style={style}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ minWidth: 160 }}
      >
        <span className="custom-select-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={16} style={{ color: 'var(--text-tertiary)' }} />
          {formatDate(value)}
        </span>
      </div>

      {isOpen && (
        <div className="custom-datepicker-popover">
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
            <div className="calendar-dropdowns">
              <select 
                className="calendar-select" 
                value={viewMonth} 
                onChange={(e) => setViewMonth(parseInt(e.target.value))}
              >
                {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
              </select>
              <select 
                className="calendar-select" 
                value={viewYear} 
                onChange={(e) => setViewYear(parseInt(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => 2026 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button className="calendar-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
          </div>
          
          <div className="calendar-weekdays">
            <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
          </div>
          
          <div className="calendar-grid">
            {renderGrid()}
          </div>
        </div>
      )}
    </div>
  )
}
