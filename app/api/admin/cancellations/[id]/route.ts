import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeStatus(value: unknown) {
  return value === "APPROVED" || value === "REJECTED" ? value : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const status = normalizeStatus(body.status);

    if (!status) {
      return NextResponse.json({ error: "Trạng thái xử lý không hợp lệ." }, { status: 400 });
    }

    const current = await prisma.cancellationRequest.findUnique({
      include: {
        booking: {
          include: {
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
      where: { id }
    });

    if (!current) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu hủy vé." }, { status: 404 });
    }

    if (current.status !== "PENDING") {
      return NextResponse.json({ error: "Yêu cầu hủy vé này đã được xử lý." }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancellation = await tx.cancellationRequest.update({
        data: {
          status
        },
        where: { id: current.id }
      });

      if (status === "APPROVED") {
        await tx.booking.update({
          data: {
            status: "CANCELLED"
          },
          where: {
            id: current.bookingId
          }
        });

        await tx.seatHold.deleteMany({
          where: {
            bookingId: current.bookingId
          }
        });

        await tx.ticket.deleteMany({
          where: {
            bookingId: current.bookingId
          }
        });
      }

      return cancellation;
    });

    return NextResponse.json({
      cancellation: {
        bookingCode: current.booking.code,
        bookingId: current.bookingId,
        createdAt: current.createdAt.toISOString(),
        customerEmail: current.user.email,
        customerName: current.user.name,
        customerPhone: current.phone || current.user.phone || "",
        id: updated.id,
        note: updated.note || "",
        reason: updated.reason,
        route: current.booking.trip.route,
        seatCodes: current.booking.seatHolds.map((seat) => seat.seatNo).sort(),
        status: updated.status,
        totalAmount: current.booking.totalAmount,
        travelDate: current.booking.trip.departureAt.toISOString()
      }
    });
  } catch {
    return NextResponse.json({ error: "Không thể xử lý yêu cầu hủy vé." }, { status: 500 });
  }
}
