import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ feedbacks: [] });
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
      },
      where: {
        userId: user.id
      }
    });

    return NextResponse.json({
      feedbacks: feedbacks.map((feedback) => ({
        bookingId: feedback.booking?.code || "Không có vé",
        createdAt: feedback.createdAt.toISOString(),
        customerId: feedback.userId || user.id,
        customerName: feedback.name || feedback.user?.name || user.name,
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

export async function POST(request: Request) {
  const user = await getCurrentUser();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const message = normalizeText(body.message);
    const name = normalizeText(body.name) || user?.name || "Khách hàng";
    const bookingId = normalizeText(body.bookingId);
    const route = normalizeText(body.route);
    const rating = Number(body.rating);

    if (!message) {
      return NextResponse.json({ error: "Vui lòng nhập nội dung phản hồi." }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Điểm đánh giá phải từ 1 đến 5." }, { status: 400 });
    }

    const booking = bookingId
      ? await prisma.booking.findFirst({
          include: {
            trip: true
          },
          where: {
            code: bookingId,
            ...(user ? { userId: user.id } : {})
          }
        })
      : null;

    const feedback = await prisma.feedback.create({
      data: {
        bookingId: booking?.id || null,
        message,
        name,
        rating,
        status: "Mới",
        tripId: booking?.tripId || null,
        userId: user?.id || null
      },
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
      }
    });

    return NextResponse.json(
      {
        feedback: {
          bookingId: feedback.booking?.code || bookingId || "Không có vé",
          createdAt: feedback.createdAt.toISOString(),
          customerId: feedback.userId || user?.id || "guest",
          customerName: feedback.name || feedback.user?.name || name,
          customerPhone: feedback.user?.phone || "",
          id: feedback.id,
          message: feedback.message,
          rating: feedback.rating,
          route: feedback.trip?.route || route || "Chưa chọn chuyến",
          status: feedback.status
        }
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Không thể gửi phản hồi." }, { status: 500 });
  }
}
