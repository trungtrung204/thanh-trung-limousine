import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function mapCancellation(item: Awaited<ReturnType<typeof getCancellationRows>>[number]) {
  return {
    bookingCode: item.booking.code,
    bookingId: item.bookingId,
    createdAt: item.createdAt.toISOString(),
    customerEmail: item.user.email,
    customerName: item.user.name,
    customerPhone: item.phone || item.user.phone || "",
    id: item.id,
    note: item.note || "",
    reason: item.reason,
    route: item.booking.trip.route,
    seatCodes: item.booking.seatHolds.map((seat) => seat.seatNo).sort(),
    status: item.status,
    totalAmount: item.booking.totalAmount,
    travelDate: item.booking.trip.departureAt.toISOString()
  };
}

function getCancellationRows() {
  return prisma.cancellationRequest.findMany({
    include: {
      booking: {
        include: {
          seatHolds: true,
          trip: true
        }
      },
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
}

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const cancellations = await getCancellationRows();
    return NextResponse.json({ cancellations: cancellations.map(mapCancellation) });
  } catch {
    return NextResponse.json({ error: "Không thể tải yêu cầu hủy vé." }, { status: 500 });
  }
}
