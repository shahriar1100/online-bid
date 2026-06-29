"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "src/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateForStorage, formatDateForDisplay } from "src/lib/date-utils"

interface DateTimePickerProps {
  onSelect: (selectedDate: Date | null, selectedTime: string) => void
  selectedDate: Date | null
  selectedTime: string
  onClose: () => void
}

/**
 * Backward-compat re-exports from date-utils.
 * Consumers that already import these names continue to work unchanged.
 */
// Display format: MM/DD/YYYY
export const formatDateMMDDYYYY = (date: Date | null): string => {
  if (!date) return "Select a date"
  return formatDateForDisplay(date) || "Select a date"
}

// Storage format: DD/MM/YYYY  (kept so existing imports don't break)
export const formatDateDDMMYYYY = (date: Date | null): string => {
  if (!date) return "Select a date"
  return formatDateForStorage(date) || "Select a date"
}

// Helper: convert 24h hour string to 12h hour + period
const to12Hour = (hour24: string): { hour: string; period: "AM" | "PM" } => {
  const h = parseInt(hour24, 10)
  if (h === 0) return { hour: "12", period: "AM" }
  if (h < 12) return { hour: String(h).padStart(2, "0"), period: "AM" }
  if (h === 12) return { hour: "12", period: "PM" }
  return { hour: String(h - 12).padStart(2, "0"), period: "PM" }
}

// Helper: convert 12h hour + period to 24h hour string
const to24Hour = (hour12: string, period: "AM" | "PM"): string => {
  const h = parseInt(hour12, 10)
  if (period === "AM") {
    return h === 12 ? "00" : String(h).padStart(2, "0")
  }
  // PM
  return h === 12 ? "12" : String(h + 12).padStart(2, "0")
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ onSelect, selectedDate, selectedTime, onClose }) => {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(selectedDate)

  // Parse incoming 24h time into 12h components
  const initTime = to12Hour(selectedTime ? selectedTime.split(":")[0] : "12")
  const [localSelectedHour, setLocalSelectedHour] = useState(initTime.hour)
  const [localSelectedMinute, setLocalSelectedMinute] = useState(selectedTime ? selectedTime.split(":")[1] : "00")
  const [localSelectedPeriod, setLocalSelectedPeriod] = useState<"AM" | "PM">(initTime.period)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Adjust for Monday-first week
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => {
      if (prevMonth === 0) {
        setCurrentYear((prevYear) => prevYear - 1)
        return 11
      }
      return prevMonth - 1
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => {
      if (prevMonth === 11) {
        setCurrentYear((prevYear) => prevYear + 1)
        return 0
      }
      return prevMonth + 1
    })
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)
    setLocalSelectedDate(newDate)
  }

  const handleApply = () => {
    // Convert 12h AM/PM back to 24h for internal storage
    const hour24 = to24Hour(localSelectedHour, localSelectedPeriod)
    const formattedTime = `${hour24}:${localSelectedMinute}`
    onSelect(localSelectedDate, formattedTime)
  }

  const handleCancel = () => {
    onClose()
  }

  const days = useMemo(() => {
    const numDays = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const daysArray: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= numDays; i++) {
      daysArray.push(i)
    }
    return daysArray
  }, [currentMonth, currentYear])

  // 12-hour options: 12, 01, 02, ..., 11
  const hourOptions = ["12", ...Array.from({ length: 11 }, (_, i) => String(i + 1).padStart(2, "0"))]
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))
  const periodOptions: ("AM" | "PM")[] = ["AM", "PM"]

  return (
    <div className="p-4 bg-white dark:bg-black rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      {/* disable past date */}
      <div className="grid grid-cols-7 text-center text-sm text-gray-500 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="font-medium w-10 h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {days.map((day, index) => {
          const date = day ? new Date(currentYear, currentMonth, day) : null
          const isToday = date && date.toDateString() === today.toDateString()
          const isSelected = localSelectedDate && date && date.toDateString() === localSelectedDate.toDateString()

          // Check if date is in the past (before today)
          const isPastDate = date ? date.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0) : false

          return (
            <div
              key={index}
              className={`
    w-10 h-10 flex items-center justify-center rounded-md
    ${day === null ? "opacity-0 cursor-default" : ""}
    ${isPastDate ? "opacity-40 text-gray-400" : ""}
    ${isSelected
                  ? "bg-blue-600 text-white cursor-pointer"
                  : !isPastDate
                    ? "cursor-pointer hover:bg-gray-100 text-gray-700"
                    : ""}
    ${isToday && !isPastDate && !isSelected ? "border border-blue-600" : ""}
  `}
              onClick={() => day && !isPastDate && handleDateClick(day)}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="my-6 pt-4 border-t">
        <h3 className="font-medium mb-3">Time Details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="w-full">
            <label htmlFor="hour-select" className="block text-xs font-medium text-gray-500 mb-1">
              Hour
            </label>
            <Select value={localSelectedHour} onValueChange={setLocalSelectedHour}>
              <SelectTrigger className="w-full rounded text-black dark:text-white" id="hour-select">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <label htmlFor="minute-select" className="block text-xs font-medium text-gray-500 mb-1">
              Minute
            </label>
            <Select value={localSelectedMinute} onValueChange={setLocalSelectedMinute}>
              <SelectTrigger className="w-full rounded text-black dark:text-white" id="minute-select">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <label htmlFor="period-select" className="block text-xs font-medium text-gray-500 mb-1">
              AM/PM
            </label>
            <Select value={localSelectedPeriod} onValueChange={(val) => setLocalSelectedPeriod(val as "AM" | "PM")}>
              <SelectTrigger className="w-full rounded text-black dark:text-white" id="period-select">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleCancel}
          className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-6 py-2 bg-[#1e2939] text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export default DateTimePicker
