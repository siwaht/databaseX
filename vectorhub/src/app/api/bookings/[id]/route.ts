import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { updateBooking, deleteBooking } from "@/lib/bookings/store";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const data = await request.json();

        // Prevent updating immutable fields if necessary, or just pass through
        const updatedBooking = await updateBooking(id, data);

        if (!updatedBooking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json(updatedBooking);
    } catch (error) {
        logger.error(`PATCH /api/bookings/${params.id} failed`, error as Error);
        return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const success = await deleteBooking(id);

        if (!success) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error(`DELETE /api/bookings/${params.id} failed`, error as Error);
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
