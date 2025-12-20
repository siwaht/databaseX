import { JsonStore } from "@/lib/store/json-store";
import { Booking, BookingSettings, EventType } from "@/types/booking";

// Initialize stores
const bookingsStore = new JsonStore<Booking>("bookings.json");
const settingsStore = new JsonStore<BookingSettings>("booking-settings.json");
const eventTypesStore = new JsonStore<EventType>("event-types.json");

export async function listBookings() {
    return bookingsStore.getAll();
}

export async function createBooking(booking: Booking) {
    return bookingsStore.create(booking);
}

export async function updateBooking(id: string, updates: Partial<Booking>) {
    return bookingsStore.update(id, updates);
}

export async function getBookingSettings() {
    const settings = await settingsStore.getById("default");
    if (!settings) {
        // Return defaults if not set
        return {
            id: "default",
            timezone: "UTC",
            availability: {
                "Monday": { start: "09:00", end: "17:00" },
                "Tuesday": { start: "09:00", end: "17:00" },
                "Wednesday": { start: "09:00", end: "17:00" },
                "Thursday": { start: "09:00", end: "17:00" },
                "Friday": { start: "09:00", end: "17:00" },
                "Saturday": null,
                "Sunday": null
            },
            brandColor: "#000000"
        };
    }
    return settings;
}

export async function saveBookingSettings(settings: Omit<BookingSettings, "id">) {
    const existing = await settingsStore.getById("default");
    if (existing) {
        return settingsStore.update("default", settings);
    } else {
        return settingsStore.create({ ...settings, id: "default" });
    }
}

export async function listEventTypes() {
    return eventTypesStore.getAll();
}

export async function createEventType(eventType: EventType) {
    return eventTypesStore.create(eventType);
}

export async function updateEventType(id: string, updates: Partial<EventType>) {
    return eventTypesStore.update(id, updates);
}

export async function deleteEventType(id: string) {
    return eventTypesStore.delete(id);
}
