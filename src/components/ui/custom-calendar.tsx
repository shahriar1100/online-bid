"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "src/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateForStorage, formatDateForDisplay } from "src/lib/date-utils"

interface DateRangePickerProps {
  onSelect: (startDate: Date | null, startTime: string, endDate: Date | null, endTime: string) => void
  startDate?: Date | null
  startTime?: string
  endDate?: Date | null
  endTime?: string
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

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onSelect,
  startDate = null,
  startTime = "12:00",
  endDate = null,
  endTime = "13:00",
  onClose,
}) => {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const [localStartDate, setLocalStartDate] = useState<Date | null>(startDate)
  const [localEndDate, setLocalEndDate] = useState<Date | null>(endDate)

  // Parse incoming 24h time into 12h components
  const initStart = to12Hour(startTime ? startTime.split(":")[0] : "12")
  const initEnd = to12Hour(endTime ? endTime.split(":")[0] : "13")

  const [localStartHour, setLocalStartHour] = useState(initStart.hour)
  const [localStartMinute, setLocalStartMinute] = useState(startTime ? startTime.split(":")[1] : "00")
  const [localStartPeriod, setLocalStartPeriod] = useState<"AM" | "PM">(initStart.period)

  const [localEndHour, setLocalEndHour] = useState(initEnd.hour)
  const [localEndMinute, setLocalEndMinute] = useState(endTime ? endTime.split(":")[1] : "00")
  const [localEndPeriod, setLocalEndPeriod] = useState<"AM" | "PM">(initEnd.period)

  const [selectionMode, setSelectionMode] = useState<"start" | "end">("start")

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
    return firstDay === 0 ? 6 : firstDay - 1
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

    if (selectionMode === "start") {
      setLocalStartDate(newDate)
      // If end date is before new start date, clear it
      if (localEndDate && newDate > localEndDate) {
        setLocalEndDate(null)
      }
      setSelectionMode("end")
    } else {
      // Only allow end date if it's after start date
      if (localStartDate && newDate >= localStartDate) {
        setLocalEndDate(newDate)
      } else if (!localStartDate) {
        setLocalStartDate(newDate)
      }
    }
  }

  const handleApply = () => {
    // Convert 12h AM/PM back to 24h for internal storage
    const startH24 = to24Hour(localStartHour, localStartPeriod)
    const endH24 = to24Hour(localEndHour, localEndPeriod)
    const formattedStartTime = `${startH24}:${localStartMinute}`
    const formattedEndTime = `${endH24}:${localEndMinute}`
    onSelect(localStartDate, formattedStartTime, localEndDate, formattedEndTime)
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

  const isInRange = (date: Date | null): boolean => {
    if (!date || !localStartDate || !localEndDate) return false
    const dateTime = date.getTime()
    return dateTime >= localStartDate.getTime() && dateTime <= localEndDate.getTime()
  }

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
          const isStartDate = localStartDate && date && date.toDateString() === localStartDate.toDateString()
          const isEndDate = localEndDate && date && date.toDateString() === localEndDate.toDateString()
          const inRange = isInRange(date)
          const isPastDate = date ? date.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0) : false

          return (
            <div
              key={index}
              className={`
                w-10 h-10 flex items-center justify-center rounded-md
                ${day === null ? "opacity-0 cursor-default" : ""}
                ${isPastDate ? "opacity-40 text-gray-400" : ""}
                ${isStartDate || isEndDate
                  ? "bg-blue-600 text-white cursor-pointer"
                  : inRange
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 cursor-pointer"
                    : !isPastDate
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      : ""
                }
                ${isToday && !isPastDate && !isStartDate && !isEndDate ? "border border-blue-600" : ""}
              `}
              onClick={() => day && !isPastDate && handleDateClick(day)}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="my-6 pt-4 border-t">
        <div className="grid grid-cols-1 gap-6">
          {/* Start Time */}
          <div>
            <h3 className="font-medium mb-3">Start Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="start-hour-select"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Hour
                </label>
                <Select value={localStartHour} onValueChange={setLocalStartHour}>
                  <SelectTrigger
                    className="w-full rounded text-black dark:text-white"
                    id="start-hour-select"
                  >
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

              <div>
                <label
                  htmlFor="start-minute-select"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Minute
                </label>
                <Select value={localStartMinute} onValueChange={setLocalStartMinute}>
                  <SelectTrigger
                    className="w-full rounded text-black dark:text-white"
                    id="start-minute-select"
                  >
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

              <div>
                <label
                  htmlFor="start-period-select"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  AM/PM
                </label>
                <Select value={localStartPeriod} onValueChange={(val) => setLocalStartPeriod(val as "AM" | "PM")}>
                  <SelectTrigger
                    className="w-full rounded text-black dark:text-white"
                    id="start-period-select"
                  >
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

          {/* End Time */}
          <div>
            <h3 className="font-medium mb-3">End Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="end-hour-select"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Hour
                </label>
                <Select value={localEndHour} onValueChange={setLocalEndHour}>
                  <SelectTrigger
                    className="w-full rounded text-black dark:text-white"
                    id="end-hour-select"
                  >
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

              <div>
                <label
                  htmlFor="end-minute-select"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Minute
                </label>
                <Select value={localEndMinute} onValueChange={setLocalEndMinute}>
                  <SelectTrigger
                    className="w-full rounded text-black dark:text-white"
                    id="end-minute-select"
                  >
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

              <div>
                <label
                  htmlFor="end-period-select"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  AM/PM
                </label>
                <Select value={localEndPeriod} onValueChange={(val) => setLocalEndPeriod(val as "AM" | "PM")}>
                  <SelectTrigger
                    className="w-full rounded text-black dark:text-white"
                    id="end-period-select"
                  >
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

export default DateRangePicker
