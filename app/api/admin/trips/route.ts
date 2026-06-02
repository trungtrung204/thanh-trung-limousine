import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  makeArrivalAt,
  makeDepartureAt,
  makeTripCode,
  mapTripToApi,
  splitRoute,
  type TransportTripPayload
} from "@/lib/transport-api";

function normalizeTripPayload(body: Record<string, unknown>): TransportTripPayload | null {
  const from = typeof body.from === "string" ? body.from.trim() : "";
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const route =
    typeof body.route === "string" && body.route.trim()
      ? body.route.trim()
      : from && to
        ? `${from} - ${to}`
        : "";
  const price = normalizeNumber(body.price);
  const total = Number(body.total);
  const time = typeof body.time === "string" && body.time ? body.time : "07:30";

  if (!route || !Number.isFinite(price) || price < 0 || !Number.isInteger(total) || total <= 0) {
    return null;
  }

  return {
    arrivalDate: typeof body.arrivalDate === "string" ? body.arrivalDate.trim() : "",
    arrivalTime: typeof body.arrivalTime === "string" ? body.arrivalTime.trim() : "",
    code: typeof body.code === "string" ? body.code.trim() : "",
    departureDate: typeof body.departureDate === "string" ? body.departureDate.trim() : "",
    driver: typeof body.driver === "string" ? body.driver.trim() : "",
    from,
    platform: typeof body.platform === "string" ? body.platform.trim() : "Website",
    price,
    route,
    status: typeof body.status === "string" ? body.status : "Sắp chạy",
    to,
    time,
    total,
    vehicle: typeof body.vehicle === "string" ? body.vehicle.trim() : ""
  };
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return Number(value);
  }

  const normalized = value.replace(/[^\d]/g, "");
  return Number(normalized || value);
}

function isUniqueConstraintError(error: unknown) {
  const err = error as { code?: string };
  return err.code === "P2002";
}

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

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
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeTripPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Thông tin chuyến xe không hợp lệ." }, { status: 400 });
    }

    const routeParts = splitRoute(payload.route);
    const from = payload.from || routeParts.from;
    const to = payload.to || routeParts.to;
    const departureAt = makeDepartureAt(payload.time, payload.departureDate || new Date());
    const arrivalAt = makeArrivalAt(departureAt, payload.arrivalTime, payload.arrivalDate);
    const trip = await prisma.trip.create({
      data: {
        code: payload.code || makeTripCode(),
        arrivalAt,
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
