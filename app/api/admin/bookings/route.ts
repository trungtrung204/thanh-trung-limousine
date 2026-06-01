import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapBookingToApi } from "@/lib/transport-api";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
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
      }
    });

    return NextResponse.json({ bookings: bookings.map(mapBookingToApi) });
  } catch {
    return NextResponse.json({ error: "Không thể tải danh sách đặt vé." }, { status: 500 });
  }
}
