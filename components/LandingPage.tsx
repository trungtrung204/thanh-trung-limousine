"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Armchair,
  BadgeCheck,
  Bus,
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  Headphones,
  Loader2,
  Luggage,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Ticket,
  WalletCards,
  Wifi,
  X
} from "lucide-react";
import type { ManualPaymentInfo } from "@/lib/manual-payment";
import type { ApiBooking, ApiTrip } from "@/lib/transport-api";

type CustomerSession = {
  email: string;
  id: string;
  name: string;
  phone: string | null;
  role: "USER" | "ADMIN" | "DRIVER";
};

const fallbackLocations = ["Vinh", "Hoàng Mai", "Diễn Châu", "Quỳnh Lưu", "Hà Nội"];
const maxTicketsPerBooking = 10;
const todayKey = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatTimeFromIso(value: string | null) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getArrivalTime(trip: ApiTrip) {
  if (trip.arrivalAt) {
    return formatTimeFromIso(trip.arrivalAt);
  }

  const departure = new Date(trip.departureAt);
  if (Number.isNaN(departure.getTime())) {
    return "--:--";
  }

  return formatTimeFromIso(new Date(departure.getTime() + 90 * 60 * 1000).toISOString());
}

function getDurationLabel(trip: ApiTrip) {
  const departure = new Date(trip.departureAt);
  const arrival = trip.arrivalAt ? new Date(trip.arrivalAt) : new Date(departure.getTime() + 90 * 60 * 1000);
  const minutes = Math.max(Math.round((arrival.getTime() - departure.getTime()) / 60000), 0);
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;

  if (!hours) {
    return `${remainMinutes} phút`;
  }

  return `${hours} giờ ${remainMinutes ? `${remainMinutes} phút` : ""}`.trim();
}

function getSeatsLeft(trip: ApiTrip) {
  return Math.max(trip.total - trip.sold, 0);
}

function splitSeatZones(seatCodes: string[]) {
  const frontCount = Math.max(1, Math.ceil(seatCodes.length * 0.25));
  const middleCount = Math.max(1, Math.ceil(seatCodes.length * 0.5));

  return [
    { label: "Đầu xe", seats: seatCodes.slice(0, frontCount) },
    { label: "Thân xe", seats: seatCodes.slice(frontCount, frontCount + middleCount) },
    { label: "Cuối xe", seats: seatCodes.slice(frontCount + middleCount) }
  ].filter((zone) => zone.seats.length);
}

function getAvailableSeatCodes(trip: ApiTrip) {
  return createSeatCodes(trip.total).filter((seatCode) => !trip.seatHolds.includes(seatCode));
}

function createSeatCodes(total: number) {
  return Array.from({ length: total }, (_, index) => {
    const group = String.fromCharCode(65 + Math.floor(index / 15));
    const number = String((index % 15) + 1).padStart(2, "0");
    return `${group}${number}`;
  });
}

function uniqueLocations(trips: ApiTrip[]) {
  const values = new Set<string>();
  trips.forEach((trip) => {
    if (trip.from) {
      values.add(trip.from);
    }
    if (trip.to) {
      values.add(trip.to);
    }
  });

  return values.size ? Array.from(values) : fallbackLocations;
}

function tripDateKey(trip: ApiTrip) {
  return trip.departureAt.slice(0, 10);
}

function mapBookingStatus(booking: ApiBooking) {
  if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
    return "Đã hủy";
  }

  if (booking.paymentStatus === "Thanh toán thành công" || booking.status === "CONFIRMED") {
    return "Đã thanh toán";
  }

  return "Chờ thanh toán";
}

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);
  const [trips, setTrips] = useState<ApiTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [sortMode, setSortMode] = useState<"early" | "price" | "seats">("early");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [passengers, setPassengers] = useState(1);
  const [activeTrip, setActiveTrip] = useState<ApiTrip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<ManualPaymentInfo | null>(null);
  const [recentBooking, setRecentBooking] = useState<ApiBooking | null>(null);

  const locations = useMemo(() => uniqueLocations(trips), [trips]);
  const filteredTrips = useMemo(() => {
    const filtered = trips.filter((trip) => {
      const routeMatched =
        (!searchFrom || trip.from === searchFrom || trip.route.includes(searchFrom)) &&
        (!searchTo || trip.to === searchTo || trip.route.includes(searchTo));
      const dateMatched = !searchDate || tripDateKey(trip) === searchDate;
      const vehicleMatched =
        vehicleFilter === "all" ||
        trip.vehicle.toLowerCase().includes(vehicleFilter) ||
        trip.route.toLowerCase().includes(vehicleFilter);
      return routeMatched && dateMatched && vehicleMatched;
    });

    return filtered.sort((a, b) => {
      if (sortMode === "price") {
        return a.price - b.price;
      }

      if (sortMode === "seats") {
        return getSeatsLeft(b) - getSeatsLeft(a);
      }

      return new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();
    });
  }, [searchDate, searchFrom, searchTo, sortMode, trips, vehicleFilter]);

  const featuredTrips = filteredTrips.length ? filteredTrips : trips;

  useEffect(() => {
    void refreshTrips();
    void refreshCurrentUser();
  }, []);

  useEffect(() => {
    if (!customer) {
      return;
    }

    async function keepSessionAlive() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          setCustomer(null);
        }
      } catch {
        // Keep the current customer state during temporary network issues.
      }
    }

    const timer = window.setInterval(() => {
      void keepSessionAlive();
    }, 15 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [customer]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function refreshCurrentUser() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setCustomer(null);
        return;
      }

      const data = (await response.json()) as { user?: CustomerSession | null };
      setCustomer(data.user?.role === "USER" ? data.user : null);
    } catch {
      setCustomer(null);
    }
  }

  async function refreshTrips() {
    setTripsLoading(true);
    try {
      const response = await fetch("/api/trips", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; trips?: ApiTrip[] };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải danh sách chuyến xe.");
      }

      setTrips(data.trips || []);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể tải danh sách chuyến xe.");
      setTrips([]);
    } finally {
      setTripsLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCustomer(null);
      setToast("Bạn đã đăng xuất.");
    } finally {
      setLogoutSubmitting(false);
    }
  }

  function buildSeatSelection(trip: ApiTrip, currentSeats: string[], ticketCount: number) {
    const availableSeats = getAvailableSeatCodes(trip);
    const targetCount = Math.min(Math.max(ticketCount, 1), maxTicketsPerBooking, availableSeats.length);
    const keptSeats = currentSeats.filter((seat) => availableSeats.includes(seat)).slice(0, targetCount);
    const extraSeats = availableSeats
      .filter((seat) => !keptSeats.includes(seat))
      .slice(0, targetCount - keptSeats.length);

    return [...keptSeats, ...extraSeats];
  }

  function changePassengerCount(nextPassengers: number) {
    const normalizedPassengers = Math.min(Math.max(nextPassengers, 1), maxTicketsPerBooking);
    setPassengers(normalizedPassengers);

    if (!activeTrip) {
      return;
    }

    const nextSeats = buildSeatSelection(activeTrip, selectedSeats, normalizedPassengers);
    setSelectedSeats(nextSeats);

    if (nextSeats.length < normalizedPassengers) {
      setToast(`Chuyến này chỉ còn ${nextSeats.length} ghế phù hợp.`);
    }
  }

  function openSeatPicker(trip: ApiTrip) {
    setActiveTrip(trip);
    setSelectedSeats(buildSeatSelection(trip, [], passengers));
    setPickupPoint(trip.from);
    setDropoffPoint(trip.to);
    setPaymentInfo(null);
    setRecentBooking(null);
    window.setTimeout(() => document.getElementById("chon-ghe")?.scrollIntoView({ behavior: "smooth" }), 40);
  }

  function handleSearch() {
    const nextTrip = filteredTrips[0] || trips[0];
    if (!nextTrip) {
      setToast("Hiện chưa có chuyến phù hợp. Vui lòng thử tuyến hoặc ngày khác.");
      return;
    }

    window.setTimeout(() => document.getElementById("danh-sach-chuyen")?.scrollIntoView({ behavior: "smooth" }), 40);
  }

  function toggleSeat(seatCode: string) {
    if (!activeTrip || activeTrip.seatHolds.includes(seatCode)) {
      return;
    }

    const limit = Math.min(Math.max(passengers, 1), maxTicketsPerBooking);
    setSelectedSeats((current) => {
      if (current.includes(seatCode)) {
        return current.filter((item) => item !== seatCode);
      }

      if (current.length >= limit) {
        setToast(`Bạn đang chọn tối đa ${limit} ghế cho đơn này.`);
        return current;
      }

      return [...current, seatCode];
    });
  }

  async function confirmBooking() {
    if (!activeTrip) {
      setToast("Vui lòng chọn chuyến xe trước khi đặt vé.");
      return;
    }

    const seatsToBook = selectedSeats;

    if (!seatsToBook.length) {
      setToast("Chuyến này hiện không còn ghế trống.");
      return;
    }

    if (seatsToBook.length !== passengers) {
      setToast(`Vui lòng chọn đúng ${passengers} ghế trước khi đặt vé.`);
      return;
    }

    if (!customer) {
      setToast("Vui lòng đăng nhập để giữ ghế và theo dõi vé.");
      router.push("/login");
      return;
    }

    setBookingSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        body: JSON.stringify({
          dropoffPoint,
          paymentMethod: "Thanh toán QR",
          pickupPoint,
          seatNos: seatsToBook,
          tripId: activeTrip.id
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = (await response.json()) as { booking?: ApiBooking; error?: string };

      if (!response.ok || !data.booking) {
        throw new Error(data.error || "Không thể tạo đơn đặt vé.");
      }

      const paymentResponse = await fetch(`/api/payments/${data.booking.code}`, { cache: "no-store" });
      const paymentData = (await paymentResponse.json()) as { error?: string; payment?: ManualPaymentInfo };

      setRecentBooking(data.booking);
      setPaymentInfo(paymentResponse.ok ? paymentData.payment || null : null);
      setSelectedSeats([]);
      await refreshTrips();
      setToast("Đã tạo đơn đặt vé. Vui lòng hoàn tất thanh toán QR.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể tạo đơn đặt vé.");
    } finally {
      setBookingSubmitting(false);
    }
  }

  const seatCodes = activeTrip ? createSeatCodes(activeTrip.total) : [];
  const seatZones = splitSeatZones(seatCodes);
  const totalAmount = activeTrip ? activeTrip.price * passengers : 0;

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#101828]">
      <header className="sticky top-0 z-50 border-b border-[#dbe7f5] bg-white/95 text-[#101828] shadow-[0_8px_28px_rgba(15,102,215,0.08)] backdrop-blur-xl">
        <div className="border-b border-[#e5edf8] bg-[#f4f8ff]">
          <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs font-black text-[#0b4f83] sm:px-6">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[#1677e8]" />
              <span>Giữ ghế trực tuyến, thanh toán QR, vé điện tử sau xác nhận</span>
            </div>
            <div className="hidden items-center gap-4 lg:flex">
              <span className="inline-flex items-center gap-2">
                <Headphones className="h-4 w-4 text-[#1677e8]" />
                Hỗ trợ 24/7
              </span>
              <a className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[#0f66d7] shadow-sm ring-1 ring-[#dbe7f5]" href="tel:19001000">
                <Phone className="h-4 w-4" />
                Hotline 1900 1000
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm ring-2 ring-white/30">
              <Image alt="Logo Thành Trung Limousine" className="object-cover" fill sizes="44px" src="/logoicon.png" />
            </span>
            <span>
              <span className="block text-base font-black text-[#073a6b]">Thành Trung Limousine</span>
              <span className="block text-xs font-semibold text-[#667085]">Sàn đặt vé xe khách</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-black text-[#344054] md:flex">
            <a className="hover:text-[#1677e8]" href="#danh-sach-chuyen">
              Chuyến xe
            </a>
            <a className="hover:text-[#1677e8]" href="#tuyen-pho-bien">
              Tuyến phổ biến
            </a>
            <Link className="hover:text-[#1677e8]" href="/user/ve-cua-toi">
              Vé của tôi
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {customer ? (
              <>
                <span className="max-w-[180px] truncate text-sm font-black text-[#344054]">
                  {customer.name}
                </span>
                <button
                  className="rounded-md border border-[#c7d7ea] px-3 py-2 text-sm font-bold text-[#344054] hover:bg-[#f4f8ff]"
                  disabled={logoutSubmitting}
                  onClick={handleLogout}
                  type="button"
                >
                  {logoutSubmitting ? "Đang thoát..." : "Đăng xuất"}
                </button>
              </>
            ) : (
              <>
                <Link className="rounded-md px-3 py-2 text-sm font-black text-[#1677e8] hover:bg-[#eef7ff]" href="/login">
                  Đăng nhập
                </Link>
                <Link
                  className="rounded-md bg-[#1677e8] px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-[#0f66d7]"
                  href="/register"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <button
            aria-label="Mở menu"
            className="rounded-md border border-[#c7d7ea] p-2 text-[#344054] md:hidden"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-[#d9e2ef] bg-white p-4 text-[#101828] md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-black text-[#1677e8]">Menu</span>
              <button aria-label="Đóng menu" onClick={() => setMenuOpen(false)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-2 text-sm font-bold">
              <a className="rounded-md px-3 py-2 hover:bg-[#f2f4f7]" href="#danh-sach-chuyen">
                Chuyến xe
              </a>
              <a className="rounded-md px-3 py-2 hover:bg-[#f2f4f7]" href="#tuyen-pho-bien">
                Tuyến phổ biến
              </a>
              <Link className="rounded-md px-3 py-2 hover:bg-[#f2f4f7]" href="/user/ve-cua-toi">
                Vé của tôi
              </Link>
              {customer ? (
                <button
                  className="rounded-md px-3 py-2 text-left hover:bg-[#f2f4f7] disabled:opacity-60"
                  disabled={logoutSubmitting}
                  onClick={handleLogout}
                  type="button"
                >
                  {logoutSubmitting ? "Đang thoát..." : "Đăng xuất"}
                </button>
              ) : (
                <Link className="rounded-md px-3 py-2 hover:bg-[#f2f4f7]" href="/login">
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <section className="relative overflow-hidden bg-[#eef6ff] text-[#08233f]">
        <Image
          alt="Hành trình du lịch biển miền Trung cùng Thành Trung Limousine"
          className="object-cover opacity-25"
          fill
          priority
          src="/landmarks/nghe-an-coast.jpg"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,199,255,0.22),transparent_28rem),linear-gradient(180deg,rgba(244,248,255,0.84)_0%,rgba(245,248,252,0.98)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:pt-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)] lg:items-center">
            <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#cfe7ff] bg-white/90 px-4 py-2 text-sm font-black text-[#0f66d7] shadow-sm">
              <BadgeCheck className="h-4 w-4" />
              Đặt vé nhanh, rõ hành trình, không phát sinh bước rối
            </div>
            <h1 className="text-4xl font-black leading-tight text-[#073a6b] sm:text-5xl lg:text-6xl">
              Đặt vé xe Thành Trung trong vài thao tác
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#23415f] sm:text-lg">
              Tìm chuyến nhanh, chọn ghế trực quan, giá hiển thị rõ ràng và hỗ trợ xuyên suốt hành trình.
            </p>
            <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                ["4.9/5", "Đánh giá dịch vụ"],
                ["24/7", "Hỗ trợ đặt vé"],
                [`${maxTicketsPerBooking} ghế`, "Tối đa mỗi đơn"]
              ].map(([value, label]) => (
                <div className="rounded-2xl border border-[#dbe7f5] bg-white/90 p-4 shadow-sm backdrop-blur" key={label}>
                  <p className="text-2xl font-black text-[#1677e8]">{value}</p>
                  <p className="mt-1 text-sm font-bold text-[#0b4f83]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-white text-[#101828] shadow-[0_28px_90px_rgba(15,102,215,0.18)] ring-1 ring-[#d6e8ff]">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#e4e7ec] bg-[#f9fbff] px-4 pt-4">
              {[
                { icon: <Bus className="h-5 w-5" />, label: "Xe khách" },
                { icon: <Ticket className="h-5 w-5" />, label: "Vé của tôi" },
                { icon: <Headphones className="h-5 w-5" />, label: "Hỗ trợ" },
                { icon: <WalletCards className="h-5 w-5" />, label: "Thanh toán" }
              ].map((item, index) => (
                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-black transition",
                    index === 0 ? "bg-white text-[#1677e8] shadow-sm ring-1 ring-[#eef2f7]" : "text-[#475467] hover:bg-white hover:text-[#1677e8]"
                  ].join(" ")}
                  key={item.label}
                >
                  {item.icon}
                  {item.label}
                </span>
              ))}
            </div>
            <div className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr]">
              <label className="block rounded-2xl border border-[#dbe7f5] bg-[#fbfdff] p-3 transition focus-within:border-[#1677e8] focus-within:bg-white focus-within:shadow-sm">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#98a2b3]">Nơi xuất phát</span>
                <select
                  className="h-11 w-full border-0 bg-transparent p-0 text-lg font-black text-[#101828] focus:ring-0"
                  onChange={(event) => setSearchFrom(event.target.value)}
                  value={searchFrom}
                >
                  <option value="">Tất cả điểm đi</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block rounded-2xl border border-[#dbe7f5] bg-[#fbfdff] p-3 transition focus-within:border-[#1677e8] focus-within:bg-white focus-within:shadow-sm">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#98a2b3]">Nơi đến</span>
                <select
                  className="h-11 w-full border-0 bg-transparent p-0 text-lg font-black text-[#101828] focus:ring-0"
                  onChange={(event) => setSearchTo(event.target.value)}
                  value={searchTo}
                >
                  <option value="">Tất cả điểm đến</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 border-t border-[#eef2f7] p-4 lg:grid-cols-[1fr_1fr_200px] lg:items-end">
              <label className="block rounded-2xl border border-[#dbe7f5] bg-[#fbfdff] p-3 transition focus-within:border-[#1677e8] focus-within:bg-white focus-within:shadow-sm">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#98a2b3]">Ngày đi</span>
                <input
                  className="h-11 w-full border-0 bg-transparent p-0 text-lg font-black text-[#101828] focus:ring-0"
                  min={todayKey()}
                  onChange={(event) => setSearchDate(event.target.value)}
                  type="date"
                  value={searchDate}
                />
              </label>
              <label className="block rounded-2xl border border-[#dbe7f5] bg-[#fbfdff] p-3 transition focus-within:border-[#1677e8] focus-within:bg-white focus-within:shadow-sm">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#98a2b3]">Số khách</span>
                <select
                  className="h-11 w-full border-0 bg-transparent p-0 text-lg font-black text-[#101828] focus:ring-0"
                  onChange={(event) => changePassengerCount(Number(event.target.value))}
                  value={passengers}
                >
                  {Array.from({ length: maxTicketsPerBooking }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value} khách
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="inline-flex h-[70px] items-center justify-center gap-2 rounded-2xl bg-[#1677e8] px-4 text-base font-black text-white shadow-[0_14px_30px_rgba(22,119,232,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0f66d7]"
                onClick={handleSearch}
                type="button"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </button>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[#eef2f7] bg-[#fbfdff] px-4 py-3 text-xs font-bold text-[#667085]">
              <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-[#1677e8]">Gợi ý: Vinh - Hà Nội</span>
              <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-[#1677e8]">Vinh - Hoàng Mai</span>
              <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-[#1677e8]">Vinh - Hà Giang</span>
            </div>
          </div>

          </div>

          <div className="mx-auto mt-7 grid max-w-4xl gap-3 rounded-2xl bg-white/90 px-5 py-4 text-[#0b4f83] shadow-sm ring-1 ring-[#dbe7f5] sm:grid-cols-4">
            {[
              ["Chắc chắn có chỗ", <BadgeCheck className="h-5 w-5 text-[#1677e8]" key="icon" />],
              ["Hỗ trợ 24/7", <Headphones className="h-5 w-5 text-[#1677e8]" key="icon" />],
              ["Nhiều tuyến đẹp", <MapPin className="h-5 w-5 text-[#1677e8]" key="icon" />],
              ["Thanh toán tiện lợi", <CreditCard className="h-5 w-5 text-[#1677e8]" key="icon" />]
            ].map(([label, icon]) => (
              <div className="flex items-center justify-center gap-2 text-sm font-black" key={label as string}>
                {icon}
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {[
          { desc: "Khoang ngồi thoải mái, tiện nghi rõ ràng.", icon: <Bus className="h-6 w-6" />, tone: "from-[#1677e8] to-[#27b7ff]", title: "Xe limousine" },
          { desc: "Giữ ghế và nhận mã đơn trực tuyến.", icon: <Ticket className="h-6 w-6" />, tone: "from-[#ff8a00] to-[#ffd43b]", title: "Đặt vé nhanh" },
          { desc: "Hotline sẵn sàng xử lý thay đổi.", icon: <Headphones className="h-6 w-6" />, tone: "from-[#00a878] to-[#42e695]", title: "Hỗ trợ 24/7" },
          { desc: "QR chuyển khoản và xác nhận vé.", icon: <CreditCard className="h-6 w-6" />, tone: "from-[#7048e8] to-[#15aabf]", title: "Thanh toán tiện lợi" }
        ].map((item) => (
          <div className="group rounded-2xl border border-[#cfe7ff] bg-white p-5 shadow-[0_10px_30px_rgba(22,119,232,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(22,119,232,0.14)]" key={item.title}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}>
              {item.icon}
            </span>
            <h3 className="mt-3 font-black text-[#101828]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#667085]">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" id="tuyen-pho-bien">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#0b6ea8]">Tuyến phổ biến</p>
            <h2 className="text-2xl font-black text-[#101828] sm:text-3xl">Các hành trình được đặt nhiều</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#667085]">
            Giá hiển thị theo chuyến hiện có. Số ghế còn lại được cập nhật từ hệ thống đặt vé.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {trips.slice(0, 3).map((trip) => (
            <div className="overflow-hidden rounded-2xl border border-[#cfe7ff] bg-white shadow-[0_12px_28px_rgba(22,119,232,0.10)]" key={trip.id}>
              <div className="h-2 bg-[linear-gradient(90deg,#1677e8,#22c7ff,#ffd43b)]" />
              <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[#101828]">{trip.route}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">
                    {trip.vehicle || "Limousine"} · {formatDate(trip.departureAt)}
                  </p>
                </div>
                <span className="rounded-md bg-[#fff0c2] px-2 py-1 text-xs font-black text-[#b54708]">
                  {formatCurrency(trip.price)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-[#344054]">
                  <Clock3 className="h-4 w-4 text-[#1677e8]" />
                  {trip.time}
                </span>
                <span className="font-bold text-[#027a48]">{Math.max(trip.total - trip.sold, 0)} ghế trống</span>
              </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#cfe7ff] bg-[#f7fbff] py-12" id="danh-sach-chuyen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#0b6ea8]">Danh sách chuyến</p>
              <h2 className="text-2xl font-black text-[#101828] sm:text-3xl">Chọn chuyến phù hợp</h2>
              <p className="mt-2 text-sm text-[#667085]">
                Lọc nhanh theo tuyến, loại xe và sắp xếp như một sàn đặt vé xe chuyên nghiệp.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border-[#badcff] bg-white text-sm font-bold focus:border-[#1677e8] focus:ring-[#1677e8]"
                onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                value={sortMode}
              >
                <option value="early">Giờ đi sớm nhất</option>
                <option value="price">Giá thấp nhất</option>
                <option value="seats">Ghế còn nhiều</option>
              </select>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#badcff] bg-white px-3 text-sm font-bold text-[#0b4f83]"
                disabled={tripsLoading}
                onClick={refreshTrips}
                type="button"
              >
                {tripsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                {tripsLoading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-[#cfe7ff] bg-white p-4 shadow-[0_12px_30px_rgba(22,119,232,0.08)] lg:sticky lg:top-24 lg:self-start">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-black">Bộ lọc</h3>
                <SlidersHorizontal className="h-4 w-4 text-[#1677e8]" />
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-[#344054]">Loại xe</span>
                  <select
                    className="h-11 w-full rounded-md border-[#badcff] text-sm focus:border-[#1677e8] focus:ring-[#1677e8]"
                    onChange={(event) => setVehicleFilter(event.target.value)}
                    value={vehicleFilter}
                  >
                    <option value="all">Tất cả</option>
                    <option value="limousine">Limousine</option>
                    <option value="16">16 chỗ</option>
                    <option value="45">Giường nằm</option>
                  </select>
                </label>
                <div className="rounded-xl bg-[#eef7ff] p-3 text-sm text-[#344054] ring-1 ring-[#d8ecff]">
                  <p className="font-black text-[#101828]">Tiêu chí phổ biến</p>
                  <div className="mt-3 grid gap-2 font-semibold">
                    <span className="inline-flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-[#027a48]" />
                      Xác nhận nhanh
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-[#0b6ea8]" />
                      Hỗ trợ 24/7
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <WalletCards className="h-4 w-4 text-[#c2410c]" />
                      Thanh toán QR
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <div>
              {tripsLoading ? (
                <div className="rounded-lg border border-[#e4e7ec] bg-[#f8fafc] p-8 text-center text-sm font-bold text-[#667085]">
                  Đang tải chuyến xe...
                </div>
              ) : featuredTrips.length ? (
                <div className="grid gap-4">
                  {featuredTrips.map((trip) => (
                    <TripCard key={trip.id} onSelect={() => openSeatPicker(trip)} trip={trip} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-[#e4e7ec] bg-[#f8fafc] p-8 text-center text-sm font-bold text-[#667085]">
                  Chưa có chuyến xe phù hợp với bộ lọc.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" id="chon-ghe">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#0b6ea8]">Chọn ghế</p>
            <h2 className="text-2xl font-black text-[#101828] sm:text-3xl">Sơ đồ ghế trực quan</h2>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-[#667085]">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-white ring-1 ring-[#d0d5dd]" />Trống</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#0b6ea8]" />Đang chọn</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#d0d5dd]" />Đã đặt</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#f2f4f7] ring-1 ring-[#eaecf0]" />Không khả dụng</span>
          </div>
        </div>

        {activeTrip ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#eaecf0] pb-4">
                <div>
                  <h3 className="text-lg font-black">{activeTrip.route}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">
                    {activeTrip.vehicle} · {activeTrip.time} · {formatDate(activeTrip.departureAt)}
                  </p>
                </div>
                <span className="rounded-md bg-[#e8f7fb] px-3 py-2 text-sm font-black text-[#0b6ea8]">
                  {formatCurrency(activeTrip.price)}/ghế
                </span>
              </div>
              <div className="rounded-[28px] border border-[#d9e2ef] bg-[#f8fafc] p-4">
                <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#d0d5dd] bg-white p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#064e6f] text-white">
                      <Bus className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#101828]">Cabin tài xế</p>
                      <p className="text-xs font-bold text-[#667085]">Đầu xe · lối lên xuống</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#e8f7fb] px-3 py-1 text-xs font-black text-[#0b6ea8]">
                    {activeTrip.total} ghế
                  </span>
                </div>

                <div className="grid gap-4">
                  {seatZones.map((zone) => (
                    <SeatZone
                      bookedSeats={activeTrip.seatHolds}
                      key={zone.label}
                      label={zone.label}
                      onToggleSeat={toggleSeat}
                      seats={zone.seats}
                      selectedSeats={selectedSeats}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black">Tóm tắt chuyến</h3>
              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Tuyến" value={activeTrip.route} />
                <SummaryRow label="Giờ đi" value={`${activeTrip.time} · ${formatDate(activeTrip.departureAt)}`} />
                <label className="flex items-center justify-between gap-4 border-b border-[#edf2f7] pb-3">
                  <span className="text-[#667085]">Số lượng vé</span>
                  <select
                    className="h-10 rounded-md border-[#d0d5dd] py-0 text-sm font-black text-[#101828] focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
                    onChange={(event) => changePassengerCount(Number(event.target.value))}
                    value={passengers}
                  >
                    {Array.from({ length: maxTicketsPerBooking }, (_, index) => index + 1).map((value) => (
                      <option key={value} value={value}>
                        {value} vé
                      </option>
                    ))}
                  </select>
                </label>
                <SummaryRow label="Ghế đã chọn" value={selectedSeats.length ? selectedSeats.join(", ") : "Chưa chọn"} />
                <SummaryRow label="Tiến độ chọn ghế" value={`${selectedSeats.length}/${passengers} ghế`} />
                <SummaryRow label="Tổng tiền" value={formatCurrency(totalAmount)} strong />
              </div>
              <div className="mt-4 grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#667085]">Điểm đón</span>
                  <input
                    className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
                    onChange={(event) => setPickupPoint(event.target.value)}
                    value={pickupPoint}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#667085]">Điểm trả</span>
                  <input
                    className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
                    onChange={(event) => setDropoffPoint(event.target.value)}
                    value={dropoffPoint}
                  />
                </label>
              </div>
              <button
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#064e6f] px-4 text-sm font-black text-white hover:bg-[#053d56] disabled:bg-[#98a2b3]"
                disabled={bookingSubmitting || selectedSeats.length !== passengers}
                onClick={confirmBooking}
                type="button"
              >
                <WalletCards className="h-4 w-4" />
                {bookingSubmitting ? "Đang tạo đơn..." : "Đặt vé và thanh toán"}
              </button>
              <p className="mt-3 text-xs leading-5 text-[#667085]">
                Sau khi nhận được thanh toán, nhà xe sẽ xác nhận vé.
              </p>
            </aside>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#b8c4d6] bg-white p-8 text-center">
            <Armchair className="mx-auto h-8 w-8 text-[#0b6ea8]" />
            <p className="mt-3 text-sm font-bold text-[#667085]">Chọn một chuyến xe để xem sơ đồ ghế.</p>
          </div>
        )}

        {paymentInfo && recentBooking ? (
          <PaymentPanel booking={recentBooking} payment={paymentInfo} />
        ) : null}
      </section>

      <section className="bg-[#064e6f] py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
          <div>
            <h2 className="text-2xl font-black">Cần hỗ trợ đặt vé?</h2>
            <p className="mt-2 text-sm leading-6 text-[#d7f0f7]">
              Đội ngũ Thành Trung Limousine hỗ trợ kiểm tra chuyến, điểm đón và trạng thái thanh toán.
            </p>
          </div>
          <div className="grid gap-2 text-sm font-bold">
            <a className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-[#064e6f]" href="tel:19001000">
              <Phone className="h-4 w-4" />
              Hotline 1900 1000
            </a>
            <Link className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-3" href="/user/ve-cua-toi">
              <Ticket className="h-4 w-4" />
              Xem vé của tôi
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d9e2ef] bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-[#667085] sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="font-bold text-[#064e6f]">Thành Trung Limousine</p>
            <p>Vé xe khách liên tỉnh · Thanh toán QR · Vé điện tử</p>
          </div>
          <p className="border-t border-[#eaecf0] pt-3 text-xs leading-5 text-[#98a2b3]">
            Đây chỉ là sản phẩm demo web do sinh viên thực hiện, không có mục đích vi phạm quyền sở hữu trí tuệ gì khác.
          </p>
        </div>
      </footer>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-[#d0d5dd] bg-white px-4 py-3 text-sm font-bold text-[#344054] shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function TripCard({ onSelect, trip }: { onSelect: () => void; trip: ApiTrip }) {
  const seatsLeft = getSeatsLeft(trip);

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#dbe7f5] bg-white shadow-[0_14px_36px_rgba(15,102,215,0.10)] transition duration-200 hover:-translate-y-0.5 hover:border-[#8ec9ff] hover:shadow-[0_20px_48px_rgba(15,102,215,0.16)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f7] bg-[#fbfdff] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-[#1677e8]">Đề xuất phù hợp</span>
          <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-[#c2410c]">Thanh toán QR</span>
        </div>
        <span className="text-xs font-bold text-[#667085]">{formatDate(trip.departureAt)}</span>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-stretch">
        <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-2xl bg-[#f4f8ff] p-5 ring-1 ring-[#dbe7f5]">
            <p className="text-sm font-black text-[#1677e8]">Thành Trung Limousine</p>
            <p className="mt-3 text-xl font-black text-[#101828]">{trip.vehicle || "Limousine"}</p>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-3xl font-black text-[#073a6b]">{trip.time}</p>
                <p className="text-xs font-bold text-[#667085]">{trip.from}</p>
              </div>
              <div className="grid place-items-center gap-1">
                <div className="h-1 w-14 rounded-full bg-[#badcff]" />
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-[#0b4f83] ring-1 ring-[#d8ecff]">
                  {getDurationLabel(trip)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-[#073a6b]">{getArrivalTime(trip)}</p>
                <p className="text-xs font-bold text-[#667085]">{trip.to}</p>
              </div>
            </div>
          </div>
          <div className="py-1">
            <h3 className="text-2xl font-black text-[#101828]">{trip.route}</h3>
            <p className="mt-1 text-sm font-semibold text-[#667085]">
              Tài xế {trip.driver} · {trip.status}
            </p>
            <div className="mt-6 grid gap-3 text-sm text-[#344054] md:grid-cols-2">
              <span className="flex items-start gap-2 rounded-2xl bg-[#fbfdff] p-3 ring-1 ring-[#eef2f7]">
                <MapPin className="mt-0.5 h-4 w-4 text-[#1677e8]" />
                <span><b>Đón:</b> {trip.from}</span>
              </span>
              <span className="flex items-start gap-2 rounded-2xl bg-[#fbfdff] p-3 ring-1 ring-[#eef2f7]">
                <MapPin className="mt-0.5 h-4 w-4 text-[#f59e0b]" />
                <span><b>Trả:</b> {trip.to}</span>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[Wifi, Luggage, ShieldCheck, Star].map((Icon, index) => (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-bold text-[#0b4f83]"
                  key={index}
                >
                  <Icon className="h-3.5 w-3.5 text-[#1677e8]" />
                  {["Xác nhận nhanh", "Hỗ trợ 24/7", "Thanh toán QR", "Đánh giá cao"][index]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#dbe7f5] bg-[#fbfdff] p-4">
          <div className="lg:text-right">
            <p className="text-sm font-bold text-[#667085]">Từ</p>
            <p className="text-3xl font-black text-[#d9480f]">{formatCurrency(trip.price)}</p>
            <p className="text-sm font-bold text-[#667085]">mỗi ghế</p>
          </div>
          <div className="mt-5">
            <p className="text-sm font-bold text-[#667085]">Số ghế còn</p>
            <p className="mt-2 text-3xl font-black text-[#073a6b]">{seatsLeft}</p>
            <button
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1677e8] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(22,119,232,0.24)] transition hover:bg-[#0f66d7]"
              onClick={onSelect}
              type="button"
            >
              Chọn chuyến
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SeatZone({
  bookedSeats,
  label,
  onToggleSeat,
  seats,
  selectedSeats
}: {
  bookedSeats: string[];
  label: string;
  onToggleSeat: (seatCode: string) => void;
  seats: string[];
  selectedSeats: string[];
}) {
  return (
    <section className="rounded-2xl border border-[#e4e7ec] bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-black text-[#064e6f]">{label}</h4>
        <span className="text-xs font-bold text-[#667085]">{seats.length} ghế</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
        {seats.map((seatCode) => {
          const booked = bookedSeats.includes(seatCode);
          const selected = selectedSeats.includes(seatCode);
          const unavailable = false;

          return (
            <button
              aria-label={`Ghế ${seatCode}`}
              className={[
                "flex h-11 items-center justify-center rounded-md border text-xs font-black transition",
                booked
                  ? "cursor-not-allowed border-[#d0d5dd] bg-[#e4e7ec] text-[#98a2b3]"
                  : selected
                    ? "border-[#064e6f] bg-[#0b6ea8] text-white"
                    : unavailable
                      ? "cursor-not-allowed border-[#eaecf0] bg-[#f2f4f7] text-[#98a2b3]"
                      : "border-[#d0d5dd] bg-white text-[#344054] hover:border-[#0b6ea8] hover:bg-[#e8f7fb]"
              ].join(" ")}
              disabled={booked || unavailable}
              key={seatCode}
              onClick={() => onToggleSeat(seatCode)}
              type="button"
            >
              {seatCode}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f2f4f7] pb-3 last:border-b-0">
      <span className="text-[#667085]">{label}</span>
      <span className={strong ? "text-right text-base font-black text-[#c2410c]" : "text-right font-bold text-[#101828]"}>
        {value}
      </span>
    </div>
  );
}

function PaymentPanel({ booking, payment }: { booking: ApiBooking; payment: ManualPaymentInfo }) {
  return (
    <section className="mt-6 rounded-lg border border-[#b8d7ff] bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg border border-[#e4e7ec] bg-[#f8fafc] p-4">
          <Image
            alt={`Mã QR thanh toán cho đơn ${payment.bookingCode}`}
            className="h-full w-full object-contain"
            height={512}
            src="/qr.jpg"
            width={512}
          />
        </div>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#0b6ea8]">Thanh toán QR</p>
              <h3 className="text-2xl font-black text-[#101828]">Quét mã để thanh toán</h3>
            </div>
            <span className="rounded-md bg-[#fff7ed] px-3 py-2 text-sm font-black text-[#c2410c]">
              {mapBookingStatus(booking)}
            </span>
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <SummaryRow label="Ngân hàng" value={payment.bankName} />
            <SummaryRow label="Chủ tài khoản" value={payment.accountName} />
            <SummaryRow label="Số tài khoản" value={payment.accountNo} />
            <SummaryRow label="Số tiền" value={formatCurrency(payment.amount)} strong />
            <SummaryRow label="Nội dung chuyển khoản" value={payment.reference} />
            <SummaryRow label="Trạng thái" value="Chờ xác nhận thanh toán" />
          </div>
          <p className="mt-4 rounded-lg bg-[#e8f7fb] p-3 text-sm font-semibold leading-6 text-[#0b6ea8]">
            Sau khi nhận được thanh toán, nhà xe sẽ xác nhận vé. Mã đơn của bạn là {payment.bookingCode}.
          </p>
          <Link
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#064e6f] px-4 text-sm font-black text-white"
            href="/user/ve-cua-toi"
          >
            Xem vé của tôi
          </Link>
        </div>
      </div>
    </section>
  );
}
