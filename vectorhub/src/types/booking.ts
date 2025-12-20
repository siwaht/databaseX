export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface EventType {
    id: string;
    name: string;
    description: string;
    duration: number; // in minutes
    slug: string;
    isActive: boolean;
    color: string;
}

export interface Booking {
    id: string;
    eventTypeId: string;
    eventTypeName: string;
    startTime: string; // ISO format
    endTime: string; // ISO format
    guestName: string;
    guestEmail: string;
    guestNotes?: string;
    status: BookingStatus;
    createdAt: string;
    meetingUrl?: string;
    agenda?: string;
}

export interface DaySchedule {
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 for Sunday, 6 for Saturday
    slots: {
        start: string; // HH:mm
        end: string; // HH:mm
    }[];
    enabled: boolean;
}

export interface Availability {
    id: string;
    name: string;
    schedule: DaySchedule[];
    isDefault: boolean;
}

export interface BookingSettings {
    id: string; // Singleton "default"
    timezone: string;
    availability: {
        [day: string]: { start: string; end: string } | null
    };
    brandColor: string;
}
