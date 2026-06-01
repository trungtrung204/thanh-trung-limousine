import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapBookingToApi } from "@/lib/transport-api";

export async function GET() {
  const user = await requireUserApi();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để xem vé." }, { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: {
        cancellations: true,
        payments: true,
        seatHolds: true,
        tickets: true,
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
