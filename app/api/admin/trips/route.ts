import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  makeDepartureAt,
  makeTripCode,
  mapTripToApi,
  splitRoute,
  type TransportTripPayload
} from "@/lib/transport-api";

function normalizeTripPayload(body: Record<string, unknown>): TransportTripPayload | null {
  const route = typeof body.route === "string" ? body.route.trim() : "";
  const price = Number(body.price);
  const total = Number(body.total);
  const time = typeof body.time === "string" && body.time ? body.time : "07:30";

  if (!route || !Number.isFinite(price) || price < 0 || !Number.isInteger(total) || total <= 0) {
    return null;
  }

  return {
    code: typeof body.code === "string" ? body.code.trim() : "",
    driver: typeof body.driver === "string" ? body.driver.trim() : "",
    platform: typeof body.platform === "string" ? body.platform.trim() : "Website",
    price,
    route,
    status: typeof body.status === "string" ? body.status : "Sắp chạy",
    time,
    total,
    vehicle: typeof body.vehicle === "string" ? body.vehicle.trim() : ""
  };
}

function isUniqueConstraintError(error: unknown) {
  const err = error as { code?: string };
  return err.code === "P2002";
}

export async function GET() {
  await requireAdmin();

  try {
    const trips = await prisma.trip.findMany({
      include: {
        seatHolds: {
          select: {
            seatNo: true
          }
        }
      },
      orderBy: {
        departureAt: "asc"
      }
    });

    return NextResponse.json({ trips: trips.map(mapTripToApi) });
  } catch {
    return NextResponse.json({ error: "Không thể tải danh sách chuyến xe." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeTripPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Thông tin chuyến xe không hợp lệ." }, { status: 400 });
    }

    const { from, to } = splitRoute(payload.route);
    const departureAt = makeDepartureAt(payload.time);
    const trip = await prisma.trip.create({
      data: {
        code: payload.code || makeTripCode(),
        departureAt,
        driverName: payload.driver || "Chưa phân công",
        from,
        price: payload.price,
        route: payload.route,
        status: payload.status || "Sắp chạy",
        to,
        totalSeats: payload.total,
        vehicleNo: payload.vehicle || "Chưa chọn"
      },
      include: {
        seatHolds: true
      }
    });

    return NextResponse.json({ trip: mapTripToApi(trip) }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Mã chuyến đã tồn tại." }, { status: 409 });
    }

    return NextResponse.json({ error: "Không thể tạo chuyến xe." }, { status: 500 });
  }
}
