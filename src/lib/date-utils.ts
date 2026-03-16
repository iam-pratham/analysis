/**
 * Centralized Date Utilities
 * 
 * To ensure dates NEVER shift (no matter the timezone):
 * 1. We parse everything as a plain YYYY-MM-DD string where possible.
 * 2. We use simple string splitting to display it.
 */

/**
 * Ensures we get a consistent YYYY-MM-DD string from any input.
 */
export function normalizeToStaticDate(date: any): string {
    if (!date) return "";
    
    // If it's already a Date object
    if (date instanceof Date) {
        if (isNaN(date.getTime())) return "";
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        return `${y}-${m < 10 ? `0${m}` : m}-${d < 10 ? `0${d}` : d}`;
    }

    // If it's a string, try to extract YYYY, MM, DD
    if (typeof date === 'string') {
        const parts = date.split(/T|\s/)[0].split(/[\/\-]/);
        if (parts.length === 3) {
            // Check if it's YYYY-MM-DD or MM/DD/YYYY
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1]}-${parts[2]}`;
            } else {
                // Assume MM/DD/YYYY
                let y = parts[2];
                if (y.length === 2) y = parseInt(y) < 50 ? `20${y}` : `19${y}`;
                const m = parts[0].padStart(2, '0');
                const d = parts[1].padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
        }
    }

    return String(date);
}

/**
 * Formats a date string (YYYY-MM-DD) to MM-DD-YYYY without any timezone logic.
 */
export function formatNJDate(date: any): string {
    const staticDate = normalizeToStaticDate(date);
    if (!staticDate || !staticDate.includes('-')) return "N/A";
    
    const [y, m, d] = staticDate.split('-');
    if (!y || !m || !d) return "N/A";
    
    return `${m}-${d}-${y}`;
}

export function parseNJDate(date: any): Date {
    // We return a local Date object but we really want the string.
    // However, to keep compatibility with existing code that expects a Date object:
    const staticDate = normalizeToStaticDate(date);
    if (!staticDate) return new Date();
    const [y, m, d] = staticDate.split('-').map(Number);
    return new Date(y, m - 1, d); // Local time Date
}
