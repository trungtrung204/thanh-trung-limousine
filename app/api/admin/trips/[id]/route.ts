import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeArrivalAt, makeDepartureAt, mapTripToApi, splitRoute } from "@/lib/transport-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fromInput = getString(body.from);
    const toInput = getString(body.to);
    const route = getString(body.route) || (fromInput && toInput ? `${fromInput} - ${toInput}` : "");
    const price = normalizeNumber(body.price);
    const total = Number(body.total);

    if (!route || !Number.isFinite(price) || price < 0 || !Number.isInteger(total) || total <= 0) {
      return NextResponse.json({ error: "Thông tin chuyến xe không hợp lệ." }, { status: 400 });
    }

    const routeParts = splitRoute(route);
    const from = fromInput || routeParts.from;
    const to = toInput || routeParts.to;
    const departureAt = makeDepartureAt(getString(body.time) || "07:30");
    const trip = await prisma.trip.update({
      data: {
        arrivalAt: makeArrivalAt(departureAt, getString(body.arrivalTime)),
        code: getString(body.code) || undefined,
        departureAt,
        driverName: getString(body.driver) || "Chưa phân công",
        from,
        price,
        route,
        status: getString(body.status) || "Sắp chạy",
        to,
        totalSeats: total,
        vehicleNo: getString(body.vehicle) || "Chưa chọn"
      },
      include: {
        seatHolds: true
      },
      where: { id }
    });

    return NextResponse.json({ trip: mapTripToApi(trip) });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Mã chuyến đã tồn tại." }, { status: 409 });
    }

    return NextResponse.json({ error: "Không thể cập nhật chuyến xe." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    await prisma.trip.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa chuyến xe. Chuyến có thể đã có vé liên quan." },
      { status: 409 }
    );
  }
}
