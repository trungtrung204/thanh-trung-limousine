import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để xem vé." }, { status: 401 });
  }

  const { bookingId } = await context.params;

  try {
    const booking = await prisma.booking.findFirst({
      include: {
        tickets: true
      },
      where: {
        OR: [{ id: bookingId }, { code: bookingId }],
        ...(user.role === "ADMIN" ? {} : { userId: user.id })
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Không tìm thấy vé." }, { status: 404 });
    }

    return NextResponse.json({
      tickets: booking.tickets.map((ticket) => ({
        id: ticket.id,
        issuedAt: ticket.issuedAt.toISOString(),
        qrCode: ticket.qrCode || "",
        seatNo: ticket.seatNo
      }))
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải QR vé." }, { status: 500 });
  }
}
