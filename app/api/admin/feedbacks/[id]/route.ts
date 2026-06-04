import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(["Mới", "Đang xử lý", "Đã liên hệ", "Đã xử lý"]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = normalizeText(body.status);

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Trạng thái phản hồi không hợp lệ." }, { status: 400 });
    }

    const feedback = await prisma.feedback.update({
      data: { status },
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
      where: { id }
    });

    return NextResponse.json({
      feedback: {
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
      }
    });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật trạng thái phản hồi." }, { status: 500 });
  }
}
