"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApexOptions } from "apexcharts";
import {
  BarChart3,
  Bus,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Filter,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Save,
  Search,
  Settings,
  Ticket,
  Trash2,
  Users,
  X
} from "lucide-react";
import type { ApiBooking, ApiTrip } from "@/lib/transport-api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type PageKey =
  | "overview"
  | "trips"
  | "bookings"
  | "customers"
  | "payments"
  | "cancellations"
  | "feedbacks"
  | "revenue"
  | "settings";

type AdminStats = {
  bookingStatusCounts: Record<string, number>;
  soldSeats: number;
  totalBookings: number;
  totalCustomers: number;
  totalFeedbacks: number;
  totalRevenue: number;
  totalSeats: number;
  totalTrips: number;
  tripStatusCounts: Record<string, number>;
};

type FeedbackItem = {
  bookingId: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  id: string;
  message: string;
  rating: number;
  route: string;
  status: string;
};

type CustomerSummary = {
  createdAt?: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  revenue: number;
  tickets: number;
  totalBookings?: number;
};

type CancellationItem = {
  bookingCode: string;
  bookingId: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  id: string;
  note: string;
  reason: string;
  route: string;
  seatCodes: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalAmount: number;
  travelDate: string;
};

type RevenueReport = {
  daily: Array<{ date: string; revenue: number; tickets: number }>;
  monthly: Array<{ month: string; revenue: number; tickets: number }>;
  monthRevenue: number;
  soldTickets: number;
  todayRevenue: number;
  totalRevenue: number;
};

type TripFormState = {
  arrivalDate: string;
  arrivalTime: string;
  code: string;
  departureDate: string;
  driver: string;
  from: string;
  id: string;
  price: string;
  route: string;
  status: string;
  to: string;
  time: string;
  total: string;
  vehicle: string;
};

const emptyStats: AdminStats = {
  bookingStatusCounts: {},
  soldSeats: 0,
  totalBookings: 0,
  totalCustomers: 0,
  totalFeedbacks: 0,
  totalRevenue: 0,
  totalSeats: 0,
  totalTrips: 0,
  tripStatusCounts: {}
};

const emptyRevenue: RevenueReport = {
  daily: [],
  monthly: [],
  monthRevenue: 0,
  soldTickets: 0,
  todayRevenue: 0,
  totalRevenue: 0
};

const navItems: Array<{ icon: ReactNode; key: PageKey; label: string }> = [
  { icon: <LayoutDashboard className="h-4 w-4" />, key: "overview", label: "Tổng quan" },
  { icon: <Route className="h-4 w-4" />, key: "trips", label: "Quản lý chuyến xe" },
  { icon: <Ticket className="h-4 w-4" />, key: "bookings", label: "Quản lý vé/booking" },
  { icon: <Users className="h-4 w-4" />, key: "customers", label: "Quản lý khách hàng" },
  { icon: <CreditCard className="h-4 w-4" />, key: "payments", label: "Quản lý thanh toán" },
  { icon: <RotateCcw className="h-4 w-4" />, key: "cancellations", label: "Yêu cầu hủy vé" },
  { icon: <MessageSquare className="h-4 w-4" />, key: "feedbacks", label: "Phản hồi khách hàng" },
  { icon: <BarChart3 className="h-4 w-4" />, key: "revenue", label: "Báo cáo doanh thu" },
  { icon: <Settings className="h-4 w-4" />, key: "settings", label: "Cài đặt hệ thống" }
];

const pageMeta: Record<PageKey, { desc: string; title: string }> = {
  bookings: {
    desc: "Theo dõi đơn đặt vé, ghế, thanh toán và vé điện tử.",
    title: "Quản lý vé/booking"
  },
  cancellations: {
    desc: "Xử lý các yêu cầu hủy vé do khách hàng gửi.",
    title: "Yêu cầu hủy vé"
  },
  customers: {
    desc: "Danh sách khách hàng, số booking và tổng chi.",
    title: "Quản lý khách hàng"
  },
  feedbacks: {
    desc: "Tổng hợp phản hồi khách hàng gửi về nhà xe.",
    title: "Phản hồi khách hàng"
  },
  overview: {
    desc: "Theo dõi doanh thu, chuyến xe, vé bán và phản hồi.",
    title: "Tổng quan"
  },
  payments: {
    desc: "Đối soát các đơn chờ thanh toán và xác nhận vé.",
    title: "Quản lý thanh toán"
  },
  revenue: {
    desc: "Biểu đồ doanh thu 7 ngày, theo tháng và số vé bán.",
    title: "Báo cáo doanh thu"
  },
  settings: {
    desc: "Thông tin cấu hình cơ bản, không hiển thị secret.",
    title: "Cài đặt hệ thống"
  },
  trips: {
    desc: "Tạo, sửa và quản lý lịch chạy của Thành Trung Limousine.",
    title: "Quản lý chuyến xe"
  }
};

const emptyTripForm: TripFormState = {
  arrivalDate: "",
  arrivalTime: "",
  code: "",
  departureDate: todayInputDate(),
  driver: "",
  from: "",
  id: "",
  price: "",
  route: "",
  status: "Sắp chạy",
  to: "",
  time: "07:30",
  total: "16",
  vehicle: ""
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function todayInputDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function dateInputFromIso(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh"
  }).format(date);
}

function bookingStatusLabel(booking: ApiBooking) {
  if (booking.cancellationStatus === "PENDING") {
    return "Chờ duyệt hủy";
  }

  if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
    return "Đã hủy";
  }

  if (booking.paymentStatus === "Thanh toán thành công" || booking.status === "CONFIRMED") {
    return "Đã thanh toán";
  }

  return "Chờ thanh toán";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [sessionIssue, setSessionIssue] = useState("");
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [trips, setTrips] = useState<ApiTrip[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [cancellations, setCancellations] = useState<CancellationItem[]>([]);
  const [registeredCustomers, setRegisteredCustomers] = useState<CustomerSummary[]>([]);
  const [revenue, setRevenue] = useState<RevenueReport>(emptyRevenue);
  const [tripForm, setTripForm] = useState<TripFormState>(emptyTripForm);
  const [tripSaving, setTripSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const customers = registeredCustomers.length ? registeredCustomers : buildCustomerSummaries(bookings);
  const filteredBookings = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return bookings;
    }

    return bookings.filter((booking) =>
      [booking.code, booking.customerName, booking.customerPhone, booking.route, booking.paymentStatus]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [bookings, query]);

  const pendingPayments = useMemo(
    () => bookings.filter((booking) => bookingStatusLabel(booking) === "Chờ thanh toán"),
    [bookings]
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setSessionIssue("");
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) {
            setSessionIssue("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
          }
          return;
        }
        if (!response.ok) {
          throw new Error("Không thể kiểm tra phiên đăng nhập.");
        }

        const data = (await response.json()) as { user?: { role?: string } | null };
        if (cancelled) {
          return;
        }

        if (data.user?.role !== "ADMIN") {
          setSessionIssue("Tài khoản hiện tại không có quyền truy cập khu vực quản trị.");
          return;
        }

        const hash = window.location.hash.replace("#", "");
        const normalizedHash = hash === "booking" ? "bookings" : hash;
        if (navItems.some((item) => item.key === normalizedHash)) {
          setActivePage(normalizedHash as PageKey);
        }

        setAuthorized(true);
        await refreshAll();
      } catch {
        if (!cancelled) {
          setSessionIssue("Không thể tải phiên đăng nhập. Vui lòng làm mới lại trang.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // refreshAll is intentionally kept out to avoid re-running bootstrap on every state refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (authorized) {
      window.history.replaceState(null, "", `#${activePage}`);
    }
  }, [activePage, authorized]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshCancellations();
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [authorized]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    async function keepSessionAlive() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          setAuthorized(false);
          setSessionIssue("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
        }
      } catch {
        // Keep the current screen during transient network issues.
      }
    }

    const timer = window.setInterval(() => {
      void keepSessionAlive();
    }, 15 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [authorized]);

  async function refreshAll() {
    await Promise.all([
      refreshStats(),
      refreshTrips(),
      refreshBookings(),
      refreshFeedbacks(),
      refreshCancellations(),
      refreshCustomers(),
      refreshRevenue()
    ]);
  }

  async function handleManualRefresh() {
    setRefreshing(true);
    try {
      await refreshAll();
      setToast("Dữ liệu đã được làm mới.");
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshStats() {
    try {
      const response = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; stats?: AdminStats };
      if (!response.ok || !data.stats) {
        throw new Error(data.error || "Không thể tải thống kê.");
      }

      setStats(data.stats);
    } catch (error) {
      setStats(emptyStats);
      setToast(error instanceof Error ? error.message : "Không thể tải thống kê.");
    }
  }

  async function refreshTrips() {
    try {
      const response = await fetch("/api/admin/trips", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; trips?: ApiTrip[] };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải chuyến xe.");
      }

      setTrips(data.trips || []);
    } catch (error) {
      setTrips([]);
      setToast(error instanceof Error ? error.message : "Không thể tải chuyến xe.");
    }
  }

  async function refreshBookings() {
    try {
      const response = await fetch("/api/admin/bookings", { cache: "no-store" });
      const data = (await response.json()) as { bookings?: ApiBooking[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải booking.");
      }

      setBookings(data.bookings || []);
    } catch (error) {
      setBookings([]);
      setToast(error instanceof Error ? error.message : "Không thể tải booking.");
    }
  }

  async function refreshFeedbacks() {
    try {
      const response = await fetch("/api/admin/feedbacks", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; feedbacks?: FeedbackItem[] };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải phản hồi.");
      }

      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      setFeedbacks([]);
      setToast(error instanceof Error ? error.message : "Không thể tải phản hồi.");
    }
  }

  async function refreshCancellations() {
    try {
      const response = await fetch("/api/admin/cancellations", { cache: "no-store" });
      const data = (await response.json()) as { cancellations?: CancellationItem[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải yêu cầu hủy vé.");
      }

      setCancellations(data.cancellations || []);
    } catch (error) {
      setCancellations([]);
      setToast(error instanceof Error ? error.message : "Không thể tải yêu cầu hủy vé.");
    }
  }

  async function refreshCustomers() {
    try {
      const response = await fetch("/api/admin/customers", { cache: "no-store" });
      const data = (await response.json()) as { customers?: CustomerSummary[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải khách hàng.");
      }

      setRegisteredCustomers(data.customers || []);
    } catch (error) {
      setRegisteredCustomers([]);
      setToast(error instanceof Error ? error.message : "Không thể tải khách hàng.");
    }
  }

  async function refreshRevenue() {
    try {
      const response = await fetch("/api/admin/revenue", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; revenue?: RevenueReport };
      if (!response.ok || !data.revenue) {
        throw new Error(data.error || "Không thể tải báo cáo doanh thu.");
      }

      setRevenue(data.revenue);
    } catch (error) {
      setRevenue(emptyRevenue);
      setToast(error instanceof Error ? error.message : "Không thể tải báo cáo doanh thu.");
    }
  }

  async function handleLogout() {
    setLogoutSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
    } finally {
      setLogoutSubmitting(false);
    }
  }

  async function confirmPayment(booking: ApiBooking) {
    const actionKey = `confirm-${booking.id}`;
    if (pendingAction) {
      return;
    }

    setPendingAction(actionKey);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/confirm-payment`, { method: "POST" });
      const data = (await response.json()) as { booking?: ApiBooking; error?: string };
      if (!response.ok || !data.booking) {
        throw new Error(data.error || "Không thể xác nhận thanh toán.");
      }

      const updatedBooking = data.booking;
      setBookings((current) => current.map((item) => (item.id === updatedBooking.id ? updatedBooking : item)));
      await Promise.all([refreshStats(), refreshBookings(), refreshRevenue()]);
      setToast(`Đã xác nhận thanh toán và chuyến xe cho mã ${updatedBooking.code}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể xác nhận thanh toán.");
    } finally {
      setPendingAction("");
    }
  }

  async function rejectBooking(booking: ApiBooking) {
    const reason = window.prompt(`Nhập lý do từ chối mã ${booking.code}`);
    if (reason === null) {
      return;
    }

    const actionKey = `reject-${booking.id}`;
    if (pendingAction) {
      return;
    }

    setPendingAction(actionKey);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/reject`, {
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = (await response.json()) as { booking?: ApiBooking; error?: string };
      if (!response.ok || !data.booking) {
        throw new Error(data.error || "Không thể từ chối booking.");
      }

      const rejectedBooking = data.booking;
      setBookings((current) => current.map((item) => (item.id === rejectedBooking.id ? rejectedBooking : item)));
      await Promise.all([refreshStats(), refreshBookings(), refreshTrips(), refreshRevenue()]);
      setToast(`Đã từ chối mã ${rejectedBooking.code}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể từ chối booking.");
    } finally {
      setPendingAction("");
    }
  }

  async function processCancellation(cancellation: CancellationItem, status: "APPROVED" | "REJECTED") {
    const actionKey = `cancel-${status}-${cancellation.id}`;
    if (pendingAction) {
      return;
    }

    setPendingAction(actionKey);
    try {
      const response = await fetch(`/api/admin/cancellations/${cancellation.id}`, {
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH"
      });
      const data = (await response.json()) as { cancellation?: CancellationItem; error?: string };
      if (!response.ok || !data.cancellation) {
        throw new Error(data.error || "Không thể xử lý yêu cầu hủy vé.");
      }

      await Promise.all([refreshCancellations(), refreshBookings(), refreshTrips(), refreshStats(), refreshRevenue()]);
      setToast(
        status === "APPROVED"
          ? `Đã duyệt hủy mã ${data.cancellation.bookingCode}.`
          : `Đã từ chối yêu cầu hủy mã ${data.cancellation.bookingCode}.`
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể xử lý yêu cầu hủy vé.");
    } finally {
      setPendingAction("");
    }
  }

  async function saveTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTripSaving(true);
    try {
      const payload = {
        arrivalDate: tripForm.arrivalDate,
        arrivalTime: tripForm.arrivalTime,
        code: tripForm.code,
        departureDate: tripForm.departureDate,
        driver: tripForm.driver,
        from: tripForm.from,
        price: tripForm.price,
        route: tripForm.route || (tripForm.from && tripForm.to ? `${tripForm.from} - ${tripForm.to}` : ""),
        status: tripForm.status,
        to: tripForm.to,
        time: tripForm.time,
        total: Number(tripForm.total),
        vehicle: tripForm.vehicle
      };
      const response = await fetch(tripForm.id ? `/api/admin/trips/${tripForm.id}` : "/api/admin/trips", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: tripForm.id ? "PUT" : "POST"
      });
      const data = (await response.json()) as { error?: string; trip?: ApiTrip };
      if (!response.ok || !data.trip) {
        throw new Error(data.error || "Không thể lưu chuyến xe.");
      }

      setTripForm(emptyTripForm);
      await Promise.all([refreshTrips(), refreshStats()]);
      setToast(`Đã lưu chuyến ${data.trip.code}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể lưu chuyến xe.");
    } finally {
      setTripSaving(false);
    }
  }

  async function deleteTrip(trip: ApiTrip) {
    const message =
      trip.sold > 0
        ? `Chuyến ${trip.code} đang có ${trip.sold} vé/ghế liên quan. Xóa chuyến sẽ xóa booking và vé của chuyến này. Tiếp tục?`
        : `Xóa chuyến ${trip.code}?`;
    if (!window.confirm(message)) {
      return;
    }

    const actionKey = `delete-trip-${trip.id}`;
    if (pendingAction) {
      return;
    }

    setPendingAction(actionKey);
    try {
      const response = await fetch(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { deletedBookings?: number; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Không thể xóa chuyến xe.");
      }

      await Promise.all([refreshTrips(), refreshBookings(), refreshCancellations(), refreshStats(), refreshRevenue()]);
      setToast(`Đã xóa chuyến ${trip.code}${data.deletedBookings ? ` và ${data.deletedBookings} booking liên quan` : ""}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể xóa chuyến xe.");
    } finally {
      setPendingAction("");
    }
  }

  function startEditTrip(trip: ApiTrip) {
    setTripForm({
      arrivalDate: dateInputFromIso(trip.arrivalAt),
      arrivalTime: trip.arrivalAt ? new Date(trip.arrivalAt).toTimeString().slice(0, 5) : "",
      code: trip.code,
      departureDate: dateInputFromIso(trip.departureAt),
      driver: trip.driver,
      from: trip.from,
      id: trip.id,
      price: String(trip.price),
      route: trip.route,
      status: trip.status,
      to: trip.to,
      time: trip.time,
      total: String(trip.total),
      vehicle: trip.vehicle
    });
    setActivePage("trips");
  }

  if (sessionIssue && !authorized && !loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-4 text-[#344054]">
        <div className="max-w-md rounded-lg border border-[#e4e7ec] bg-white px-5 py-4 text-sm font-bold shadow-sm">
          <p>{sessionIssue}</p>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-md bg-[#0a4f8f] px-4 py-2 text-white"
              onClick={() => window.location.reload()}
              type="button"
            >
              Làm mới
            </button>
            <button
              className="rounded-md border border-[#d0d5dd] px-4 py-2 text-[#344054]"
              onClick={() => router.replace("/admin/login")}
              type="button"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!authorized || loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f9fc] text-[#344054]">
        <div className="rounded-lg border border-[#e4e7ec] bg-white px-5 py-4 text-sm font-bold shadow-sm">
          Đang tải khu vực quản trị...
        </div>
      </main>
    );
  }

  const currentPage = pageMeta[activePage];

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#101828]">
      {sidebarOpen ? (
        <button
          aria-label="Đóng sidebar"
          className="fixed inset-0 z-30 bg-[#101828]/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-[#d9e2ef] bg-[#083d77] p-4 text-white transition lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative h-11 w-11 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-white/30">
              <Image alt="Logo Thành Trung Limousine" className="object-cover" fill sizes="44px" src="/logoicon.png" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#d7ebff]">Thành Trung</p>
              <h1 className="font-black">Limousine Admin</h1>
            </div>
          </div>
          <button className="rounded-md p-2 lg:hidden" onClick={() => setSidebarOpen(false)} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <button
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold",
                item.key === activePage ? "bg-white text-[#083d77]" : "text-[#d7ebff] hover:bg-white/10"
              ].join(" ")}
              key={item.key}
              onClick={() => {
                setActivePage(item.key);
                setSidebarOpen(false);
              }}
              type="button"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#d9e2ef] bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Mở sidebar"
                className="rounded-md border border-[#d0d5dd] p-2 text-[#344054] lg:hidden"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#0a6ea8]">Thành Trung Limousine Admin</p>
                <h2 className="truncate text-xl font-black">{currentPage.title}</h2>
                <p className="hidden text-sm text-[#667085] sm:block">{currentPage.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="hidden h-10 items-center gap-2 rounded-md border border-[#d0d5dd] px-3 text-sm font-bold text-[#344054] sm:inline-flex"
                disabled={refreshing}
                onClick={handleManualRefresh}
                type="button"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                {refreshing ? "Đang tải..." : "Làm mới"}
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a4f8f] px-3 text-sm font-bold text-white"
                disabled={logoutSubmitting}
                onClick={handleLogout}
                type="button"
              >
                {logoutSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="hidden sm:inline">{logoutSubmitting ? "Đang thoát..." : "Đăng xuất"}</span>
              </button>
            </div>
          </div>
        </header>

        <section className="px-4 py-6 sm:px-6">
          {activePage === "overview" ? (
            <OverviewPage
              bookings={bookings}
              cancellations={cancellations}
              feedbacks={feedbacks}
              pendingPayments={pendingPayments}
              revenue={revenue}
              stats={stats}
              trips={trips}
            />
          ) : null}
          {activePage === "trips" ? (
            <TripsPage
              form={tripForm}
              onDelete={deleteTrip}
              onEdit={startEditTrip}
              onFormChange={setTripForm}
              onSave={saveTrip}
              pendingAction={pendingAction}
              saving={tripSaving}
              trips={trips}
            />
          ) : null}
          {activePage === "bookings" ? (
            <BookingsPage
              bookings={filteredBookings}
              onConfirmPayment={confirmPayment}
              onRejectBooking={rejectBooking}
              pendingAction={pendingAction}
              query={query}
              setQuery={setQuery}
            />
          ) : null}
          {activePage === "customers" ? <CustomersPage customers={customers} /> : null}
          {activePage === "payments" ? (
            <PaymentsPage
              bookings={bookings}
              onConfirmPayment={confirmPayment}
              onRejectBooking={rejectBooking}
              pendingAction={pendingAction}
            />
          ) : null}
          {activePage === "cancellations" ? (
            <CancellationsPage cancellations={cancellations} onProcess={processCancellation} pendingAction={pendingAction} />
          ) : null}
          {activePage === "feedbacks" ? <FeedbacksPage feedbacks={feedbacks} /> : null}
          {activePage === "revenue" ? <RevenuePage revenue={revenue} /> : null}
          {activePage === "settings" ? <SettingsPage /> : null}
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-[#d0d5dd] bg-white px-4 py-3 text-sm font-bold text-[#344054] shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function OverviewPage({
  bookings,
  cancellations,
  feedbacks,
  pendingPayments,
  revenue,
  stats,
  trips
}: {
  bookings: ApiBooking[];
  cancellations: CancellationItem[];
  feedbacks: FeedbackItem[];
  pendingPayments: ApiBooking[];
  revenue: RevenueReport;
  stats: AdminStats;
  trips: ApiTrip[];
}) {
  const seatRate = stats.totalSeats ? Math.round((stats.soldSeats / stats.totalSeats) * 100) : 0;
  const pendingCancellations = cancellations.filter((item) => item.status === "PENDING").length;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Doanh thu" value={formatCurrency(revenue.totalRevenue || stats.totalRevenue)} />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Hôm nay" value={formatCurrency(revenue.todayRevenue)} />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Tháng này" value={formatCurrency(revenue.monthRevenue)} />
        <StatCard icon={<Ticket className="h-5 w-5" />} label="Vé đã bán" value={String(revenue.soldTickets || stats.soldSeats)} />
        <StatCard icon={<Bus className="h-5 w-5" />} label="Chuyến xe" value={String(stats.totalTrips)} />
        <StatCard icon={<RotateCcw className="h-5 w-5" />} label="Chờ duyệt hủy" value={String(pendingCancellations)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">Vận hành hôm nay</h3>
              <p className="mt-1 text-sm text-[#667085]">Tổng quan chuyến, ghế và đơn đang chờ xử lý.</p>
            </div>
            <span className="rounded-md bg-[#eff8ff] px-3 py-2 text-sm font-black text-[#075bbf]">
              Lấp đầy {seatRate}%
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MiniPanel label="Chuyến gần nhất" value={trips[0]?.route || "Chưa có chuyến"} />
            <MiniPanel label="Booking mới" value={String(bookings.length)} />
            <MiniPanel label="Chờ thanh toán" value={String(pendingPayments.length)} />
          </div>
          <div className="mt-5">
            <RevenueChart revenue={revenue} type="daily" />
          </div>
          <div className="mt-5 overflow-hidden rounded-lg border border-[#eaecf0]">
            <BookingTable bookings={bookings.slice(0, 6)} compact />
          </div>
        </section>

        <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Phản hồi mới</h3>
          <div className="mt-4 grid gap-3">
            {feedbacks.slice(0, 4).map((feedback) => (
              <div className="rounded-lg bg-[#f8fafc] p-3" key={feedback.id}>
                <p className="text-sm font-black">{feedback.customerName}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#667085]">{feedback.message}</p>
                <p className="mt-2 text-xs font-bold text-[#075bbf]">{feedback.rating} sao · {feedback.route}</p>
              </div>
            ))}
            {!feedbacks.length ? <p className="text-sm font-semibold text-[#667085]">Chưa có phản hồi.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function TripsPage({
  form,
  onDelete,
  onEdit,
  onFormChange,
  onSave,
  pendingAction,
  saving,
  trips
}: {
  form: TripFormState;
  onDelete: (trip: ApiTrip) => void;
  onEdit: (trip: ApiTrip) => void;
  onFormChange: (form: TripFormState) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  pendingAction: string;
  saving: boolean;
  trips: ApiTrip[];
}) {
  function update(field: keyof TripFormState, value: string) {
    const nextForm = { ...form, [field]: value };
    if (field === "from" || field === "to") {
      nextForm.route =
        nextForm.from && nextForm.to ? `${nextForm.from} - ${nextForm.to}` : nextForm.route;
    }
    onFormChange(nextForm);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <form className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm" onSubmit={onSave}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black">{form.id ? "Sửa chuyến xe" : "Tạo chuyến xe"}</h3>
            <p className="mt-1 text-sm text-[#667085]">Nhập tuyến theo dạng Vinh - Hoàng Mai.</p>
          </div>
          <Plus className="h-5 w-5 text-[#075bbf]" />
        </div>
        <div className="grid gap-3">
          <FormInput label="Mã chuyến" onChange={(value) => update("code", value)} placeholder="Tự tạo nếu bỏ trống" value={form.code} />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Điểm đón" onChange={(value) => update("from", value)} placeholder="Vinh" required value={form.from} />
            <FormInput label="Điểm trả" onChange={(value) => update("to", value)} placeholder="Hà Nội" required value={form.to} />
          </div>
          <FormInput label="Tuyến" onChange={(value) => update("route", value)} placeholder="Vinh - Hà Nội" required value={form.route} />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Ngày đi" onChange={(value) => update("departureDate", value)} required type="date" value={form.departureDate} />
            <FormInput label="Ngày dự kiến đến" onChange={(value) => update("arrivalDate", value)} type="date" value={form.arrivalDate} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Giờ đi" onChange={(value) => update("time", value)} required type="time" value={form.time} />
            <FormInput label="Giờ đến" onChange={(value) => update("arrivalTime", value)} type="time" value={form.arrivalTime} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Tổng ghế" onChange={(value) => update("total", value)} required type="number" value={form.total} />
            <FormInput label="Giá vé" onChange={(value) => update("price", value)} placeholder="300.000" required value={form.price} />
          </div>
          <FormInput label="Xe" onChange={(value) => update("vehicle", value)} placeholder="37B-xxxxx" value={form.vehicle} />
          <FormInput label="Tài xế" onChange={(value) => update("driver", value)} placeholder="Tên tài xế" value={form.driver} />
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Trạng thái</span>
            <select
              className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => update("status", event.target.value)}
              value={form.status}
            >
              {["Sắp chạy", "Đang chạy", "Hoàn thành", "Đã hủy"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#0a4f8f] px-4 text-sm font-black text-white disabled:bg-[#98a2b3]"
            disabled={saving}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu chuyến"}
          </button>
          {form.id ? (
            <button
              className="h-11 rounded-md border border-[#d0d5dd] px-4 text-sm font-bold text-[#344054]"
              onClick={() => onFormChange(emptyTripForm)}
              type="button"
            >
              Hủy
            </button>
          ) : null}
        </div>
      </form>

      <section className="rounded-lg border border-[#e4e7ec] bg-white shadow-sm">
        <div className="border-b border-[#eaecf0] p-5">
          <h3 className="text-lg font-black">Danh sách chuyến xe</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs font-black text-[#667085]">
              <tr>
                <th className="px-4 py-3">Chuyến</th>
                <th className="px-4 py-3">Điểm đón/trả</th>
                <th className="px-4 py-3">Giờ</th>
                <th className="px-4 py-3">Ghế</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaecf0]">
              {trips.map((trip) => {
                const deleting = pendingAction === `delete-trip-${trip.id}`;

                return (
                  <tr key={trip.id}>
                    <td className="px-4 py-3">
                      <p className="font-black">{trip.route}</p>
                      <p className="text-xs font-semibold text-[#667085]">{trip.code} · {trip.vehicle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{trip.from}</p>
                      <p className="text-xs text-[#667085]">{trip.to}</p>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <p>{trip.time}</p>
                      <p className="text-xs text-[#667085]">{formatDate(trip.departureAt)}</p>
                      <p className="text-xs text-[#667085]">
                        Đến {trip.arrivalAt ? formatDate(trip.arrivalAt) : "chưa có dự kiến"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{trip.sold}/{trip.total}</td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(trip.price)}</td>
                    <td className="px-4 py-3"><TripStatusBadge status={trip.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-md border border-[#d0d5dd] p-2 text-[#344054] disabled:opacity-60"
                          disabled={Boolean(pendingAction)}
                          onClick={() => onEdit(trip)}
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md border border-[#fecdd3] p-2 text-[#be123c] disabled:opacity-60"
                          disabled={Boolean(pendingAction)}
                          onClick={() => onDelete(trip)}
                          type="button"
                        >
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!trips.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-bold text-[#667085]" colSpan={7}>
                    Chưa có chuyến xe.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BookingsPage({
  bookings,
  onConfirmPayment,
  onRejectBooking,
  pendingAction,
  query,
  setQuery
}: {
  bookings: ApiBooking[];
  onConfirmPayment: (booking: ApiBooking) => void;
  onRejectBooking: (booking: ApiBooking) => void;
  pendingAction: string;
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#eaecf0] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black">Danh sách booking</h3>
          <p className="mt-1 text-sm text-[#667085]">Tìm theo mã vé, khách hàng, số điện thoại hoặc tuyến.</p>
        </div>
        <label className="flex h-11 items-center gap-2 rounded-md border border-[#d0d5dd] px-3 text-[#667085] sm:w-80">
          <Search className="h-4 w-4" />
          <input
            className="h-full flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm booking"
            value={query}
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <BookingTable
          bookings={bookings}
          onConfirmPayment={onConfirmPayment}
          onRejectBooking={onRejectBooking}
          pendingAction={pendingAction}
        />
      </div>
    </section>
  );
}

function PaymentsPage({
  bookings,
  onConfirmPayment,
  onRejectBooking,
  pendingAction
}: {
  bookings: ApiBooking[];
  onConfirmPayment: (booking: ApiBooking) => void;
  onRejectBooking: (booking: ApiBooking) => void;
  pendingAction: string;
}) {
  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white shadow-sm">
      <div className="border-b border-[#eaecf0] p-5">
        <h3 className="text-lg font-black">Đối soát thanh toán</h3>
        <p className="mt-1 text-sm text-[#667085]">Xác nhận các đơn đã nhận tiền để phát hành vé điện tử.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs font-black text-[#667085]">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Số tiền</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaecf0]">
            {bookings.map((booking) => {
              const status = bookingStatusLabel(booking);
              const confirming = pendingAction === `confirm-${booking.id}`;
              const rejecting = pendingAction === `reject-${booking.id}`;
              return (
                <tr key={booking.id}>
                  <td className="px-4 py-3">
                    <p className="font-black">{booking.code}</p>
                    <p className="text-xs font-semibold text-[#667085]">{booking.paymentReference || booking.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold">{booking.customerName}</p>
                    <p className="text-xs text-[#667085]">{booking.route}</p>
                  </td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(booking.price)}</td>
                  <td className="px-4 py-3">{booking.paymentProvider || booking.paymentMethod || "Chưa chọn"}</td>
                  <td className="px-4 py-3"><BookingStatusBadge status={status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {status === "Chờ thanh toán" ? (
                        <>
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0a4f8f] px-3 text-xs font-black text-white disabled:bg-[#98a2b3]"
                            disabled={Boolean(pendingAction)}
                            onClick={() => onConfirmPayment(booking)}
                            type="button"
                          >
                            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {confirming ? "Đang xác nhận..." : "Xác nhận thanh toán"}
                          </button>
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#fecdd3] px-3 text-xs font-black text-[#be123c] disabled:opacity-60"
                            disabled={Boolean(pendingAction)}
                            onClick={() => onRejectBooking(booking)}
                            type="button"
                          >
                            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {rejecting ? "Đang từ chối..." : "Từ chối"}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-[#667085]">Đã xử lý</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!bookings.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm font-bold text-[#667085]" colSpan={6}>
                  Chưa có dữ liệu thanh toán.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CancellationsPage({
  cancellations,
  onProcess,
  pendingAction
}: {
  cancellations: CancellationItem[];
  onProcess: (cancellation: CancellationItem, status: "APPROVED" | "REJECTED") => void;
  pendingAction: string;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const rows = cancellations.filter((item) => statusFilter === "all" || item.status === statusFilter);

  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#eaecf0] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black">Yêu cầu hủy vé</h3>
          <p className="mt-1 text-sm text-[#667085]">Duyệt hoặc từ chối yêu cầu hủy do khách gửi.</p>
        </div>
        <select
          className="h-10 rounded-md border-[#d0d5dd] text-sm font-bold focus:border-[#075bbf] focus:ring-[#075bbf]"
          onChange={(event) => setStatusFilter(event.target.value)}
          value={statusFilter}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs font-black text-[#667085]">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Chuyến xe</th>
              <th className="px-4 py-3">Lý do</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaecf0]">
            {rows.map((item) => {
              const approving = pendingAction === `cancel-APPROVED-${item.id}`;
              const rejecting = pendingAction === `cancel-REJECTED-${item.id}`;

              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-black">{item.bookingCode}</p>
                    <p className="text-xs font-semibold text-[#667085]">
                      Ghế {item.seatCodes.join(", ") || "đã giải phóng"} · {formatDate(item.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold">{item.customerName}</p>
                    <p className="text-xs text-[#667085]">{item.customerPhone || item.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">{item.route}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{item.reason}</p>
                    {item.note ? <p className="mt-1 text-xs text-[#667085]">{item.note}</p> : null}
                  </td>
                  <td className="px-4 py-3"><CancellationStatusBadge status={item.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {item.status === "PENDING" ? (
                        <>
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0a4f8f] px-3 text-xs font-black text-white disabled:bg-[#98a2b3]"
                            disabled={Boolean(pendingAction)}
                            onClick={() => onProcess(item, "APPROVED")}
                            type="button"
                          >
                            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {approving ? "Đang duyệt..." : "Duyệt hủy"}
                          </button>
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#fecdd3] px-3 text-xs font-black text-[#be123c] disabled:opacity-60"
                            disabled={Boolean(pendingAction)}
                            onClick={() => onProcess(item, "REJECTED")}
                            type="button"
                          >
                            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {rejecting ? "Đang từ chối..." : "Từ chối"}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-[#667085]">Đã xử lý</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm font-bold text-[#667085]" colSpan={6}>
                  Chưa có yêu cầu hủy vé.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CustomersPage({ customers }: { customers: CustomerSummary[] }) {
  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white shadow-sm">
      <div className="border-b border-[#eaecf0] p-5">
        <h3 className="text-lg font-black">Khách hàng</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs font-black text-[#667085]">
            <tr>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Liên hệ</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Số vé</th>
              <th className="px-4 py-3">Doanh thu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaecf0]">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3">
                  <p className="font-black">{customer.name}</p>
                  <p className="text-xs font-semibold text-[#667085]">{customer.email}</p>
                </td>
                <td className="px-4 py-3">{customer.phone || "Chưa cập nhật"}</td>
                <td className="px-4 py-3 font-bold">{customer.totalBookings ?? customer.tickets}</td>
                <td className="px-4 py-3 font-bold">{customer.tickets}</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(customer.revenue)}</td>
              </tr>
            ))}
            {!customers.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm font-bold text-[#667085]" colSpan={5}>
                  Chưa có khách hàng.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RevenuePage({ revenue }: { revenue: RevenueReport }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Tổng doanh thu" value={formatCurrency(revenue.totalRevenue)} />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Doanh thu hôm nay" value={formatCurrency(revenue.todayRevenue)} />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Doanh thu tháng này" value={formatCurrency(revenue.monthRevenue)} />
        <StatCard icon={<Ticket className="h-5 w-5" />} label="Số vé đã bán" value={String(revenue.soldTickets)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <RevenueChart revenue={revenue} type="daily" />
        <RevenueChart revenue={revenue} type="monthly" />
      </div>
      <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black">Số vé bán theo ngày</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs font-black text-[#667085]">
              <tr>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Số vé</th>
                <th className="px-4 py-3">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaecf0]">
              {revenue.daily.map((item) => (
                <tr key={item.date}>
                  <td className="px-4 py-3 font-bold">{item.date}</td>
                  <td className="px-4 py-3">{item.tickets}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FeedbacksPage({ feedbacks }: { feedbacks: FeedbackItem[] }) {
  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white shadow-sm">
      <div className="border-b border-[#eaecf0] p-5">
        <h3 className="text-lg font-black">Phản hồi khách hàng</h3>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {feedbacks.map((feedback) => (
          <article className="rounded-lg border border-[#eaecf0] p-4" key={feedback.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-black">{feedback.customerName}</h4>
                <p className="mt-1 text-sm font-semibold text-[#667085]">{feedback.route}</p>
              </div>
              <span className="rounded-md bg-[#fff7ed] px-2 py-1 text-xs font-black text-[#c2410c]">
                {feedback.rating} sao
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#344054]">{feedback.message}</p>
            <p className="mt-3 text-xs font-bold text-[#075bbf]">{feedback.status}</p>
          </article>
        ))}
        {!feedbacks.length ? <p className="text-sm font-bold text-[#667085]">Chưa có phản hồi.</p> : null}
      </div>
    </section>
  );
}

function SettingsPage() {
  const [brandName, setBrandName] = useState("Thành Trung Limousine");
  const [hotline, setHotline] = useState("1900 1000");
  const [supportEmail, setSupportEmail] = useState("hotro@thanhtrunglimousine.site");
  const [maxSeats, setMaxSeats] = useState("10");
  const [holdMinutes, setHoldMinutes] = useState("30");
  const [cancelHours, setCancelHours] = useState("6");
  const [qrPayment, setQrPayment] = useState(true);
  const [manualConfirm, setManualConfirm] = useState(true);
  const [notifyBooking, setNotifyBooking] = useState(true);
  const [notifyCancellation, setNotifyCancellation] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-black">Cài đặt hệ thống</h3>
            <p className="mt-1 text-sm text-[#667085]">
              Cấu hình vận hành hiển thị trong admin, không hiển thị secret hoặc biến môi trường.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a4f8f] px-4 text-sm font-black text-white"
            onClick={() => setSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }))}
            type="button"
          >
            <Save className="h-4 w-4" />
            Lưu cấu hình
          </button>
        </div>
        {savedAt ? (
          <p className="mt-3 rounded-md bg-[#ecfdf3] px-3 py-2 text-sm font-bold text-[#027a48]">
            Đã ghi nhận cấu hình lúc {savedAt}.
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsPanel icon={<Bus className="h-5 w-5" />} title="Thương hiệu & liên hệ">
          <SettingsInput label="Tên thương hiệu" onChange={setBrandName} value={brandName} />
          <SettingsInput label="Hotline hỗ trợ" onChange={setHotline} value={hotline} />
          <SettingsInput label="Email hỗ trợ" onChange={setSupportEmail} value={supportEmail} />
          <MiniPanel label="Tên hiển thị" value={brandName} />
        </SettingsPanel>

        <SettingsPanel icon={<Ticket className="h-5 w-5" />} title="Quy trình đặt vé">
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsInput label="Số vé tối đa mỗi đơn" onChange={setMaxSeats} type="number" value={maxSeats} />
            <SettingsInput label="Thời gian giữ ghế" onChange={setHoldMinutes} suffix="phút" type="number" value={holdMinutes} />
          </div>
          <SettingsToggle checked={notifyBooking} label="Thông báo khi có booking mới" onChange={setNotifyBooking} />
          <SettingsToggle checked={maintenance} label="Chế độ bảo trì giao diện đặt vé" onChange={setMaintenance} />
        </SettingsPanel>

        <SettingsPanel icon={<CreditCard className="h-5 w-5" />} title="Thanh toán & hủy vé">
          <SettingsToggle checked={qrPayment} label="Bật thanh toán QR" onChange={setQrPayment} />
          <SettingsToggle checked={manualConfirm} label="Admin xác nhận thanh toán thủ công" onChange={setManualConfirm} />
          <SettingsToggle checked={notifyCancellation} label="Thông báo yêu cầu hủy vé mới" onChange={setNotifyCancellation} />
          <SettingsInput label="Hạn gửi yêu cầu hủy trước giờ chạy" onChange={setCancelHours} suffix="giờ" type="number" value={cancelHours} />
        </SettingsPanel>

        <SettingsPanel icon={<ShieldSettingsIcon />} title="Bảo mật & vận hành">
          <SystemStatusRow label="Đăng nhập admin" value="Bắt buộc tài khoản quản trị" />
          <SystemStatusRow label="Database" value="Supabase PostgreSQL" />
          <SystemStatusRow label="Thanh toán" value={manualConfirm ? "Chờ admin xác nhận" : "Theo trạng thái provider"} />
          <SystemStatusRow label="Secret/env" value="Không hiển thị trong giao diện" />
        </SettingsPanel>
      </div>

      <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black">Checklist vận hành nhanh</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Kiểm tra chuyến sắp chạy",
            "Đối soát booking chờ thanh toán",
            "Duyệt yêu cầu hủy vé",
            "Xem báo cáo doanh thu"
          ].map((item) => (
            <label className="flex items-center gap-3 rounded-lg border border-[#eaecf0] bg-[#f8fafc] p-3 text-sm font-bold text-[#344054]" key={item}>
              <input className="rounded border-[#d0d5dd] text-[#075bbf] focus:ring-[#075bbf]" type="checkbox" />
              {item}
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}

function ShieldSettingsIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full border border-current text-xs font-black">
      S
    </span>
  );
}

function SettingsPanel({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#eff8ff] text-[#075bbf]">{icon}</div>
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function SettingsInput({
  label,
  onChange,
  suffix,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  suffix?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#344054]">{label}</span>
      <div className="flex items-center rounded-md border border-[#d0d5dd] bg-white focus-within:border-[#075bbf] focus-within:ring-1 focus-within:ring-[#075bbf]">
        <input
          className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm focus:ring-0"
          onChange={(event) => onChange(event.target.value)}
          type={type}
          value={value}
        />
        {suffix ? <span className="px-3 text-sm font-bold text-[#667085]">{suffix}</span> : null}
      </div>
    </label>
  );
}

function SettingsToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-[#eaecf0] bg-[#f8fafc] px-3 py-2 text-sm font-bold text-[#344054]">
      <span>{label}</span>
      <input
        checked={checked}
        className="h-5 w-5 rounded border-[#d0d5dd] text-[#075bbf] focus:ring-[#075bbf]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function SystemStatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#eaecf0] bg-[#f8fafc] px-3 py-2 text-sm">
      <span className="font-bold text-[#667085]">{label}</span>
      <span className="text-right font-black text-[#101828]">{value}</span>
    </div>
  );
}

function BookingTable({
  bookings,
  compact,
  onConfirmPayment,
  onRejectBooking,
  pendingAction = "",
  paymentsOnly
}: {
  bookings: ApiBooking[];
  compact?: boolean;
  onConfirmPayment?: (booking: ApiBooking) => void;
  onRejectBooking?: (booking: ApiBooking) => void;
  pendingAction?: string;
  paymentsOnly?: boolean;
}) {
  const rows = paymentsOnly ? bookings.filter((booking) => bookingStatusLabel(booking) === "Chờ thanh toán") : bookings;

  return (
    <table className="min-w-full text-left text-sm">
      <thead className="bg-[#f8fafc] text-xs font-black text-[#667085]">
        <tr>
          <th className="px-4 py-3">Mã vé</th>
          <th className="px-4 py-3">Khách hàng</th>
          <th className="px-4 py-3">Tuyến</th>
          {!compact ? <th className="px-4 py-3">Ghế</th> : null}
          <th className="px-4 py-3">Số tiền</th>
          <th className="px-4 py-3">Trạng thái</th>
          {!compact ? <th className="px-4 py-3 text-right">Thao tác</th> : null}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#eaecf0]">
        {rows.map((booking) => {
          const status = bookingStatusLabel(booking);
          const confirming = pendingAction === `confirm-${booking.id}`;
          const rejecting = pendingAction === `reject-${booking.id}`;
          return (
            <tr key={booking.id}>
              <td className="px-4 py-3">
                <p className="font-black">{booking.code}</p>
                <p className="text-xs font-semibold text-[#667085]">{formatDate(booking.createdAt)}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-bold">{booking.customerName}</p>
                <p className="text-xs text-[#667085]">{booking.customerPhone || booking.customerEmail}</p>
              </td>
              <td className="px-4 py-3">{booking.route}</td>
              {!compact ? <td className="px-4 py-3">{booking.seatCodes.join(", ")}</td> : null}
              <td className="px-4 py-3 font-bold">{formatCurrency(booking.price)}</td>
              <td className="px-4 py-3"><BookingStatusBadge status={status} /></td>
              {!compact ? (
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {status === "Chờ thanh toán" ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        {onConfirmPayment ? (
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0a4f8f] px-3 text-xs font-black text-white disabled:bg-[#98a2b3]"
                            disabled={Boolean(pendingAction)}
                            onClick={() => onConfirmPayment(booking)}
                            type="button"
                          >
                            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {confirming ? "Đang xác nhận..." : "Xác nhận thanh toán & chuyến"}
                          </button>
                        ) : null}
                        {onRejectBooking ? (
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#fecdd3] px-3 text-xs font-black text-[#be123c] disabled:opacity-60"
                            disabled={Boolean(pendingAction)}
                            onClick={() => onRejectBooking(booking)}
                            type="button"
                          >
                            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {rejecting ? "Đang từ chối..." : "Từ chối"}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-[#667085]">Đã xử lý</span>
                    )}
                  </div>
                </td>
              ) : null}
            </tr>
          );
        })}
        {!rows.length ? (
          <tr>
            <td className="px-4 py-8 text-center text-sm font-bold text-[#667085]" colSpan={compact ? 5 : 7}>
              Chưa có dữ liệu.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function RevenueChart({ revenue, type }: { revenue: RevenueReport; type: "daily" | "monthly" }) {
  const source = type === "daily" ? revenue.daily : revenue.monthly;
  const categories = source.map((item) => ("date" in item ? item.date.slice(5) : item.month));
  const revenueValues = source.map((item) => item.revenue);
  const ticketValues = source.map((item) => item.tickets);
  const options: ApexOptions = {
    chart: {
      fontFamily: "inherit",
      toolbar: { show: false }
    },
    colors: ["#075bbf", "#f59e0b"],
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#eaecf0"
    },
    legend: {
      fontWeight: 700
    },
    stroke: {
      curve: "smooth",
      width: [3, 2]
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#667085",
          fontWeight: 700
        }
      }
    },
    yaxis: [
      {
        labels: {
          formatter: (value) => `${Math.round(value / 1000)}k`
        }
      },
      {
        opposite: true,
        labels: {
          formatter: (value) => `${Math.round(value)}`
        }
      }
    ]
  };

  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">
            {type === "daily" ? "Doanh thu 7 ngày gần nhất" : "Doanh thu theo tháng"}
          </h3>
          <p className="mt-1 text-sm text-[#667085]">Tính theo booking đã xác nhận hoặc payment đã thanh toán.</p>
        </div>
        <BarChart3 className="h-5 w-5 text-[#075bbf]" />
      </div>
      {source.length ? (
        <Chart
          height={320}
          options={options}
          series={[
            { data: revenueValues, name: "Doanh thu", type: "area" },
            { data: ticketValues, name: "Vé bán", type: "line" }
          ]}
          type="line"
        />
      ) : (
        <p className="rounded-lg border border-dashed border-[#b8c4d6] p-8 text-center text-sm font-bold text-[#667085]">
          Chưa có dữ liệu doanh thu.
        </p>
      )}
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-[#eff8ff] text-[#075bbf]">{icon}</div>
      <p className="text-sm font-bold text-[#667085]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#101828]">{value}</p>
    </div>
  );
}

function MiniPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eaecf0] bg-[#f8fafc] p-4">
      <p className="text-sm font-bold text-[#667085]">{label}</p>
      <p className="mt-2 truncate text-lg font-black text-[#101828]">{value}</p>
    </div>
  );
}

function FormInput({
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#344054]">{label}</span>
      <input
        className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Đã thanh toán"
      ? "bg-[#ecfdf3] text-[#027a48]"
      : status === "Đã hủy"
        ? "bg-[#fff1f3] text-[#b42318]"
        : status === "Chờ duyệt hủy"
          ? "bg-[#fef3c7] text-[#92400e]"
          : "bg-[#fff7ed] text-[#c2410c]";
  return <span className={`rounded-md px-2 py-1 text-xs font-black ${tone}`}>{status}</span>;
}

function CancellationStatusBadge({ status }: { status: CancellationItem["status"] }) {
  const labels: Record<CancellationItem["status"], string> = {
    APPROVED: "Đã duyệt hủy",
    PENDING: "Chờ duyệt hủy",
    REJECTED: "Đã từ chối"
  };
  const tone =
    status === "APPROVED"
      ? "bg-[#ecfdf3] text-[#027a48]"
      : status === "REJECTED"
        ? "bg-[#fff1f3] text-[#b42318]"
        : "bg-[#fef3c7] text-[#92400e]";

  return <span className={`rounded-md px-2 py-1 text-xs font-black ${tone}`}>{labels[status]}</span>;
}

function TripStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Đang chạy"
      ? "bg-[#ecfdf3] text-[#027a48]"
      : status === "Đã hủy"
        ? "bg-[#fff1f3] text-[#b42318]"
        : status === "Hoàn thành"
          ? "bg-[#f4f3ff] text-[#5925dc]"
          : "bg-[#eff8ff] text-[#075bbf]";
  return <span className={`rounded-md px-2 py-1 text-xs font-black ${tone}`}>{status}</span>;
}

function buildCustomerSummaries(bookings: ApiBooking[]) {
  const map = new Map<string, CustomerSummary>();

  bookings.forEach((booking) => {
    const current = map.get(booking.customerId) || {
      email: booking.customerEmail,
      id: booking.customerId,
      name: booking.customerName,
      phone: booking.customerPhone,
      revenue: 0,
      tickets: 0,
      totalBookings: 0
    };
    current.tickets += booking.seats;
    current.totalBookings = (current.totalBookings || 0) + 1;
    current.revenue += bookingStatusLabel(booking) === "Đã thanh toán" ? booking.price : 0;
    map.set(booking.customerId, current);
  });

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}
