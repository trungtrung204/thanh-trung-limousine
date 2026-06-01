import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const [
      totalTrips,
      totalBookings,
      totalCustomers,
      totalFeedbacks,
      trips,
      paidBookingRevenue,
      paidPaymentRevenue,
      bookingStatusGroups,
      tripStatusGroups
    ] = await Promise.all([
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.feedback.count(),
      prisma.trip.findMany({
        select: {
          seatHolds: {
            select: {
              id: true
            }
          },
          status: true,
          totalSeats: true
        }
      }),
      prisma.booking.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          status: {
            in: ["CONFIRMED", "COMPLETED"]
          }
        }
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: {
            in: ["PAID", "DEMO_RECORDED"]
          }
        }
      }),
      prisma.booking.groupBy({
        by: ["status"],
        _count: {
          _all: true
        }
      }),
      prisma.trip.groupBy({
        by: ["status"],
        _count: {
          _all: true
        }
      })
    ]);

    const soldSeats = trips.reduce((sum, trip) => sum + trip.seatHolds.length, 0);
    const totalSeats = trips.reduce((sum, trip) => sum + trip.totalSeats, 0);
    const bookingStatusCounts = Object.fromEntries(
      bookingStatusGroups.map((group) => [group.status, group._count._all])
    );
    const tripStatusCounts = Object.fromEntries(
      tripStatusGroups.map((group) => [group.status, group._count._all])
    );

    const paymentRevenue = paidPaymentRevenue._sum.amount || 0;
    const bookingRevenue = paidBookingRevenue._sum.totalAmount || 0;

    return NextResponse.json({
      stats: {
        bookingStatusCounts,
        soldSeats,
        totalBookings,
        totalCustomers,
        totalFeedbacks,
        totalRevenue: paymentRevenue || bookingRevenue,
        totalSeats,
        totalTrips,
        tripStatusCounts
      }
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải thống kê." }, { status: 500 });
  }
}
