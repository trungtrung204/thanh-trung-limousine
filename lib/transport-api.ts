import type {
  Booking,
  BookingStatus,
  CancellationRequest,
  Payment,
  SeatHold,
  Ticket,
  Trip,
  User
} from "@prisma/client";

export type TransportTripPayload = {
  arrivalTime?: string;
  code?: string;
  driver?: string;
  from?: string;
  platform?: string;
  price: number;
  route: string;
  sold?: number;
  status?: string;
  to?: string;
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
  cancellationRequestId: string;
  cancellationStatus: string;
  cancellationReason: string;
  dropoffPoint: string;
  id: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentReference: string;
  paymentStatus: string;
  paidAt: string | null;
  pickupPoint: string;
  price: number;
  route: string;
  seatCodes: string[];
  seats: number;
  status: BookingStatus;
  ticketQrCodes: string[];
  tickets: Array<{
    id: string;
    issuedAt: string;
    qrCode: string;
    seatNo: string;
  }>;
  to: string;
  from: string;
  travelDate: string;
  tripId: string;
};

type BookingWithRelations = Booking & {
  cancellations?: CancellationRequest[];
  payments?: Payment[];
  seatHolds: SeatHold[];
  tickets?: Ticket[];
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

export function makeArrivalAt(departureAt: Date, time?: string) {
  if (!time) {
    return null;
  }

  const arrivalAt = makeDepartureAt(time, departureAt);
  if (arrivalAt <= departureAt) {
    arrivalAt.setDate(arrivalAt.getDate() + 1);
  }

  return arrivalAt;
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
  const tickets = booking.tickets || [];
  const cancellation = (booking.cancellations || [])
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const paymentStatus =
    payment?.status === "PAID" || payment?.status === "DEMO_RECORDED"
      ? "Thanh toán thành công"
      : "Chờ thanh toán";

  return {
    code: booking.code,
    createdAt: booking.createdAt.toISOString(),
    cancellationReason: cancellation?.reason || "",
    cancellationRequestId: cancellation?.id || "",
    cancellationStatus: cancellation?.status || "",
    customerEmail: booking.user.email,
    customerId: booking.user.id,
    customerName: booking.user.name,
    customerPhone: booking.user.phone || "",
    dropoffPoint: booking.dropoffPoint || booking.trip.to,
    from: booking.trip.from,
    id: booking.id,
    paymentMethod: payment?.method || "Chưa chọn",
    paymentProvider: payment?.provider || "",
    paymentReference: payment?.reference || "",
    paymentStatus,
    paidAt: payment?.paidAt?.toISOString() || null,
    pickupPoint: booking.pickupPoint || booking.trip.from,
    price: booking.totalAmount,
    route: booking.trip.route,
    seatCodes: booking.seatHolds.map((seat) => seat.seatNo).sort(),
    seats: booking.seats,
    status: booking.status,
    ticketQrCodes: tickets.map((ticket) => ticket.qrCode).filter(Boolean) as string[],
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      issuedAt: ticket.issuedAt.toISOString(),
      qrCode: ticket.qrCode || "",
      seatNo: ticket.seatNo
    })),
    to: booking.trip.to,
    travelDate,
    tripId: booking.tripId
  };
}
