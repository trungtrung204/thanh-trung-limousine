import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { makeManualPaymentInfo } from "@/lib/manual-payment";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để xem thanh toán." }, { status: 401 });
  }

  const { bookingId } = await context.params;

  try {
    const booking = await prisma.booking.findFirst({
      include: {
        payments: true
      },
      where: {
        OR: [{ id: bookingId }, { code: bookingId }],
        ...(user.role === "ADMIN" ? {} : { userId: user.id })
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Không tìm thấy đơn thanh toán." }, { status: 404 });
    }

    const payment = booking.payments[0];
    return NextResponse.json({
      bookingStatus: booking.status,
      payment: makeManualPaymentInfo({
        amount: booking.totalAmount,
        bookingCode: booking.code,
        reference: payment?.reference
      }),
      status: payment?.status || "PENDING"
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải thông tin thanh toán." }, { status: 500 });
  }
}
