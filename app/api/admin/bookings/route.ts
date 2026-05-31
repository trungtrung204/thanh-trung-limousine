import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapBookingToApi } from "@/lib/transport-api";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Bạn không có quyền quản trị." }, { status: 403 });
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
      }
    });

    return NextResponse.json({ bookings: bookings.map(mapBookingToApi) });
  } catch {
    return NextResponse.json({ error: "Không thể tải danh sách đặt vé." }, { status: 500 });
  }
}
