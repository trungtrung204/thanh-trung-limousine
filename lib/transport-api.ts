import type { Booking, BookingStatus, Payment, SeatHold, Trip, User } from "@prisma/client";

export type TransportTripPayload = {
  code?: string;
  driver?: string;
  platform?: string;
  price: number;
  route: string;
  sold?: number;
  status?: string;
  time: string;
  total: number;
  vehicle?: string;
};

export type ApiTrip = {
  arrivalAt: string | null;
  code: string;
  departureAt: string;
  driver: string;
  from: string;
  id: string;
  platform: string;
  price: number;
  route: string;
  seatHolds: string[];
  sold: number;
  status: string;
  time: string;
  to: string;
  total: number;
  vehicle: string;
};

export type ApiBooking = {
  code: string;
  createdAt: string;
  customerEmail: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  dropoffPoint: string;
  id: string;
  paymentMethod: string;
  paymentStatus: string;
  pickupPoint: string;
  price: number;
  route: string;
  seatCodes: string[];
  seats: number;
  status: BookingStatus;
  to: string;
  from: string;
  travelDate: string;
  tripId: string;
};

type BookingWithRelations = Booking & {
  payments?: Payment[];
  seatHolds: SeatHold[];
  trip: Trip;
  user: Pick<User, "email" | "id" | "name" | "phone">;
};

export function splitRoute(route: string) {
  const [from = "", to = ""] = route.split("-").map((part) => part.trim());
  return { from, to };
}

export function makeTripCode() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `TT${day}${month}${year}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function makeBookingCode() {
  return `BK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

export function makeDepartureAt(time: string, date = new Date()) {
  const [hours = "7", minutes = "30"] = time.split(":");
  const departureAt = new Date(date);
  departureAt.setHours(Number(hours) || 7, Number(minutes) || 30, 0, 0);
  return departureAt;
}

export function formatTripTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function mapTripToApi(trip: Trip & { seatHolds?: Array<Pick<SeatHold, "seatNo">> }): ApiTrip {
  const { from, to } = splitRoute(trip.route);
  const seatHolds = trip.seatHolds?.map((seat) => seat.seatNo).sort() || [];

  return {
    arrivalAt: trip.arrivalAt?.toISOString() || null,
    code: trip.code,
    departureAt: trip.departureAt.toISOString(),
    driver: trip.driverName || "Chưa phân công",
    from: trip.from || from,
    id: trip.id,
    platform: "Website",
    price: trip.price,
    route: trip.route,
    seatHolds,
    sold: seatHolds.length,
    status: trip.status,
    time: formatTripTime(trip.departureAt),
    to: trip.to || to,
    total: trip.totalSeats,
    vehicle: trip.vehicleNo || "Chưa chọn"
  };
}

export function mapBookingToApi(booking: BookingWithRelations): ApiBooking {
  const travelDate = booking.trip.departureAt.toISOString().slice(0, 10);
  const payment = booking.payments?.[0];
  const paymentStatus =
    payment?.status === "PAID" || payment?.status === "DEMO_RECORDED"
      ? "Đã ghi nhận demo"
      : "Chờ thanh toán";

  return {
    code: booking.code,
    createdAt: booking.createdAt.toISOString(),
    customerEmail: booking.user.email,
    customerId: booking.user.id,
    customerName: booking.user.name,
    customerPhone: booking.user.phone || "",
    dropoffPoint: booking.dropoffPoint || booking.trip.to,
    from: booking.trip.from,
    id: booking.id,
    paymentMethod: payment?.method || "Chưa chọn",
    paymentStatus,
    pickupPoint: booking.pickupPoint || booking.trip.from,
    price: booking.totalAmount,
    route: booking.trip.route,
    seatCodes: booking.seatHolds.map((seat) => seat.seatNo).sort(),
    seats: booking.seats,
    status: booking.status,
    to: booking.trip.to,
    travelDate,
    tripId: booking.tripId
  };
}
