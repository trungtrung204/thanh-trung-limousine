import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireUserApi();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để gửi yêu cầu hủy vé." }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const reason = getText(body.reason);
    const note = getText(body.note);
    const phone = getText(body.phone);

    if (!reason) {
      return NextResponse.json({ error: "Vui lòng nhập lý do hủy vé." }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      include: {
        cancellations: {
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      where: {
        OR: [{ id }, { code: id }],
        userId: user.id
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Không tìm thấy vé của bạn." }, { status: 404 });
    }

    if (booking.status === "CANCELLED" || booking.status === "REJECTED" || booking.status === "COMPLETED") {
      return NextResponse.json({ error: "Vé này không còn đủ điều kiện gửi yêu cầu hủy." }, { status: 409 });
    }

    const pendingRequest = booking.cancellations.find((item) => item.status === "PENDING");
    if (pendingRequest) {
      return NextResponse.json(
        { error: "Vé này đã có yêu cầu hủy đang chờ xử lý." },
        { status: 409 }
      );
    }

    const cancellation = await prisma.cancellationRequest.create({
      data: {
        bookingId: booking.id,
        note: note || null,
        phone: phone || user.phone || null,
        reason,
        userId: user.id
      }
    });

    return NextResponse.json({ cancellation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Không thể gửi yêu cầu hủy vé." }, { status: 500 });
  }
}
