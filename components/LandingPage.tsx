"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
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
    <main className="min-h-screen bg-[#f7f9fc] text-[#101828]">
      <header className="sticky top-0 z-50 border-b border-[#d9e2ef] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative h-10 w-10 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#d9e2ef]">
              <Image alt="Logo Thành Trung Limousine" className="object-cover" fill sizes="40px" src="/logoicon.png" />
            </span>
            <span>
              <span className="block text-base font-black text-[#073b7a]">Thành Trung Limousine</span>
              <span className="block text-xs font-semibold text-[#667085]">Sàn đặt vé xe khách</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold text-[#344054] md:flex">
            <a className="font-bold hover:text-[#075bbf]" href="#danh-sach-chuyen">
              Chuyến xe
            </a>
            <a className="font-bold hover:text-[#075bbf]" href="#tuyen-pho-bien">
              Tuyến phổ biến
            </a>
            <Link className="font-bold hover:text-[#075bbf]" href="/user/ve-cua-toi">
              Vé của tôi
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {customer ? (
              <>
                <span className="max-w-[180px] truncate text-sm font-bold text-[#344054]">
                  {customer.name}
                </span>
                <button
                  className="rounded-md border border-[#d0d5dd] px-3 py-2 text-sm font-bold text-[#344054] hover:bg-[#f2f4f7]"
                  disabled={logoutSubmitting}
                  onClick={handleLogout}
                  type="button"
                >
                  {logoutSubmitting ? "Đang thoát..." : "Đăng xuất"}
                </button>
              </>
            ) : (
              <>
                <Link className="rounded-md px-3 py-2 text-sm font-bold text-[#075bbf]" href="/login">
                  Đăng nhập
                </Link>
                <Link
                  className="rounded-md bg-[#073b7a] px-4 py-2 text-sm font-bold text-white hover:bg-[#052f61]"
                  href="/register"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <button
            aria-label="Mở menu"
            className="rounded-md border border-[#d0d5dd] p-2 text-[#344054] md:hidden"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-[#d9e2ef] bg-white p-4 md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-black text-[#073b7a]">Menu</span>
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

      <section className="relative min-h-[620px] overflow-hidden bg-[#0b3f7a] text-white">
        <Image
          alt="Xe limousine Thành Trung trên hành trình liên tỉnh"
          className="object-cover opacity-40"
          fill
          priority
          src="/landmarks/northern-station.jpg"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,35,71,0.92),rgba(7,59,122,0.74),rgba(7,59,122,0.38))]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:pt-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-[#ffe082]">
              <BadgeCheck className="h-4 w-4" />
              Đặt vé xe limousine nhanh, rõ giá, giữ ghế trực tuyến
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Thành Trung Limousine
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#e8f3ff] sm:text-lg">
              Trải nghiệm đặt vé xe chuyên nghiệp với tìm chuyến nhanh, chọn ghế trực quan,
              thanh toán QR và vé điện tử sau khi nhà xe xác nhận.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["4.9/5", "Đánh giá dịch vụ"],
                ["24/7", "Hỗ trợ đặt vé"],
                [`${maxTicketsPerBooking} ghế`, "Tối đa mỗi đơn"]
              ].map(([value, label]) => (
                <div className="rounded-lg border border-white/15 bg-white/10 p-4" key={label}>
                  <p className="text-2xl font-black text-[#ffd166]">{value}</p>
                  <p className="mt-1 text-sm font-semibold text-[#d7ebff]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="self-end rounded-lg bg-white p-4 text-[#101828] shadow-[0_24px_80px_rgba(16,24,40,0.22)]">
            <div className="mb-4 flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <div>
                <p className="text-sm font-bold text-[#075bbf]">Tìm chuyến xe</p>
                <h2 className="text-xl font-black">Bạn muốn đi đâu?</h2>
              </div>
              <Search className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div className="grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#667085]">Điểm đi</span>
                <select
                  className="h-12 w-full rounded-md border-[#d0d5dd] text-sm font-bold focus:border-[#075bbf] focus:ring-[#075bbf]"
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
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#667085]">Điểm đến</span>
                <select
                  className="h-12 w-full rounded-md border-[#d0d5dd] text-sm font-bold focus:border-[#075bbf] focus:ring-[#075bbf]"
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
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#667085]">Ngày đi</span>
                  <input
                    className="h-12 w-full rounded-md border-[#d0d5dd] text-sm font-bold focus:border-[#075bbf] focus:ring-[#075bbf]"
                    min={todayKey()}
                    onChange={(event) => setSearchDate(event.target.value)}
                    type="date"
                    value={searchDate}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#667085]">Số khách</span>
                  <select
                    className="h-12 w-full rounded-md border-[#d0d5dd] text-sm font-bold focus:border-[#075bbf] focus:ring-[#075bbf]"
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
              </div>
              <button
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#073b7a] px-4 text-sm font-black text-white hover:bg-[#052f61]"
                onClick={handleSearch}
                type="button"
              >
                <Search className="h-4 w-4" />
                Tìm chuyến
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4">
        {[
          { desc: "Khoang ngồi thoải mái, tiện nghi rõ ràng.", icon: <Bus className="h-6 w-6 text-[#075bbf]" />, title: "Xe limousine" },
          { desc: "Giữ ghế và nhận mã đơn trực tuyến.", icon: <Ticket className="h-6 w-6 text-[#075bbf]" />, title: "Đặt vé nhanh" },
          { desc: "Hotline sẵn sàng xử lý thay đổi.", icon: <Headphones className="h-6 w-6 text-[#075bbf]" />, title: "Hỗ trợ 24/7" },
          { desc: "QR chuyển khoản và xác nhận vé.", icon: <CreditCard className="h-6 w-6 text-[#075bbf]" />, title: "Thanh toán tiện lợi" }
        ].map((item) => (
          <div className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm" key={item.title}>
            {item.icon}
            <h3 className="mt-3 font-black text-[#101828]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#667085]">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" id="tuyen-pho-bien">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#075bbf]">Tuyến phổ biến</p>
            <h2 className="text-2xl font-black text-[#101828] sm:text-3xl">Các hành trình được đặt nhiều</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#667085]">
            Giá hiển thị theo chuyến hiện có. Số ghế còn lại được cập nhật từ hệ thống đặt vé.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {trips.slice(0, 3).map((trip) => (
            <div className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm" key={trip.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[#101828]">{trip.route}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">
                    {trip.vehicle || "Limousine"} · {formatDate(trip.departureAt)}
                  </p>
                </div>
                <span className="rounded-md bg-[#fff7ed] px-2 py-1 text-xs font-black text-[#c2410c]">
                  {formatCurrency(trip.price)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-[#344054]">
                  <Clock3 className="h-4 w-4 text-[#075bbf]" />
                  {trip.time}
                </span>
                <span className="font-bold text-[#027a48]">{Math.max(trip.total - trip.sold, 0)} ghế trống</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d9e2ef] bg-white py-12" id="danh-sach-chuyen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#075bbf]">Danh sách chuyến</p>
              <h2 className="text-2xl font-black text-[#101828] sm:text-3xl">Chọn chuyến phù hợp</h2>
              <p className="mt-2 text-sm text-[#667085]">
                Lọc nhanh theo tuyến, loại xe và sắp xếp như một sàn đặt vé xe chuyên nghiệp.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border-[#d0d5dd] text-sm font-bold focus:border-[#075bbf] focus:ring-[#075bbf]"
                onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                value={sortMode}
              >
                <option value="early">Giờ đi sớm nhất</option>
                <option value="price">Giá thấp nhất</option>
                <option value="seats">Ghế còn nhiều</option>
              </select>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-3 text-sm font-bold text-[#344054]"
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
            <aside className="rounded-lg border border-[#e4e7ec] bg-[#f8fafc] p-4 lg:sticky lg:top-24 lg:self-start">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-black">Bộ lọc</h3>
                <SlidersHorizontal className="h-4 w-4 text-[#075bbf]" />
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-[#344054]">Loại xe</span>
                  <select
                    className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                    onChange={(event) => setVehicleFilter(event.target.value)}
                    value={vehicleFilter}
                  >
                    <option value="all">Tất cả</option>
                    <option value="limousine">Limousine</option>
                    <option value="16">16 chỗ</option>
                    <option value="45">Giường nằm</option>
                  </select>
                </label>
                <div className="rounded-lg bg-white p-3 text-sm text-[#344054]">
                  <p className="font-black text-[#101828]">Tiêu chí phổ biến</p>
                  <div className="mt-3 grid gap-2 font-semibold">
                    <span className="inline-flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-[#027a48]" />
                      Xác nhận nhanh
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-[#075bbf]" />
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
            <p className="text-sm font-black text-[#075bbf]">Chọn ghế</p>
            <h2 className="text-2xl font-black text-[#101828] sm:text-3xl">Sơ đồ ghế trực quan</h2>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-[#667085]">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-white ring-1 ring-[#d0d5dd]" />Trống</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#075bbf]" />Đang chọn</span>
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
                <span className="rounded-md bg-[#eff8ff] px-3 py-2 text-sm font-black text-[#075bbf]">
                  {formatCurrency(activeTrip.price)}/ghế
                </span>
              </div>
              <div className="rounded-[28px] border border-[#d9e2ef] bg-[#f8fafc] p-4">
                <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#d0d5dd] bg-white p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#073b7a] text-white">
                      <Bus className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#101828]">Cabin tài xế</p>
                      <p className="text-xs font-bold text-[#667085]">Đầu xe · lối lên xuống</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#eff8ff] px-3 py-1 text-xs font-black text-[#075bbf]">
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
                    className="h-10 rounded-md border-[#d0d5dd] py-0 text-sm font-black text-[#101828] focus:border-[#075bbf] focus:ring-[#075bbf]"
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
                    className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                    onChange={(event) => setPickupPoint(event.target.value)}
                    value={pickupPoint}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#667085]">Điểm trả</span>
                  <input
                    className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                    onChange={(event) => setDropoffPoint(event.target.value)}
                    value={dropoffPoint}
                  />
                </label>
              </div>
              <button
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#073b7a] px-4 text-sm font-black text-white hover:bg-[#052f61] disabled:bg-[#98a2b3]"
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
            <Armchair className="mx-auto h-8 w-8 text-[#075bbf]" />
            <p className="mt-3 text-sm font-bold text-[#667085]">Chọn một chuyến xe để xem sơ đồ ghế.</p>
          </div>
        )}

        {paymentInfo && recentBooking ? (
          <PaymentPanel booking={recentBooking} payment={paymentInfo} />
        ) : null}
      </section>

      <section className="bg-[#073b7a] py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
          <div>
            <h2 className="text-2xl font-black">Cần hỗ trợ đặt vé?</h2>
            <p className="mt-2 text-sm leading-6 text-[#d7ebff]">
              Đội ngũ Thành Trung Limousine hỗ trợ kiểm tra chuyến, điểm đón và trạng thái thanh toán.
            </p>
          </div>
          <div className="grid gap-2 text-sm font-bold">
            <a className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-[#073b7a]" href="tel:19001000">
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
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-[#667085] sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="font-bold text-[#073b7a]">Thành Trung Limousine</p>
          <p>Vé xe khách liên tỉnh · Thanh toán QR · Vé điện tử</p>
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
    <article className="rounded-lg border border-[#b8d7ff] bg-white p-5 shadow-[0_8px_24px_rgba(11,63,122,0.10)] transition hover:border-[#7db7ff] hover:shadow-[0_12px_30px_rgba(11,63,122,0.14)]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="grid gap-5 md:grid-cols-[264px_minmax(0,1fr)]">
          <div className="rounded-lg bg-[#f2f6fb] p-5 ring-1 ring-[#e7eef8]">
            <p className="text-sm font-black text-[#075bbf]">Thành Trung Limousine</p>
            <p className="mt-3 text-xl font-black text-[#101828]">{trip.vehicle || "Limousine"}</p>
            <p className="mt-1 text-xs font-bold text-[#667085]">{formatDate(trip.departureAt)}</p>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-3xl font-black text-[#073b7a]">{trip.time}</p>
                <p className="text-xs font-bold text-[#667085]">{trip.from}</p>
              </div>
              <div className="h-px w-12 bg-[#b8c4d6]" />
              <div className="text-right">
                <p className="text-3xl font-black text-[#073b7a]">{getArrivalTime(trip)}</p>
                <p className="text-xs font-bold text-[#667085]">{trip.to}</p>
              </div>
            </div>
            <p className="mt-3 rounded-md bg-white px-2 py-1 text-center text-xs font-black text-[#475467]">
              {getDurationLabel(trip)}
            </p>
          </div>
          <div className="py-1">
            <div>
              <div>
                <h3 className="text-xl font-black text-[#101828]">{trip.route}</h3>
                <p className="mt-1 text-sm font-semibold text-[#667085]">
                  Tài xế {trip.driver} · {trip.status}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[#344054] md:grid-cols-2">
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[#075bbf]" />
                <span><b>Đón:</b> {trip.from}</span>
              </span>
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[#f59e0b]" />
                <span><b>Trả:</b> {trip.to}</span>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[Wifi, Luggage, ShieldCheck, Star].map((Icon, index) => (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-[#f8fafc] px-2 py-1 text-xs font-bold text-[#475467]"
                  key={index}
                >
                  <Icon className="h-3.5 w-3.5 text-[#075bbf]" />
                  {["Xác nhận nhanh", "Hỗ trợ 24/7", "Thanh toán QR", "Đánh giá cao"][index]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:text-right">
          <p className="text-2xl font-black text-[#c2410c]">{formatCurrency(trip.price)}</p>
          <p className="text-sm font-bold text-[#667085]">mỗi ghế</p>
          <div className="mt-4 rounded-lg border border-[#eaecf0] p-4 text-left">
            <p className="text-sm font-bold text-[#667085]">Số ghế còn</p>
            <p className="mt-2 text-3xl font-black text-[#073b7a]">{seatsLeft}</p>
            <button
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#073b7a] px-4 text-sm font-black text-white hover:bg-[#052f61]"
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
        <h4 className="text-sm font-black text-[#073b7a]">{label}</h4>
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
                    ? "border-[#073b7a] bg-[#075bbf] text-white"
                    : unavailable
                      ? "cursor-not-allowed border-[#eaecf0] bg-[#f2f4f7] text-[#98a2b3]"
                      : "border-[#d0d5dd] bg-white text-[#344054] hover:border-[#075bbf] hover:bg-[#eff8ff]"
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
        <div className="rounded-lg border border-[#e4e7ec] bg-[#f8fafc] p-4">
          <QRCodeSVG className="h-full w-full" value={payment.qrValue} />
        </div>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#075bbf]">Thanh toán QR</p>
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
          <p className="mt-4 rounded-lg bg-[#eff8ff] p-3 text-sm font-semibold leading-6 text-[#075bbf]">
            Sau khi nhận được thanh toán, nhà xe sẽ xác nhận vé. Mã đơn của bạn là {payment.bookingCode}.
          </p>
          <Link
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#073b7a] px-4 text-sm font-black text-white"
            href="/user/ve-cua-toi"
          >
            Xem vé của tôi
          </Link>
        </div>
      </div>
    </section>
  );
}
