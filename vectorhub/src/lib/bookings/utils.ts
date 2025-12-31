/**
 * Shared utilities for booking management
 */

export interface TimeSlot {
    start: string;
    end: string;
    available?: boolean;
}

export interface BookingSlot {
    startTime: string;
    endTime: string;
}

/**
 * Generate available time slots for a given day
 * @param startTime - Day start time in HH:mm format
 * @param endTime - Day end time in HH:mm format
 * @param duration - Slot duration in minutes
 * @param existingBookings - Array of existing bookings to check for conflicts
 * @param date - The date to generate slots for
 * @param includeAvailability - Whether to include availability status (default: true)
 */
export function generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    existingBookings: BookingSlot[],
    date: Date,
    includeAvailability: boolean = true
): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const current = new Date(date);
    current.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMin, 0, 0);

    const now = new Date();

    while (current < endDate) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        if (slotEnd > endDate) break;

        const slot: TimeSlot = {
            start: current.toISOString(),
            end: slotEnd.toISOString(),
        };

        if (includeAvailability) {
            // Check if slot is in the past
            const isPast = current < now;

            // Check if slot conflicts with existing bookings
            const hasConflict = existingBookings.some((booking) => {
                const bookingStart = new Date(booking.startTime);
                const bookingEnd = new Date(booking.endTime);
                return current < bookingEnd && slotEnd > bookingStart;
            });

            slot.available = !isPast && !hasConflict;
        }

        slots.push(slot);
        current.setMinutes(current.getMinutes() + duration);
    }

    return slots;
}

/**
 * Check if a time slot conflicts with existing bookings
 */
export function hasBookingConflict(
    startTime: string,
    endTime: string,
    existingBookings: BookingSlot[],
    excludeBookingId?: string
): boolean {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return existingBookings.some((booking) => {
        // Skip the booking being updated
        if (excludeBookingId && (booking as any).id === excludeBookingId) {
            return false;
        }
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return start < bookingEnd && end > bookingStart;
    });
}

/**
 * Validate that a time is within business hours
 */
export function isWithinBusinessHours(
    time: string,
    businessStart: string,
    businessEnd: string
): boolean {
    const timeDate = new Date(time);
    const hours = timeDate.getHours();
    const minutes = timeDate.getMinutes();
    const timeMinutes = hours * 60 + minutes;

    const [startHour, startMin] = businessStart.split(":").map(Number);
    const [endHour, endMin] = businessEnd.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

/**
 * Format a date for display
 */
export function formatBookingDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Format a time for display
 */
export function formatBookingTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Get the next available date for booking (skipping unavailable days)
 */
export function getNextAvailableDate(
    availability: Record<string, { start: string; end: string } | null>,
    startFrom: Date = new Date()
): Date | null {
    const maxDays = 30; // Look up to 30 days ahead
    const current = new Date(startFrom);
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < maxDays; i++) {
        const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
        if (availability[dayName]) {
            return current;
        }
        current.setDate(current.getDate() + 1);
    }

    return null;
}
