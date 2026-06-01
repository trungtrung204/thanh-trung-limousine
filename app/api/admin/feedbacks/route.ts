import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        booking: {
          select: {
            code: true
          }
        },
        trip: {
          select: {
            route: true
          }
        },
        user: {
          select: {
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

    return NextResponse.json({
      feedbacks: feedbacks.map((feedback) => ({
        bookingId: feedback.booking?.code || "Không có vé",
        createdAt: feedback.createdAt.toISOString(),
        customerId: feedback.userId || "guest",
        customerName: feedback.name || feedback.user?.name || "Khách hàng",
        customerPhone: feedback.user?.phone || "",
        id: feedback.id,
        message: feedback.message,
        rating: feedback.rating,
        route: feedback.trip?.route || "Chưa chọn chuyến",
        status: feedback.status
      }))
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải phản hồi." }, { status: 500 });
  }
}
