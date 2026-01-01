export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'website' | 'chatbot' | 'referral' | 'social' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

// Custom field definition
export type CustomFieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'multiselect' | 'checkbox' | 'date';

export interface CustomField {
    id: string;
    name: string;
    label: string;
    type: CustomFieldType;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select/multiselect
    defaultValue?: string;
}

export interface CustomFieldValue {
    fieldId: string;
    fieldName: string;
    value: string | string[] | boolean | number;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    source: LeadSource;
    status: LeadStatus;
    priority: LeadPriority;
    notes?: string;
    tags?: string[];
    interestedIn?: string;
    preferredContactMethod?: 'email' | 'phone' | 'callback';
    preferredCallbackTime?: string;
    customFields?: CustomFieldValue[]; // Custom captured data
    createdAt: string;
    updatedAt: string;
    assignedTo?: string;
}

export interface EventType {
    id: string;
    name: string;
    description: string;
    duration: number;
    slug: string;
    isActive: boolean;
    color: string;
    customFields?: CustomField[]; // Custom fields for this event type
}

export interface Booking {
    id: string;
    eventTypeId: string;
    eventTypeName: string;
    startTime: string;
    endTime: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guestNotes?: string;
    status: BookingStatus;
    createdAt: string;
    meetingUrl?: string;
    agenda?: string;
    customFields?: CustomFieldValue[]; // Custom captured data
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
    is24x7?: boolean; // If true, bookings are available 24/7 (ignores availability)
    brandColor: string;
    leadCustomFields?: CustomField[]; // Custom fields for all leads
}
