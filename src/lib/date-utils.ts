/**
 * date-utils.ts
 *
 * Centralized date parsing and formatting for ibidz.
 *
 * Storage format  (DB / backend):  DD/MM/YYYY HH:mm   (24-hour, e.g. "25/06/2025 14:30")
 * Display format  (UI / picker):   MM/DD/YYYY hh:mm AM/PM  (12-hour US, e.g. "06/25/2025 02:30 PM")
 *
 * Rules:
 *  - NEVER manipulate date strings inline in components.
 *  - ALL parsing uses date-fns `parse()` so the format is explicit.
 *  - ALL formatting uses date-fns `format()`.
 */

import { parse, format, isValid } from "date-fns"

// ─── Format tokens ───────────────────────────────────────────────────────────

/** Format used in SQLite / backend payloads */
const STORAGE_DATE_FORMAT = "dd/MM/yyyy"
const STORAGE_DATETIME_FORMAT = "dd/MM/yyyy HH:mm"

/** Format shown to users in the UI */
const DISPLAY_DATE_FORMAT = "MM/dd/yyyy"
const DISPLAY_DATETIME_FORMAT = "MM/dd/yyyy hh:mm aa" // aa = AM/PM

// ─── Core parsers ────────────────────────────────────────────────────────────

/**
 * Parse a stored date/time string ("DD/MM/YYYY HH:mm") into a JS Date.
 * Returns `null` when the string is absent or unparseable.
 */
export function parseStorageDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null

  // Full datetime: "DD/MM/YYYY HH:mm"
  const full = parse(dateStr.trim(), STORAGE_DATETIME_FORMAT, new Date())
  if (isValid(full)) return full

  // Date-only: "DD/MM/YYYY"
  const dateOnly = parse(dateStr.trim(), STORAGE_DATE_FORMAT, new Date())
  if (isValid(dateOnly)) return dateOnly

  return null
}

/**
 * Parse a stored date-only string ("DD/MM/YYYY") into a JS Date.
 * Convenience wrapper around parseStorageDate for date-only contexts.
 */
export function parseStorageDateOnly(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null
  const d = parse(dateStr.trim(), STORAGE_DATE_FORMAT, new Date())
  return isValid(d) ? d : null
}

// ─── Formatters for storage (backend payloads) ───────────────────────────────

/**
 * Format a Date object to the storage date-only string: "DD/MM/YYYY"
 */
export function formatDateForStorage(date: Date | null | undefined): string {
  if (!date || !isValid(date)) return ""
  return format(date, STORAGE_DATE_FORMAT)
}

/**
 * Build a full storage datetime string: "DD/MM/YYYY HH:mm"
 * @param date  JS Date (provides day/month/year)
 * @param time24  "HH:mm" 24-hour time string from the calendar's onSelect callback
 */
export function formatForStorage(date: Date | null | undefined, time24: string): string {
  if (!date || !isValid(date)) return ""
  const [hh, mm] = time24.split(":").map((s) => s.trim())
  const d = new Date(date)
  d.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0)
  return format(d, STORAGE_DATETIME_FORMAT)
}

/**
 * Build the duration storage string: "DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm"
 */
export function formatDurationForStorage(
  startDate: Date | null,
  startTime: string,
  endDate: Date | null,
  endTime: string,
): string {
  if (!startDate || !endDate) return ""
  return `${formatForStorage(startDate, startTime)} to ${formatForStorage(endDate, endTime)}`
}

// ─── Formatters for display (what users see) ─────────────────────────────────

/**
 * Format a Date to the display date-only string: "MM/DD/YYYY"
 */
export function formatDateForDisplay(date: Date | null | undefined): string {
  if (!date || !isValid(date)) return ""
  return format(date, DISPLAY_DATE_FORMAT)
}

/**
 * Build a full display datetime string: "MM/DD/YYYY hh:mm AM/PM"
 * @param date  JS Date (provides day/month/year)
 * @param time24  "HH:mm" 24-hour time string
 */
export function formatForDisplay(date: Date | null | undefined, time24: string): string {
  if (!date || !isValid(date)) return ""
  const [hh, mm] = time24.split(":").map((s) => s.trim())
  const d = new Date(date)
  d.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0)
  return format(d, DISPLAY_DATETIME_FORMAT)
}

/**
 * Build the duration display string: "MM/DD/YYYY hh:mm AM/PM to MM/DD/YYYY hh:mm AM/PM"
 */
export function formatDurationForDisplay(
  startDate: Date | null,
  startTime: string,
  endDate: Date | null,
  endTime: string,
): string {
  if (!startDate) return ""
  const start = formatForDisplay(startDate, startTime)
  if (!endDate) return `${start} - Select End Date`
  return `${start} to ${formatForDisplay(endDate, endTime)}`
}

// ─── Direct storage → display conversions ────────────────────────────────────

/**
 * Convert a 24-hour time string "HH:mm" to 12-hour display "hh:mm AM/PM".
 */
export function time24ToDisplay(time24: string): string {
  if (!time24) return ""
  // Use a reference date so date-fns can format time
  const ref = parse(time24.trim(), "HH:mm", new Date())
  if (!isValid(ref)) return time24
  return format(ref, "hh:mm aa")
}

/**
 * Convert a stored datetime string "DD/MM/YYYY HH:mm" to display "MM/DD/YYYY hh:mm AM/PM".
 * Safe — returns the original string unchanged if it cannot be parsed.
 */
export function formatStorageDateTimeForDisplay(storedStr: string | null | undefined): string {
  if (!storedStr || typeof storedStr !== "string") return ""
  const d = parseStorageDate(storedStr)
  if (!d) return storedStr
  return format(d, DISPLAY_DATETIME_FORMAT)
}

/**
 * Convert a stored duration string "DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm"
 * to the display equivalent "MM/DD/YYYY hh:mm AM/PM to MM/DD/YYYY hh:mm AM/PM".
 * Falls back to the raw string if parsing fails.
 */
export function formatStorageDurationForDisplay(durationStr: string | null | undefined): string {
  if (!durationStr || typeof durationStr !== "string") return ""
  const parts = durationStr.split(" to ")
  if (parts.length !== 2) return durationStr
  const start = formatStorageDateTimeForDisplay(parts[0].trim())
  const end = formatStorageDateTimeForDisplay(parts[1].trim())
  if (!start || !end) return durationStr
  return `${start} to ${end}`
}

export function parseDurationStringForDisplay(durationStr: string | null | undefined): string {
  return formatStorageDurationForDisplay(durationStr)
}


// ─── Edit-mode helper: parse stored duration back to picker state ─────────────

export interface ParsedDuration {
  startDate: Date | null
  startTime: string // "HH:mm" 24-hour, ready for picker
  endDate: Date | null
  endTime: string   // "HH:mm" 24-hour, ready for picker
}

/**
 * Parse a stored duration string "DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm"
 * into the four state values the DateRangePicker expects.
 */
export function parseStorageDuration(durationStr: string | null | undefined): ParsedDuration {
  const empty: ParsedDuration = { startDate: null, startTime: "12:00", endDate: null, endTime: "12:00" }
  if (!durationStr || typeof durationStr !== "string") return empty

  const parts = durationStr.split(" to ")
  if (parts.length !== 2) return empty

  const [startStr, endStr] = parts

  // Each part is "DD/MM/YYYY HH:mm"
  const startDateStr = startStr.trim().split(" ")[0]  // "DD/MM/YYYY"
  const startTimeStr = startStr.trim().split(" ")[1]  // "HH:mm"
  const endDateStr = endStr.trim().split(" ")[0]
  const endTimeStr = endStr.trim().split(" ")[1]

  const startDate = parseStorageDateOnly(startDateStr)
  const endDate = parseStorageDateOnly(endDateStr)

  return {
    startDate,
    startTime: startTimeStr || "12:00",
    endDate,
    endTime: endTimeStr || "12:00",
  }
}

/**
 * Parse a stored single datetime string "DD/MM/YYYY HH:mm"
 * into { date, time } the DateTimePicker expects.
 */
export function parseStorageSingleDateTime(str: string | null | undefined): { date: Date | null; time: string } {
  if (!str || typeof str !== "string") return { date: null, time: "12:00" }
  const [datePart, timePart] = str.trim().split(" ")
  const date = parseStorageDateOnly(datePart)
  return { date, time: timePart || "12:00" }
}
