import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { makePaymentReference } from "@/lib/manual-payment";
import { prisma } from "@/lib/prisma";
import { mapBookingToApi } from "@/lib/transport-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function makeTicketQrCode(bookingCode: string, seatNo: string) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TICKET:${bookingCode}:${seatNo}:${random}`;
}

function isUniqueConstraintError(error: unknown) {
  const err = error as { code?: string };
  return err.code === "P2002";
}

export async function POST(_request: Request, context: RouteContext) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findFirst({
        include: {
          payments: true,
          seatHolds: true,
          tickets: true
        },
        where: {
          OR: [{ id }, { code: id }]
        }
      });

      if (!current) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      const now = new Date();
      const existingPayment = current.payments[0];
      if (existingPayment) {
        await tx.payment.update({
          data: {
            balanceDate: now,
            paidAt: now,
            reference: existingPayment.reference || makePaymentReference(current.code),
            status: "PAID"
          },
          where: { id: existingPayment.id }
        });
      } else {
        await tx.payment.create({
          data: {
            amount: current.totalAmount,
            balanceDate: now,
            bookingId: current.id,
            method: "QR thủ công",
            paidAt: now,
            provider: "manual-qr",
            reference: makePaymentReference(current.code),
            status: "PAID",
            userId: current.userId
          }
        });
      }

      await tx.booking.update({
        data: {
          status: "CONFIRMED"
        },
        where: { id: current.id }
      });

      await tx.seatHold.updateMany({
        data: {
          status: "CONFIRMED"
        },
        where: {
          bookingId: current.id
        }
      });

      const existingTicketSeats = new Set(current.tickets.map((ticket) => ticket.seatNo));
      for (const seat of current.seatHolds) {
        if (existingTicketSeats.has(seat.seatNo)) {
          continue;
        }

        const duplicateTicket = await tx.ticket.findFirst({
          where: {
            seatNo: seat.seatNo,
            tripId: current.tripId
          }
        });

        if (!duplicateTicket) {
          await tx.ticket.create({
            data: {
              bookingId: current.id,
              qrCode: makeTicketQrCode(current.code, seat.seatNo),
              seatNo: seat.seatNo,
              tripId: current.tripId
            }
          });
        }
      }

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
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy đơn đặt vé." }, { status: 404 });
    }

    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "QR vé hoặc ghế đã tồn tại." }, { status: 409 });
    }

    return NextResponse.json({ error: "Không thể xác nhận thanh toán." }, { status: 500 });
  }
}
