// /**
//  * date-utils.ts
//  *
//  * Centralized date parsing and formatting for ibidz.
//  *
//  * Storage format  (DB / backend):  DD/MM/YYYY HH:mm   (24-hour, e.g. "25/06/2025 14:30")
//  * Display format  (UI / picker):   MM/DD/YYYY hh:mm AM/PM  (12-hour US, e.g. "06/25/2025 02:30 PM")
//  *
//  * Rules:
//  *  - NEVER manipulate date strings inline in components.
//  *  - ALL parsing uses date-fns `parse()` so the format is explicit.
//  *  - ALL formatting uses date-fns `format()`.
//  */

// import { parse, format, isValid } from "date-fns";
// import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

// // ─── Format tokens ───────────────────────────────────────────────────────────

// /** Format used in SQLite / backend payloads */
// const STORAGE_DATE_FORMAT = "dd/MM/yyyy"
// const STORAGE_DATETIME_FORMAT = "dd/MM/yyyy HH:mm"

// /** Format shown to users in the UI */
// const DISPLAY_DATE_FORMAT = "MM/dd/yyyy"
// const DISPLAY_DATETIME_FORMAT = "MM/dd/yyyy hh:mm aa" // aa = AM/PM
// export const US_TIME_ZONES = {
//   ET: "America/New_York",
//   CT: "America/Chicago",
//   MT: "America/Denver",
//   PT: "America/Los_Angeles",
//   AKT: "America/Anchorage",
//   HST: "Pacific/Honolulu",
// } as const


// // ─── Core parsers ────────────────────────────────────────────────────────────

// /**
//  * Parse a stored date/time string ("DD/MM/YYYY HH:mm") into a JS Date.
//  * Returns `null` when the string is absent or unparseable.
//  */
// export function parseStorageDate(dateStr: string | null | undefined): Date | null {
//   if (!dateStr || typeof dateStr !== "string") return null

//   const trimmed = dateStr.trim()

//   // Stored datetime: DD/MM/YYYY HH:mm
//   const full = parse(trimmed, STORAGE_DATETIME_FORMAT, new Date())

//  if (isValid(full)) {
//   return fromZonedTime(full, AUCTION_TIME_ZONE)
// }

//   // Stored date-only: DD/MM/YYYY
//   const dateOnly = parse(trimmed, STORAGE_DATE_FORMAT, new Date())

// if (isValid(dateOnly)) {
//   return fromZonedTime(dateOnly, AUCTION_TIME_ZONE)
// }

//   return null
// }

// /**
//  * Parse a stored date-only string ("DD/MM/YYYY") into a JS Date.
//  * Convenience wrapper around parseStorageDate for date-only contexts.
//  */
// export function parseStorageDateOnly(
//   dateStr: string | null | undefined
// ): Date | null {
//   if (!dateStr || typeof dateStr !== "string") return null;

//   const d = parse(
//     dateStr.trim(),
//     STORAGE_DATE_FORMAT,
//     new Date(2000, 0, 1)
//   );

//   if (!isValid(d)) return null;

//   // Keep the calendar date exactly as stored.
//   // Do not convert this date through a timezone because
//   // the DateRangePicker works with calendar dates.
//   return new Date(
//     d.getFullYear(),
//     d.getMonth(),
//     d.getDate()
//   );
// }

// // ─── Formatters for storage (backend payloads) ───────────────────────────────

// /**
//  * Format a Date object to the storage date-only string: "DD/MM/YYYY"
//  */
// export function formatDateForStorage(date: Date | null | undefined): string {
//   if (!date || !isValid(date)) return ""
//   return format(date, STORAGE_DATE_FORMAT)
// }

// /**
//  * Build a full storage datetime string: "DD/MM/YYYY HH:mm"
//  * @param date  JS Date (provides day/month/year)
//  * @param time24  "HH:mm" 24-hour time string from the calendar's onSelect callback
//  */
// export function formatForStorage(
//   date: Date | null | undefined,
//   time24: string
// ): string {
//   if (!date || !isValid(date)) return ""

//   const [hh, mm] = time24.split(":").map((s) => s.trim())

//   const d = new Date(date)

//   d.setHours(
//     parseInt(hh, 10) || 0,
//     parseInt(mm, 10) || 0,
//     0,
//     0
//   )

//   return format(d, STORAGE_DATETIME_FORMAT)
// }

// /**
//  * Build the duration storage string: "DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm"
//  */
// export function formatDurationForStorage(
//   startDate: Date | null,
//   startTime: string,
//   endDate: Date | null,
//   endTime: string,
// ): string {
//   if (!startDate || !endDate) return ""
//   return `${formatForStorage(startDate, startTime)} to ${formatForStorage(endDate, endTime)}`
// }

// // ─── Formatters for display (what users see) ─────────────────────────────────

// /**
//  * Format a Date to the display date-only string: "MM/DD/YYYY"
//  */
// export function formatDateForDisplay(date: Date | null | undefined): string {
//   if (!date || !isValid(date)) return ""
//   return format(date, DISPLAY_DATE_FORMAT)
// }

// /**
//  * Build a full display datetime string: "MM/DD/YYYY hh:mm AM/PM"
//  * @param date  JS Date (provides day/month/year)
//  * @param time24  "HH:mm" 24-hour time string
//  */
// export function formatForDisplay(date: Date | null | undefined, time24: string): string {
//   if (!date || !isValid(date)) return ""
//   const [hh, mm] = time24.split(":").map((s) => s.trim())
//   const d = new Date(date)
//   d.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0)
//   return format(d, DISPLAY_DATETIME_FORMAT)
// }

// /**
//  * Build the duration display string: "MM/DD/YYYY hh:mm AM/PM to MM/DD/YYYY hh:mm AM/PM"
//  */
// export function formatDurationForDisplay(
//   startDate: Date | null,
//   startTime: string,
//   endDate: Date | null,
//   endTime: string,
// ): string {
//   if (!startDate) return ""
//   const start = formatForDisplay(startDate, startTime)
//   if (!endDate) return `${start} - Select End Date`
//   return `${start} to ${formatForDisplay(endDate, endTime)}`
// }

// // ─── Direct storage → display conversions ────────────────────────────────────

// /**
//  * Convert a 24-hour time string "HH:mm" to 12-hour display "hh:mm AM/PM".
//  */
// export function time24ToDisplay(time24: string): string {
//   if (!time24) return ""
//   // Use a reference date so date-fns can format time
//   const ref = parse(time24.trim(), "HH:mm", new Date())
//   if (!isValid(ref)) return time24
//   return format(ref, "hh:mm aa")
// }

// /**
//  * Convert a stored datetime string "DD/MM/YYYY HH:mm" to display "MM/DD/YYYY hh:mm AM/PM".
//  * Safe — returns the original string unchanged if it cannot be parsed.
//  */
// export function formatStorageDateTimeForDisplay(
//   storedStr: string | null | undefined
// ): string {
//   if (!storedStr || typeof storedStr !== "string") return ""

//   const d = parseStorageDate(storedStr)

//   if (!d) return storedStr

// return formatInTimeZone(
//   d,
//   AUCTION_TIME_ZONE,
//   DISPLAY_DATETIME_FORMAT
// )
// }

// /**
//  * Convert a stored duration string "DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm"
//  * to the display equivalent "MM/DD/YYYY hh:mm AM/PM to MM/DD/YYYY hh:mm AM/PM".
//  * Falls back to the raw string if parsing fails.
//  */
// export function formatStorageDurationForDisplay(durationStr: string | null | undefined): string {
//   if (!durationStr || typeof durationStr !== "string") return ""
//   const parts = durationStr.split(" to ")
//   if (parts.length !== 2) return durationStr
//   const start = formatStorageDateTimeForDisplay(parts[0].trim())
//   const end = formatStorageDateTimeForDisplay(parts[1].trim())
//   if (!start || !end) return durationStr
//   return `${start} to ${end}`
// }

// export function parseDurationStringForDisplay(durationStr: string | null | undefined): string {
//   return formatStorageDurationForDisplay(durationStr)
// }


// // ─── Edit-mode helper: parse stored duration back to picker state ─────────────

// export interface ParsedDuration {
//   startDate: Date | null
//   startTime: string // "HH:mm" 24-hour, ready for picker
//   endDate: Date | null
//   endTime: string   // "HH:mm" 24-hour, ready for picker
// }

// /**
//  * Parse a stored duration string "DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm"
//  * into the four state values the DateRangePicker expects.
//  */
// export function parseStorageDuration(durationStr: string | null | undefined): ParsedDuration {
//   const empty: ParsedDuration = { startDate: null, startTime: "12:00", endDate: null, endTime: "12:00" }
//   if (!durationStr || typeof durationStr !== "string") return empty

//   const parts = durationStr.split(" to ")
//   if (parts.length !== 2) return empty

//   const [startStr, endStr] = parts

//   // Each part is "DD/MM/YYYY HH:mm"
//   const startDateStr = startStr.trim().split(" ")[0]  // "DD/MM/YYYY"
//   const startTimeStr = startStr.trim().split(" ")[1]  // "HH:mm"
//   const endDateStr = endStr.trim().split(" ")[0]
//   const endTimeStr = endStr.trim().split(" ")[1]

//   const startDate = parseStorageDateOnly(startDateStr)
//   const endDate = parseStorageDateOnly(endDateStr)

//   return {
//     startDate,
//     startTime: startTimeStr || "12:00",
//     endDate,
//     endTime: endTimeStr || "12:00",
//   }
// }

// /**
//  * Parse a stored single datetime string "DD/MM/YYYY HH:mm"
//  * into { date, time } the DateTimePicker expects.
//  */
// export function parseStorageSingleDateTime(
//   str: string | null | undefined
// ): { date: Date | null; time: string } {
//   if (!str || typeof str !== "string") {
//     return { date: null, time: "12:00" }
//   }

//   const [datePart, timePart] = str.trim().split(" ")

//   const date = parseStorageDateOnly(datePart)

//   return {
//     date,
//     time: timePart || "12:00",
//   }
// }

// export function parseDurationToUnix(duration: string): {
//   start: number;
//   end: number;
// } {
//   const parts = duration.split(" to ")

//   if (parts.length !== 2) {
//     throw new Error(`Invalid duration: ${duration}`)
//   }

//   const startDate = parseStorageDate(parts[0].trim())
//   const endDate = parseStorageDate(parts[1].trim())

//   if (!startDate || !endDate) {
//     throw new Error(`Failed to parse duration: ${duration}`)
//   }

//   return {
//     start: Math.floor(startDate.getTime() / 1000),
//     end: Math.floor(endDate.getTime() / 1000),
//   }
// }


/**
 * date-utils.ts
 *
 * Centralized date parsing, formatting and timezone utilities for IBIDZ.
 *
 * IMPORTANT:
 * - Auction times are stored as UTC Unix timestamps in the backend.
 * - Auction display/input times are based on the property's US timezone.
 * - Never assume the browser's local timezone for auction calculations.
 */

import { parse, format, isValid } from "date-fns"
import {
  fromZonedTime,
  formatInTimeZone,
} from "date-fns-tz"

// ─────────────────────────────────────────────────────────────────────────────
// Storage / Display formats
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_DATE_FORMAT = "dd/MM/yyyy"
const STORAGE_DATETIME_FORMAT = "dd/MM/yyyy HH:mm"

const DISPLAY_DATE_FORMAT = "MM/dd/yyyy"
const DISPLAY_DATETIME_FORMAT = "MM/dd/yyyy hh:mm aa"

// ─────────────────────────────────────────────────────────────────────────────
// USA Timezones
// ─────────────────────────────────────────────────────────────────────────────

export const US_TIME_ZONES = {
  EASTERN: "America/New_York",
  CENTRAL: "America/Chicago",
  MOUNTAIN: "America/Denver",
  PACIFIC: "America/Los_Angeles",
  ARIZONA: "America/Phoenix",
  ALASKA: "America/Anchorage",
  HAWAII: "Pacific/Honolulu",
} as const

export type USTimeZone =
  (typeof US_TIME_ZONES)[keyof typeof US_TIME_ZONES]

// ─────────────────────────────────────────────────────────────────────────────
// US State → Timezone
// ─────────────────────────────────────────────────────────────────────────────

const US_STATE_TIMEZONES: Record<string, USTimeZone> = {
  // Eastern
  Alabama: US_TIME_ZONES.EASTERN,
  Connecticut: US_TIME_ZONES.EASTERN,
  Delaware: US_TIME_ZONES.EASTERN,
  Florida: US_TIME_ZONES.EASTERN,
  Georgia: US_TIME_ZONES.EASTERN,
  Indiana: US_TIME_ZONES.EASTERN,
  Kentucky: US_TIME_ZONES.EASTERN,
  Maine: US_TIME_ZONES.EASTERN,
  Maryland: US_TIME_ZONES.EASTERN,
  Massachusetts: US_TIME_ZONES.EASTERN,
  Michigan: US_TIME_ZONES.EASTERN,
  New_Hampshire: US_TIME_ZONES.EASTERN,
  New_Jersey: US_TIME_ZONES.EASTERN,
  New_York: US_TIME_ZONES.EASTERN,
  North_Carolina: US_TIME_ZONES.EASTERN,
  Ohio: US_TIME_ZONES.EASTERN,
  Pennsylvania: US_TIME_ZONES.EASTERN,
  Rhode_Island: US_TIME_ZONES.EASTERN,
  South_Carolina: US_TIME_ZONES.EASTERN,
  Tennessee: US_TIME_ZONES.EASTERN,
  Vermont: US_TIME_ZONES.EASTERN,
  Virginia: US_TIME_ZONES.EASTERN,
  West_Virginia: US_TIME_ZONES.EASTERN,

  // Central
  Arkansas: US_TIME_ZONES.CENTRAL,
  Illinois: US_TIME_ZONES.CENTRAL,
  Iowa: US_TIME_ZONES.CENTRAL,
  Kansas: US_TIME_ZONES.CENTRAL,
  Louisiana: US_TIME_ZONES.CENTRAL,
  Minnesota: US_TIME_ZONES.CENTRAL,
  Mississippi: US_TIME_ZONES.CENTRAL,
  Missouri: US_TIME_ZONES.CENTRAL,
  Nebraska: US_TIME_ZONES.CENTRAL,
  North_Dakota: US_TIME_ZONES.CENTRAL,
  Oklahoma: US_TIME_ZONES.CENTRAL,
  South_Dakota: US_TIME_ZONES.CENTRAL,
  Texas: US_TIME_ZONES.CENTRAL,
  Wisconsin: US_TIME_ZONES.CENTRAL,

  // Mountain
  Colorado: US_TIME_ZONES.MOUNTAIN,
  Idaho: US_TIME_ZONES.MOUNTAIN,
  Montana: US_TIME_ZONES.MOUNTAIN,
  New_Mexico: US_TIME_ZONES.MOUNTAIN,
  Utah: US_TIME_ZONES.MOUNTAIN,
  Wyoming: US_TIME_ZONES.MOUNTAIN,

  // Pacific
  California: US_TIME_ZONES.PACIFIC,
  Nevada: US_TIME_ZONES.PACIFIC,
  Oregon: US_TIME_ZONES.PACIFIC,
  Washington: US_TIME_ZONES.PACIFIC,

  // Arizona
  Arizona: US_TIME_ZONES.ARIZONA,

  // Alaska
  Alaska: US_TIME_ZONES.ALASKA,

  // Hawaii
  Hawaii: US_TIME_ZONES.HAWAII,
}

// ─────────────────────────────────────────────────────────────────────────────
// State → Timezone helper
// ─────────────────────────────────────────────────────────────────────────────

export function getUSStateTimeZone(
  state: string | null | undefined
): USTimeZone {
  if (!state) {
    return US_TIME_ZONES.CENTRAL
  }

  const normalized = state
    .trim()
    .replace(/\s+/g, "_")

  return (
    US_STATE_TIMEZONES[normalized] ??
    US_TIME_ZONES.CENTRAL
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Core parsers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse stored datetime:
 *
 * DD/MM/YYYY HH:mm
 *
 * The returned Date represents the correct instant in time
 * assuming the stored value belongs to the supplied timezone.
 */
export function parseStorageDate(
  dateStr: string | null | undefined,
  timeZone: string = US_TIME_ZONES.CENTRAL
): Date | null {
  if (!dateStr || typeof dateStr !== "string") {
    return null
  }

  const trimmed = dateStr.trim()

  const full = parse(
    trimmed,
    STORAGE_DATETIME_FORMAT,
    new Date(2000, 0, 1)
  )

  if (isValid(full)) {
    return fromZonedTime(full, timeZone)
  }

  const dateOnly = parse(
    trimmed,
    STORAGE_DATE_FORMAT,
    new Date(2000, 0, 1)
  )

  if (isValid(dateOnly)) {
    return fromZonedTime(dateOnly, timeZone)
  }

  return null
}

/**
 * Parse date-only value:
 *
 * DD/MM/YYYY
 *
 * This intentionally keeps the calendar date without
 * converting it through a timezone.
 */
export function parseStorageDateOnly(
  dateStr: string | null | undefined
): Date | null {
  if (!dateStr || typeof dateStr !== "string") {
    return null
  }

  const d = parse(
    dateStr.trim(),
    STORAGE_DATE_FORMAT,
    new Date(2000, 0, 1)
  )

  if (!isValid(d)) {
    return null
  }

  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage formatters
// ─────────────────────────────────────────────────────────────────────────────

export function formatDateForStorage(
  date: Date | null | undefined
): string {
  if (!date || !isValid(date)) {
    return ""
  }

  return format(date, STORAGE_DATE_FORMAT)
}

/**
 * Format date + 24-hour time for storage.
 *
 * IMPORTANT:
 * This function only creates the human-readable storage string.
 * UTC conversion is handled separately.
 */
export function formatForStorage(
  date: Date | null | undefined,
  time24: string
): string {
  if (!date || !isValid(date)) {
    return ""
  }

  const [hh, mm] = time24
    .split(":")
    .map((s) => s.trim())

  const d = new Date(date)

  d.setHours(
    Number.parseInt(hh, 10) || 0,
    Number.parseInt(mm, 10) || 0,
    0,
    0
  )

  return format(d, STORAGE_DATETIME_FORMAT)
}

export function formatDurationForStorage(
  startDate: Date | null,
  startTime: string,
  endDate: Date | null,
  endTime: string
): string {
  if (!startDate || !endDate) {
    return ""
  }

  return `${formatForStorage(
    startDate,
    startTime
  )} to ${formatForStorage(endDate, endTime)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Display formatters
// ─────────────────────────────────────────────────────────────────────────────

export function formatDateForDisplay(
  date: Date | null | undefined
): string {
  if (!date || !isValid(date)) {
    return ""
  }

  return format(date, DISPLAY_DATE_FORMAT)
}

export function formatForDisplay(
  date: Date | null | undefined,
  time24: string
): string {
  if (!date || !isValid(date)) {
    return ""
  }

  const [hh, mm] = time24
    .split(":")
    .map((s) => s.trim())

  const d = new Date(date)

  d.setHours(
    Number.parseInt(hh, 10) || 0,
    Number.parseInt(mm, 10) || 0,
    0,
    0
  )

  return format(d, DISPLAY_DATETIME_FORMAT)
}

export function formatDurationForDisplay(
  startDate: Date | null,
  startTime: string,
  endDate: Date | null,
  endTime: string
): string {
  if (!startDate) {
    return ""
  }

  const start = formatForDisplay(
    startDate,
    startTime
  )

  if (!endDate) {
    return `${start} - Select End Date`
  }

  return `${start} to ${formatForDisplay(
    endDate,
    endTime
  )}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Time conversion
// ─────────────────────────────────────────────────────────────────────────────

export function time24ToDisplay(
  time24: string
): string {
  if (!time24) {
    return ""
  }

  const ref = parse(
    time24.trim(),
    "HH:mm",
    new Date(2000, 0, 1)
  )

  if (!isValid(ref)) {
    return time24
  }

  return format(ref, "hh:mm aa")
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage → Display
// ─────────────────────────────────────────────────────────────────────────────

export function formatStorageDateTimeForDisplay(
  storedStr: string | null | undefined,
  timeZone: string = US_TIME_ZONES.CENTRAL
): string {
  if (!storedStr || typeof storedStr !== "string") {
    return ""
  }

  const d = parseStorageDate(
    storedStr,
    timeZone
  )

  if (!d) {
    return storedStr
  }

  return formatInTimeZone(
    d,
    timeZone,
    DISPLAY_DATETIME_FORMAT
  )
}

export function formatStorageDurationForDisplay(
  durationStr: string | null | undefined,
  timeZone: string = US_TIME_ZONES.CENTRAL
): string {
  if (!durationStr || typeof durationStr !== "string") {
    return ""
  }

  const parts = durationStr.split(" to ")

  if (parts.length !== 2) {
    return durationStr
  }

  const start = formatStorageDateTimeForDisplay(
    parts[0].trim(),
    timeZone
  )

  const end = formatStorageDateTimeForDisplay(
    parts[1].trim(),
    timeZone
  )

  if (!start || !end) {
    return durationStr
  }

  return `${start} to ${end}`
}

export function parseDurationStringForDisplay(
  durationStr: string | null | undefined,
  timeZone: string = US_TIME_ZONES.CENTRAL
): string {
  return formatStorageDurationForDisplay(
    durationStr,
    timeZone
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit-mode helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedDuration {
  startDate: Date | null
  startTime: string
  endDate: Date | null
  endTime: string
}

export function parseStorageDuration(
  durationStr: string | null | undefined
): ParsedDuration {
  const empty: ParsedDuration = {
    startDate: null,
    startTime: "12:00",
    endDate: null,
    endTime: "12:00",
  }

  if (!durationStr || typeof durationStr !== "string") {
    return empty
  }

  const parts = durationStr.split(" to ")

  if (parts.length !== 2) {
    return empty
  }

  const [startStr, endStr] = parts

  const startParts = startStr.trim().split(" ")
  const endParts = endStr.trim().split(" ")

  const startDate = parseStorageDateOnly(
    startParts[0]
  )

  const endDate = parseStorageDateOnly(
    endParts[0]
  )

  return {
    startDate,
    startTime: startParts[1] || "12:00",
    endDate,
    endTime: endParts[1] || "12:00",
  }
}

export function parseStorageSingleDateTime(
  str: string | null | undefined
): {
  date: Date | null
  time: string
} {
  if (!str || typeof str !== "string") {
    return {
      date: null,
      time: "12:00",
    }
  }

  const [datePart, timePart] = str
    .trim()
    .split(" ")

  return {
    date: parseStorageDateOnly(datePart),
    time: timePart || "12:00",
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Timezone-aware conversion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a local auction date/time into a UTC Unix timestamp.
 *
 * Example:
 *
 * 03/20/2026 10:00
 * America/New_York
 *
 * → correct UTC timestamp
 */
export function localDateTimeToUnix(
  date: Date,
  time24: string,
  timeZone: string
): number {
  const [hh, mm] = time24
    .split(":")
    .map((value) => Number.parseInt(value, 10))

  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hh || 0,
    mm || 0,
    0,
    0
  )

  const utcDate = fromZonedTime(
    localDate,
    timeZone
  )

  return Math.floor(
    utcDate.getTime() / 1000
  )
}

/**
 * Convert stored duration into UTC Unix timestamps.
 *
 * The duration is interpreted in the supplied auction timezone.
 */
export function parseDurationToUnix(
  duration: string,
  timeZone: string = US_TIME_ZONES.CENTRAL
): {
  start: number
  end: number
} {
  const parts = duration.split(" to ")

  if (parts.length !== 2) {
    throw new Error(
      `Invalid duration: ${duration}`
    )
  }

  const [startStr, endStr] = parts

  const start = parseStorageDate(
    startStr.trim(),
    timeZone
  )

  const end = parseStorageDate(
    endStr.trim(),
    timeZone
  )

  if (!start || !end) {
    throw new Error(
      `Failed to parse duration: ${duration}`
    )
  }

  return {
    start: Math.floor(
      start.getTime() / 1000
    ),
    end: Math.floor(
      end.getTime() / 1000
    ),
  }
}