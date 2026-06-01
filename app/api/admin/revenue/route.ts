import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getLocalDateKey(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getMonthKey(date = new Date()) {
  return getLocalDateKey(date).slice(0, 7);
}

function startOfLocalDay(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function startOfLocalMonth(monthsAgo: number) {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const fromDate = startOfLocalMonth(11);
    const bookings = await prisma.booking.findMany({
      include: {
        payments: true
      },
      where: {
        OR: [
          {
            status: {
              in: ["CONFIRMED", "COMPLETED"]
            },
            updatedAt: {
              gte: fromDate
            }
          },
          {
            payments: {
              some: {
                status: {
                  in: ["PAID", "DEMO_RECORDED"]
                }
              }
            }
          }
        ]
      }
    });

    const dayKeys = Array.from({ length: 7 }, (_, index) => getLocalDateKey(startOfLocalDay(6 - index)));
    const monthKeys = Array.from({ length: 12 }, (_, index) => getMonthKey(startOfLocalMonth(11 - index)));
    const dailyMap = new Map(dayKeys.map((key) => [key, { date: key, revenue: 0, tickets: 0 }]));
    const monthlyMap = new Map(monthKeys.map((key) => [key, { month: key, revenue: 0, tickets: 0 }]));

    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let soldTickets = 0;
    const todayKey = getLocalDateKey();
    const currentMonthKey = getMonthKey();

    for (const booking of bookings) {
      const paidPayment = booking.payments.find(
        (payment) => payment.status === "PAID" || payment.status === "DEMO_RECORDED"
      );
      const recordDate = paidPayment?.paidAt || paidPayment?.balanceDate || booking.updatedAt || booking.createdAt;
      const amount = paidPayment?.amount || booking.totalAmount;
      const dateKey = getLocalDateKey(recordDate);
      const monthKey = getMonthKey(recordDate);

      totalRevenue += amount;
      soldTickets += booking.seats;

      if (dateKey === todayKey) {
        todayRevenue += amount;
      }

      if (monthKey === currentMonthKey) {
        monthRevenue += amount;
      }

      const dayValue = dailyMap.get(dateKey);
      if (dayValue) {
        dayValue.revenue += amount;
        dayValue.tickets += booking.seats;
      }

      const monthValue = monthlyMap.get(monthKey);
      if (monthValue) {
        monthValue.revenue += amount;
        monthValue.tickets += booking.seats;
      }
    }

    return NextResponse.json({
      revenue: {
        daily: Array.from(dailyMap.values()),
        monthly: Array.from(monthlyMap.values()),
        monthRevenue,
        soldTickets,
        todayRevenue,
        totalRevenue
      }
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải báo cáo doanh thu." }, { status: 500 });
  }
}
