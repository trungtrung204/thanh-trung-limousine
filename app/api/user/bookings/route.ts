import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapBookingToApi } from "@/lib/transport-api";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Bạn cần đăng nhập để xem vé." }, { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: {
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
