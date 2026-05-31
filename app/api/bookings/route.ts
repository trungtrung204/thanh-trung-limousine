import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeBookingCode, mapBookingToApi } from "@/lib/transport-api";

function normalizeSeatNos(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((seat) => (typeof seat === "string" ? seat.trim().toUpperCase() : ""))
        .filter(Boolean)
    )
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Bạn cần đăng nhập để đặt vé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const tripId = typeof body.tripId === "string" ? body.tripId : "";
    const seatNos = normalizeSeatNos(body.seatNos ?? body.seatCodes);
    const pickupPoint = typeof body.pickupPoint === "string" ? body.pickupPoint.trim() : "";
    const dropoffPoint = typeof body.dropoffPoint === "string" ? body.dropoffPoint.trim() : "";

    if (!tripId || !seatNos.length) {
      return NextResponse.json({ error: "Vui lòng chọn chuyến và ghế." }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id: tripId }
      });

      if (!trip) {
        throw new Error("TRIP_NOT_FOUND");
      }

      if (seatNos.length > 6) {
        throw new Error("TOO_MANY_SEATS");
      }

      const createdBooking = await tx.booking.create({
        data: {
          code: makeBookingCode(),
          dropoffPoint: dropoffPoint || trip.to,
          pickupPoint: pickupPoint || trip.from,
          seats: seatNos.length,
          status: "PENDING_PAYMENT",
          totalAmount: trip.price * seatNos.length,
          tripId: trip.id,
          userId: user.id
        }
      });

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await Promise.all(
        seatNos.map((seatNo) =>
          tx.seatHold.create({
            data: {
              bookingId: createdBooking.id,
              customerName: user.name,
              expiresAt,
              seatNo,
              status: "PENDING_PAYMENT",
              tripId: trip.id
            }
          })
        )
      );

      return tx.booking.findUniqueOrThrow({
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
        where: { id: createdBooking.id }
      });
    });

    return NextResponse.json({ booking: mapBookingToApi(booking) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ghế đã có người đặt" }, { status: 409 });
    }

    if (error instanceof Error && error.message === "TRIP_NOT_FOUND") {
      return NextResponse.json({ error: "Chuyến xe không tồn tại." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "TOO_MANY_SEATS") {
      return NextResponse.json({ error: "Mỗi đơn đặt tối đa 6 ghế." }, { status: 400 });
    }

    return NextResponse.json({ error: "Không thể tạo đơn đặt vé." }, { status: 500 });
  }
}
