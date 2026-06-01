import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        bookings: {
          include: {
            payments: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        role: "USER"
      }
    });

    return NextResponse.json({
      customers: users.map((user) => ({
        createdAt: user.createdAt.toISOString(),
        email: user.email,
        id: user.id,
        name: user.name,
        phone: user.phone || "",
        revenue: user.bookings.reduce((sum, booking) => {
          const paidPayment = booking.payments.find(
            (payment) => payment.status === "PAID" || payment.status === "DEMO_RECORDED"
          );
          return sum + (paidPayment ? paidPayment.amount : booking.status === "CONFIRMED" ? booking.totalAmount : 0);
        }, 0),
        tickets: user.bookings.reduce((sum, booking) => sum + booking.seats, 0),
        totalBookings: user.bookings.length
      }))
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải danh sách khách hàng." }, { status: 500 });
  }
}
