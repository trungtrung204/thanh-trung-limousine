import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapBookingToApi } from "@/lib/transport-api";

export async function GET() {
  const user = await requireUser();

  try {
    const bookings = await prisma.booking.findMany({
      include: {
        payments: true,
        seatHolds: true,
        trip: true,
        user: {
          select: {
            email: true,
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        userId: user.id
      }
    });

    return NextResponse.json({ bookings: bookings.map(mapBookingToApi) });
  } catch {
    return NextResponse.json({ error: "Không thể tải vé của bạn." }, { status: 500 });
  }
}
