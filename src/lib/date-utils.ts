import { formatInTimeZone, toDate } from 'date-fns-tz'

const NJ_TIMEZONE = 'America/New_York'

/**
 * Parses a date string or object and converts it to a New Jersey local date.
 * If it's a YYYY-MM-DD string, we treat it as local to NJ to avoid daily shifts.
 */
export function parseNJDate(date: any): Date {
    if (!date) return new Date()
    
    // If it's a YYYY-MM-DD string, we force it to be parsed in NJ timezone
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return toDate(`${date}T00:00:00`, { timeZone: NJ_TIMEZONE })
    }
    
    return toDate(date, { timeZone: NJ_TIMEZONE })
}

/**
 * Formats a date specifically for New Jersey time.
 * Default format is MM-dd-yyyy as requested.
 */
export function formatNJDate(date: any, formatStr: string = 'MM-dd-yyyy'): string {
    const d = parseNJDate(date)
    return formatInTimeZone(d, NJ_TIMEZONE, formatStr)
}
