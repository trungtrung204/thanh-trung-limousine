import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapTripToApi } from "@/lib/transport-api";

export async function GET() {
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
    return NextResponse.json(
      { error: "Không thể tải danh sách chuyến xe." },
      { status: 500 }
    );
  }
}
