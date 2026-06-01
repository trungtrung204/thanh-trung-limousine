import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapBookingToApi } from "@/lib/transport-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    const current = await prisma.booking.findFirst({
      include: {
        payments: true,
        tickets: true
      },
      where: {
        OR: [{ id }, { code: id }]
      }
    });

    if (!current) {
      return NextResponse.json({ error: "Không tìm thấy đơn đặt vé." }, { status: 404 });
    }

    if (current.status === "CONFIRMED" || current.tickets.length > 0) {
      return NextResponse.json(
        { error: "Đơn đã xác nhận thanh toán không thể từ chối tại bước này." },
        { status: 409 }
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        data: {
          status: "FAILED"
        },
        where: {
          bookingId: current.id
        }
      });

      await tx.seatHold.deleteMany({
        where: {
          bookingId: current.id
        }
      });

      await tx.booking.update({
        data: {
          note: reason || current.note,
          status: "REJECTED"
        },
        where: {
          id: current.id
        }
      });

      return tx.booking.findUniqueOrThrow({
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
        where: { id: current.id }
      });
    });

    return NextResponse.json({ booking: mapBookingToApi(booking) });
  } catch {
    return NextResponse.json({ error: "Không thể từ chối đơn đặt vé." }, { status: 500 });
  }
}
